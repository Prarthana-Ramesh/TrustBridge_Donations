import { TrendingUp, Save, Plus, X, Calendar, FileText, Users, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

interface FundUtilizationProps {
  onNavigate: (page: string) => void;
}

interface Project {
  project_id: string;
  name: string;
  description: string;
  budget: number;
  amount_utilized: number;
  completion_percent: number;
  status: string;
  created_at: string;
}

interface Donation {
  donation_id: string;
  donor_name: string;
  amount: number;
  amount_utilized: number;
  utilization_percent: number;
  purpose: string;
  donated_at: string;
}

interface UtilizationRecord {
  utilization_id: string;
  donation_id: string;
  project_id: string;
  donor_name: string;
  project_name: string;
  amount_utilized: number;
  purpose: string;
  beneficiaries: number;
  location: string;
  utilized_at: string;
}

function FundUtilization({ onNavigate: _onNavigate }: FundUtilizationProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddProjectForm, setShowAddProjectForm] = useState(false);
  const [showAddUtilizationForm, setShowAddUtilizationForm] = useState(false);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [utilizationRecords, setUtilizationRecords] = useState<UtilizationRecord[]>([]);

  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    budget: '',
  });

  const [utilizationForm, setUtilizationForm] = useState({
    donationId: '',
    projectId: '',
    purpose: '',
    amountUtilized: '',
    date: '',
    beneficiaries: '',
    location: '',
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [projectsRes, donationsRes, recordsRes] = await Promise.all([
        fetch('/api/utilization/projects', { headers }),
        fetch('/api/utilization/donations', { headers }),
        fetch('/api/utilization/records', { headers }),
      ]);

      if (!projectsRes.ok || !donationsRes.ok || !recordsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const projectsData = await projectsRes.json();
      const donationsData = await donationsRes.json();
      const recordsData = await recordsRes.json();

      setProjects(projectsData.projects || []);
      setDonations(donationsData.donations || []);
      setUtilizationRecords(recordsData.records || []);
    } catch (err: any) {
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProjectForm({
      ...projectForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleUtilizationInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setUtilizationForm({
      ...utilizationForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/utilization/add-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: projectForm.name,
          description: projectForm.description,
          budget: parseFloat(projectForm.budget),
          status: 'ACTIVE',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add project');
      }

      alert('Project added successfully!');
      setShowAddProjectForm(false);
      setProjectForm({ name: '', description: '', budget: '' });
      loadData();
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Failed to add project'));
    }
  };

  const handleAddUtilization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/utilization/add-utilization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          donation_id: utilizationForm.donationId,
          project_id: utilizationForm.projectId || null,
          purpose: utilizationForm.purpose,
          amount_utilized: parseFloat(utilizationForm.amountUtilized),
          beneficiaries: parseInt(utilizationForm.beneficiaries),
          location: utilizationForm.location,
          utilized_at: utilizationForm.date,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add utilization');
      }

      alert('Utilization record added successfully!');
      setShowAddUtilizationForm(false);
      setUtilizationForm({
        donationId: '',
        projectId: '',
        purpose: '',
        amountUtilized: '',
        date: '',
        beneficiaries: '',
        location: '',
      });
      loadData();
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Failed to add utilization'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Fund Utilization Management</h1>
              <p className="text-gray-600">Track and manage how donations are being utilized across projects</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddProjectForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Project
              </button>
              <button
                onClick={() => setShowAddUtilizationForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Utilization
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading data...</span>
          </div>
        ) : (
          <>
            {/* Projects Overview */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Projects Overview</h2>
              {projects.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No projects yet. Click "Add Project" to create one.</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <div key={project.project_id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-800 flex-1">{project.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Budget: ₹{project.budget.toLocaleString()}</span>
                          <span className="text-gray-600">Used: ₹{project.amount_utilized.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              project.completion_percent >= 90
                                ? 'bg-gradient-to-r from-green-500 to-green-600'
                                : project.completion_percent >= 70
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                : 'bg-gradient-to-r from-yellow-500 to-orange-600'
                            }`}
                            style={{ width: `${project.completion_percent}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 text-right">{project.completion_percent}% utilized</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Donations Pending Utilization */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Donations & Utilization Status</h2>
              {donations.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No donations yet.</p>
              ) : (
                <div className="space-y-3">
                  {donations.map((donation) => (
                    <div
                      key={donation.donation_id}
                      className={`p-4 border rounded-lg flex items-center justify-between ${
                        donation.utilization_percent === 100
                          ? 'bg-green-50 border-green-200'
                          : donation.utilization_percent > 0
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-orange-50 border-orange-200'
                      }`}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{donation.donor_name}</h3>
                        <p className="text-sm text-gray-600">{donation.purpose}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                donation.utilization_percent === 100
                                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                                  : donation.utilization_percent >= 70
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                  : 'bg-gradient-to-r from-orange-500 to-orange-600'
                              }`}
                              style={{ width: `${donation.utilization_percent}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 min-w-fit">{donation.utilization_percent}%</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-gray-800">₹{donation.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">₹{donation.amount_utilized.toLocaleString()} used</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Utilization Records */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Utilization Records</h2>
              {utilizationRecords.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No utilization records yet.</p>
              ) : (
                <div className="space-y-4">
                  {utilizationRecords.map((record) => (
                    <div key={record.utilization_id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-bold text-gray-800">{record.purpose}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">From: {record.donor_name}</p>
                          {record.project_name && (
                            <p className="text-sm text-gray-600">Project: {record.project_name}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-800">₹{record.amount_utilized.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Date
                          </p>
                          <p className="font-semibold text-gray-800 text-sm">{new Date(record.utilized_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            Beneficiaries
                          </p>
                          <p className="font-semibold text-gray-800">{record.beneficiaries}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            Location
                          </p>
                          <p className="font-semibold text-gray-800 text-sm">{record.location}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            ID
                          </p>
                          <p className="font-semibold text-blue-600 text-sm">{record.utilization_id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Add Project Form Modal */}
        {showAddProjectForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Add New Project</h2>
                <button
                  onClick={() => setShowAddProjectForm(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddProject} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={projectForm.name}
                    onChange={handleProjectInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., School Building Construction"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={projectForm.description}
                    onChange={handleProjectInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe the project objectives and scope..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget (₹) *
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={projectForm.budget}
                    onChange={handleProjectInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="100000"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddProjectForm(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Utilization Form Modal */}
        {showAddUtilizationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-green-600 text-white p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Add Utilization Details</h2>
                <button
                  onClick={() => setShowAddUtilizationForm(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddUtilization} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Donation *
                  </label>
                  <select
                    name="donationId"
                    value={utilizationForm.donationId}
                    onChange={handleUtilizationInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a donation</option>
                    {donations.map((d) => (
                      <option key={d.donation_id} value={d.donation_id}>
                        {d.donor_name} - ₹{d.amount.toLocaleString()} ({d.purpose})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Project (Optional)
                  </label>
                  <select
                    name="projectId"
                    value={utilizationForm.projectId}
                    onChange={handleUtilizationInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a project</option>
                    {projects.map((p) => (
                      <option key={p.project_id} value={p.project_id}>
                        {p.name} - Budget: ₹{p.budget.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Purpose *
                    </label>
                    <input
                      type="text"
                      name="purpose"
                      value={utilizationForm.purpose}
                      onChange={handleUtilizationInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Classroom Renovation"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount Utilized (₹) *
                    </label>
                    <input
                      type="number"
                      name="amountUtilized"
                      value={utilizationForm.amountUtilized}
                      onChange={handleUtilizationInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="10000"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={utilizationForm.date}
                      onChange={handleUtilizationInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beneficiaries Count *
                    </label>
                    <input
                      type="number"
                      name="beneficiaries"
                      value={utilizationForm.beneficiaries}
                      onChange={handleUtilizationInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="120"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={utilizationForm.location}
                    onChange={handleUtilizationInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Village School, Raigad"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddUtilizationForm(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Utilization
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FundUtilization;
