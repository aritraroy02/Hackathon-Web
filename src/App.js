import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container, Alert, Snackbar } from '@mui/material';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import ChildForm from './components/forms/ChildForm';
import RecordsList from './components/records/RecordsList';
import SyncPage from './components/sync/SyncPage';
import AuthPage from './components/auth/AuthPage';
import SettingsPage from './components/settings/SettingsPage';
import HelpPage from './components/help/HelpPage';
import OfflineIndicator from './components/common/OfflineIndicator';
import InstallPrompt from './components/common/InstallPrompt';
import { useAppContext } from './contexts/AppContext';
import { checkNetworkStatus } from './utils/network';

function App() {
  const { 
    state, 
    dispatch, 
    showNotification, 
    hideNotification 
  } = useAppContext();
  
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);

  useEffect(() => {
    // Network status monitoring
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      setNetworkStatus(isOnline);
      dispatch({ 
        type: 'SET_ONLINE_STATUS', 
        payload: isOnline 
      });
      
      if (isOnline) {
        checkNetworkStatus().then(hasConnection => {
          if (hasConnection && state.pendingRecords.length > 0) {
            showNotification(
              'You\'re back online! Would you like to sync your data?',
              'info'
            );
          }
        });
      } else {
        showNotification(
          'You\'re offline. Data will be saved locally.',
          'warning'
        );
      }
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    
    // Initial network check
    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, [dispatch, showNotification, state.pendingRecords.length]);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (state.notification.show) {
      const timer = setTimeout(() => {
        hideNotification();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [state.notification.show, hideNotification]);

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
        isOnline={networkStatus}
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
          <Route path="/" element={<Navigate to="/form" replace />} />
          <Route 
            path="/form" 
            element={
              state.isAuthenticated ? (
                <ChildForm />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          <Route 
            path="/records" 
            element={
              state.isAuthenticated ? (
                <RecordsList />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          <Route 
            path="/sync" 
            element={
              state.isAuthenticated ? (
                <SyncPage />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          <Route path="/auth" element={<AuthPage />} />
          <Route 
            path="/settings" 
            element={
              state.isAuthenticated ? (
                <SettingsPage />
              ) : (
                <Navigate to="/auth" replace />
              )
            } 
          />
          <Route path="/help" element={<HelpPage />} />
          <Route path="*" element={<Navigate to="/form" replace />} />
        </Routes>
      </Container>

      {state.isAuthenticated && <Navigation />}
      
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

export default App;
