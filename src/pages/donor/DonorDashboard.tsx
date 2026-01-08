import { DollarSign, Users, Building2, Heart, TrendingUp, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

interface DonorDashboardProps {
  onNavigate: (page: string) => void;
}

interface SummaryData {
  totalDonations: number;
  utilizedAmount: number;
  ngosSupported: number;
  donationCount: number;
  growthPercent: number;
}

interface RecentDonation {
  donation_id: string;
  ngo: string;
  amount: number;
  date: string;
  utilizedPercent: number;
}

interface TopNGO {
  name: string;
  amount: number;
  percentage: number;
}

interface ImpactMetrics {
  childrenEducated: number;
  mealsProvided: number;
  medicalTreatments: number;
}

function DonorDashboard({ onNavigate }: DonorDashboardProps) {
  const { token: ctxToken } = useAuth();
  
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalDonations: 0,
    utilizedAmount: 0,
    ngosSupported: 0,
    donationCount: 0,
    growthPercent: 0,
  });

  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);
  const [topNGOs, setTopNGOs] = useState<TopNGO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [impactMetrics, setImpactMetrics] = useState<ImpactMetrics>({
    childrenEducated: 0,
    mealsProvided: 0,
    medicalTreatments: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get token from context first, then from localStorage
        const authToken = ctxToken || localStorage.getItem('token');
        if (!authToken) {
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
          return;
        }

        // Fetch donor analytics data
        const analyticsResponse = await fetch('http://localhost:5000/api/donor-analytics/reports', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!analyticsResponse.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const analyticsData = await analyticsResponse.json();

        // Update summary data
        setSummaryData({
          totalDonations: analyticsData.stats.total_donated,
          utilizedAmount: analyticsData.stats.total_utilized,
          ngosSupported: analyticsData.stats.ngos_supported,
          donationCount: analyticsData.monthly_donations.length,
          growthPercent: analyticsData.stats.growth_percent,
        });

        // Update top NGOs
        setTopNGOs(analyticsData.donations_by_ngo.slice(0, 3));

        // Fetch donor donation history for recent donations
        const donorHistoryResponse = await fetch('http://localhost:5000/api/donations/donor/history', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (donorHistoryResponse.ok) {
          const donorHistoryData = await donorHistoryResponse.json();
          
          // Format recent donations with actual data
          const recentDonationsData = donorHistoryData.donations.slice(0, 3).map((donation: any) => ({
            donation_id: donation.id,
            ngo: donation.ngo,
            amount: donation.amount,
            date: donation.date,
            utilizedPercent: donation.utilized,
          }));

          setRecentDonations(recentDonationsData);

          // Calculate impact metrics based on donations
          // This is a simplified calculation - in production, you'd have actual impact data
          const totalDonated = donorHistoryData.summary.total_donated;
          setImpactMetrics({
            childrenEducated: Math.round(totalDonated / 1000 * 2), // Rough estimate
            mealsProvided: Math.round(totalDonated / 10),
            medicalTreatments: Math.round(totalDonated / 5000),
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [ctxToken]);

  const quickActions = [
    { 
      label: 'Browse NGOs', 
      page: 'donor-ngos', 
      icon: <Building2 className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600',
      description: 'Find organizations to support'
    },
    { 
      label: 'Make Donation', 
      page: 'donor-make-donation', 
      icon: <Heart className="w-6 h-6" />,
      color: 'from-green-500 to-green-600',
      description: 'Contribute to a cause'
    },
    { 
      label: 'My Donations', 
      page: 'donor-donations', 
      icon: <DollarSign className="w-6 h-6" />,
      color: 'from-purple-500 to-purple-600',
      description: 'View donation history'
    },
    { 
      label: 'Reports', 
      page: 'donor-reports', 
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-orange-500 to-orange-600',
      description: 'Analyze your impact'
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">Error loading dashboard</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back, Donor!</h1>
          <p className="text-gray-600">Here's an overview of your charitable contributions</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <span className={`text-sm font-semibold ${summaryData.growthPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summaryData.growthPercent >= 0 ? '+' : ''}{summaryData.growthPercent.toFixed(1)}%
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Donations</h3>
            <p className="text-2xl font-bold text-gray-800">
              ₹{summaryData.totalDonations.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-green-600 font-semibold">
                {summaryData.totalDonations > 0 
                  ? `${((summaryData.utilizedAmount / summaryData.totalDonations) * 100).toFixed(1)}%`
                  : '0%'}
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Utilized Amount</h3>
            <p className="text-2xl font-bold text-gray-800">
              ₹{summaryData.utilizedAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-blue-600 font-semibold">Active</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">NGOs Supported</h3>
            <p className="text-2xl font-bold text-gray-800">{summaryData.ngosSupported}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm text-green-600 font-semibold">+{summaryData.donationCount}</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Donations Made</h3>
            <p className="text-2xl font-bold text-gray-800">{summaryData.donationCount}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => onNavigate(action.page)}
                className={`bg-gradient-to-r ${action.color} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 text-left`}
              >
                <div className="flex items-center mb-3">
                  {action.icon}
                  <ArrowRight className="w-5 h-5 ml-auto" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{action.label}</h3>
                <p className="text-sm text-white/90">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Donations */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Recent Donations</h2>
              <button
                onClick={() => onNavigate('donor-donations')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View All →
              </button>
            </div>
            <div className="space-y-4">
              {recentDonations.length > 0 ? (
                recentDonations.map((donation) => (
                  <div
                    key={donation.donation_id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => onNavigate('donor-utilization')}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{donation.ngo}</h3>
                      <p className="text-sm text-gray-600">{donation.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">₹{donation.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                      <p className="text-sm text-green-600">{donation.utilizedPercent.toFixed(0)}% Utilized</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-center py-4">No recent donations yet</p>
              )}
            </div>
          </div>

          {/* Top NGOs */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Top NGOs by Contribution</h2>
              <button
                onClick={() => onNavigate('donor-ngos')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Browse All →
              </button>
            </div>
            <div className="space-y-4">
              {topNGOs.length > 0 ? (
                topNGOs.map((ngo, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{ngo.name}</h3>
                      <span className="text-sm font-bold text-gray-800">
                        ₹{ngo.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                          style={{ width: `${ngo.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{ngo.percentage}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-center py-4">No NGO data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Impact Overview */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Your Impact</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-blue-100 text-sm mb-1">Children Educated</p>
              <p className="text-3xl font-bold">{impactMetrics.childrenEducated}</p>
              <p className="text-xs text-blue-200 mt-2">Based on your donations</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm mb-1">Meals Provided</p>
              <p className="text-3xl font-bold">{impactMetrics.mealsProvided.toLocaleString()}</p>
              <p className="text-xs text-blue-200 mt-2">Through partner NGOs</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm mb-1">Medical Treatments</p>
              <p className="text-3xl font-bold">{impactMetrics.medicalTreatments}</p>
              <p className="text-xs text-blue-200 mt-2">Healthcare initiatives</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DonorDashboard;
