import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, BarChart3, Users, UserCheck, Settings, HelpCircle, Search } from 'lucide-react';
import { apiService } from './services/api';
import storageService from './services/storage';
import Dashboard from './components/Dashboard';
import About from './components/About';
import ChildrenList from './components/ChildrenList';
import KYCManagement from './components/KYCManagement';
import SettingsPage from './components/SettingsPage';
import ChildLookup from './components/ChildLookup';
import MalnutritionAnalysis from './components/MalnutritionAnalysis';
import './App.css';

// Navigation component
function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleMenuClick = (path) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'View All Child Data', path: '/children' },
    { icon: Search, label: 'Find Child by Health ID', path: '/lookup' },
    { icon: UserCheck, label: 'Representative KYC', path: '/kyc' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: HelpCircle, label: 'Help & Support', path: '/about' }
  ];
  
  return (
    <>
      <nav className="navbar">
        <div className="container">
          <div className="navbar-left">
            <button className="hamburger-btn" onClick={toggleSidebar}>
              <Menu size={window.innerWidth <= 480 ? 20 : 24} />
            </button>
            <Link to="/" className="navbar-brand">
              {window.innerWidth <= 480 ? 'Child Health' : 'Child Health Dashboard'}
            </Link>
          </div>
          <ul className="navbar-nav">
            <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>Dashboard</Link></li>
            <li><Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>About</Link></li>
          </ul>
        </div>
      </nav>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2>Menu</h2>
          <button className="close-btn" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleMenuClick(item.path)}
                className={`sidebar-nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <IconComponent size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}

// Offline indicator component
function OfflineIndicator({ isOffline }) {
  if (!isOffline) return null;
  
  return (
    <div className="offline-indicator">
      You are currently offline. Showing cached data.
    </div>
  );
}

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Network status listeners
    const handleOnline = () => {
      setIsOffline(false);
      fetchData(); // Refresh data when back online
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial data fetch
    fetchData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (navigator.onLine) {
        // Try to fetch from API
        const response = await apiService.getDashboardData();
        setDashboardData(response);
        
        // Store data offline for future use
        if (response.rawData && response.rawData.length > 0) {
          await storageService.storeChildren(response.rawData);
        }
      } else {
        // Load from offline storage
        const offlineData = await storageService.getDashboardStats();
        if (offlineData) {
          setDashboardData(offlineData);
        } else {
          throw new Error('No offline data available');
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(error.message);
      
      // Try to load offline data as fallback
      try {
        const offlineData = await storageService.getDashboardStats();
        if (offlineData && offlineData.data.totalChildren > 0) {
          setDashboardData(offlineData);
          setError(null);
        }
      } catch (offlineError) {
        console.error('Failed to load offline data:', offlineError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchData();
  };

  return (
    <Router>
      <div className="App">
        <Navigation />
        <OfflineIndicator isOffline={isOffline} />
        
        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard 
                  data={dashboardData} 
                  loading={loading} 
                  error={error} 
                  onRetry={handleRetry}
                  isOffline={isOffline}
                />
              } 
            />
            <Route path="/children" element={<ChildrenList />} />
            <Route path="/lookup" element={<ChildLookup />} />
            <Route path="/kyc" element={<KYCManagement />} />
            <Route path="/malnutrition-analysis" element={<MalnutritionAnalysis />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

