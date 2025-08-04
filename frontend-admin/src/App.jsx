import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import { apiService } from './services/api';
import storageService from './services/storage';
import Dashboard from './components/Dashboard';
import About from './components/About';
import './App.css';

// Navigation component
function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          Child Health Dashboard
        </Link>
        <ul className="navbar-nav">
          <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>Dashboard</Link></li>
          <li><Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>About</Link></li>
        </ul>
      </div>
    </nav>
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
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

