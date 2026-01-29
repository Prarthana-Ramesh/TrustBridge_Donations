from flask import Blueprint, request, jsonify, current_app
from psycopg2.extras import RealDictCursor
from db import get_db
from jwt_utils import decode_jwt
from datetime import datetime
from blockchain import trustbridge_blockchain

utilization_bp = Blueprint("utilization", __name__, url_prefix="/api/utilization")


@utilization_bp.route("/projects", methods=["GET"])
def get_ngo_projects():
    """Fetch all projects for the NGO"""
    auth_header = request.headers.get("Authorization")
    ngo_id = None

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_jwt(token, current_app.config.get("SECRET_KEY"))
            user_id = payload.get("user_id")
            
            # Get ngo_id from user_id
            conn = get_db()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT ngo_id FROM ngos WHERE user_id = %s", (user_id,))
            ngo = cur.fetchone()
            if ngo:
                ngo_id = ngo["ngo_id"]
            cur.close()
            conn.close()
        except ValueError:
            return jsonify({"error": "Invalid token"}), 401

    if not ngo_id:
        return jsonify({"error": "NGO not found"}), 404

    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Fetch projects with budget info
    cur.execute(
        "SELECT project_id, name, description, budget, status, created_at "
        "FROM projects "
        "WHERE ngo_id = %s "
        "ORDER BY created_at DESC",
        (ngo_id,)
    )
    projects = cur.fetchall()

    project_list = []
    for p in projects:
        budget = float(p.get("budget")) if p.get("budget") is not None else 0
        
        # Get utilization for this project
        cur.execute(
            "SELECT COALESCE(SUM(amount_utilized), 0) as total_utilized "
            "FROM utilizations "
            "WHERE ngo_id = %s AND project_id = %s",
            (ngo_id, p.get("project_id"))
        )
        util_result = cur.fetchone()
        utilized = float(util_result["total_utilized"]) if util_result and util_result.get("total_utilized") else 0
        
        completion_percent = 0
        if budget > 0:
            completion_percent = min(int((utilized / budget) * 100), 100)

        project_list.append({
            "project_id": p.get("project_id"),
            "name": p.get("name"),
            "description": p.get("description"),
            "budget": budget,
            "amount_utilized": utilized,
            "completion_percent": completion_percent,
            "status": p.get("status"),
            "created_at": p.get("created_at")
        })

    cur.close()
    conn.close()

    return jsonify({"projects": project_list})


@utilization_bp.route("/donations", methods=["GET"])
def get_ngo_donations():
    """Fetch all donations for the NGO"""
    auth_header = request.headers.get("Authorization")
    ngo_id = None

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_jwt(token, current_app.config.get("SECRET_KEY"))
            user_id = payload.get("user_id")
            
            conn = get_db()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT ngo_id FROM ngos WHERE user_id = %s", (user_id,))
            ngo = cur.fetchone()
            if ngo:
                ngo_id = ngo["ngo_id"]
            cur.close()
            conn.close()
        except ValueError:
            return jsonify({"error": "Invalid token"}), 401

    if not ngo_id:
        return jsonify({"error": "NGO not found"}), 404

    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Fetch donations with utilization stats
    cur.execute(
        "SELECT d.donation_id, dn.name as donor_name, d.amount, d.donated_at, d.purpose, "
        "COALESCE(SUM(u.amount_utilized), 0) as amount_utilized "
        "FROM donations d "
        "LEFT JOIN donors dn ON d.donor_id = dn.donor_id "
        "LEFT JOIN utilizations u ON d.donation_id = u.donation_id "
        "WHERE d.ngo_id = %s "
        "GROUP BY d.donation_id, dn.name, d.amount, d.donated_at, d.purpose "
        "ORDER BY d.donated_at DESC",
        (ngo_id,)
    )
    donations = cur.fetchall()

    donation_list = []
    for d in donations:
        amount = float(d.get("amount")) if d.get("amount") is not None else 0
        utilized = float(d.get("amount_utilized")) if d.get("amount_utilized") is not None else 0
        utilization_percent = 0
        if amount > 0:
            utilization_percent = min(int((utilized / amount) * 100), 100)

        donation_list.append({
            "donation_id": d.get("donation_id"),
            "donor_name": d.get("donor_name") or "Unknown",
            "amount": amount,
            "amount_utilized": utilized,
            "utilization_percent": utilization_percent,
            "purpose": d.get("purpose"),
            "donated_at": str(d.get("donated_at")) if d.get("donated_at") else None
        })

    cur.close()
    conn.close()

    return jsonify({"donations": donation_list})


