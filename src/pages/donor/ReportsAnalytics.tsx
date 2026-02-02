import { TrendingUp, DollarSign, PieChart, BarChart3, Download, Calendar, Loader, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import API_BASE_URL from '../../api';

interface ReportsAnalyticsProps {
  onNavigate: (page: string) => void;
}

interface MonthlyDonation {
  month: string;
  amount: number;
}

interface NGODonation {
  ngo: string;
  amount: number;
  percentage: number;
  color: string;
}

interface CategoryUtilization {
  category: string;
  amount: number;
  utilized: number;
  percentage: number;
}

interface Stats {
  total_donated: number;
  avg_monthly: number;
  total_utilized: number;
  ngos_supported: number;
  growth_percent: number;
}

interface Insights {
  top_ngo: string;
  top_ngo_amount: number;
  top_ngo_percentage: number;
  top_category: string;
  top_category_utilization: number;
  growth_trend: number;
}

interface ReportsData {
  monthly_donations: MonthlyDonation[];
  donations_by_ngo: NGODonation[];
  utilization_by_category: CategoryUtilization[];
  stats: Stats;
  insights: Insights;
}

function ReportsAnalytics({}: ReportsAnalyticsProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportsData | null>(null);

  useEffect(() => {
    loadReports();
  }, [token]);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/api/donor-analytics/reports`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const reportData = await response.json();
      setData(reportData);
    } catch (err: any) {
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">Error Loading Reports</h2>
          <p className="text-gray-600 text-center">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  const monthlyDonations = data.monthly_donations;
  const donationsByNGO = data.donations_by_ngo;
  const utilizationByCategory = data.utilization_by_category;
  const maxAmount = monthlyDonations.length > 0 ? Math.max(...monthlyDonations.map((d) => d.amount)) : 1;

  const handleExport = () => {
    try {
      // Prepare CSV data
      const csvContent = [
        ['TrustBridge Donations - Donor Reports & Analytics'],
        ['Generated on:', new Date().toLocaleDateString()],
        [],
        ['SUMMARY STATISTICS'],
        ['Total Donated', `₹${data.stats.total_donated}`],
        ['Average Monthly', `₹${data.stats.avg_monthly}`],
        ['Total Utilized', `₹${data.stats.total_utilized}`],
        ['NGOs Supported', data.stats.ngos_supported],
        ['Growth %', `${data.stats.growth_percent}%`],
        [],
        ['MONTHLY DONATIONS (Last 6 Months)'],
        ['Month', 'Amount'],
        ...data.monthly_donations.map((m) => [m.month, m.amount]),
        [],
        ['DONATIONS BY NGO'],
        ['NGO', 'Amount', 'Percentage'],
        ...data.donations_by_ngo.map((n) => [n.ngo, n.amount, `${n.percentage}%`]),
        [],
        ['UTILIZATION BY CATEGORY'],
        ['Category', 'Amount', 'Utilized', 'Percentage'],
        ...data.utilization_by_category.map((c) => [c.category, c.amount, c.utilized, `${c.percentage}%`]),
      ]
        .map((row) => row.join(','))
        .join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `donor-reports-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error exporting report');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Reports & Analytics</h1>
            <p className="text-gray-600">Track your donation impact and trends</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-medium">Last 6 Months</span>
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-5 h-5" />
              <span className="text-sm font-medium">Export Report</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Total Donated</p>
            <p className="text-2xl font-bold text-gray-800 mb-2">₹{data.stats.total_donated.toLocaleString()}</p>
            <div className="flex items-center">
              <span className={`text-sm font-semibold ${data.stats.growth_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.stats.growth_percent > 0 ? '+' : ''}{data.stats.growth_percent}%
              </span>
              <span className="text-xs text-gray-500 ml-2">vs last period</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Average Monthly</p>
            <p className="text-2xl font-bold text-gray-800 mb-2">₹{data.stats.avg_monthly.toLocaleString()}</p>
            <div className="flex items-center">
              <span className="text-sm font-semibold text-green-600">+8.3%</span>
              <span className="text-xs text-gray-500 ml-2">vs last period</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Total Utilized</p>
            <p className="text-2xl font-bold text-gray-800 mb-2">₹{data.stats.total_utilized.toLocaleString()}</p>
            <div className="flex items-center">
              <span className="text-sm font-semibold text-green-600">+15.2%</span>
              <span className="text-xs text-gray-500 ml-2">vs last period</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm text-gray-600 mb-2">NGOs Supported</p>
            <p className="text-2xl font-bold text-gray-800 mb-2">{data.stats.ngos_supported}</p>
            <div className="flex items-center">
              <span className="text-sm font-semibold text-green-600">+3</span>
              <span className="text-xs text-gray-500 ml-2">vs last period</span>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Donations Trend */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Monthly Donations</h2>
                  <p className="text-sm text-gray-600">Contribution trends over time</p>
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="overflow-x-auto">
              <svg width="100%" height="400" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid meet" className="min-w-max">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <line
                    key={`grid-${i}`}
                    x1="80"
                    y1={320 - (i * 64)}
                    x2="950"
                    y2={320 - (i * 64)}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                ))}

                {/* Y-axis */}
                <line x1="80" y1="20" x2="80" y2="320" stroke="#1f2937" strokeWidth="2" />

                {/* X-axis */}
                <line x1="80" y1="320" x2="950" y2="320" stroke="#1f2937" strokeWidth="2" />

                {/* Y-axis label */}
                <text x="20" y="170" fontSize="12" fill="#6b7280" textAnchor="middle" transform="rotate(-90 20 170)">
                  Amount (₹)
                </text>

                {/* X-axis label */}
                <text x="515" y="360" fontSize="12" fill="#6b7280" textAnchor="middle">
                  Month
                </text>

                {/* Y-axis ticks and labels */}
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const value = Math.round((maxAmount / 5) * i);
                  return (
                    <g key={`y-tick-${i}`}>
                      <line x1="75" y1={320 - (i * 64)} x2="80" y2={320 - (i * 64)} stroke="#1f2937" strokeWidth="1" />
                      <text x="70" y={325 - (i * 64)} fontSize="11" fill="#6b7280" textAnchor="end">
                        {value > 0 ? `₹${(value / 1000).toFixed(0)}K` : '0'}
                      </text>
                    </g>
                  );
                })}

                {/* Columns */}
                {monthlyDonations.map((month, index) => {
                  const barWidth = 800 / monthlyDonations.length;
                  const x = 100 + (index * barWidth);
                  const height = (month.amount / maxAmount) * 280;

                  return (
                    <g key={`month-${index}`}>
                      {/* Column */}
                      <rect
                        x={x + barWidth * 0.45}
                        y={320 - height}
                        width={barWidth * 0.1}
                        height={height}
                        fill="url(#columnGradient)"
                        rx="4"
                      />

                      {/* Value label on top of column */}
                      {month.amount > 0 && (
                        <text x={x + barWidth * 0.5} y={320 - height - 8} fontSize="10" fill="#1f2937" textAnchor="middle" fontWeight="bold">
                          ₹{(month.amount / 1000).toFixed(0)}K
                        </text>
                      )}

                      {/* X-axis label */}
                      <text x={x + barWidth * 0.5} y="340" fontSize="11" fill="#6b7280" textAnchor="middle">
                        {month.month}
                      </text>
                    </g>
                  );
                })}

                {/* Gradient definition */}
                <defs>
                  <linearGradient id="columnGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1e40af" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Monthly</span>
                <span className="text-lg font-bold text-gray-800">₹{data.stats.avg_monthly.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Donations by NGO - Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <PieChart className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Donations by NGO</h2>
                  <p className="text-sm text-gray-600">Distribution across organizations</p>
                </div>
              </div>
            </div>

            {/* Donut Chart Representation */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-48 h-48">
                {/* Outer ring with segments */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {donationsByNGO.map((ngo, index) => {
                    const previousPercentages = donationsByNGO
                      .slice(0, index)
                      .reduce((sum, n) => sum + n.percentage, 0);
                    const strokeDasharray = `${ngo.percentage} ${100 - ngo.percentage}`;
                    const strokeDashoffset = -previousPercentages;

                    return (
                      <circle
                        key={index}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={
                          ngo.color.includes('blue')
                            ? '#3b82f6'
                            : ngo.color.includes('green')
                            ? '#10b981'
                            : ngo.color.includes('purple')
                            ? '#a855f7'
                            : ngo.color.includes('orange')
                            ? '#f97316'
                            : '#6b7280'
                        }
                        strokeWidth="16"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-gray-800">₹{(data.stats.total_donated / 100000).toFixed(2)}L</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              {donationsByNGO.length > 0 ? (
                donationsByNGO.map((ngo, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${ngo.color}`}></div>
                      <span className="text-sm text-gray-700">{ngo.ngo}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">
                        ₹{(ngo.amount / 1000).toFixed(0)}K
                      </p>
                      <p className="text-xs text-gray-500">{ngo.percentage}%</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No NGO data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Utilization by Category */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Utilization by Category</h2>
                <p className="text-sm text-gray-600">How your donations are being used</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {utilizationByCategory.length > 0 ? (
              utilizationByCategory.map((category, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">{category.category}</h3>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">
                        ₹{category.utilized.toLocaleString()} / ₹{category.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-green-600">{category.percentage}% Utilized</p>
                    </div>
                  </div>

                  {/* Stacked Progress Bar */}
                  <div className="relative w-full bg-gray-200 rounded-full h-6">
                    <div
                      className="absolute top-0 left-0 bg-gradient-to-r from-green-500 to-green-600 h-6 rounded-full flex items-center justify-center transition-all duration-500"
                      style={{ width: `${category.percentage}%` }}
                    >
                      {category.percentage > 15 && (
                        <span className="text-white text-xs font-semibold">Utilized</span>
                      )}
                    </div>
                    <div
                      className="absolute top-0 bg-gray-300 h-6 rounded-r-full flex items-center justify-center"
                      style={{
                        left: `${category.percentage}%`,
                        width: `${100 - category.percentage}%`,
                      }}
                    >
                      {100 - category.percentage > 15 && (
                        <span className="text-gray-600 text-xs font-semibold">Pending</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No utilization data available</div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Allocated</p>
                <p className="text-xl font-bold text-gray-800">₹{data.stats.total_donated.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Utilized</p>
                <p className="text-xl font-bold text-green-600">₹{data.stats.total_utilized.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-xl font-bold text-orange-600">₹{(data.stats.total_donated - data.stats.total_utilized).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Key Insights</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-6 h-6" />
                <h3 className="font-semibold">Top Contribution</h3>
              </div>
              <p className="text-2xl font-bold mb-1">{data.insights.top_ngo}</p>
              <p className="text-sm text-blue-100">₹{data.insights.top_ngo_amount.toLocaleString()} donated ({data.insights.top_ngo_percentage}% of total)</p>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6" />
                <h3 className="font-semibold">Highest Utilization</h3>
              </div>
              <p className="text-2xl font-bold mb-1">{data.insights.top_category}</p>
              <p className="text-sm text-blue-100">{data.insights.top_category_utilization}% funds utilized effectively</p>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-6 h-6" />
                <h3 className="font-semibold">Growth Trend</h3>
              </div>
              <p className="text-2xl font-bold mb-1">{data.insights.growth_trend > 0 ? '+' : ''}{data.insights.growth_trend}%</p>
              <p className="text-sm text-blue-100">Change in last 6 months</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsAnalytics;
