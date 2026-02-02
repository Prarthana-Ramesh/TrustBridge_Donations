import { Users, Search, Mail, Phone, Calendar, DollarSign, TrendingUp, Eye, Loader, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import API_BASE_URL from '../../api';

interface DonorManagementProps {
  onNavigate: (page: string, donorId?: string) => void;
}

interface Donor {
  donor_id: string;
  name: string;
  email: string;
  phone: string;
  total_contributions: number;
  donation_count: number;
  last_donation: string | null;
  joined_date: string | null;
  status: string;
}

interface DonationHistory {
  donation_id: string;
  amount: number;
  date: string | null;
  purpose: string;
  utilized: number;
}

interface DonorDetails {
  donor: {
    donor_id: string;
    name: string;
    email: string;
    phone: string;
    joined_date: string | null;
    total_contributions: number;
    donation_count: number;
  };
  history: DonationHistory[];
}

function DonorManagement({ }: DonorManagementProps) {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDonor, setSelectedDonor] = useState<string | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [donorDetails, setDonorDetails] = useState<DonorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDonors();
  }, [token]);

  useEffect(() => {
    if (selectedDonor) {
      loadDonorDetails(selectedDonor);
    }
  }, [selectedDonor]);

  const loadDonors = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/api/donors/list`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch donors');
      }

      const data = await response.json();
      setDonors(data.donors || []);
    } catch (err: any) {
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const loadDonorDetails = async (donorId: string) => {
    setLoadingDetails(true);
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/api/donors/${donorId}/history`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch donor details');
      }

      const data = await response.json();
      setDonorDetails(data);
    } catch (err: any) {
      console.error('Error loading donor details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredDonors = donors.filter((donor) =>
    donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDonorsAmount = donors.reduce((sum, d) => sum + d.total_contributions, 0);
  const totalDonations = donors.reduce((sum, d) => sum + d.donation_count, 0);
  const avgDonation = totalDonations > 0 ? totalDonorsAmount / totalDonations : 0;
  const activeThisMonth = donors.filter(d => 
    d.last_donation && new Date(d.last_donation).getMonth() === new Date().getMonth()
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Donor Management</h1>
          <p className="text-gray-600">Manage relationships with your valued donors</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-sm text-gray-600">Total Donors</h3>
            </div>
            <p className="text-2xl font-bold text-gray-800">{donors.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm text-gray-600">Total Contributions</h3>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              ₹{(totalDonorsAmount / 1000).toFixed(0)}K
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-sm text-gray-600">Avg. Donation</h3>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              ₹{avgDonation.toFixed(0)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-sm text-gray-600">Active This Month</h3>
            </div>
            <p className="text-2xl font-bold text-gray-800">{activeThisMonth}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search donors by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 flex items-center justify-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading donors...</span>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Donor List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-blue-600 to-green-600 text-white">
                  <h2 className="text-xl font-bold">Donor List ({filteredDonors.length})</h2>
                </div>
                {filteredDonors.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    No donors found
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredDonors.map((donor) => (
                      <div
                        key={donor.donor_id}
                        onClick={() => setSelectedDonor(donor.donor_id)}
                        className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                          selectedDonor === donor.donor_id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {donor.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-800">{donor.name}</h3>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <Mail className="w-4 h-4" />
                                  {donor.email}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div>
                                <p className="text-xs text-gray-600">Total Contributions</p>
                                <p className="text-lg font-bold text-green-600">
                                  ₹{donor.total_contributions.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Donations</p>
                                <p className="text-lg font-bold text-gray-800">{donor.donation_count}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Last Donation</p>
                                <p className="text-sm font-medium text-gray-800">
                                  {donor.last_donation ? new Date(donor.last_donation).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Member Since</p>
                                <p className="text-sm font-medium text-gray-800">
                                  {donor.joined_date ? new Date(donor.joined_date).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <button className="ml-4 p-2 hover:bg-blue-100 rounded-lg transition-colors">
                            <Eye className="w-5 h-5 text-blue-600" />
                          </button>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            {donor.status}
                          </span>
                          {donor.phone && (
                            <a
                              href={`tel:${donor.phone}`}
                              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="w-4 h-4" />
                              {donor.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Donor Details Panel */}
            <div className="lg:col-span-1">
              {selectedDonor && donorDetails ? (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-4">
                  <div className="p-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                    <h2 className="text-xl font-bold">Donor Details</h2>
                  </div>
                  {loadingDetails ? (
                    <div className="p-12 flex items-center justify-center">
                      <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="text-center mb-6">
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-3">
                          {donorDetails.donor.name.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">{donorDetails.donor.name}</h3>
                        <p className="text-sm text-gray-600">{donorDetails.donor.email}</p>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Total Contributed</p>
                          <p className="text-2xl font-bold text-green-600">
                            ₹{donorDetails.donor.total_contributions.toLocaleString()}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Donations</p>
                            <p className="text-xl font-bold text-gray-800">{donorDetails.donor.donation_count}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Avg. Amount</p>
                            <p className="text-xl font-bold text-gray-800">
                              ₹{donorDetails.donor.donation_count > 0 
                                ? (donorDetails.donor.total_contributions / donorDetails.donor.donation_count).toFixed(0)
                                : 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Donation History</h4>
                        {donorDetails.history.length === 0 ? (
                          <p className="text-center text-gray-500 py-4 text-sm">No donation history</p>
                        ) : (
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {donorDetails.history.map((donation) => (
                              <div key={donation.donation_id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-gray-800">
                                    ₹{donation.amount.toLocaleString()}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {donation.date ? new Date(donation.date).toLocaleDateString() : 'N/A'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{donation.purpose}</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                                      style={{ width: `${donation.utilized}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-600">{donation.utilized}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Select a Donor
                  </h3>
                  <p className="text-sm text-gray-600">
                    Click on a donor from the list to view their details and donation history
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DonorManagement;