@utilization_bp.route("/records", methods=["GET"])
def get_utilization_records():
    """Fetch utilization records - all utilizations if no auth, or NGO-specific if authenticated"""
    auth_header = request.headers.get("Authorization")
    ngo_id = None

    # Try to get NGO ID from token
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_jwt(token, current_app.config.get("SECRET_KEY"))
            user_id = payload.get("user_id")
            
            conn = get_db()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT ngo_id FROM ngos WHERE user_id = %s", (user_id,))
            ngo = cur.fetchone()
            if ngo:
                ngo_id = ngo["ngo_id"]
            cur.close()
            conn.close()
        except ValueError:
            pass  # Continue without NGO filter

    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Fetch utilizations (NGO-specific or all)
    if ngo_id:
        cur.execute(
            "SELECT u.utilization_id, u.donation_id, u.project_id, u.amount_utilized, u.purpose, "
            "u.beneficiaries, u.location, u.utilized_at, "
            "COALESCE(dn.name, 'Anonymous') as donor_name, "
            "COALESCE(n.name, 'Unknown NGO') as ngo_name "
            "FROM utilizations u "
            "LEFT JOIN donations d ON u.donation_id = d.donation_id "
            "LEFT JOIN donors dn ON d.donor_id = dn.donor_id "
            "LEFT JOIN ngos n ON u.ngo_id = n.ngo_id "
            "WHERE u.ngo_id = %s "
            "ORDER BY u.utilized_at DESC",
            (ngo_id,)
        )
    else:
        # Get all utilizations across all NGOs
        cur.execute(
            "SELECT u.utilization_id, u.donation_id, u.project_id, u.amount_utilized, u.purpose, "
            "u.beneficiaries, u.location, u.utilized_at, "
            "COALESCE(dn.name, 'Anonymous') as donor_name, "
            "COALESCE(n.name, 'Unknown NGO') as ngo_name "
            "FROM utilizations u "
            "LEFT JOIN donations d ON u.donation_id = d.donation_id "
            "LEFT JOIN donors dn ON d.donor_id = dn.donor_id "
            "LEFT JOIN ngos n ON u.ngo_id = n.ngo_id "
            "ORDER BY u.utilized_at DESC"
        )
    
    records = cur.fetchall()

    utilization_list = []
    total_utilized = 0
    active_projects = set()
    total_beneficiaries = 0
    completed_count = 0
    
    for r in records:
        amount = float(r.get("amount_utilized")) if r.get("amount_utilized") else 0
        beneficiaries = r.get("beneficiaries") or 0
        
        total_utilized += amount
        total_beneficiaries += beneficiaries
        
        project_name = "Unknown"
        if r.get("project_id"):
            cur.execute(
                "SELECT name FROM projects WHERE project_id = %s",
                (r.get("project_id"),)
            )
            proj_result = cur.fetchone()
            if proj_result:
                project_name = proj_result["name"]
            active_projects.add(r.get("project_id"))
        
        # Determine status based on utilization
        status = "Completed" if amount > 0 else "Pending"
        if status == "Completed":
            completed_count += 1
        
        utilization_list.append({
            "utilization_id": r.get("utilization_id"),
            "donation_id": r.get("donation_id"),
            "project_id": r.get("project_id"),
            "donor_name": r.get("donor_name") or "Unknown",
            "project_name": project_name,
            "amount_utilized": amount,
            "purpose": r.get("purpose") or "General",
            "beneficiaries": beneficiaries,
            "location": r.get("location") or "Unknown",
            "utilized_at": str(r.get("utilized_at")) if r.get("utilized_at") else None,
            "ngo_name": r.get("ngo_name") or "Unknown NGO",
            "status": status
        })

    cur.close()
    conn.close()

    return jsonify({
        "records": utilization_list,
        "summary": {
            "total_utilized": total_utilized,
            "active_projects": len(active_projects),
            "completed_projects": completed_count,
            "total_beneficiaries": total_beneficiaries,
            "total_count": len(utilization_list)
        }
    })


