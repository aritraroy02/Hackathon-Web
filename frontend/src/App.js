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
import './i18n'; // Initialize i18n
import i18n from './i18n';

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
  const appInitializedRef = useRef(false);
  const autoSyncTriggeredRef = useRef(false);

  useEffect(() => {
    // Prevent re-initialization
    if (appInitializedRef.current) {
      return;
    }
    
    // Clear any temp data that might cause redirects
    localStorage.removeItem('childFormTempData');
    
    // Clear logout flag if it exists from a previous session
    delete window.__LOGOUT_IN_PROGRESS__;
    
    // Initialize databases and check existing auth
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        
        // Validate and fix language setting
        const currentLanguage = i18n.language;
        const supportedLanguages = ['en', 'es', 'fr', 'hi', 'zh'];
        if (!supportedLanguages.includes(currentLanguage)) {
          console.log(`⚠️ Unsupported language detected: ${currentLanguage}, switching to 'en'`);
          i18n.changeLanguage('en');
        }
        
        // Initialize IndexedDB for offline storage with recovery
        try {
          await initializeDatabase();
          console.log('IndexedDB initialized successfully');
        } catch (dbError) {
          console.warn('Database initialization failed, attempting recovery:', dbError.message);
          
          // Import recovery function dynamically to avoid circular dependencies
          const { recoverDatabase } = await import('./utils/database');
          const recoveryResult = await recoverDatabase();
          
          if (recoveryResult.success) {
            console.log('✅ Database recovery successful');
          } else {
            console.error('❌ Database recovery failed, continuing without database');
            // Clear potentially corrupted localStorage as fallback
            try {
              localStorage.clear();
            } catch (clearError) {
              console.error('Failed to clear localStorage:', clearError);
            }
          }
        }
        
        // Check for existing authentication
        await checkExistingAuth();
        console.log('Auth check completed');
        
        // Mark app as initialized
        appInitializedRef.current = true;
      } catch (error) {
        console.error('App initialization failed:', error);
        // Clear potentially corrupted data if initialization fails
        try {
          localStorage.removeItem('authUser');
          localStorage.removeItem('authToken');
          localStorage.removeItem('childFormDraft');
        } catch (cleanupError) {
          console.error('Failed to clean up corrupted data:', cleanupError);
        }
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
      console.log('🔄 Triggering initial MongoDB load...');
      loadMongoRecords(user);
    }
  }, [isAuthenticated, user, state.isOnline, loadMongoRecords]);

  // Clear MongoDB records when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      mongoRecordsLoadedRef.current = false;
      autoSyncTriggeredRef.current = false;
      clearMongoRecords();
    }
  }, [isAuthenticated, clearMongoRecords]);

  // Auto-sync when user comes online (with safety checks)
  useEffect(() => {
    // Skip if logout is in progress
    if (window.__LOGOUT_IN_PROGRESS__) {
      return;
    }
    
    if (state.isOnline && isAuthenticated && user && state.settings.syncOnReconnect && !state.isSyncing && !autoSyncTriggeredRef.current) {
      // Delay auto-sync slightly to ensure network is stable
      const timer = setTimeout(() => {
        // Double-check conditions haven't changed
        if (!window.__LOGOUT_IN_PROGRESS__ && state.isOnline && isAuthenticated && user && !state.isSyncing) {
          autoSyncTriggeredRef.current = true;
          triggerAutoSync(user);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [state.isOnline, isAuthenticated, user, state.settings.syncOnReconnect, state.isSyncing, triggerAutoSync]);

  const getNotificationSeverity = (type) => {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  return (
      <Box 
        className="app-container"
        sx={{
          bgcolor: 'background.default',
          minHeight: '100vh',
          color: 'text.primary'
        }}
      >
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