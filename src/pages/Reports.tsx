import { BarChart3, PieChart, TrendingUp, Download, Loader } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MonthlyTrend {
  month: string;
  donations: number;
  utilization: number;
}

interface CategoryDist {
  category: string;
  percentage: number;
  amount: number;
  count: number;
}

interface TopProject {
  project_name: string;
  amount_utilized: number;
  beneficiaries: number;
  utilization_count: number;
}

interface ReportData {
  monthly_trends: MonthlyTrend[];
  category_distribution: CategoryDist[];
  yearly_summary: {
    total_donations: number;
    total_utilized: number;
    active_donors: number;
    total_donations_count: number;
    total_utilizations: number;
    growth_rate: number;
  };
  top_projects: TopProject[];
  impact_metrics: {
    total_beneficiaries: number;
    active_projects: number;
    completed_projects: number;
    active_ngos: number;
  };
  all_time_stats: {
    total_donations: number;
    total_utilized: number;
  };
}

function Reports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/reports/overall');
        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }
        const reportData: ReportData = await response.json();
        setData(reportData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleExportReport = () => {
    if (!data) return;

    const csv = [
      ['TrustBridge Donations - Financial Report'],
      ['Generated on:', new Date().toLocaleDateString('en-IN')],
      [],
      ['YEARLY SUMMARY'],
      ['Total Donations', `₹${data.yearly_summary.total_donations.toLocaleString('en-IN')}`],
      ['Total Utilized', `₹${data.yearly_summary.total_utilized.toLocaleString('en-IN')}`],
      ['Active Donors', data.yearly_summary.active_donors],
      ['Growth Rate', `${data.yearly_summary.growth_rate}%`],
      [],
      ['MONTHLY TRENDS'],
      ['Month', 'Donations (₹)', 'Utilization (₹)'],
      ...data.monthly_trends.map(m => [m.month, m.donations, m.utilization]),
      [],
      ['CATEGORY DISTRIBUTION'],
      ['Category', 'Amount (₹)', 'Percentage'],
      ...data.category_distribution.map(c => [c.category, c.amount, `${c.percentage}%`]),
      [],
      ['TOP PROJECTS'],
      ['Project Name', 'Amount Utilized (₹)', 'Beneficiaries'],
      ...data.top_projects.map(p => [p.project_name, p.amount_utilized, p.beneficiaries]),
      [],
      ['IMPACT METRICS'],
      ['Total Beneficiaries', data.impact_metrics.total_beneficiaries],
      ['Active Projects', data.impact_metrics.active_projects],
      ['Completed Projects', data.impact_metrics.completed_projects],
      ['Active NGOs', data.impact_metrics.active_ngos],
    ].map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="ml-4 text-gray-600">Loading reports...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <p className="text-red-600">{error || 'Failed to load reports'}</p>
      </div>
    );
  }

  const monthlyData = data.monthly_trends;
  const maxAmount = Math.max(
    ...monthlyData.map((d) => Math.max(d.donations, d.utilization))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Financial Reports
            </h1>
            <p className="text-gray-600">
              Comprehensive analysis of donations and fund utilization
            </p>
          </div>
          <button
            onClick={handleExportReport}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-shadow"
          >
            <Download className="w-5 h-5" />
            <span>Export Report</span>
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Monthly Trends
              </h2>
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="space-y-4">
              {monthlyData.map((data, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{data.month}</span>
                    <div className="flex space-x-4">
                      <span className="text-blue-600 font-semibold">
                        ₹{(data.donations / 100000).toFixed(1)}L
                      </span>
                      <span className="text-green-600 font-semibold">
                        ₹{(data.utilization / 100000).toFixed(1)}L
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{
                          width: `${(data.donations / maxAmount) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-green-600 h-full rounded-full"
                        style={{
                          width: `${(data.utilization / maxAmount) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-center space-x-6 mt-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  <span className="text-sm text-gray-600">Donations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                  <span className="text-sm text-gray-600">Utilization</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Category Distribution
              </h2>
              <PieChart className="w-6 h-6 text-green-600" />
            </div>
            <div className="space-y-4">
              {data.category_distribution.slice(0, 4).map((cat, index) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
                return (
                  <div key={index}>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-800 font-medium">
                        {cat.category}
                      </span>
                      <span className="text-gray-600 font-semibold">
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className={`${colors[index] || 'bg-gray-500'} h-4 rounded-full flex items-center justify-end pr-2`}
                        style={{ width: `${cat.percentage}%` }}
                      >
                        {cat.percentage >= 8 && (
                          <span className="text-white text-xs font-bold">
                            {cat.percentage.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Total Amount Distributed:</strong> ₹{data.yearly_summary.total_donations.toLocaleString('en-IN', { maximumFractionDigits: 0 })} across all
                categories
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Yearly Summary
              </h3>
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Total Donations</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{(data.yearly_summary.total_donations / 100000).toFixed(2)}L
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Utilized</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{(data.yearly_summary.total_utilized / 100000).toFixed(2)}L
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Growth Rate</p>
                <p className="text-2xl font-bold text-gray-800">
                  {data.yearly_summary.growth_rate > 0 ? '+' : ''}{data.yearly_summary.growth_rate}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Top Performing Projects
            </h3>
            <div className="space-y-3">
              {data.top_projects.slice(0, 3).map((project, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 truncate pr-2">
                    {project.project_name}
                  </span>
                  <span className="text-sm font-semibold text-green-600 whitespace-nowrap">
                    ₹{(project.amount_utilized / 100000).toFixed(2)}L
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Impact Metrics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Lives Impacted</span>
                <span className="text-sm font-semibold text-blue-600">
                  {data.impact_metrics.total_beneficiaries.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Projects Completed</span>
                <span className="text-sm font-semibold text-blue-600">
                  {data.impact_metrics.completed_projects}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Active NGOs</span>
                <span className="text-sm font-semibold text-blue-600">
                  {data.impact_metrics.active_ngos}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-lg shadow-md p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">
            Transparency & Accountability
          </h2>
          <p className="text-lg mb-4">
            All financial data is audited and verified for complete transparency
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <div>
              <p className="text-3xl font-bold">100%</p>
              <p className="text-sm">Fund Tracking</p>
            </div>
            <div>
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-sm">Real-time Updates</p>
            </div>
            <div>
              <p className="text-3xl font-bold">0%</p>
              <p className="text-sm">Administrative Fees</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