@utilization_bp.route("/add-project", methods=["POST"])
def add_project():
    """Add a new project"""
    auth_header = request.headers.get("Authorization")
    ngo_id = None

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_jwt(token, current_app.config.get("SECRET_KEY"))
            user_id = payload.get("user_id")
            
            conn = get_db()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT ngo_id FROM ngos WHERE user_id = %s", (user_id,))
            ngo = cur.fetchone()
            if ngo:
                ngo_id = ngo["ngo_id"]
            cur.close()
            conn.close()
        except ValueError:
            return jsonify({"error": "Invalid token"}), 401

    if not ngo_id:
        return jsonify({"error": "NGO not found"}), 404

    data = request.get_json()
    name = data.get("name")
    description = data.get("description")
    budget = data.get("budget")
    status = data.get("status", "ACTIVE")

    if not name or not budget:
        return jsonify({"error": "Name and budget are required"}), 400

    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(
            "INSERT INTO projects (ngo_id, name, description, budget, status, created_at) "
            "VALUES (%s, %s, %s, %s, %s, %s) RETURNING project_id",
            (ngo_id, name, description, budget, status, datetime.now())
        )
        result = cur.fetchone()
        project_id = result["project_id"]
        
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Project added successfully", "project_id": project_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@utilization_bp.route("/add-utilization", methods=["POST"])
def add_utilization():
    """Add a new utilization record"""
    auth_header = request.headers.get("Authorization")
    ngo_id = None

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_jwt(token, current_app.config.get("SECRET_KEY"))
            user_id = payload.get("user_id")
            
            conn = get_db()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT ngo_id FROM ngos WHERE user_id = %s", (user_id,))
            ngo = cur.fetchone()
            if ngo:
                ngo_id = ngo["ngo_id"]
            cur.close()
            conn.close()
        except ValueError:
            return jsonify({"error": "Invalid token"}), 401

    if not ngo_id:
        return jsonify({"error": "NGO not found"}), 404

    data = request.get_json()
    donation_id = data.get("donation_id")
    project_id = data.get("project_id")
    amount_utilized = data.get("amount_utilized")
    purpose = data.get("purpose")
    beneficiaries = data.get("beneficiaries")
    location = data.get("location")
    utilized_at = data.get("utilized_at", datetime.now())

    if not donation_id or not amount_utilized:
        return jsonify({"error": "Donation ID and amount are required"}), 400

    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get the donation amount
        cur.execute("SELECT amount FROM donations WHERE donation_id = %s AND ngo_id = %s", 
                   (donation_id, ngo_id))
        donation = cur.fetchone()
        
        if not donation:
            cur.close()
            conn.close()
            return jsonify({"error": "Donation not found or does not belong to this NGO"}), 404
        
        total_donation = float(donation["amount"])
        
        # Get sum of already utilized amounts for this donation
        cur.execute(
            "SELECT COALESCE(SUM(amount_utilized), 0) as total_utilized "
            "FROM utilizations WHERE donation_id = %s",
            (donation_id,)
        )
        util_result = cur.fetchone()
        already_utilized = float(util_result["total_utilized"]) if util_result else 0
        
        # Calculate remaining amount
        remaining = total_donation - already_utilized
        
        # Validate that new utilization doesn't exceed remaining
        if float(amount_utilized) > remaining:
            cur.close()
            conn.close()
            return jsonify({
                "error": "Utilization amount exceeds remaining donation amount",
                "total_donation": total_donation,
                "already_utilized": already_utilized,
                "remaining": remaining,
                "requested": float(amount_utilized)
            }), 400
        
        cur.execute(
            "INSERT INTO utilizations (ngo_id, donation_id, project_id, amount_utilized, purpose, "
            "beneficiaries, location, utilized_at) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING utilization_id",
            (ngo_id, donation_id, project_id, amount_utilized, purpose, beneficiaries, location, utilized_at)
        )
        result = cur.fetchone()
        utilization_id = result["utilization_id"]
        
        conn.commit()
        cur.close()
        conn.close()

        # Add to blockchain
        try:
            trustbridge_blockchain.add_block({
                "type": "utilization",
                "utilization_id": str(utilization_id),
                "ngo_id": str(ngo_id),
                "donation_id": str(donation_id),
                "project_id": str(project_id) if project_id else None,
                "amount_utilized": float(amount_utilized),
                "purpose": purpose,
                "beneficiaries": beneficiaries,
                "location": location
            })
        except Exception as e:
            print(f"Warning: Failed to add utilization to blockchain: {str(e)}")

        return jsonify({"message": "Utilization record added successfully", "utilization_id": utilization_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
