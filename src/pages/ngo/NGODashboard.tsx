import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { DollarSign, Users, TrendingUp, FolderOpen, Bell, Heart, ArrowRight, Clock } from 'lucide-react';

interface NGODashboardProps {
  onNavigate: (page: string) => void;
}

function NGODashboard({ onNavigate }: NGODashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState({
    totalDonationsReceived: 0,
    utilizedFunds: 0,
    activeDonors: 0,
    activeProjects: 0,
    additionalDonationsSinceLastLogin: 0,
    utilizationChangePercent: null as number | null,
    newDonorsSinceLastLogin: 0,
  });

  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const { token } = useAuth();

  useEffect(() => {

    const load = async () => {
      setLoading(true);
      setError(null);
      console.debug('NGODashboard - token', token);
      try {
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        console.debug('NGODashboard - fetch headers', headers);
        const res = await fetch('/api/ngo/dashboard', { headers });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to fetch dashboard data');
        }

        const text = await res.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch (err) {
          throw new Error('Invalid JSON response from server: ' + (text || String(err)));
        }

        const summary = data.summary || {};
        setSummaryData({
          totalDonationsReceived: summary.totalDonationsReceived || 0,
          utilizedFunds: summary.utilizedFunds || 0,
          activeDonors: summary.activeDonors || 0,
          activeProjects: summary.activeProjects || 0,
          additionalDonationsSinceLastLogin: summary.additionalDonationsSinceLastLogin || 0,
          utilizationChangePercent: summary.utilizationChangePercent ?? null,
          newDonorsSinceLastLogin: summary.newDonorsSinceLastLogin || 0,
        });
        setRecentDonations((data.recentDonations || []).map((d: any, idx: number) => ({
          id: d.donation_id || idx,
          donor: d.donor || 'Unknown',
          amount: d.amount,
          date: d.date || d.donated_at,
          project: d.project_name || '',
          new: false
        })));
        setNotifications(data.notifications || []);
        setActiveProjects(data.activeProjects || []);
      } catch (err: any) {
        setError(err.message || 'Server error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);


  const quickActions = [
    { label: 'Manage Donors', page: 'ngo-donor-management', icon: <Users className="w-6 h-6" />, color: 'from-blue-500 to-blue-600' },
    { label: 'View Donations', page: 'ngo-donation-records', icon: <DollarSign className="w-6 h-6" />, color: 'from-green-500 to-green-600' },
    { label: 'Add Utilization', page: 'ngo-utilization', icon: <TrendingUp className="w-6 h-6" />, color: 'from-purple-500 to-purple-600' },
    { label: 'Request Funding', page: 'ngo-funding-request', icon: <Heart className="w-6 h-6" />, color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">NGO Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's an overview of your organization</p>
        </div>

        {/* Summary Cards */}
        {loading ? (
          <div className="mb-8 text-center text-gray-600">Loading dashboard...</div>
        ) : error ? (
          <div className="mb-8 text-center text-red-600">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              {summaryData.additionalDonationsSinceLastLogin > 0 && (
                <span className="text-sm text-green-600 font-semibold">+{summaryData.additionalDonationsSinceLastLogin}</span>
              )}
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Donations Received</h3>
            <p className="text-2xl font-bold text-gray-800">
              ₹{summaryData.totalDonationsReceived.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              {summaryData.utilizationChangePercent !== null && Math.abs(summaryData.utilizationChangePercent) > 0 && (
                <span className={`text-sm font-semibold ${summaryData.utilizationChangePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summaryData.utilizationChangePercent > 0 ? '+' : ''}{summaryData.utilizationChangePercent}%
                </span>
              )}
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Utilized Funds</h3>
            <p className="text-2xl font-bold text-gray-800">
              ₹{summaryData.utilizedFunds.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              {summaryData.newDonorsSinceLastLogin > 0 && (
                <span className="text-sm text-blue-600 font-semibold">+{summaryData.newDonorsSinceLastLogin} new</span>
              )}
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Active Donors</h3>
            <p className="text-2xl font-bold text-gray-800">{summaryData.activeDonors}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FolderOpen className="w-6 h-6 text-orange-600" />
              </div>
              {summaryData.activeProjects > 0 && (
                <span className="text-sm text-green-600 font-semibold">{summaryData.activeProjects} ongoing</span>
              )}
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Active Projects</h3>
            <p className="text-2xl font-bold text-gray-800">{summaryData.activeProjects}</p>
          </div>
          </div>
        )}

        {/* Notifications Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6" />
              <h2 className="text-xl font-bold">Latest Notifications</h2>
            </div>
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
              {notifications.filter(n => !n.is_read).length} Unread
            </span>
          </div>
          <div className="space-y-3">
            {notifications.length > 0 ? (
              notifications.map((notification: any) => (
                <div
                  key={notification.notification_id || notification.id}
                  className={`p-4 rounded-lg transition-colors ${
                    notification.is_read ? 'bg-white/10' : 'bg-white/20 border border-white/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm flex-1 leading-relaxed font-medium">{notification.message}</p>
                    <span className="text-xs text-blue-100 ml-3 whitespace-nowrap">{notification.created_at}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-white/70 text-sm">
                No recent notifications
              </div>
            )}
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
                <h3 className="text-lg font-semibold">{action.label}</h3>
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
                onClick={() => onNavigate('ngo-donation-records')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View All →
              </button>
            </div>
            <div className="space-y-4">
              {recentDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{donation.donor}</h3>
                      {donation.new && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{donation.project}</p>
                    <p className="text-xs text-gray-500">{donation.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">₹{Number(donation.amount || 0).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Projects */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Active Projects</h2>
              <button
                onClick={() => onNavigate('ngo-utilization')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Manage →
              </button>
            </div>
            <div className="space-y-4">
              {activeProjects.map((project, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{project.name}</h3>
                    <span className="text-sm text-gray-600">{project.donors} donors</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Budget: ₹{project.budget.toLocaleString()}</span>
                    <span className="font-semibold">{project.utilized}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        project.utilized >= 90
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : project.utilized >= 70
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                          : 'bg-gradient-to-r from-yellow-500 to-orange-600'
                      }`}
                      style={{ width: `${project.utilized}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-800">Pending Tasks</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border-l-4 border-orange-500 bg-orange-50 rounded">
              <h4 className="font-semibold text-gray-800 mb-1">Utilization Reports Due</h4>
              <p className="text-sm text-gray-600">3 donations pending utilization details</p>
              <button
                onClick={() => onNavigate('ngo-utilization')}
                className="text-orange-600 font-medium text-sm mt-2"
              >
                Update Now →
              </button>
            </div>
            <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded">
              <h4 className="font-semibold text-gray-800 mb-1">Funding Responses</h4>
              <p className="text-sm text-gray-600">2 organizations replied to requests</p>
              <button
                onClick={() => onNavigate('ngo-funding-responses')}
                className="text-blue-600 font-medium text-sm mt-2"
              >
                View Responses →
              </button>
            </div>
            <div className="p-4 border-l-4 border-green-500 bg-green-50 rounded">
              <h4 className="font-semibold text-gray-800 mb-1">Profile Update</h4>
              <p className="text-sm text-gray-600">Keep your NGO profile up to date</p>
              <button
                onClick={() => onNavigate('ngo-profile')}
                className="text-green-600 font-medium text-sm mt-2"
              >
                Update Profile →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NGODashboard;
