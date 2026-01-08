from flask import Blueprint, jsonify, current_app
from db import get_db
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')


@reports_bp.route("/overall", methods=["GET"])
def get_overall_reports():
    """Fetch comprehensive overall reports across all NGOs"""
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Get last 6 months of data
    today = datetime.now()
    six_months_ago = today - timedelta(days=180)

    # Monthly trends for donations vs utilization (last 6 months)
    cur.execute("""
        WITH monthly_data AS (
            SELECT 
                DATE_TRUNC('month', d.donated_at)::date as month,
                COALESCE(SUM(d.amount), 0) as donations,
                COALESCE(SUM(u.amount_utilized), 0) as utilization
            FROM donations d
            LEFT JOIN utilizations u ON d.donation_id = u.donation_id
            WHERE d.donated_at >= %s
            GROUP BY DATE_TRUNC('month', d.donated_at)
            ORDER BY month DESC
            LIMIT 6
        )
        SELECT * FROM monthly_data ORDER BY month ASC
    """, (six_months_ago,))
    monthly_trends = cur.fetchall()

    # Category distribution (by purpose)
    cur.execute("""
        SELECT 
            d.purpose as category,
            COUNT(*) as count,
            SUM(d.amount) as total_amount,
            ROUND(100.0 * SUM(d.amount) / 
                (SELECT SUM(amount) FROM donations WHERE donated_at >= %s), 2) as percentage
        FROM donations d
        WHERE d.donated_at >= %s
        GROUP BY d.purpose
        ORDER BY total_amount DESC
        LIMIT 10
    """, (six_months_ago, six_months_ago))
    category_dist = cur.fetchall()

    # Yearly summary stats
    cur.execute("""
        SELECT 
            COALESCE(SUM(d.amount), 0) as total_donations,
            COALESCE(SUM(u.amount_utilized), 0) as total_utilized,
            COUNT(DISTINCT d.donor_id) as active_donors,
            COUNT(DISTINCT d.donation_id) as total_donations_count,
            COUNT(DISTINCT u.utilization_id) as total_utilizations
        FROM donations d
        LEFT JOIN utilizations u ON d.donation_id = u.donation_id
        WHERE d.donated_at >= %s
    """, (six_months_ago,))
    yearly_stats = cur.fetchone()

    # Growth rate calculation
    cur.execute("""
        SELECT 
            DATE_TRUNC('month', d.donated_at)::date as month,
            COALESCE(SUM(d.amount), 0) as monthly_total
        FROM donations d
        WHERE d.donated_at >= %s
        GROUP BY DATE_TRUNC('month', d.donated_at)
        ORDER BY month DESC
        LIMIT 2
    """, (six_months_ago,))
    growth_data = cur.fetchall()

    growth_rate = 0
    if len(growth_data) >= 2:
        prev_month = growth_data[1].get('monthly_total', 0) or 0
        if prev_month > 0:
            curr_month = growth_data[0].get('monthly_total', 0) or 0
            growth_rate = round(((curr_month - prev_month) / prev_month) * 100, 1)

    # Top projects by fund utilization
    cur.execute("""
        SELECT 
            COALESCE(p.name, u.purpose, 'General Project') as project_name,
            COALESCE(SUM(u.amount_utilized), 0) as amount_utilized,
            COALESCE(SUM(u.beneficiaries), 0) as beneficiaries,
            COUNT(DISTINCT u.utilization_id) as utilization_count
        FROM utilizations u
        LEFT JOIN projects p ON u.project_id = p.project_id
        WHERE u.utilized_at >= %s
        GROUP BY p.project_id, u.purpose
        ORDER BY amount_utilized DESC
        LIMIT 5
    """, (six_months_ago,))
    top_projects = cur.fetchall()

    # Impact metrics
    cur.execute("""
        SELECT 
            COALESCE(SUM(u.beneficiaries), 0) as total_beneficiaries,
            COUNT(DISTINCT u.project_id) as active_projects,
            COUNT(DISTINCT CASE WHEN u.amount_utilized > 0 THEN u.utilization_id END) as completed_projects,
            COUNT(DISTINCT n.ngo_id) as active_ngos
        FROM utilizations u
        LEFT JOIN projects p ON u.project_id = p.project_id
        LEFT JOIN ngos n ON u.ngo_id = n.ngo_id
        WHERE u.utilized_at >= %s
    """, (six_months_ago,))
    impact = cur.fetchone()

    # All-time stats for comparison
    cur.execute("""
        SELECT 
            COALESCE(SUM(d.amount), 0) as total_donations_all_time,
            COALESCE(SUM(u.amount_utilized), 0) as total_utilized_all_time
        FROM donations d
        LEFT JOIN utilizations u ON d.donation_id = u.donation_id
    """)
    all_time_stats = cur.fetchone()

    cur.close()
    conn.close()

    # Format response
    monthly_list = [
        {
            "month": m["month"].strftime("%b") if m["month"] else "Unknown",
            "donations": float(m.get("donations") or 0),
            "utilization": float(m.get("utilization") or 0)
        }
        for m in monthly_trends
    ]

    category_list = [
        {
            "category": c.get("category") or "Other",
            "percentage": float(c.get("percentage") or 0),
            "amount": float(c.get("total_amount") or 0),
            "count": c.get("count") or 0
        }
        for c in category_dist
    ]

    project_list = [
        {
            "project_name": p.get("project_name") or "General",
            "amount_utilized": float(p.get("amount_utilized") or 0),
            "beneficiaries": p.get("beneficiaries") or 0,
            "utilization_count": p.get("utilization_count") or 0
        }
        for p in top_projects
    ]

    return jsonify({
        "monthly_trends": monthly_list,
        "category_distribution": category_list,
        "yearly_summary": {
            "total_donations": float(yearly_stats.get("total_donations") or 0),
            "total_utilized": float(yearly_stats.get("total_utilized") or 0),
            "active_donors": yearly_stats.get("active_donors") or 0,
            "total_donations_count": yearly_stats.get("total_donations_count") or 0,
            "total_utilizations": yearly_stats.get("total_utilizations") or 0,
            "growth_rate": growth_rate
        },
        "top_projects": project_list,
        "impact_metrics": {
            "total_beneficiaries": impact.get("total_beneficiaries") or 0,
            "active_projects": impact.get("active_projects") or 0,
            "completed_projects": impact.get("completed_projects") or 0,
            "active_ngos": impact.get("active_ngos") or 0
        },
        "all_time_stats": {
            "total_donations": float(all_time_stats.get("total_donations_all_time") or 0),
            "total_utilized": float(all_time_stats.get("total_utilized_all_time") or 0)
        }
    })
