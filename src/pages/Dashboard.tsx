import { DollarSign, TrendingUp, Users, Activity, Loader, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DashboardStats {
  total_donations: number;
  total_utilized: number;
  total_beneficiaries: number;
  active_projects: number;
  growth_percent: number;
  utilization_percent: number;
}

interface FundAllocation {
  utilized: number;
  available: number;
}

interface ThisMonth {
  donations: number;
  utilized: number;
  beneficiaries: number;
}

interface Category {
  category: string;
  percentage: number;
}

interface Activity {
  type: string;
  description: string;
  amount: string;
  time: string;
}

interface DashboardData {
  stats: DashboardStats;
  fund_allocation: FundAllocation;
  this_month: ThisMonth;
  top_categories: Category[];
  recent_activities: Activity[];
}

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err: any) {
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">Error Loading Dashboard</h2>
          <p className="text-gray-600 text-center">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Donations',
      value: `₹${data.stats.total_donations.toLocaleString()}`,
      change: `${data.stats.growth_percent > 0 ? '+' : ''}${data.stats.growth_percent}%`,
      icon: <DollarSign className="w-8 h-8" />,
      color: 'bg-blue-500',
    },
    {
      title: 'Utilized Funds',
      value: `₹${data.stats.total_utilized.toLocaleString()}`,
      change: `${data.stats.utilization_percent}%`,
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'bg-green-500',
    },
    {
      title: 'Total Beneficiaries',
      value: data.stats.total_beneficiaries.toLocaleString(),
      change: '+15.2%',
      icon: <Users className="w-8 h-8" />,
      color: 'bg-blue-600',
    },
    {
      title: 'Active NGOs',
      value: data.stats.active_projects.toString(),
      change: '+4',
      icon: <Activity className="w-8 h-8" />,
      color: 'bg-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">
            Monitor donation activities and fund utilization in real-time
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} text-white p-3 rounded-lg`}>
                  {stat.icon}
                </div>
                <span className="text-green-600 text-sm font-semibold">
                  {stat.change}
                </span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Fund Allocation
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Utilized</span>
                  <span className="text-sm font-semibold text-gray-800">{data.fund_allocation.utilized}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${data.fund_allocation.utilized}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Available</span>
                  <span className="text-sm font-semibold text-gray-800">{data.fund_allocation.available}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${data.fund_allocation.available}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              This Month
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Donations</span>
                <span className="font-semibold text-gray-800">₹{data.this_month.donations.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Utilized</span>
                <span className="font-semibold text-gray-800">₹{data.this_month.utilized.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Beneficiaries</span>
                <span className="font-semibold text-gray-800">{data.this_month.beneficiaries}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Top Categories
            </h3>
            <div className="space-y-3">
              {data.top_categories.map((cat, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-600">{cat.category}</span>
                  <span className="font-semibold text-blue-600">{cat.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Recent Activities
          </h2>
          <div className="space-y-4">
            {data.recent_activities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-0"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.type === 'donation'
                        ? 'bg-blue-600'
                        : activity.type === 'utilization'
                        ? 'bg-green-600'
                        : 'bg-gray-600'
                    }`}
                  ></div>
                  <div>
                    <p className="text-gray-800">{activity.description}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
                <span className="font-semibold text-gray-800">
                  {activity.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
