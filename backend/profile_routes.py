from flask import Blueprint, request, jsonify, current_app
from db import get_db
from jwt_utils import decode_jwt
from psycopg2.extras import RealDictCursor

profile_bp = Blueprint("profile", __name__, url_prefix="/api/profile")

@profile_bp.route("/ngo", methods=["GET"])
def get_ngo_profile():
    """Fetch NGO profile data"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing authorization token"}), 401
    
    token = auth_header.split(" ", 1)[1]
    try:
        payload = decode_jwt(token, current_app.config.get("SECRET_KEY"))
        user_id = payload.get("user_id")
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 401
    
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Fetch NGO details
        cur.execute("""
            SELECT 
                n.ngo_id,
                n.name,
                n.registration_number,
                n.registration_date,
                n.category,
                n.mission,
                n.vision,
                n.email,
                n.phone,
                n.city,
                n.state,
                n.country,
                n.website,
                COALESCE(SUM(d.amount), 0) as total_donations,
                COUNT(DISTINCT d.donor_id) as active_donors,
                COUNT(DISTINCT d.donation_id) as total_donations_count,
                EXTRACT(YEAR FROM n.registration_date) as established_year
            FROM ngos n
            LEFT JOIN donations d ON n.ngo_id = d.ngo_id
            WHERE n.user_id = %s
            GROUP BY n.ngo_id, n.name, n.registration_number, n.registration_date, 
                     n.category, n.mission, n.vision, n.email, n.phone, n.city, n.state, n.country, n.website
        """, (user_id,))
        
        ngo = cur.fetchone()
        if not ngo:
            return jsonify({"error": "NGO not found"}), 404
        
        # Fetch utilization data
        cur.execute("""
            SELECT 
                COALESCE(SUM(amount_utilized), 0) as total_utilized
            FROM utilizations
            WHERE ngo_id = %s
        """, (ngo["ngo_id"],))
        
        utilization = cur.fetchone()
        total_utilized = utilization["total_utilized"] if utilization else 0
        
        # Fetch documents (placeholder - would need a documents table)
        cur.execute("""
            SELECT 'Registration Certificate' as name, 'Verified' as status, 
                   n.registration_date as date
            FROM ngos n
            WHERE n.ngo_id = %s
        """, (ngo["ngo_id"],))
        
        documents = cur.fetchall()
        
        profile_data = {
            "ngoName": ngo["name"],
            "registrationNumber": ngo["registration_number"],
            "registrationDate": ngo["registration_date"].isoformat() if ngo["registration_date"] else "",
            "category": ngo["category"],
            "mission": ngo["mission"] or "",
            "vision": ngo["vision"] or "",
            "contactEmail": ngo["email"] or "",
            "contactPhone": ngo["phone"] or "",
            "address": f"{ngo['city'] or 'Unknown'}, {ngo['state'] or 'Unknown'}, {ngo['country'] or 'India'}",
            "website": ngo["website"] or "",
            "established": str(int(ngo["established_year"])) if ngo["established_year"] else "Unknown",
            "beneficiaries": f"{ngo['active_donors']}+",
            "volunteers": "250+",  # Placeholder
            "projects": str(ngo["total_donations_count"]),
            "sectors": [ngo["category"]] if ngo["category"] else [],
            "achievements": [
                "FCRA Registered",
                "Tax Exemption Certified",
                "Transparent Operations"
            ],
            "transparencyScore": 85,
            "documents": [
                {
                    "name": "Registration Certificate",
                    "status": "Verified",
                    "date": ngo["registration_date"].isoformat() if ngo["registration_date"] else ""
                },
                {
                    "name": "Annual Report 2024",
                    "status": "Uploaded",
                    "date": ""
                }
            ],
            "stats": {
                "totalDonations": float(ngo["total_donations"]),
                "totalUtilized": float(total_utilized),
                "activeDonors": ngo["active_donors"],
                "utilizationPercent": round((float(total_utilized) / float(ngo["total_donations"]) * 100) if ngo["total_donations"] > 0 else 0, 2)
            }
        }
        
        return jsonify(profile_data)
    
    except Exception as e:
        print(f"Error fetching NGO profile: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@profile_bp.route("/donor", methods=["POST"])
def create_or_update_donor():
    data = request.json
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        UPDATE donors
        SET name=%s, phone=%s, dob=%s, gender=%s,
            pan_number=%s, aadhaar_number=%s
        WHERE user_id=%s
    """, (
        data["name"],
        data["phone"],
        data.get("dob"),
        data.get("gender"),
        data.get("pan_number"),
        data.get("aadhaar_number"),
        data["user_id"]
    ))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Donor profile updated"})

@profile_bp.route("/ngo", methods=["POST"])
def create_or_update_ngo():
    data = request.json
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        UPDATE ngos
        SET registration_number=%s,
            registration_date=%s,
            category=%s,
            phone=%s,
            city=%s,
            state=%s,
            country=%s,
            mission=%s,
            vision=%s,
            website=%s
        WHERE user_id=%s
    """, (
        data["registration_number"],
        data["registration_date"],
        data["category"],
        data["phone"],
        data["city"],
        data["state"],
        data["country"],
        data.get("mission"),
        data.get("vision"),
        data.get("website"),
        data["user_id"]
    ))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "NGO profile updated"})
