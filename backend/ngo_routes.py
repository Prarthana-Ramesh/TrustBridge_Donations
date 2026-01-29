from flask import Blueprint, request, jsonify, current_app
from psycopg2.extras import RealDictCursor
from db import get_db
from jwt_utils import decode_jwt

ngo_bp = Blueprint("ngo", __name__, url_prefix="/api/ngo")


@ngo_bp.route("/list", methods=["GET"])
def get_ngo_list():
    """Fetch all NGOs for listing/selection"""
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Fetch all NGOs with their statistics
        cur.execute("""
            SELECT 
                n.ngo_id,
                n.name,
                n.category,
                n.city,
                n.state,
                n.mission,
                n.vision,
                n.phone,
                n.registration_number,
                COALESCE(SUM(d.amount), 0) as funds_received,
                COUNT(DISTINCT d.donor_id) as donor_count,
                COUNT(DISTINCT d.donation_id) as donation_count
            FROM ngos n
            LEFT JOIN donations d ON n.ngo_id = d.ngo_id
            GROUP BY n.ngo_id, n.name, n.category, n.city, n.state, n.mission, n.vision, n.phone, n.registration_number
            ORDER BY funds_received DESC
        """)
        
        ngos_data = cur.fetchall()
        
        ngo_list = []
        for ngo in ngos_data:
            ngo_id = ngo.get("ngo_id")
            funds_received = float(ngo.get("funds_received")) if ngo.get("funds_received") else 0
            
            # Get actual utilized funds for this NGO
            cur.execute(
                "SELECT COALESCE(SUM(amount_utilized), 0) as total_utilized FROM utilizations WHERE ngo_id = %s",
                (ngo_id,)
            )
            util_result = cur.fetchone()
            utilized_funds = float(util_result["total_utilized"]) if util_result else 0
            
            # Calculate utilization percentage
            utilized_percent = 0
            if funds_received > 0:
                utilized_percent = int((utilized_funds / funds_received) * 100)
            
            ngo_list.append({
                "ngo_id": ngo_id,
                "name": ngo.get("name"),
                "sector": ngo.get("category") or "General",
                "location": f"{ngo.get('city') or 'Unknown'}, {ngo.get('state') or 'India'}",
                "description": ngo.get("mission") or "Making a difference in the community",
                "fundsReceived": funds_received,
                "utilized": utilized_percent,
                "utilizedAmount": utilized_funds,
                "beneficiaries": ngo.get("donor_count") or 0,
                "projects": ngo.get("donation_count") or 0,
                "rating": 4.5,
                "phone": ngo.get("phone"),
                "registration_number": ngo.get("registration_number")
            })

        return jsonify({"ngos": ngo_list})

    except Exception as e:
        print(f"Error fetching NGO list: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()


@ngo_bp.route("/dashboard", methods=["GET"])
def get_ngo_dashboard():
    ngo_id = request.args.get("ngo_id")
    prev_login = None
    auth_user_id = None

    # Decode token (if present) to get user_id and prev_login
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_jwt(token, current_app.config.get("SECRET_KEY"))
            auth_user_id = payload.get("user_id")
            prev_login = payload.get("prev_login")
            print(f"Resolved user_id from token: {auth_user_id}; prev_login: {prev_login}")
        except ValueError as ve:
            msg = str(ve)
            if 'expired' in msg.lower():
                return jsonify({"error": "Token expired"}), 401
            return jsonify({"error": "Invalid token"}), 401

    # If no ngo_id provided, try to infer from auth_user_id
    if not ngo_id and auth_user_id:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT ngo_id, user_id, name FROM ngos WHERE user_id = %s", (auth_user_id,))
        ngo = cur.fetchone()
        cur.close()
        conn.close()
        if ngo:
            ngo_id = ngo["ngo_id"]

    print(f"Fetching dashboard for NGO ID: {ngo_id}")
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # If ngo_id not provided (or couldn't be resolved via token), pick the first NGO
    if not ngo_id:
        cur.execute("SELECT ngo_id, user_id, name FROM ngos ORDER BY created_at LIMIT 1")
        ngo = cur.fetchone()
        if not ngo:
            cur.close()
            conn.close()
            return jsonify({"error": "No NGOs found"}), 404
        ngo_id = ngo["ngo_id"]
    else:
        cur.execute("SELECT ngo_id, user_id, name FROM ngos WHERE ngo_id = %s", (ngo_id,))
        ngo = cur.fetchone()
        if not ngo:
            cur.close()
            conn.close()
            return jsonify({"error": "NGO not found"}), 404

    # Summary metrics
    cur.execute(
        "SELECT COALESCE(SUM(amount),0) as total_donations FROM donations WHERE ngo_id = %s",
        (ngo_id,)
    )
    total_donations = cur.fetchone()["total_donations"]

    cur.execute(
        "SELECT COALESCE(SUM(amount_utilized),0) as utilized_funds FROM utilizations WHERE ngo_id = %s",
        (ngo_id,)
    )
    utilized_funds = cur.fetchone()["utilized_funds"]

    cur.execute(
        "SELECT COUNT(DISTINCT donor_id) as active_donors FROM donations WHERE ngo_id = %s",
        (ngo_id,)
    )
    active_donors = cur.fetchone()["active_donors"]

    cur.execute(
        "SELECT COUNT(*) as active_projects FROM projects WHERE ngo_id = %s AND status = 'ACTIVE'",
        (ngo_id,)
    )
    active_projects = cur.fetchone()["active_projects"]

    # Additional metrics since previous login
    additional_donations = 0
    new_donors = 0
    utilization_change_percent = None

    if prev_login:
        cur.execute(
            "SELECT COUNT(*) as cnt FROM donations WHERE ngo_id = %s AND donated_at > to_timestamp(%s)",
            (ngo_id, prev_login)
        )
        additional_donations = cur.fetchone()["cnt"] or 0

        cur.execute(
            "SELECT COUNT(DISTINCT donor_id) as cnt FROM donations WHERE ngo_id = %s AND donated_at > to_timestamp(%s)",
            (ngo_id, prev_login)
        )
        new_donors = cur.fetchone()["cnt"] or 0

    # utilization change: compare total utilized_funds now vs before the latest utilization entry
    try:
        cur.execute(
            "SELECT utilized_at FROM utilizations WHERE ngo_id = %s ORDER BY utilized_at DESC LIMIT 1",
            (ngo_id,)
        )
        latest_util = cur.fetchone()
        if latest_util and latest_util.get("utilized_at"):
            latest_ts = latest_util.get("utilized_at")
            cur.execute(
                "SELECT COALESCE(SUM(amount_utilized),0) as total_before FROM utilizations WHERE ngo_id = %s AND utilized_at < %s",
                (ngo_id, latest_ts)
            )
            total_before = cur.fetchone()["total_before"] or 0
            if total_before and float(total_before) > 0:
                utilization_change_percent = round(((float(utilized_funds) - float(total_before)) / float(total_before)) * 100, 1)
    except Exception as e:
        # If created_at column does not exist or any error, rollback and skip utilization change calculation
        conn.rollback()
        print(f"Notice: skipping utilization change calc due to error: {e}")

    # Recent donations
    cur.execute(
        "SELECT d.donation_id, dn.name as donor, d.amount, d.donated_at::text as date, d.purpose, pd.project_id "
        "FROM donations d LEFT JOIN donors dn ON d.donor_id = dn.donor_id "
        "LEFT JOIN project_donations pd ON d.donation_id = pd.donation_id "
        "WHERE d.ngo_id = %s ORDER BY d.donated_at DESC LIMIT 10",
        (ngo_id,)
    )
    recent_donations = cur.fetchall()

    # Notifications for the NGO user with formatted messages
    user_id = ngo["user_id"]
    cur.execute(
        "SELECT notification_id, type, message, created_at::text as created_at, is_read FROM notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 5",
        (user_id,)
    )
    raw_notifications = cur.fetchall()
    
    # Format notifications with sentence structures based on type
    notifications = []
    for notif in raw_notifications:
        notification_type = notif.get("type", "").lower()
        message = notif.get("message", "")
        
        # Create formatted message based on notification type
        if notification_type == "donation":
            formatted_message = f"🎁 {message}"
        elif notification_type == "project_creation":
            formatted_message = f"📋 {message}"
        elif notification_type == "fund_utilization":
            formatted_message = f"💰 {message}"
        else:
            formatted_message = f"📢 {message}"
        
        notifications.append({
            "notification_id": notif.get("notification_id"),
            "type": notification_type,
            "message": formatted_message,
            "created_at": notif.get("created_at"),
            "is_read": notif.get("is_read")
        })

    # Active projects and utilization percent
    cur.execute(
        "SELECT p.project_id, p.name, p.budget, COALESCE(SUM(u.amount_utilized),0) as amount_utilized, "
        "COUNT(DISTINCT pd.donation_id) as donors_count "
        "FROM projects p "
        "LEFT JOIN project_donations pd ON p.project_id = pd.project_id "
        "LEFT JOIN utilizations u ON pd.donation_id = u.donation_id "
        "WHERE p.ngo_id = %s AND p.status = 'ACTIVE' "
        "GROUP BY p.project_id, p.name, p.budget",
        (ngo_id,)
    )
    projects = cur.fetchall()

    # compute utilized percent safely
    active_projects_list = []
    for p in projects:
        budget = p.get("budget") or 0
        utilized = 0
        if budget and float(budget) > 0:
            utilized = int((float(p.get("amount_utilized") or 0) / float(budget)) * 100)
        active_projects_list.append({
            "project_id": p.get("project_id"),
            "name": p.get("name"),
            "budget": float(p.get("budget")) if p.get("budget") is not None else 0,
            "utilized": utilized,
            "donors": p.get("donors_count")
        })

    cur.close()
    conn.close()

    return jsonify({
        "ngo_id": ngo_id,
        "ngo_name": ngo.get("name"),
        "summary": {
            "totalDonationsReceived": float(total_donations),
            "utilizedFunds": float(utilized_funds),
            "activeDonors": active_donors,
            "activeProjects": active_projects,
            "additionalDonationsSinceLastLogin": int(additional_donations),
            "utilizationChangePercent": utilization_change_percent,
            "newDonorsSinceLastLogin": int(new_donors)
        },
        "recentDonations": recent_donations,
        "notifications": notifications,
        "activeProjects": active_projects_list
    })
