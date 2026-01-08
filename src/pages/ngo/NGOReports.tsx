import { BarChart3, TrendingUp, Calendar, DollarSign, Users, Download, PieChart, Loader, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

interface NGOReportsProps {
  onNavigate: (page: string) => void;
}

interface MonthlyData {
  month: string;
  donations: number;
  utilized: number;
}

interface DonorData {
  donor: string;
  amount: number;
  percentage: number;
}

interface CategoryData {
  category: string;
  amount: number;
  utilized: number;
  percentage: number;
}

interface YearlyData {
  year: string;
  totalDonations: number;
  utilized: number;
  donors: number;
}

interface Stats {
  total_donations: number;
  total_utilized: number;
  active_donors: number;
  avg_donation: number;
  growth_percent: number;
  utilization_percent: number;
}

interface ReportsData {
  monthly_data: MonthlyData[];
  donor_wise_data: DonorData[];
  category_wise_data: CategoryData[];
  yearly_comparison: YearlyData[];
  stats: Stats;
}

function NGOReports({ }: NGOReportsProps) {
  const { token } = useAuth();
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedCategory, setSelectedCategory] = useState('all');
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

      const response = await fetch('/api/ngo-analytics/reports', { headers });
      
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

  const monthlyData = data.monthly_data;
  const donorWiseData = data.donor_wise_data;
  const categoryWiseData = data.category_wise_data;
  const yearlyComparison = data.yearly_comparison;
  const maxDonation = monthlyData.length > 0 ? Math.max(...monthlyData.map((d) => d.donations)) : 1;

  const handleExport = () => {
    try {
      // Prepare CSV data
      const csvContent = [
        ['TrustBridge Donations - NGO Reports & Analytics'],
        ['Generated on:', new Date().toLocaleDateString()],
        [],
        ['SUMMARY STATISTICS'],
        ['Total Donations', `₹${data.stats.total_donations}`],
        ['Total Utilized', `₹${data.stats.total_utilized}`],
        ['Active Donors', data.stats.active_donors],
        ['Average Donation', `₹${data.stats.avg_donation}`],
        ['Growth', `${data.stats.growth_percent}%`],
        ['Utilization %', `${data.stats.utilization_percent}%`],
        [],
        ['MONTHLY TRENDS'],
        ['Month', 'Donations', 'Utilized'],
        ...data.monthly_data.map((m) => [m.month, m.donations, m.utilized]),
        [],
        ['TOP DONORS'],
        ['Donor', 'Amount', 'Percentage'],
        ...data.donor_wise_data.map((d) => [d.donor, d.amount, `${d.percentage}%`]),
        [],
        ['CATEGORY UTILIZATION'],
        ['Category', 'Amount', 'Utilized', 'Percentage'],
        ...data.category_wise_data.map((c) => [c.category, c.amount, c.utilized, `${c.percentage}%`]),
      ]
        .map((row) => row.join(','))
        .join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ngo-reports-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error exporting report');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Education: 'bg-blue-500',
      Healthcare: 'bg-green-500',
      Infrastructure: 'bg-purple-500',
      'Social Welfare': 'bg-orange-500',
      Others: 'bg-gray-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Reports & Analytics</h1>
              <p className="text-gray-600">Comprehensive insights into donations and utilization</p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all"
            >
              <Download className="w-5 h-5" />
              Export Report
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="education">Education</option>
                <option value="healthcare">Healthcare</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="social">Social Welfare</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Donations</p>
            <p className="text-2xl font-bold text-gray-800">₹{data.stats.total_donations.toLocaleString()}</p>
            <p className="text-sm text-green-600 mt-1">
              {data.stats.growth_percent > 0 ? '+' : ''}{data.stats.growth_percent}% from last year
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Utilized Funds</p>
            <p className="text-2xl font-bold text-gray-800">₹{data.stats.total_utilized.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">{data.stats.utilization_percent}% utilization</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Active Donors</p>
            <p className="text-2xl font-bold text-gray-800">{data.stats.active_donors}</p>
            <p className="text-sm text-gray-600 mt-1">This year</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-orange-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Avg. Donation</p>
            <p className="text-2xl font-bold text-gray-800">₹{data.stats.avg_donation.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">Per donor</p>
          </div>
        </div>

        {/* Monthly Trends - Column Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Monthly Donation Trends
          </h2>
          
          {monthlyData.length > 0 ? (
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
                  const value = Math.round((maxDonation / 5) * i);
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
                {monthlyData.map((month, index) => {
                  const barWidth = (850 / (monthlyData.length * 2.5));
                  const spacing = barWidth * 1.2;
                  const x = 120 + index * spacing;
                  const donationsHeight = (month.donations / maxDonation) * 280;
                  const utilizedHeight = (month.utilized / maxDonation) * 280;

                  return (
                    <g key={`month-${index}`}>
                      {/* Donations column */}
                      <rect
                        x={x + barWidth * 0.28}
                        y={320 - donationsHeight}
                        width={barWidth / 2 - 20}
                        height={donationsHeight}
                        fill="#3b82f6"
                        rx="4"
                      />

                      {/* Utilized column */}
                      <rect
                        x={x + barWidth / 2 + 12}
                        y={320 - utilizedHeight}
                        width={barWidth / 2 - 20}
                        height={utilizedHeight}
                        fill="#10b981"
                        rx="4"
                      />

                      {/* X-axis label */}
                      <text x={x + barWidth / 2} y="340" fontSize="11" fill="#6b7280" textAnchor="middle">
                        {month.month}
                      </text>
                    </g>
                  );
                })}

                {/* Legend */}
                <rect x="100" y="360" width="15" height="15" fill="#3b82f6" rx="2" />
                <text x="120" y="372" fontSize="11" fill="#6b7280">
                  Donations
                </text>

                <rect x="280" y="360" width="15" height="15" fill="#10b981" rx="2" />
                <text x="300" y="372" fontSize="11" fill="#6b7280">
                  Utilized
                </text>
              </svg>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No monthly data available</div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Donor-wise Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Top Donors
            </h2>
            <div className="space-y-4">
              {donorWiseData.length > 0 ? (
                donorWiseData.map((donor, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{donor.donor}</span>
                      <span className="text-sm font-bold text-gray-800">₹{(donor.amount / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full"
                          style={{ width: `${donor.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-10 text-right">{donor.percentage}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No donor data available</div>
              )}
            </div>
          </div>

          {/* Category-wise Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <PieChart className="w-6 h-6" />
              Category-wise Utilization
            </h2>
            <div className="space-y-4">
              {categoryWiseData.length > 0 ? (
                categoryWiseData.map((category, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 ${getCategoryColor(category.category)} rounded-full`}></div>
                        <span className="text-sm font-medium text-gray-700">{category.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-800">₹{(category.amount / 1000).toFixed(0)}K</span>
                        <span className="text-xs text-gray-600 ml-2">({category.percentage}%)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`${getCategoryColor(category.category)} h-2 rounded-full`}
                          style={{ width: `${category.amount > 0 ? (category.utilized / category.amount) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-10 text-right">
                        {category.amount > 0 ? Math.round((category.utilized / category.amount) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No category data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Yearly Comparison */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Yearly Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Year</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Donations</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Utilized Funds</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Utilization %</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Active Donors</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Growth</th>
                </tr>
              </thead>
              <tbody>
                {yearlyComparison.length > 0 ? (
                  yearlyComparison.map((year, index) => {
                    const utilizationPercentage = year.totalDonations > 0 
                      ? Math.round((year.utilized / year.totalDonations) * 100)
                      : 0;
                    const growth = index > 0 && yearlyComparison[index - 1].totalDonations > 0
                      ? Math.round(((year.totalDonations - yearlyComparison[index - 1].totalDonations) / yearlyComparison[index - 1].totalDonations) * 100)
                      : 0;
                    
                    return (
                      <tr key={year.year} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold text-gray-800">{year.year}</td>
                        <td className="text-right py-3 px-4 text-gray-800">₹{(year.totalDonations / 1000).toFixed(0)}K</td>
                        <td className="text-right py-3 px-4 text-gray-800">₹{(year.utilized / 1000).toFixed(0)}K</td>
                        <td className="text-right py-3 px-4">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                            {utilizationPercentage}%
                          </span>
                        </td>
                        <td className="text-right py-3 px-4 text-gray-800">{year.donors}</td>
                        <td className="text-right py-3 px-4">
                          {index > 0 && (
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${growth > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {growth > 0 ? '+' : ''}{growth}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">No yearly data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NGOReports;
