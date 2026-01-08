import { useState } from 'react';
import Navbar from './components/Navbar';
import DonorNavbar from './components/DonorNavbar';
import NGONavbar from './components/NGONavbar';
import Footer from './components/Footer';
import UserLanding from './pages/user/UserLanding';
import Dashboard from './pages/Dashboard';
import Donations from './pages/Donations';
import Utilization from './pages/Utilization';
import Reports from './pages/Reports';
import About from './pages/About';
import Login from './pages/Login';
import DonorDashboard from './pages/donor/DonorDashboard';
import NGOListing from './pages/donor/NGOListing';
import NGODetails from './pages/donor/NGODetails';
import DonationsPage from './pages/donor/DonationsPage';
import UtilizationTracking from './pages/donor/UtilizationTracking';
import ReportsAnalytics from './pages/donor/ReportsAnalytics';
import MakeDonation from './pages/donor/MakeDonation';
import NGODashboard from './pages/ngo/NGODashboard';
import DonorManagement from './pages/ngo/DonorManagement';
import DonationRecords from './pages/ngo/DonationRecords';
import FundUtilization from './pages/ngo/FundUtilization';
import FundingRequest from './pages/ngo/FundingRequest';
import FundingResponses from './pages/ngo/FundingResponses';
import NGOReports from './pages/ngo/NGOReports';
import NGOProfile from './pages/ngo/NGOProfile';
import { useAuth } from './pages/AuthContext';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined);
  const { isAuthenticated, userRole } = useAuth();

  const handleNavigate = (page: string, id?: number) => {
    setCurrentPage(page);
    if (id !== undefined) {
      setSelectedId(id);
    }
  };

  const renderPage = () => {
    // Show login page
    if (currentPage === 'login') {
      return <Login onNavigate={handleNavigate} />;
    }

    // Donor role pages
    if (userRole === 'donor' && isAuthenticated) {
      switch (currentPage) {
        case 'donor-dashboard':
          return <DonorDashboard onNavigate={handleNavigate} />;
        case 'donor-ngos':
          return <NGOListing onNavigate={handleNavigate} />;
        case 'donor-ngo-details':
          return <NGODetails onNavigate={handleNavigate} ngoId={selectedId} />;
        case 'donor-donations':
          return <DonationsPage onNavigate={handleNavigate} />;
        case 'donor-utilization':
          return <UtilizationTracking onNavigate={handleNavigate} donationId={selectedId} />;
        case 'donor-reports':
          return <ReportsAnalytics onNavigate={handleNavigate} />;
        case 'donor-make-donation':
          return <MakeDonation onNavigate={handleNavigate} />;
        default:
          return <DonorDashboard onNavigate={handleNavigate} />;
      }
    }

    // NGO role pages
    if (userRole === 'ngo' && isAuthenticated) {
      switch (currentPage) {
        case 'ngo-dashboard':
          return <NGODashboard onNavigate={handleNavigate} />;
        case 'ngo-donor-management':
          return <DonorManagement onNavigate={handleNavigate} />;
        case 'ngo-donation-records':
          return <DonationRecords onNavigate={handleNavigate} />;
        case 'ngo-utilization':
          return <FundUtilization onNavigate={handleNavigate} />;
        case 'ngo-funding-request':
          return <FundingRequest onNavigate={handleNavigate} />;
        case 'ngo-funding-responses':
          return <FundingResponses onNavigate={handleNavigate} />;
        case 'ngo-reports':
          return <NGOReports onNavigate={handleNavigate} />;
        case 'ngo-profile':
          return <NGOProfile onNavigate={handleNavigate} />;
        default:
          return <NGODashboard onNavigate={handleNavigate} />;
      }
    }

    // Redirect to login if trying to access protected pages without authentication
    if (
      ['dashboard', 'donations', 'utilization', 'reports'].includes(currentPage) &&
      !isAuthenticated
    ) {
      return <Home />;
    }

    // Default pages
    switch (currentPage) {
      case 'home':
        return <UserLanding onNavigate={handleNavigate} />;
      case 'dashboard':
        return <Dashboard />;
      case 'donations':
        return <Donations />;
      case 'utilization':
        return <Utilization />;
      case 'reports':
        return <Reports />;
      case 'about':
        return <About />;
      default:
        return <Home />;
    }
  };

  const isDonorPage = userRole === 'donor' && isAuthenticated && currentPage !== 'login';
  const isNGOPage = userRole === 'ngo' && isAuthenticated && currentPage !== 'login';
  const showNavbar = currentPage !== 'login';

  return (
    <div className="flex flex-col min-h-screen">
      {showNavbar && (
        isDonorPage ? (
          <DonorNavbar currentPage={currentPage} onNavigate={handleNavigate} />
        ) : isNGOPage ? (
          <NGONavbar currentPage={currentPage} onNavigate={handleNavigate} />
        ) : (
          <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
        )
      )}
      <main className="flex-grow">{renderPage()}</main>
      {currentPage !== 'login' && <Footer />}
    </div>
  );
}

export default App;
