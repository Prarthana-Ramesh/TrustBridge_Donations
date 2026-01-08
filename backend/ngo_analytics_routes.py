from flask import Blueprint, jsonify, request, current_app
from db import get_db
from jwt_utils import decode_jwt
from psycopg2.extras import RealDictCursor

ngo_analytics_bp = Blueprint('ngo_analytics', __name__, url_prefix='/api/ngo-analytics')

@ngo_analytics_bp.route('/reports', methods=['GET'])
def get_ngo_reports():
    """Get comprehensive analytics and reports for an NGO"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'Authorization header missing'}), 401
    
    token = auth_header.replace('Bearer ', '')
    try:
        payload = decode_jwt(token, current_app.config.get('SECRET_KEY'))
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 401
    
    if not payload:
        return jsonify({'error': 'Invalid token'}), 401
    
    user_id = payload.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID not found in token'}), 401

    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Get NGO ID from user_id
        cur.execute("SELECT ngo_id FROM ngos WHERE user_id = %s", (user_id,))
        ngo = cur.fetchone()
        if not ngo:
            return jsonify({'error': 'NGO not found'}), 404
        
        ngo_id = ngo['ngo_id']

        # Get monthly donations and utilizations for current year
        cur.execute("""
            SELECT 
                TO_CHAR(donated_at, 'Mon') as month,
                EXTRACT(MONTH FROM donated_at) as month_num,
                COALESCE(SUM(amount), 0) as donations
            FROM donations
            WHERE ngo_id = %s 
                AND EXTRACT(YEAR FROM donated_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            GROUP BY month_num, TO_CHAR(donated_at, 'Mon')
            ORDER BY month_num
        """, (ngo_id,))
        monthly_donations_raw = cur.fetchall()

        # Get monthly utilizations
        cur.execute("""
            SELECT 
                EXTRACT(MONTH FROM u.utilized_at) as month_num,
                COALESCE(SUM(u.amount_utilized), 0) as utilized
            FROM utilizations u
            WHERE u.ngo_id = %s 
                AND EXTRACT(YEAR FROM u.utilized_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            GROUP BY month_num
            ORDER BY month_num
        """, (ngo_id,))
        monthly_utilized_raw = cur.fetchall()

        # Combine monthly data
        utilized_by_month = {int(row['month_num']): float(row['utilized']) for row in monthly_utilized_raw}
        monthly_data = []
        for row in monthly_donations_raw:
            month_num = int(row['month_num'])
            monthly_data.append({
                'month': row['month'],
                'donations': float(row['donations']),
                'utilized': utilized_by_month.get(month_num, 0)
            })

        # Get top donors
        cur.execute("""
            SELECT 
                d.name as donor,
                COALESCE(SUM(dn.amount), 0) as amount
            FROM donations dn
            JOIN donors d ON dn.donor_id = d.donor_id
            WHERE dn.ngo_id = %s
            GROUP BY d.name
            ORDER BY amount DESC
            LIMIT 6
        """, (ngo_id,))
        donor_data = cur.fetchall()

        # Calculate percentages for donors
        total_from_donors = sum(float(d['amount']) for d in donor_data)
        donor_wise_data = []
        for donor in donor_data:
            amount = float(donor['amount'])
            percentage = (amount / total_from_donors * 100) if total_from_donors > 0 else 0
            donor_wise_data.append({
                'donor': donor['donor'],
                'amount': amount,
                'percentage': round(percentage, 0)
            })

        # Get category-wise data (based on purpose)
        cur.execute("""
            SELECT 
                d.purpose as category,
                COALESCE(SUM(d.amount), 0) as amount,
                COALESCE(SUM(u.amount_utilized), 0) as utilized
            FROM donations d
            LEFT JOIN utilizations u ON d.donation_id = u.donation_id
            WHERE d.ngo_id = %s
            GROUP BY d.purpose
            ORDER BY amount DESC
            LIMIT 5
        """, (ngo_id,))
        category_data = cur.fetchall()

        # Calculate percentages for categories
        total_category = sum(float(c['amount']) for c in category_data)
        category_wise_data = []
        for cat in category_data:
            amount = float(cat['amount'])
            utilized = float(cat['utilized'])
            percentage = (amount / total_category * 100) if total_category > 0 else 0
            category_wise_data.append({
                'category': cat['category'],
                'amount': amount,
                'utilized': utilized,
                'percentage': round(percentage, 0)
            })

        # Get yearly comparison (last 3 years)
        cur.execute("""
            SELECT 
                EXTRACT(YEAR FROM donated_at)::text as year,
                COALESCE(SUM(amount), 0) as total_donations,
                COUNT(DISTINCT donor_id) as donors
            FROM donations
            WHERE ngo_id = %s
                AND donated_at >= CURRENT_DATE - INTERVAL '3 years'
            GROUP BY year
            ORDER BY year
        """, (ngo_id,))
        yearly_donations = cur.fetchall()

        # Get yearly utilization
        cur.execute("""
            SELECT 
                EXTRACT(YEAR FROM utilized_at)::text as year,
                COALESCE(SUM(amount_utilized), 0) as utilized
            FROM utilizations
            WHERE ngo_id = %s
                AND utilized_at >= CURRENT_DATE - INTERVAL '3 years'
            GROUP BY year
            ORDER BY year
        """, (ngo_id,))
        yearly_utilized = cur.fetchall()

        # Combine yearly data
        utilized_by_year = {row['year']: float(row['utilized']) for row in yearly_utilized}
        yearly_comparison = []
        for row in yearly_donations:
            year = row['year']
            total_donations = float(row['total_donations'])
            utilized = utilized_by_year.get(year, 0)
            yearly_comparison.append({
                'year': year,
                'totalDonations': total_donations,
                'utilized': utilized,
                'donors': row['donors']
            })

        # Get summary statistics
        cur.execute("""
            SELECT 
                COALESCE(SUM(amount), 0) as total_donations,
                COUNT(DISTINCT donor_id) as active_donors,
                COUNT(*) as donation_count
            FROM donations
            WHERE ngo_id = %s
                AND EXTRACT(YEAR FROM donated_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        """, (ngo_id,))
        summary = cur.fetchone()

        cur.execute("""
            SELECT COALESCE(SUM(amount_utilized), 0) as total_utilized
            FROM utilizations
            WHERE ngo_id = %s
                AND EXTRACT(YEAR FROM utilized_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        """, (ngo_id,))
        util_summary = cur.fetchone()

        # Calculate previous year for comparison
        cur.execute("""
            SELECT COALESCE(SUM(amount), 0) as prev_total
            FROM donations
            WHERE ngo_id = %s
                AND EXTRACT(YEAR FROM donated_at) = EXTRACT(YEAR FROM CURRENT_DATE) - 1
        """, (ngo_id,))
        prev_year = cur.fetchone()

        total_donations = float(summary['total_donations'])
        total_utilized = float(util_summary['total_utilized'])
        prev_total = float(prev_year['prev_total'])
        
        growth_percent = ((total_donations - prev_total) / prev_total * 100) if prev_total > 0 else 0
        utilization_percent = (total_utilized / total_donations * 100) if total_donations > 0 else 0
        avg_donation = total_donations / summary['donation_count'] if summary['donation_count'] > 0 else 0

        stats = {
            'total_donations': total_donations,
            'total_utilized': total_utilized,
            'active_donors': summary['active_donors'],
            'avg_donation': round(avg_donation, 2),
            'growth_percent': round(growth_percent, 1),
            'utilization_percent': round(utilization_percent, 0)
        }

        return jsonify({
            'monthly_data': monthly_data,
            'donor_wise_data': donor_wise_data,
            'category_wise_data': category_wise_data,
            'yearly_comparison': yearly_comparison,
            'stats': stats
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
