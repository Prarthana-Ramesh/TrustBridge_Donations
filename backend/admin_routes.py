from flask import Blueprint, request, jsonify, current_app
from psycopg2.extras import RealDictCursor
from db import get_db
from jwt_utils import decode_jwt
from datetime import datetime, timedelta

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.route("/dashboard", methods=["GET"])
def get_admin_dashboard():
    """Fetch overall statistics across all NGOs for admin dashboard"""
    
    # Optional: Add authentication check for admin users
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_jwt(token, current_app.config.get("SECRET_KEY"))
            # You could check if user is admin here
        except ValueError:
            pass  # Continue without auth for now
    
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Get overall donation statistics
        cur.execute("""
            SELECT 
                COALESCE(SUM(amount), 0) as total_donations,
                COUNT(DISTINCT donor_id) as total_donors,
                COUNT(DISTINCT ngo_id) as total_ngos,
                COUNT(DISTINCT donation_id) as total_donation_count
            FROM donations
        """)
        donation_stats = cur.fetchone()
        
        # Get utilization statistics
        cur.execute("""
            SELECT 
                COALESCE(SUM(amount_utilized), 0) as total_utilized,
                COUNT(DISTINCT ngo_id) as ngos_with_utilization
            FROM utilizations
        """)
        utilization_stats = cur.fetchone()
        
        # Get current month statistics
        cur.execute("""
            SELECT 
                COALESCE(SUM(amount), 0) as month_donations,
                COUNT(DISTINCT donor_id) as month_donors,
                COUNT(DISTINCT donation_id) as month_donation_count
            FROM donations
            WHERE EXTRACT(MONTH FROM donated_at) = EXTRACT(MONTH FROM CURRENT_DATE)
              AND EXTRACT(YEAR FROM donated_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        """)
        month_stats = cur.fetchone()
        
        # Get current month utilization
        cur.execute("""
            SELECT 
                COALESCE(SUM(amount_utilized), 0) as month_utilized
            FROM utilizations
            WHERE EXTRACT(MONTH FROM utilized_at) = EXTRACT(MONTH FROM CURRENT_DATE)
              AND EXTRACT(YEAR FROM utilized_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        """)
        month_util = cur.fetchone()
        
        # Get previous month for comparison
        cur.execute("""
            SELECT 
                COALESCE(SUM(amount), 0) as prev_month_donations
            FROM donations
            WHERE donated_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
              AND donated_at < DATE_TRUNC('month', CURRENT_DATE)
        """)
        prev_month = cur.fetchone()
        
        # Calculate growth percentage
        prev_amount = float(prev_month['prev_month_donations']) if prev_month['prev_month_donations'] else 0
        current_amount = float(donation_stats['total_donations']) if donation_stats['total_donations'] else 0
        growth_percent = round(((current_amount - prev_amount) / prev_amount * 100) if prev_amount > 0 else 0, 1)
        
        # Get top categories
        cur.execute("""
            SELECT 
                d.purpose,
                COALESCE(SUM(d.amount), 0) as total_amount,
                COUNT(*) as count
            FROM donations d
            GROUP BY d.purpose
            ORDER BY total_amount DESC
            LIMIT 3
        """)
        top_categories = cur.fetchall()
        
        total_donations = float(donation_stats['total_donations']) if donation_stats['total_donations'] else 0
        category_data = []
        for cat in top_categories:
            percentage = round((float(cat['total_amount']) / total_donations * 100) if total_donations > 0 else 0, 1)
            category_data.append({
                'category': cat['purpose'] or 'Other',
                'percentage': percentage
            })
        
        # Get recent activities
        cur.execute("""
            (SELECT 
                'donation' as type,
                CONCAT('New donation received from ', COALESCE(don.name, 'Anonymous')) as description,
                d.amount,
                d.donated_at as time
            FROM donations d
            LEFT JOIN donors don ON d.donor_id = don.donor_id
            LIMIT 3)
            
            UNION ALL
            
            (SELECT 
                'utilization' as type,
                CONCAT('Funds allocated to ', COALESCE(u.purpose, 'Project')) as description,
                u.amount_utilized as amount,
                u.utilized_at as time
            FROM utilizations u
            LIMIT 2)
            
            ORDER BY time DESC
            LIMIT 5
        """)
        activities = cur.fetchall()
        
        # Format activities
        formatted_activities = []
        for act in activities:
            time_diff = datetime.now() - act['time']
            if time_diff.days > 0:
                time_str = f"{time_diff.days} day{'s' if time_diff.days > 1 else ''} ago"
            elif time_diff.seconds >= 3600:
                hours = time_diff.seconds // 3600
                time_str = f"{hours} hour{'s' if hours > 1 else ''} ago"
            else:
                minutes = time_diff.seconds // 60
                time_str = f"{minutes} minute{'s' if minutes > 1 else ''} ago"
            
            formatted_activities.append({
                'type': act['type'],
                'description': act['description'],
                'amount': f"₹{float(act['amount']):.0f}" if act['amount'] else '-',
                'time': time_str
            })
        
        # Calculate utilization percentage
        total_utilized = float(utilization_stats['total_utilized']) if utilization_stats['total_utilized'] else 0
        utilization_percent = round((total_utilized / total_donations * 100) if total_donations > 0 else 0, 1)
        available_percent = round(100 - utilization_percent, 1)
        
        # Prepare response
        dashboard_data = {
            'stats': {
                'total_donations': total_donations,
                'total_utilized': total_utilized,
                'total_beneficiaries': donation_stats['total_donors'] or 0,
                'active_projects': donation_stats['total_ngos'] or 0,
                'growth_percent': growth_percent,
                'utilization_percent': utilization_percent
            },
            'fund_allocation': {
                'utilized': utilization_percent,
                'available': available_percent
            },
            'this_month': {
                'donations': float(month_stats['month_donations']) if month_stats['month_donations'] else 0,
                'utilized': float(month_util['month_utilized']) if month_util['month_utilized'] else 0,
                'beneficiaries': month_stats['month_donors'] or 0
            },
            'top_categories': category_data,
            'recent_activities': formatted_activities
        }
        
        return jsonify(dashboard_data)
    
    except Exception as e:
        print(f"Error fetching admin dashboard: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()
