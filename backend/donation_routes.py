from flask import Blueprint, request, jsonify, current_app
from psycopg2.extras import RealDictCursor
from db import get_db
from jwt_utils import decode_jwt

donation_bp = Blueprint("donation", __name__, url_prefix="/api/donations")


@donation_bp.route("/records", methods=["GET"])
def get_donation_records():
    """Fetch donation records - all donations if no auth, or NGO-specific if authenticated"""
    auth_header = request.headers.get("Authorization")
    ngo_id = None

    # Try to get NGO ID from token
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
            pass  # Continue without NGO filter

    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Fetch donations (all if no NGO, filtered if NGO)
    if ngo_id:
        query = """
            SELECT d.donation_id, COALESCE(dn.name, 'Anonymous') as donor_name, d.amount, d.donated_at, d.purpose,
                   COALESCE(SUM(u.amount_utilized), 0) as amount_utilized,
                   n.name as ngo_name
            FROM donations d
            LEFT JOIN donors dn ON d.donor_id = dn.donor_id
            LEFT JOIN utilizations u ON d.donation_id = u.donation_id
            LEFT JOIN ngos n ON d.ngo_id = n.ngo_id
            WHERE d.ngo_id = %s
            GROUP BY d.donation_id, dn.name, d.amount, d.donated_at, d.purpose, n.name
            ORDER BY d.donated_at DESC
        """
        cur.execute(query, (ngo_id,))
    else:
        # Get all donations across all NGOs
        query = """
            SELECT d.donation_id, COALESCE(dn.name, 'Anonymous') as donor_name, d.amount, d.donated_at, d.purpose,
                   COALESCE(SUM(u.amount_utilized), 0) as amount_utilized,
                   COALESCE(n.name, 'Unknown NGO') as ngo_name
            FROM donations d
            LEFT JOIN donors dn ON d.donor_id = dn.donor_id
            LEFT JOIN utilizations u ON d.donation_id = u.donation_id
            LEFT JOIN ngos n ON d.ngo_id = n.ngo_id
            GROUP BY d.donation_id, dn.name, d.amount, d.donated_at, d.purpose, n.name
            ORDER BY d.donated_at DESC
        """
        cur.execute(query)

    donations = cur.fetchall()

    # Calculate totals
    total_donations = 0
    total_utilized = 0
    
    donation_list = []
    for d in donations:
        amount = float(d.get("amount")) if d.get("amount") is not None else 0
        utilized = float(d.get("amount_utilized")) if d.get("amount_utilized") is not None else 0
        
        total_donations += amount
        total_utilized += utilized
        
        donation_list.append({
            "donation_id": d.get("donation_id"),
            "donor_name": d.get("donor_name") or "Unknown",
            "amount": amount,
            "amount_utilized": utilized,
            "purpose": d.get("purpose") or "General",
            "donated_at": str(d.get("donated_at")) if d.get("donated_at") else None,
            "status": "Received",
            "ngo_name": d.get("ngo_name") or "Unknown NGO"
        })

    cur.close()
    conn.close()

    return jsonify({
        "donations": donation_list,
        "summary": {
            "total_donations": total_donations,
            "total_utilized": total_utilized,
            "total_count": len(donation_list)
        }
    })


