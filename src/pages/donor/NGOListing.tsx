import { Building2, Search, TrendingUp, MapPin, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import API_BASE_URL from '../../api';

interface NGOListingProps {
  onNavigate: (page: string, ngoId?: number) => void;
}

interface NGO {
  id: number;
  name: string;
  sector: string;
  location: string;
  description: string;
  fundsReceived: number;
  utilized: number;
  beneficiaries: number;
  projects: number;
  rating: number;
}

function NGOListing({ onNavigate }: NGOListingProps) {
  const { token: ctxToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNGOs = async () => {
      try {
        setLoading(true);
        setError(null);

        const authToken = ctxToken || localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/api/ngo/list`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch NGOs');
        }

        const data = await response.json();
        // Map backend data to frontend format
        const mappedNGOs = data.ngos.map((ngo: any) => ({
          id: ngo.ngo_id,
          name: ngo.name,
          sector: ngo.sector,
          location: ngo.location,
          description: ngo.description,
          fundsReceived: ngo.fundsReceived,
          utilized: ngo.utilized,
          beneficiaries: ngo.beneficiaries,
          projects: ngo.projects,
          rating: ngo.rating,
        }));
        
        setNgos(mappedNGOs);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching NGOs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load NGOs');
        setLoading(false);
      }
    };

    fetchNGOs();
  }, [ctxToken]);

  const filteredNGOs = ngos.filter((ngo) => {
    const matchesSearch = ngo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ngo.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === 'all' || ngo.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  // Extract unique sectors from the NGO data
  const sectors = ['all', ...Array.from(new Set(ngos.map(ngo => ngo.sector)))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading NGOs...</p>
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
            <p className="font-semibold">Error loading NGOs</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Browse NGOs</h1>
          <p className="text-gray-600">Find and support organizations making a difference</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search NGOs by name or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Sector Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
              >
                {sectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector === 'all' ? 'All Sectors' : sector}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{filteredNGOs.length}</span>
            <span>NGOs found</span>
          </div>
        </div>

        {/* NGO Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNGOs.map((ngo) => (
            <div
              key={ngo.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 cursor-pointer overflow-hidden"
              onClick={() => onNavigate('donor-ngo-details', ngo.id)}
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-300">★</span>
                      <span className="text-sm font-semibold">{ngo.rating}</span>
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-1">{ngo.name}</h3>
                <div className="flex items-center text-sm text-blue-100">
                  <MapPin className="w-4 h-4 mr-1" />
                  {ngo.location}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-3">
                  {ngo.sector}
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{ngo.description}</p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Funds Received</p>
                    <p className="text-sm font-bold text-gray-800">
                      ₹{(ngo.fundsReceived / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Beneficiaries</p>
                    <p className="text-sm font-bold text-gray-800">{ngo.beneficiaries}</p>
                  </div>
                </div>

                {/* Utilization Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Utilization</span>
                    <span className="font-semibold text-gray-800">{ngo.utilized}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        ngo.utilized >= 90
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : ngo.utilized >= 75
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                          : 'bg-gradient-to-r from-yellow-500 to-orange-600'
                      }`}
                      style={{ width: `${ngo.utilized}%` }}
                    ></div>
                  </div>
                </div>

                {/* Projects Badge */}
                <div className="flex items-center text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                  <span>{ngo.projects} Active Projects</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-4 pb-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('donor-ngo-details', ngo.id);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredNGOs.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No NGOs Found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NGOListing;
