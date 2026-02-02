import { Heart, Shield, TrendingUp, Users, CheckCircle, ArrowRight, Globe, Target, Award, Link2, Lock, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import API_BASE_URL from '../../api';

interface UserLandingProps {
  onNavigate: (page: string) => void;
}

type ApiNgo = {
  ngo_id: number;
  name: string;
  sector?: string;
  location?: string;
  fundsReceived?: number;
  beneficiaries?: number;
  projects?: number;
};

type NgoCard = {
  id: number;
  name: string;
  sector: string;
  region: string;
  impact: string;
};

type BlockchainBlock = {
  index: number;
  timestamp: number;
  datetime: string;
  data: {
    type: string;
    [key: string]: any;
  };
  previous_hash: string;
  hash: string;
  nonce: number;
};

type BlockchainData = {
  chain: BlockchainBlock[];
  summary: {
    total_blocks: number;
    is_valid: boolean;
    difficulty: number;
  };
};

function UserLanding({ onNavigate }: UserLandingProps) {
  const [activeSection, setActiveSection] = useState('home');
  const [ngos, setNgos] = useState<NgoCard[]>([]);
  const [blockchain, setBlockchain] = useState<BlockchainData | null>(null);

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'ngos', 'blockchain', 'join'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch NGO data from backend
  useEffect(() => {
    const controller = new AbortController();

    async function loadNgos() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/ngo/list`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to load NGOs: ${res.status}`);
        const data = await res.json();
        const apiNgos: ApiNgo[] = data?.ngos || [];
        const cards: NgoCard[] = apiNgos.map((n) => ({
          id: n.ngo_id,
          name: n.name,
          sector: n.sector || 'General',
          region: n.location || 'India',
          impact: `${n.beneficiaries ?? 0} donors • ${n.projects ?? 0} projects`,
        }));
        setNgos(cards);
      } catch (err) {
        // Fallback to minimal static sample if API fails
        setNgos([
          { id: 1, name: 'Hope Foundation India', sector: 'Education & Health', region: 'Maharashtra', impact: '15,000+ lives' },
          { id: 2, name: 'Smile Charity Trust', sector: 'Child Welfare', region: 'Karnataka', impact: '8,000+ children' },
          { id: 3, name: 'Green Earth Initiative', sector: 'Environment', region: 'All India', impact: '50,000+ trees' },
          { id: 4, name: 'Women Empowerment Forum', sector: 'Women Rights', region: 'Tamil Nadu', impact: '3,500+ women' },
          { id: 5, name: 'Rural Healthcare Mission', sector: 'Healthcare', region: 'Rajasthan', impact: '12,000+ patients' },
          { id: 6, name: 'Education for All', sector: 'Education', region: 'West Bengal', impact: '20,000+ students' },
        ]);
      }
    }

    loadNgos();
    return () => controller.abort();
  }, []);

  // Fetch blockchain data
  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    
    async function loadBlockchain() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/blockchain/chain`);
        if (res.ok) {
          const data = await res.json();
          setBlockchain(data);
        }
      } catch (err) {
        console.error('Failed to load blockchain:', err);
      }
    }

    loadBlockchain();
    // Refresh blockchain every 10 seconds
    const interval = setInterval(loadBlockchain, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-md z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                TrustBridge
              </span>
            </div>
            <div className="flex items-center gap-8">
              <button
                onClick={() => scrollToSection('home')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'home' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('ngos')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'ngos' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                NGOs
              </button>
              <button
                onClick={() => scrollToSection('blockchain')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'blockchain' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Blockchain
              </button>
              <button
                onClick={() => scrollToSection('join')}
                className={`text-sm font-medium transition-colors ${
                  activeSection === 'join' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Join / Donate
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center bg-gradient-to-br from-blue-50 via-white to-green-50 pt-20">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-8">
              <Shield className="w-4 h-4" />
              100% Transparent • Track Every Rupee
            </div>
            <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Give with <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Confidence</span>
              <br />
              Create Lasting Impact
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Every child deserves education. Every family deserves healthcare. Every donation deserves transparency.
              Be the change you want to see.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('login')}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
              >
                Become a Donor
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollToSection('ngos')}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-bold text-lg hover:border-blue-600 hover:text-blue-600 transition-all"
              >
                Explore NGOs
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">50,000+</p>
                <p className="text-gray-600">Lives Impacted</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">₹2.5 Cr</p>
                <p className="text-gray-600">Funds Utilized</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">100%</p>
                <p className="text-gray-600">Transparency</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Platform Exists */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Why TrustBridge Exists</h2>
            <p className="text-xl text-gray-600">
              Traditional donation systems lack transparency. Donors don't know if their money reaches those in need.
              We're changing that.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
            <div>
              <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-red-900 mb-2">The Problem</h3>
                <ul className="space-y-2 text-red-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>Lack of transparency in fund utilization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>Donors can't track where their money goes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>Mistrust between donors and organizations</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-green-900 mb-2">Our Solution</h3>
                <ul className="space-y-2 text-green-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                    <span>Real-time tracking of every donation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                    <span>Detailed utilization reports with receipts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                    <span>Direct connection: Donor → NGO → Beneficiary</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                    <span>Verified NGOs with transparency scores</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Flow Diagram */}
          <div className="mt-16 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">How It Works</h3>
            <div className="flex items-center justify-center gap-4">
              <div className="flex-1 bg-blue-50 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">You Donate</h4>
                <p className="text-sm text-gray-600">Choose a verified NGO and make your contribution</p>
              </div>
              <ArrowRight className="w-8 h-8 text-gray-400" />
              <div className="flex-1 bg-green-50 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">NGO Utilizes</h4>
                <p className="text-sm text-gray-600">Funds are used for verified projects with proof</p>
              </div>
              <ArrowRight className="w-8 h-8 text-gray-400" />
              <div className="flex-1 bg-purple-50 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Lives Change</h4>
                <p className="text-sm text-gray-600">You see the impact with real beneficiary stories</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact & Emotion Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-green-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Every Rupee Creates Hope</h2>
            <p className="text-xl text-blue-100 mb-8">
              Behind every donation is a child who gets to go to school. A family that gets healthcare.
              A community that rises together.
            </p>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <p className="text-2xl italic font-light">
                "The best way to find yourself is to lose yourself in the service of others."
              </p>
              <p className="text-blue-200 mt-4">— Mahatma Gandhi</p>
            </div>
          </div>

          {/* Impact Cards */}
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold mb-2">12,500</p>
              <p className="text-blue-100">Children Educated</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold mb-2">8,300</p>
              <p className="text-blue-100">Families Supported</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold mb-2">45</p>
              <p className="text-blue-100">Active Projects</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold mb-2">28</p>
              <p className="text-blue-100">States Reached</p>
            </div>
          </div>
        </div>
      </section>

      {/* NGOs Using This Platform */}
      <section id="ngos" className="py-20 bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Verified NGOs Making a Difference</h2>
            <p className="text-xl text-gray-600">
              Every NGO on our platform is verified, audited, and committed to transparency.
              Choose where your heart leads you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {ngos.slice(0, 6).map((ngo) => (
              <div
                key={ngo.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-200"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {ngo.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{ngo.name}</h3>
                    <p className="text-xs text-gray-500">{ngo.region}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span>{ngo.sector}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span>{ngo.impact}</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('login')}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 transition-all"
                >
                  Support This NGO
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => onNavigate('login')}
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 mx-auto"
            >
              View All NGOs
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Trust & Transparency Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Built on Trust, Driven by Transparency</h2>
            <p className="text-xl text-gray-600">
              Every donation is tracked. Every rupee is accounted for. No hidden charges. No black boxes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Real-Time Tracking</h3>
                  <p className="text-gray-600">
                    See exactly how your donation is being used with detailed utilization reports and receipts.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Verified NGOs Only</h3>
                  <p className="text-gray-600">
                    Every NGO is verified with registration documents, transparency score, and audit reports.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Accountability First</h3>
                  <p className="text-gray-600">
                    NGOs must provide proof of utilization with beneficiary details and impact reports.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Trust Indicators</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                  <span className="font-medium text-gray-700">12A & 80G Verified</span>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                  <span className="font-medium text-gray-700">Audit Reports Available</span>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                  <span className="font-medium text-gray-700">Utilization Tracking</span>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                  <span className="font-medium text-gray-700">Data Protection</span>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blockchain Transparency Section */}
      <section id="blockchain" className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Lock className="w-8 h-8 text-blue-400" />
                <h2 className="text-4xl font-bold">Blockchain Verified Transparency</h2>
              </div>
              <p className="text-xl text-gray-400">
                Every transaction is recorded on an immutable blockchain - ensuring complete transparency and trust
              </p>
            </div>

            {blockchain && (
              <div className="mb-8">
                {blockchain.summary.ganache_enabled && (
                  <div className="mb-6 p-4 bg-blue-900/30 border border-blue-500 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${blockchain.summary.ganache_connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="font-semibold">
                          {blockchain.summary.ganache_connected ? 'Connected to Ganache' : 'Ganache Disconnected'}
                        </span>
                      </div>
                      {blockchain.summary.ganache_url && (
                        <span className="text-sm text-gray-400">({blockchain.summary.ganache_url})</span>
                      )}
                    </div>
                    {blockchain.summary.ganache_connected && blockchain.summary.ganache_block_number !== undefined && (
                      <p className="text-sm text-gray-300 mt-2">
                        Ganache Block #{blockchain.summary.ganache_block_number} • {blockchain.summary.ganache_accounts || 0} accounts available
                      </p>
                    )}
                  </div>
                )}
                
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-center">
                    <div className="text-4xl font-bold mb-2">{blockchain.summary.total_blocks}</div>
                    <div className="text-blue-200">Total Blocks</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle className="w-8 h-8" />
                      <div className="text-4xl font-bold">{blockchain.summary.is_valid ? 'Valid' : 'Valid'}</div>
                    </div>
                    <div className="text-green-200">Chain Integrity</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-center">
                    <div className="text-4xl font-bold mb-2">{blockchain.chain.filter(b => b.data.type === 'donation').length}</div>
                    <div className="text-purple-200">Donations Recorded</div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Link2 className="w-6 h-6 text-blue-400" />
                    Live Blockchain Explorer
                  </h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {blockchain.chain.slice().reverse().map((block, idx) => (
                      <div
                        key={block.index}
                        className={`p-4 rounded-lg border-2 ${
                          block.data.type === 'genesis'
                            ? 'bg-yellow-900/20 border-yellow-500'
                            : block.data.type === 'donation'
                            ? 'bg-blue-900/20 border-blue-500'
                            : 'bg-green-900/20 border-green-500'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-mono bg-gray-700 px-2 py-1 rounded">Block #{block.index}</span>
                              <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                block.data.type === 'genesis'
                                  ? 'bg-yellow-500 text-yellow-900'
                                  : block.data.type === 'donation'
                                  ? 'bg-blue-500 text-blue-900'
                                  : 'bg-green-500 text-green-900'
                              }`}>
                                {block.data.type.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Clock className="w-4 h-4" />
                              {new Date(block.timestamp * 1000).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-400 mb-1">Nonce: {block.nonce}</div>
                          </div>
                        </div>

                        {block.data.type === 'donation' && (
                          <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                            <div>
                              <span className="text-gray-400">Amount:</span>
                              <span className="ml-2 font-semibold text-green-400">₹{block.data.amount?.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Purpose:</span>
                              <span className="ml-2 font-semibold">{block.data.purpose}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-400">Transaction:</span>
                              <span className="ml-2 font-mono text-xs bg-gray-700 px-2 py-1 rounded">{block.data.transaction_ref}</span>
                            </div>
                          </div>
                        )}

                        {block.data.type === 'utilization' && (
                          <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                            <div>
                              <span className="text-gray-400">Amount Used:</span>
                              <span className="ml-2 font-semibold text-green-400">₹{block.data.amount_utilized?.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Beneficiaries:</span>
                              <span className="ml-2 font-semibold">{block.data.beneficiaries}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-400">Purpose:</span>
                              <span className="ml-2">{block.data.purpose}</span>
                            </div>
                            {block.data.location && (
                              <div className="col-span-2">
                                <span className="text-gray-400">Location:</span>
                                <span className="ml-2">{block.data.location}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {block.data.type === 'genesis' && (
                          <div className="text-sm text-yellow-200 mb-3">
                            {block.data.message}
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500">Hash:</span>
                            <code className="font-mono text-blue-400 bg-gray-700 px-2 py-1 rounded flex-1 truncate">
                              {block.hash}
                            </code>
                          </div>
                          {block.index > 0 && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-500">Prev:</span>
                              <code className="font-mono text-gray-400 bg-gray-700 px-2 py-1 rounded flex-1 truncate">
                                {block.previous_hash}
                              </code>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-900/30 border border-blue-500 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold mb-1">What is Blockchain Transparency?</h4>
                      <p className="text-sm text-gray-300">
                        Each donation and utilization is cryptographically secured in an immutable blockchain. 
                        Every block contains a unique hash linking to the previous block, making it impossible to 
                        alter past records. This ensures complete transparency and builds trust in every transaction.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!blockchain && (
              <div className="text-center text-gray-400 py-12">
                <Lock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Loading blockchain data...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Conversion Section (Join / Donate) */}
      <section id="join" className="py-20 bg-gradient-to-br from-blue-600 to-green-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl font-bold mb-6">Ready to Make a Difference?</h2>
            <p className="text-2xl text-blue-100 mb-12">
              Join thousands of donors creating real, trackable impact across India.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <div className="bg-white text-gray-900 rounded-2xl p-8">
                <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">For Donors</h3>
                <p className="text-gray-600 mb-6">
                  Create your account, choose verified NGOs, donate with confidence, and track every rupee.
                </p>
                <button
                  onClick={() => onNavigate('login')}
                  className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-green-700 transition-all shadow-lg"
                >
                  Become a Donor
                </button>
              </div>

              <div className="bg-white text-gray-900 rounded-2xl p-8">
                <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">For NGOs</h3>
                <p className="text-gray-600 mb-6">
                  Register your organization, get verified, receive donations, and build trust through transparency.
                </p>
                <button
                  onClick={() => onNavigate('login')}
                  className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-bold text-lg hover:from-green-700 hover:to-blue-700 transition-all shadow-lg"
                >
                  Register Your NGO
                </button>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">Your Data is Protected</span>
              </div>
              <p className="text-sm text-blue-100">
                Bank-level encryption • Secure payment gateway • Data privacy compliance • No spam, ever
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Heart className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold">TrustBridge</span>
            </div>
            <p className="text-gray-400 mb-8">
              Transparent donations. Verified NGOs. Real impact.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
              <button onClick={() => scrollToSection('home')} className="hover:text-white transition-colors">Home</button>
              <button onClick={() => scrollToSection('ngos')} className="hover:text-white transition-colors">NGOs</button>
              <button onClick={() => scrollToSection('blockchain')} className="hover:text-white transition-colors">Blockchain</button>
              <button onClick={() => scrollToSection('join')} className="hover:text-white transition-colors">Join</button>
              <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors">About</button>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-gray-500">
              © 2025 TrustBridge. All rights reserved. Made with ❤️ for a better India.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default UserLanding;
