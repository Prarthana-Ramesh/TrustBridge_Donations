import { DollarSign, Calendar, User, Download, Search, CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import API_BASE_URL from '../../api';

interface DonationRecordsProps {
  onNavigate: (page: string, donationId?: string) => void;
}

interface Donation {
  donation_id: string;
  donor_name: string;
  amount: number;
  amount_utilized: number;
  purpose: string;
  donated_at: string;
  status: string;
}

interface Summary {
  total_donations: number;
  total_utilized: number;
  total_count: number;
}

function DonationRecords({ onNavigate }: DonationRecordsProps) {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [donations, setDonations] = useState<Donation[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total_donations: 0,
    total_utilized: 0,
    total_count: 0
  });

  useEffect(() => {
    loadDonations();
  }, [token]);

  const loadDonations = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/api/donations/records`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch donation records');
      }

      const data = await response.json();
      setDonations(data.donations || []);
      setSummary(data.summary || { total_donations: 0, total_utilized: 0, total_count: 0 });
    } catch (err: any) {
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const getUtilizationStatus = (amount: number, utilized: number): string => {
    if (utilized === 0) return 'Pending';
    if (utilized >= amount) return 'Completed';
    return 'Partial';
  };

  const filteredDonations = donations.filter((donation) => {
    const matchesSearch =
      donation.donor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.donation_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    
    const donationStatus = getUtilizationStatus(donation.amount, donation.amount_utilized);
    const matchesStatus = statusFilter === 'all' || donationStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    if (status === 'Completed') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (status === 'Partial') return <Clock className="w-5 h-5 text-yellow-600" />;
    return <AlertCircle className="w-5 h-5 text-orange-600" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Donation Records</h1>
          <p className="text-gray-600">Manage and track all donations received by your organization</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Donations</p>
            <p className="text-3xl font-bold text-gray-800">₹{summary.total_donations.toLocaleString()}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Utilized Amount</p>
            <p className="text-3xl font-bold text-gray-800">₹{summary.total_utilized.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Available Balance</p>
            <p className="text-3xl font-bold text-gray-800">
              ₹{(summary.total_donations - summary.total_utilized).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-2" />
                Search Donations
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search by donor name, ID, or purpose..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 flex items-center justify-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading donation records...</span>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold">Donation ID</th>
                      <th className="text-left py-4 px-6 font-semibold">Donor</th>
                      <th className="text-left py-4 px-6 font-semibold">Date</th>
                      <th className="text-left py-4 px-6 font-semibold">Purpose</th>
                      <th className="text-right py-4 px-6 font-semibold">Amount</th>
                      <th className="text-right py-4 px-6 font-semibold">Utilized</th>
                      <th className="text-left py-4 px-6 font-semibold">Status</th>
                      <th className="text-center py-4 px-6 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredDonations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-500">
                          No donation records found
                        </td>
                      </tr>
                    ) : (
                      filteredDonations.map((donation, index) => {
                        const status = getUtilizationStatus(donation.amount, donation.amount_utilized);
                        return (
                          <tr 
                            key={donation.donation_id} 
                            className={`hover:bg-blue-50 transition-colors ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }`}
                          >
                            <td className="py-4 px-6 font-medium text-blue-600 text-sm">
                              {donation.donation_id.substring(0, 8)}...
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-gray-800">{donation.donor_name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <Calendar className="w-4 h-4" />
                                {donation.donated_at ? new Date(donation.donated_at).toLocaleDateString() : 'N/A'}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-gray-700 text-sm">
                              {donation.purpose}
                            </td>
                            <td className="py-4 px-6 text-right font-semibold text-green-600">
                              ₹{donation.amount.toLocaleString()}
                            </td>
                            <td className="py-4 px-6 text-right font-semibold text-blue-600">
                              ₹{donation.amount_utilized.toLocaleString()}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(status)}
                                <span className={`text-sm font-medium ${
                                  status === 'Completed' ? 'text-green-600' :
                                  status === 'Partial' ? 'text-yellow-600' :
                                  'text-orange-600'
                                }`}>
                                  {status}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <button 
                                onClick={() => onNavigate('ngo-utilization', donation.donation_id)} 
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline"
                              >
                                Manage →
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {filteredDonations.length} of {summary.total_count} donation records
              </p>
              <button 
                onClick={() => alert('Export functionality coming soon!')}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:shadow-lg transition-shadow"
              >
                <Download className="w-5 h-5" />
                Export Data
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DonationRecords;
