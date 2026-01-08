from flask import Blueprint, request, jsonify, current_app
from psycopg2.extras import RealDictCursor
from db import get_db
from jwt_utils import decode_jwt

donor_bp = Blueprint("donor", __name__, url_prefix="/api/donors")


@donor_bp.route("/list", methods=["GET"])
def get_donors_list():
    """Fetch all donors for the NGO with their statistics"""
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

    # Fetch all donors with their donation statistics
    cur.execute(
        "SELECT dn.donor_id, dn.name, dn.email, dn.phone, dn.created_at, "
        "COUNT(d.donation_id) as donation_count, "
        "COALESCE(SUM(d.amount), 0) as total_contributions, "
        "MAX(d.donated_at) as last_donation "
        "FROM donors dn "
        "LEFT JOIN donations d ON dn.donor_id = d.donor_id AND d.ngo_id = %s "
        "WHERE EXISTS (SELECT 1 FROM donations WHERE donor_id = dn.donor_id AND ngo_id = %s) "
        "GROUP BY dn.donor_id, dn.name, dn.email, dn.phone, dn.created_at "
        "ORDER BY total_contributions DESC",
        (ngo_id, ngo_id)
    )
    donors = cur.fetchall()

    donor_list = []
    for d in donors:
        donor_list.append({
            "donor_id": d.get("donor_id"),
            "name": d.get("name"),
            "email": d.get("email"),
            "phone": d.get("phone"),
            "total_contributions": float(d.get("total_contributions")) if d.get("total_contributions") else 0,
            "donation_count": d.get("donation_count") or 0,
            "last_donation": str(d.get("last_donation")) if d.get("last_donation") else None,
            "joined_date": str(d.get("created_at")) if d.get("created_at") else None,
            "status": "Active"
        })

    cur.close()
    conn.close()

    return jsonify({"donors": donor_list})


@donor_bp.route("/<donor_id>/history", methods=["GET"])
def get_donor_history(donor_id):
    """Fetch donation history for a specific donor"""
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

    # Fetch donor details
    cur.execute(
        "SELECT donor_id, name, email, phone, created_at FROM donors WHERE donor_id = %s",
        (donor_id,)
    )
    donor = cur.fetchone()

    if not donor:
        cur.close()
        conn.close()
        return jsonify({"error": "Donor not found"}), 404

    # Fetch donation history with utilization info
    cur.execute(
        "SELECT d.donation_id, d.amount, d.donated_at, d.purpose, "
        "COALESCE(SUM(u.amount_utilized), 0) as amount_utilized "
        "FROM donations d "
        "LEFT JOIN utilizations u ON d.donation_id = u.donation_id "
        "WHERE d.donor_id = %s AND d.ngo_id = %s "
        "GROUP BY d.donation_id, d.amount, d.donated_at, d.purpose "
        "ORDER BY d.donated_at DESC",
        (donor_id, ngo_id)
    )
    donations = cur.fetchall()

    donation_history = []
    total_contributions = 0
    
    for don in donations:
        amount = float(don.get("amount")) if don.get("amount") else 0
        utilized = float(don.get("amount_utilized")) if don.get("amount_utilized") else 0
        utilized_percent = 0
        if amount > 0:
            utilized_percent = min(int((utilized / amount) * 100), 100)
        
        total_contributions += amount
        
        donation_history.append({
            "donation_id": don.get("donation_id"),
            "amount": amount,
            "date": str(don.get("donated_at")) if don.get("donated_at") else None,
            "purpose": don.get("purpose") or "General",
            "utilized": utilized_percent
        })

    cur.close()
    conn.close()

    return jsonify({
        "donor": {
            "donor_id": donor.get("donor_id"),
            "name": donor.get("name"),
            "email": donor.get("email"),
            "phone": donor.get("phone"),
            "joined_date": str(donor.get("created_at")) if donor.get("created_at") else None,
            "total_contributions": total_contributions,
            "donation_count": len(donation_history)
        },
        "history": donation_history
    })
