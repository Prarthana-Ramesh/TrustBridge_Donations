import { Building2, MapPin, TrendingUp, Heart, ArrowLeft, Calendar, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import API_BASE_URL from '../../api';

type ApiNgo = {
  ngo_id: number;
  name: string;
  sector?: string;
  location?: string;
  description?: string;
  fundsReceived?: number;
  utilized?: number;
  beneficiaries?: number;
  projects?: number;
  phone?: string;
  registration_number?: string;
  website?: string;
  email?: string;
  founded?: string;
  rating?: number;
  totalFunds?: number;
};

type DonationRecord = {
  donation_id: number;
  donor_name: string;
  amount: number;
  donated_at?: string;
  purpose?: string;
  amount_utilized?: number;
  ngo_name?: string;
};

type UtilizationRecord = {
  utilization_id: number;
  donation_id?: number;
  project_id?: number;
  amount_utilized?: number;
  purpose?: string;
  beneficiaries?: number;
  location?: string;
  utilized_at?: string;
  ngo_name?: string;
};

interface NGODetailsProps {
  onNavigate: (page: string) => void;
  ngoId?: number;
}

function NGODetails({ onNavigate, ngoId = 1 }: NGODetailsProps) {
  const [ngoData, setNgoData] = useState<ApiNgo | null>(null);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [utilizations, setUtilizations] = useState<UtilizationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchNgo() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/ngo/list`, { signal: controller.signal });
        if (!res.ok) throw new Error('Failed to load NGO details');
        const data = await res.json();
        const match: ApiNgo | undefined = (data?.ngos || []).find((n: ApiNgo) => n.ngo_id === ngoId);
        setNgoData(match || null);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setError(err?.message || 'Unable to fetch NGO details');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchNgo();
    return () => controller.abort();
  }, [API_BASE_URL, ngoId]);

  const ngo = useMemo(() => {
    const fallback: ApiNgo = {
      ngo_id: ngoId,
      name: 'Education For All',
      sector: 'Education',
      location: 'India',
      description: 'Trusted NGO making a difference.',
      fundsReceived: 0,
      utilized: 85,
      beneficiaries: 0,
      projects: 0,
      phone: '',
      rating: 4.5,
    };
    return ngoData || fallback;
  }, [ngoData, ngoId]);

  useEffect(() => {
    if (!ngo.name) return;
    const controller = new AbortController();
    async function fetchDonations() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/donations/records`, { signal: controller.signal });
        if (!res.ok) throw new Error('Failed to load donations');
        const data = await res.json();
        const list: DonationRecord[] = data?.donations || [];
        setDonations(list.filter((d) => d.ngo_name === ngo.name));
      } catch (err) {
        if (err && (err as any).name === 'AbortError') return;
      }
    }

    async function fetchUtilizations() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/utilization/records`, { signal: controller.signal });
        if (!res.ok) throw new Error('Failed to load utilizations');
        const data = await res.json();
        const list: UtilizationRecord[] = data?.records || [];
        setUtilizations(list.filter((r) => r.ngo_name === ngo.name));
      } catch (err) {
        if (err && (err as any).name === 'AbortError') return;
      }
    }

    fetchDonations();
    fetchUtilizations();
    return () => controller.abort();
  }, [API_BASE_URL, ngo.name]);

  const donorDonations = useMemo(() =>
    donations.map((d) => ({
      id: d.donation_id,
      amount: d.amount,
      date: d.donated_at ? d.donated_at.split('T')[0] : '—',
      purpose: d.purpose || 'General',
      utilized: d.amount_utilized !== undefined && d.amount > 0 ? Math.min(Math.round((d.amount_utilized / d.amount) * 100), 100) : 0,
    }))
  , [donations]);

  const totalDonated = donorDonations.reduce((sum, d) => sum + d.amount, 0);

  const impactMetrics = useMemo(() => ([
    { label: 'Beneficiaries', value: (ngo.beneficiaries ?? 0).toLocaleString(), icon: <Users className="w-5 h-5" /> },
    { label: 'Active Projects', value: (ngo.projects ?? 0).toString(), icon: <Heart className="w-5 h-5" /> },
    { label: 'Funds Received', value: `₹${(ngo.fundsReceived ?? 0).toLocaleString()}`, icon: <TrendingUp className="w-5 h-5" /> },
    { label: 'Transparency', value: `${ngo.utilized ?? 0}%`, icon: <Building2 className="w-5 h-5" /> },
  ]), [ngo]);

  const utilizationBreakdown = useMemo(() => {
    if (!utilizations.length) return [] as { purpose: string; amount: number; percentage: number }[];
    return utilizations.map((u) => ({
      purpose: u.purpose || 'General',
      amount: u.amount_utilized || 0,
      percentage: u.amount_utilized ? 100 : 0,
    }));
  }, [utilizations]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center text-gray-700">Loading NGO details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center text-red-600 font-semibold">{error}</div>
      </div>
    );
  }

  const displayFounded = ngo.founded || '—';
  const displayRating = typeof ngo.rating === 'number' ? ngo.rating : 4.5;
  const fundsDisplay = ngo.fundsReceived ?? ngo.totalFunds ?? 0;
  const phoneDisplay = ngo.phone || 'Not available';
  const websiteDisplay = ngo.website || '';
  const emailDisplay = ngo.email || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('donor-ngos')}
          className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to NGO Listing
        </button>

        {/* NGO Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-white/20 rounded-xl">
                  <Building2 className="w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{ngo.name}</h1>
                  <div className="flex items-center gap-4 text-blue-100">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {ngo.location}
                    </span>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                      {ngo.sector}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-blue-50 mb-4">{ngo.description}</p>
              <div className="flex items-center gap-6 text-sm">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Founded {displayFounded}
                </span>
                <span className="flex items-center">
                  <span className="text-yellow-300 mr-1">★</span>
                  {displayRating} Rating
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <p className="text-blue-100 text-sm mb-1">Overall Utilization</p>
                <p className="text-4xl font-bold">{ngo.utilized}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {impactMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-lg mb-3">
                {metric.icon}
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-1">{metric.value}</p>
              <p className="text-sm text-gray-600">{metric.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Your Donations to This NGO */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Your Contributions</h2>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Donated</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{totalDonated.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {donorDonations.map((donation) => (
                  <div
                    key={donation.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{donation.purpose}</h3>
                      <span className="font-bold text-gray-800">
                        ₹{donation.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{donation.date}</span>
                      <span className="text-green-600 font-medium">
                        {donation.utilized}% Utilized
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                        style={{ width: `${donation.utilized}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Utilization Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Overall Utilization Summary
              </h2>
              <div className="space-y-4">
                {utilizationBreakdown.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{item.purpose}</h3>
                      <span className="font-bold text-gray-800">
                        ₹{item.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onNavigate('donor-utilization')}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                View Detailed Utilization Report
              </button>
            </div>
          </div>

          {/* Right Column - Actions & Contact */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => onNavigate('donor-make-donation')}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all flex items-center justify-center gap-2"
                >
                  <Heart className="w-5 h-5" />
                  Donate to This NGO
                </button>
                <button
                  onClick={() => onNavigate('donor-utilization')}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  Track Utilization
                </button>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Contact Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Website</p>
                  {websiteDisplay ? (
                    <a
                      href={`https://${websiteDisplay}`}
                      className="text-blue-600 hover:underline"
                    >
                      {websiteDisplay}
                    </a>
                  ) : (
                    <span className="text-gray-500">Not available</span>
                  )}
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Email</p>
                  {emailDisplay ? (
                    <a
                      href={`mailto:${emailDisplay}`}
                      className="text-blue-600 hover:underline"
                    >
                      {emailDisplay}
                    </a>
                  ) : (
                    <span className="text-gray-500">Not available</span>
                  )}
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Phone</p>
                  {phoneDisplay ? (
                    <a href={`tel:${phoneDisplay}`} className="text-blue-600 hover:underline">
                      {phoneDisplay}
                    </a>
                  ) : (
                    <span className="text-gray-500">Not available</span>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-gradient-to-br from-blue-600 to-green-600 text-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">NGO Statistics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">Total Funds</span>
                  <span className="font-bold">₹{(fundsDisplay / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">Beneficiaries</span>
                  <span className="font-bold">{ngo.beneficiaries}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">Active Projects</span>
                  <span className="font-bold">{ngo.projects}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NGODetails;
