import { Search, Filter, Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import API_BASE_URL from '../api';

interface Utilization {
  utilization_id: string;
  project_name: string;
  amount_utilized: number;
  utilized_at: string;
  beneficiaries: number;
  purpose: string;
  status: string;
  ngo_name: string;
}

interface UtilizationResponse {
  records: Utilization[];
  summary: {
    total_utilized: number;
    active_projects: number;
    completed_projects: number;
    total_beneficiaries: number;
    total_count: number;
  };
}

function Utilization() {
  const [utilizations, setUtilizations] = useState<Utilization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    total_utilized: 0,
    active_projects: 0,
    completed_projects: 0,
    total_beneficiaries: 0,
    total_count: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;
  const filteredUtilizations = utilizations.filter((util) =>
    util.utilization_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    util.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    util.purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUtilizations.length / itemsPerPage);
  const paginatedUtilizations = filteredUtilizations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    const fetchUtilizations = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/utilization/records`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch utilization records');
        }

        const data: UtilizationResponse = await response.json();
        setUtilizations(data.records);
        setSummary(data.summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUtilizations();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Fund Utilization
          </h1>
          <p className="text-gray-600">
            Detailed records of how donations are being utilized for various projects
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">Total Utilized</p>
            {loading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-green-600">
                ₹{summary.total_utilized.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">Active Projects</p>
            {loading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-blue-600">{summary.active_projects}</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">Completed Projects</p>
            {loading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-gray-800">{summary.completed_projects}</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600 mb-1">Beneficiaries Served</p>
            {loading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-gray-800">{summary.total_beneficiaries.toLocaleString()}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search utilization records..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 flex justify-center items-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="ml-4 text-gray-600">Loading utilization records...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Utilization ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Project/Purpose
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Amount Used
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Beneficiaries
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        NGO
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedUtilizations.length > 0 ? (
                      paginatedUtilizations.map((util, index) => (
                        <tr
                          key={util.utilization_id}
                          className={`hover:bg-blue-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-4 text-sm font-medium text-blue-600">
                            {util.utilization_id}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800">
                            {util.project_name || util.purpose}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-green-600">
                            ₹{util.amount_utilized.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(util.utilized_at).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800">
                            {util.beneficiaries || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800">
                            {util.ngo_name}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                util.status
                              )}`}
                            >
                              {util.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-600">
                          No utilization records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {paginatedUtilizations.length > 0 && (
              <div className="mt-6 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Showing {paginatedUtilizations.length} of {filteredUtilizations.length} utilization records
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(3, totalPages) }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 3 && <span className="px-4 py-2">...</span>}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Utilization;