@donation_bp.route("/donor/history", methods=["GET"])
def get_donor_donation_history():
    """Fetch all donations made by a specific donor"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Authorization header missing or invalid"}), 401

    token = auth_header.split(" ", 1)[1]
    try:
        payload = decode_jwt(token, current_app.config.get("SECRET_KEY"))
        user_id = payload.get("user_id")
        if not user_id:
            return jsonify({"error": "User ID not found in token"}), 401
    except ValueError as e:
        return jsonify({"error": f"Invalid token: {str(e)}"}), 401

    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Get donor_id from user_id
        cur.execute("SELECT donor_id FROM donors WHERE user_id = %s", (user_id,))
        donor = cur.fetchone()
        if not donor:
            return jsonify({"error": "Donor not found"}), 404
        
        donor_id = donor["donor_id"]

        # Fetch all donations with NGO details and utilization info
        cur.execute("""
            SELECT 
                d.donation_id, 
                n.name as ngo_name, 
                d.amount, 
                d.donated_at, 
                d.purpose,
                COALESCE(SUM(u.amount_utilized), 0) as amount_utilized
            FROM donations d
            JOIN ngos n ON d.ngo_id = n.ngo_id
            LEFT JOIN utilizations u ON d.donation_id = u.donation_id
            WHERE d.donor_id = %s
            GROUP BY d.donation_id, n.name, d.amount, d.donated_at, d.purpose
            ORDER BY d.donated_at DESC
        """, (donor_id,))
        
        donations = cur.fetchall()

        donation_list = []
        total_donated = 0
        total_utilized = 0
        total_beneficiaries = 0

        for d in donations:
            amount = float(d.get("amount")) if d.get("amount") else 0
            utilized = float(d.get("amount_utilized")) if d.get("amount_utilized") else 0
            utilized_percent = (utilized / amount * 100) if amount > 0 else 0

            total_donated += amount
            total_utilized += utilized

            # Determine status based on utilization
            if utilized_percent >= 100:
                status = "Fully Utilized"
            elif utilized_percent > 0:
                status = "Partially Utilized"
            else:
                status = "In Progress"

            donation_id = d.get("donation_id")
            try:
                txn_ref = f"TXN{int(donation_id):09d}"
            except (TypeError, ValueError):
                txn_ref = f"TXN{donation_id}" if donation_id is not None else "TXN-UNKNOWN"

            donation_list.append({
                "id": donation_id,
                "ngo": d.get("ngo_name"),
                "amount": amount,
                "date": str(d.get("donated_at")).split(' ')[0] if d.get("donated_at") else None,
                "purpose": d.get("purpose") or "General",
                "status": status,
                "utilized": round(utilized_percent, 1),
                "amount_utilized": utilized,
                "transactionId": txn_ref
            })

        return jsonify({
            "donations": donation_list,
            "summary": {
                "total_donated": total_donated,
                "total_utilized": total_utilized,
                "total_count": len(donation_list)
            }
        })

    except Exception as e:
        print(f"Error fetching donor donations: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


@donation_bp.route("/create", methods=["POST"])
def create_donation():
    """Create a new donation"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Authorization header missing or invalid"}), 401

    token = auth_header.split(" ", 1)[1]
    try:
        payload = decode_jwt(token, current_app.config.get("SECRET_KEY"))
        user_id = payload.get("user_id")
        if not user_id:
            return jsonify({"error": "User ID not found in token"}), 401
    except ValueError as e:
        return jsonify({"error": f"Invalid token: {str(e)}"}), 401

    data = request.get_json()
    
    # Validate required fields
    required_fields = ["ngo_name", "amount", "purpose"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Get donor_id from user_id
        cur.execute("SELECT donor_id FROM donors WHERE user_id = %s", (user_id,))
        donor = cur.fetchone()
        if not donor:
            return jsonify({"error": "Donor not found"}), 404
        
        donor_id = donor["donor_id"]

        # Get ngo_id from ngo_name
        cur.execute("SELECT ngo_id FROM ngos WHERE name = %s", (data["ngo_name"],))
        ngo = cur.fetchone()
        if not ngo:
            return jsonify({"error": "NGO not found"}), 404
        
        ngo_id = ngo["ngo_id"]

        # Insert donation (no transaction_id column in table)
        cur.execute("""
            INSERT INTO donations 
            (donor_id, ngo_id, amount, purpose, donated_at)
            VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
            RETURNING donation_id, donated_at
        """, (donor_id, ngo_id, data["amount"], data["purpose"]))
        
        result = cur.fetchone()
        conn.commit()

        # Generate a transaction reference for the response (not stored in DB)
        donation_id = result.get("donation_id")
        try:
            txn_ref = f"TXN{int(donation_id):09d}"
        except (TypeError, ValueError):
            txn_ref = f"TXN{donation_id}" if donation_id is not None else "TXN-UNKNOWN"

        return jsonify({
            "success": True,
            "message": "Donation created successfully",
            "donation": {
                "donation_id": result["donation_id"],
                "transaction_id": txn_ref,
                "amount": data["amount"],
                "ngo": data["ngo_name"],
                "purpose": data["purpose"],
                "donated_at": str(result["donated_at"])
            }
        }), 201

    except Exception as e:
        conn.rollback()
        print(f"Error creating donation: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()
