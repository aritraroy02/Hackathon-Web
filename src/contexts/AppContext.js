import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { networkService } from '../services/networkService';

// Initial state
const initialState = {
  isOnline: navigator.onLine,
  pendingRecords: [],
  syncedRecords: [],
  currentUser: null,
  isAuthenticated: false,
  formData: null,
  loading: false,
  error: null,
  syncStatus: 'idle', // idle, syncing, success, error
  lastSyncTime: null,
};

// Action types
const ActionTypes = {
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  SET_PENDING_RECORDS: 'SET_PENDING_RECORDS',
  SET_SYNCED_RECORDS: 'SET_SYNCED_RECORDS',
  ADD_PENDING_RECORD: 'ADD_PENDING_RECORD',
  REMOVE_PENDING_RECORD: 'REMOVE_PENDING_RECORD',
  SET_USER: 'SET_USER',
  SET_AUTHENTICATED: 'SET_AUTHENTICATED',
  SET_FORM_DATA: 'SET_FORM_DATA',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_SYNC_STATUS: 'SET_SYNC_STATUS',
  SET_LAST_SYNC_TIME: 'SET_LAST_SYNC_TIME',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_ONLINE_STATUS:
      return { ...state, isOnline: action.payload };
    
    case ActionTypes.SET_PENDING_RECORDS:
      return { ...state, pendingRecords: action.payload };
    
    case ActionTypes.SET_SYNCED_RECORDS:
      return { ...state, syncedRecords: action.payload };
    
    case ActionTypes.ADD_PENDING_RECORD:
      return { 
        ...state, 
        pendingRecords: [...state.pendingRecords, action.payload] 
      };
    
    case ActionTypes.REMOVE_PENDING_RECORD:
      return {
        ...state,
        pendingRecords: state.pendingRecords.filter(
          record => record.id !== action.payload
        )
      };
    
    case ActionTypes.SET_USER:
      return { ...state, currentUser: action.payload };
    
    case ActionTypes.SET_AUTHENTICATED:
      return { ...state, isAuthenticated: action.payload };
    
    case ActionTypes.SET_FORM_DATA:
      return { ...state, formData: action.payload };
    
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    
    case ActionTypes.SET_SYNC_STATUS:
      return { ...state, syncStatus: action.payload };
    
    case ActionTypes.SET_LAST_SYNC_TIME:
      return { ...state, lastSyncTime: action.payload };
    
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    
    default:
      return state;
  }
}

// Create context
const AppContext = createContext();

/**
 * App Context Provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component
 */
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: ActionTypes.SET_ONLINE_STATUS, payload: true });
    };

    const handleOffline = () => {
      dispatch({ type: ActionTypes.SET_ONLINE_STATUS, payload: false });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  /**
   * Load initial data from IndexedDB
   */
  const loadInitialData = async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      const [pendingRecords, syncedRecords] = await Promise.all([
        dbService.getAllPendingRecords(),
        dbService.getAllSyncedRecords()
      ]);

      dispatch({ type: ActionTypes.SET_PENDING_RECORDS, payload: pendingRecords });
      dispatch({ type: ActionTypes.SET_SYNCED_RECORDS, payload: syncedRecords });
      
      // Load last sync time from localStorage
      const lastSync = localStorage.getItem('lastSyncTime');
      if (lastSync) {
        dispatch({ type: ActionTypes.SET_LAST_SYNC_TIME, payload: new Date(lastSync) });
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to load data' });
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  /**
   * Add a new child record (offline-first)
   * @param {Object} recordData - Child record data
   */
  const addChildRecord = async (recordData) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      const record = await dbService.addPendingRecord(recordData);
      dispatch({ type: ActionTypes.ADD_PENDING_RECORD, payload: record });
      
      // Try to sync immediately if online
      if (state.isOnline) {
        await syncPendingRecords();
      }
      
      return record;
    } catch (error) {
      console.error('Error adding child record:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to save record' });
      throw error;
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  /**
   * Sync pending records with server
   */
  const syncPendingRecords = async () => {
    if (!state.isOnline || state.pendingRecords.length === 0) {
      return;
    }

    try {
      dispatch({ type: ActionTypes.SET_SYNC_STATUS, payload: 'syncing' });
      
      const syncResults = await networkService.syncRecords(state.pendingRecords);
      
      // Move successful syncs to synced records
      for (const result of syncResults) {
        if (result.success) {
          await dbService.movePendingToSynced(result.record.id);
          dispatch({ type: ActionTypes.REMOVE_PENDING_RECORD, payload: result.record.id });
        }
      }
      
      // Reload synced records
      const syncedRecords = await dbService.getAllSyncedRecords();
      dispatch({ type: ActionTypes.SET_SYNCED_RECORDS, payload: syncedRecords });
      
      dispatch({ type: ActionTypes.SET_SYNC_STATUS, payload: 'success' });
      dispatch({ type: ActionTypes.SET_LAST_SYNC_TIME, payload: new Date() });
      localStorage.setItem('lastSyncTime', new Date().toISOString());
      
    } catch (error) {
      console.error('Sync failed:', error);
      dispatch({ type: ActionTypes.SET_SYNC_STATUS, payload: 'error' });
      dispatch({ type: ActionTypes.SET_ERROR, payload: 'Sync failed' });
    }
  };

  /**
   * Authenticate user with eSignet
   * @param {string} nationalId - National ID
   * @param {string} otp - OTP code
   */
  const authenticateUser = async (nationalId, otp) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      const user = await networkService.authenticateWithESignet(nationalId, otp);
      
      dispatch({ type: ActionTypes.SET_USER, payload: user });
      dispatch({ type: ActionTypes.SET_AUTHENTICATED, payload: true });
      
      // Store auth token
      localStorage.setItem('authToken', user.token);
      
      return user;
    } catch (error) {
      console.error('Authentication failed:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: 'Authentication failed' });
      throw error;
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    dispatch({ type: ActionTypes.SET_USER, payload: null });
    dispatch({ type: ActionTypes.SET_AUTHENTICATED, payload: false });
    localStorage.removeItem('authToken');
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  };

  // Context value
  const contextValue = {
    ...state,
    actions: {
      addChildRecord,
      syncPendingRecords,
      authenticateUser,
      logout,
      clearError,
      loadInitialData,
    },
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Custom hook to use the App context
 * @returns {Object} Context value
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export { ActionTypes };
