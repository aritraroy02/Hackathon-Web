import React, { useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container, Alert, Snackbar } from '@mui/material';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import HomeScreen from './components/HomeScreen';
import ChildForm from './components/forms/ChildForm';
import RecordsList from './components/records/RecordsList';
import SettingsPage from './components/settings/SettingsPage';
import HelpPage from './components/help/HelpPage';
import OfflineIndicator from './components/common/OfflineIndicator';
import InstallPrompt from './components/common/InstallPrompt';
import { useAppContext } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { initializeDatabase } from './utils/database';

function AppContent() {
  const { 
    state, 
    hideNotification,
    triggerAutoSync,
    loadMongoRecords,
    clearMongoRecords
  } = useAppContext();
  
  const { checkExistingAuth, isAuthenticated, user } = useAuth();
  const mongoRecordsLoadedRef = useRef(false);

  useEffect(() => {
    // Clear any temp data that might cause redirects
    localStorage.removeItem('childFormTempData');
    
    // Initialize databases and check existing auth
    const initializeApp = async () => {
      try {
        // Initialize IndexedDB for offline storage
        await initializeDatabase();
        console.log('IndexedDB initialized');
        
        // Check for existing authentication
        await checkExistingAuth();
      } catch (error) {
        console.error('App initialization failed:', error);
      }
    };

    initializeApp();
  }, [checkExistingAuth]);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (state.notification.show) {
      const timer = setTimeout(() => {
        hideNotification();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [state.notification.show, hideNotification]);

  // Load MongoDB records once when user logs in
  useEffect(() => {
    if (isAuthenticated && user && state.isOnline && !mongoRecordsLoadedRef.current) {
      mongoRecordsLoadedRef.current = true;
      loadMongoRecords(user);
    }
  }, [isAuthenticated, user, state.isOnline, loadMongoRecords]);

  // Clear MongoDB records when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      mongoRecordsLoadedRef.current = false;
      clearMongoRecords();
    }
  }, [isAuthenticated, clearMongoRecords]);

  // Auto-sync when user comes online
  useEffect(() => {
    if (state.isOnline && isAuthenticated && user && state.settings.syncOnReconnect) {
      // Delay auto-sync slightly to ensure network is stable
      const timer = setTimeout(() => {
        triggerAutoSync(user);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [state.isOnline, isAuthenticated, user, state.settings.syncOnReconnect, triggerAutoSync]);

  const getNotificationSeverity = (type) => {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  return (
      <Box className="app-container">
        <Header />
        
        <OfflineIndicator 
          isOnline={state.isOnline}
          isSyncing={state.isSyncing}
          pendingCount={state.pendingRecords.length}
        />
        
        <Container 
          component="main" 
          className="main-content"
          maxWidth="lg"
          sx={{ py: 2 }}
        >
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/form" element={<ChildForm />} />
            <Route path="/records" element={<RecordsList />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="*" element={<HomeScreen />} />
          </Routes>
        </Container>

        <Navigation />
        
        <InstallPrompt />
        
        <Snackbar
          open={state.notification.show}
          onClose={hideNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ mt: 8 }}
        >
          <Alert 
            onClose={hideNotification} 
            severity={getNotificationSeverity(state.notification.type)}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {state.notification.message}
          </Alert>
        </Snackbar>
      </Box>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;