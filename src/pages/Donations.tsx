import { Search, Download, DollarSign, TrendingUp, Loader, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import API_BASE_URL from '../api';

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

function Donations() {
  const { token } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total_donations: 0,
    total_utilized: 0,
    total_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredDonations = donations.filter(d =>
    d.donor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.donation_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Donation Records</h1>
          <p className="text-gray-600">
            Complete history of all donations received in the system
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Donations</h3>
            <p className="text-2xl font-bold text-gray-800">
              ₹{summary.total_donations.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Utilized</h3>
            <p className="text-2xl font-bold text-gray-800">
              ₹{summary.total_utilized.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Available Balance</h3>
            <p className="text-2xl font-bold text-gray-800">
              ₹{(summary.total_donations - summary.total_utilized).toLocaleString()}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search donations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-shadow">
              <Download className="w-5 h-5" />
              <span>Export Data</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 flex items-center justify-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading donations...</span>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Donation ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Donor Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Utilized
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Purpose
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredDonations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          No donations found
                        </td>
                      </tr>
                    ) : (
                      filteredDonations.map((donation, index) => (
                        <tr
                          key={donation.donation_id}
                          className={`hover:bg-blue-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-4 text-sm font-medium text-blue-600">
                            {donation.donation_id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800">
                            {donation.donor_name}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-green-600">
                            ₹{donation.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                            ₹{donation.amount_utilized.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {donation.donated_at ? new Date(donation.donated_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800">
                            {donation.purpose}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {donation.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {filteredDonations.length} of {summary.total_count} donation records
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Donations;
