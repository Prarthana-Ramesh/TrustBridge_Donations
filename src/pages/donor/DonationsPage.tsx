import { DollarSign, Calendar, Building2, Filter, Download, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import API_BASE_URL from '../../api';

interface DonationsPageProps {
  onNavigate: (page: string, donationId?: number) => void;
}

interface Donation {
  id: number;
  ngo: string;
  amount: number;
  date: string;
  purpose: string;
  status: string;
  utilized: number;
  transactionId?: string;
}

interface DonationSummary {
  total_donated: number;
  total_utilized: number;
  total_count: number;
}

function DonationsPage({ onNavigate }: DonationsPageProps) {
  const { token: ctxToken } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [summary, setSummary] = useState<DonationSummary>({
    total_donated: 0,
    total_utilized: 0,
    total_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        setLoading(true);
        setError(null);

        const authToken = ctxToken || localStorage.getItem('token');
        if (!authToken) {
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/donations/donor/history`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch donations');
        }

        const data = await response.json();
        setDonations(data.donations);
        setSummary(data.summary);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching donations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load donations');
        setLoading(false);
      }
    };

    fetchDonations();
  }, [ctxToken]);

  const filteredDonations = donations.filter((donation) => {
    const matchesSearch =
      donation.ngo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'utilized' && donation.utilized === 100) ||
      (filterStatus === 'partial' && donation.utilized > 0 && donation.utilized < 100) ||
      (filterStatus === 'pending' && donation.utilized === 0);
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Fully Utilized':
        return 'bg-green-100 text-green-700';
      case 'Partially Utilized':
        return 'bg-blue-100 text-blue-700';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your donations...</p>
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
            <p className="font-semibold">Error loading donations</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Donations</h1>
          <p className="text-gray-600">Track all your contributions and their utilization</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Donated</h3>
            <p className="text-3xl font-bold text-gray-800">
              ₹{summary.total_donated.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Utilized</h3>
            <p className="text-3xl font-bold text-gray-800">
              ₹{summary.total_utilized.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {summary.total_donated > 0 
                ? ((summary.total_utilized / summary.total_donated) * 100).toFixed(1)
                : '0'}% of donations
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Donations</h3>
            <p className="text-3xl font-bold text-gray-800">{summary.total_count}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by NGO or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="utilized">Fully Utilized</option>
                  <option value="partial">Partially Utilized</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredDonations.length}</span> of{' '}
            <span className="font-semibold">{donations.length}</span> donations
          </p>
        </div>

        {/* Donations Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">NGO</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Purpose</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Amount</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Utilization</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDonations.map((donation) => (
                  <tr
                    key={donation.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onNavigate('donor-utilization', donation.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {donation.date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{donation.ngo}</p>
                          <p className="text-xs text-gray-500">{donation.transactionId || 'Txn ref unavailable'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-800">{donation.purpose}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-bold text-gray-800">
                        ₹{donation.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold text-gray-800 mb-1">
                          {donation.utilized}%
                        </span>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              donation.utilized === 100
                                ? 'bg-gradient-to-r from-green-500 to-green-600'
                                : donation.utilized > 0
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                : 'bg-gray-300'
                            }`}
                            style={{ width: `${donation.utilized}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          donation.status
                        )}`}
                      >
                        {donation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('donor-utilization', donation.id);
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredDonations.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Donations Found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl shadow-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Want to Make Another Donation?</h3>
          <p className="text-blue-100 mb-6">
            Continue your impact by supporting more organizations
          </p>
          <button
            onClick={() => onNavigate('donor-make-donation')}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Make a Donation
          </button>
        </div>
      </div>
    </div>
  );
}

export default DonationsPage;
