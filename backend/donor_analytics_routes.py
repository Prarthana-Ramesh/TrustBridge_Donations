from flask import Blueprint, jsonify, request, current_app
from db import get_db
from jwt_utils import decode_jwt
from psycopg2.extras import RealDictCursor

donor_analytics_bp = Blueprint('donor_analytics', __name__, url_prefix='/api/donor-analytics')

@donor_analytics_bp.route('/reports', methods=['GET'])
def get_donor_reports():
    """Get comprehensive analytics and reports for a donor"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'Authorization header missing'}), 401
    
    token = auth_header.replace('Bearer ', '')
    try:
        payload = decode_jwt(token, current_app.config.get('SECRET_KEY'))
    except ValueError as ve:
        print(f"JWT decode error: {str(ve)}")
        print(f"Token received: {token[:50]}...")  # Log first 50 chars for debugging
        return jsonify({'error': f'Invalid token: {str(ve)}'}), 401
    
    if not payload:
        return jsonify({'error': 'Invalid token'}), 401
    
    user_id = payload.get('user_id')
    if not user_id:
        print(f"User ID not found in token payload: {payload}")
        return jsonify({'error': 'User ID not found in token'}), 401

    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Get Donor ID from user_id
        cur.execute("SELECT donor_id FROM donors WHERE user_id = %s", (user_id,))
        donor = cur.fetchone()
        if not donor:
            return jsonify({'error': 'Donor not found'}), 404
        
        donor_id = donor['donor_id']

        # Get monthly donations for last 6 months
        cur.execute("""
            SELECT 
                TO_CHAR(donated_at, 'Mon') as month,
                EXTRACT(MONTH FROM donated_at) as month_num,
                COALESCE(SUM(amount), 0) as amount
            FROM donations
            WHERE donor_id = %s 
                AND donated_at >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY month_num, TO_CHAR(donated_at, 'Mon')
            ORDER BY month_num
        """, (donor_id,))
        monthly_donations = cur.fetchall()

        # Get donations by NGO
        cur.execute("""
            SELECT 
                n.name as ngo,
                COALESCE(SUM(d.amount), 0) as amount
            FROM donations d
            JOIN ngos n ON d.ngo_id = n.ngo_id
            WHERE d.donor_id = %s
            GROUP BY n.name
            ORDER BY amount DESC
            LIMIT 5
        """, (donor_id,))
        ngo_data = cur.fetchall()

        # Calculate percentages for NGOs
        total_from_ngos = sum(float(n['amount']) for n in ngo_data)
        donations_by_ngo = []
        colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-gray-500']
        for idx, ngo in enumerate(ngo_data):
            amount = float(ngo['amount'])
            percentage = (amount / total_from_ngos * 100) if total_from_ngos > 0 else 0
            donations_by_ngo.append({
                'ngo': ngo['ngo'],
                'amount': amount,
                'percentage': round(percentage, 0),
                'color': colors[idx % len(colors)]
            })

        # Get utilization by category (based on purpose)
        cur.execute("""
            SELECT 
                d.purpose as category,
                COALESCE(SUM(d.amount), 0) as amount,
                COALESCE(SUM(u.amount_utilized), 0) as utilized
            FROM donations d
            LEFT JOIN utilizations u ON d.donation_id = u.donation_id
            WHERE d.donor_id = %s
            GROUP BY d.purpose
            ORDER BY amount DESC
            LIMIT 5
        """, (donor_id,))
        category_data = cur.fetchall()

        # Calculate percentages for categories
        utilization_by_category = []
        for cat in category_data:
            amount = float(cat['amount'])
            utilized = float(cat['utilized'])
            percentage = (utilized / amount * 100) if amount > 0 else 0
            utilization_by_category.append({
                'category': cat['category'],
                'amount': amount,
                'utilized': utilized,
                'percentage': round(percentage, 0)
            })

        # Get summary statistics
        cur.execute("""
            SELECT 
                COALESCE(SUM(amount), 0) as total_donations,
                COUNT(*) as donation_count,
                COUNT(DISTINCT ngo_id) as ngos_supported
            FROM donations
            WHERE donor_id = %s
        """, (donor_id,))
        summary = cur.fetchone()

        cur.execute("""
            SELECT COALESCE(SUM(u.amount_utilized), 0) as total_utilized
            FROM donations d
            LEFT JOIN utilizations u ON d.donation_id = u.donation_id
            WHERE d.donor_id = %s
        """, (donor_id,))
        util_summary = cur.fetchone()

        # Calculate last 6 months average
        cur.execute("""
            SELECT COALESCE(AVG(amount), 0) as avg_monthly
            FROM donations
            WHERE donor_id = %s
                AND donated_at >= CURRENT_DATE - INTERVAL '6 months'
        """, (donor_id,))
        avg_data = cur.fetchone()

        # Get previous period for comparison
        cur.execute("""
            SELECT COALESCE(SUM(amount), 0) as prev_total
            FROM donations
            WHERE donor_id = %s
                AND donated_at >= CURRENT_DATE - INTERVAL '12 months'
                AND donated_at < CURRENT_DATE - INTERVAL '6 months'
        """, (donor_id,))
        prev_period = cur.fetchone()

        total_donations = float(summary['total_donations'])
        total_utilized = float(util_summary['total_utilized'])
        avg_monthly = float(avg_data['avg_monthly'])
        prev_total = float(prev_period['prev_total'])
        
        # Calculate growth (last 6 months vs previous 6 months)
        cur.execute("""
            SELECT COALESCE(SUM(amount), 0) as last_6_months
            FROM donations
            WHERE donor_id = %s
                AND donated_at >= CURRENT_DATE - INTERVAL '6 months'
        """, (donor_id,))
        last_6_months = float(cur.fetchone()['last_6_months'])
        
        growth_percent = ((last_6_months - prev_total) / prev_total * 100) if prev_total > 0 else 0

        # Get insights - top NGO and category
        top_ngo = donations_by_ngo[0] if donations_by_ngo else {'ngo': 'N/A', 'amount': 0, 'percentage': 0}
        top_category = utilization_by_category[0] if utilization_by_category else {'category': 'N/A', 'percentage': 0}

        stats = {
            'total_donated': total_donations,
            'avg_monthly': round(avg_monthly, 2),
            'total_utilized': total_utilized,
            'ngos_supported': summary['ngos_supported'],
            'growth_percent': round(growth_percent, 1)
        }

        insights = {
            'top_ngo': top_ngo['ngo'],
            'top_ngo_amount': top_ngo['amount'],
            'top_ngo_percentage': top_ngo['percentage'],
            'top_category': top_category['category'],
            'top_category_utilization': top_category['percentage'],
            'growth_trend': round(growth_percent, 0)
        }

        # Format monthly data
        monthly_data = []
        for row in monthly_donations:
            monthly_data.append({
                'month': row['month'],
                'amount': float(row['amount'])
            })

        return jsonify({
            'monthly_donations': monthly_data,
            'donations_by_ngo': donations_by_ngo,
            'utilization_by_category': utilization_by_category,
            'stats': stats,
            'insights': insights
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
