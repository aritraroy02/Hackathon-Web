import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { addNetworkListeners } from '../utils/networkUtils';
import { autoSyncOfflineRecords } from '../utils/uploadService';

// Initial state
const initialState = {
  // Form data
  currentForm: {
    childName: '',
    photo: null,
    age: '',
    gender: '',
    healthId: '',
    weight: '',
    height: '',
    guardianName: '',
    phone: '',
    malnutritionSigns: [],
    recentIllnesses: '',
    parentalConsent: false,
    location: null,
    timestamp: null
  },
  
  // Records
  savedRecords: [],
  pendingRecords: [],
  syncedRecords: [],
  mongoRecords: [],
  mongoRecordsLoaded: false,
  
  // App state
  isOnline: navigator.onLine,
  isSyncing: false,
  isLoading: false,
  isUploading: false,
  uploadProgress: {
    current: 0,
    total: 0,
    percentage: 0,
    currentRecord: null
  },
  
  // Location state
  currentLocation: null,
  locationLoading: false,
  locationError: null,
  
  // UI state
  notification: {
    show: false,
    message: '',
    type: 'info' // 'success', 'error', 'warning', 'info'
  },
  
  // Settings
  settings: {
    autoSave: true,
    syncOnReconnect: true,
    dataCompression: true,
    photoQuality: 'medium', // 'low', 'medium', 'high'
    language: 'en',
    theme: 'light'
  }
};

// Action types
export const actionTypes = {
  // Form
  UPDATE_FORM_FIELD: 'UPDATE_FORM_FIELD',
  RESET_FORM: 'RESET_FORM',
  SET_FORM_DATA: 'SET_FORM_DATA',
  
  // Records
  ADD_RECORD: 'ADD_RECORD',
  UPDATE_RECORD: 'UPDATE_RECORD',
  DELETE_RECORD: 'DELETE_RECORD',
  SET_RECORDS: 'SET_RECORDS',
  ADD_PENDING_RECORD: 'ADD_PENDING_RECORD',
  REMOVE_PENDING_RECORD: 'REMOVE_PENDING_RECORD',
  MARK_RECORD_SYNCED: 'MARK_RECORD_SYNCED',
  MARK_RECORD_UPLOADED: 'MARK_RECORD_UPLOADED',
  SET_UPLOAD_PROGRESS: 'SET_UPLOAD_PROGRESS',
  SET_MONGO_RECORDS: 'SET_MONGO_RECORDS',
  CLEAR_MONGO_RECORDS: 'CLEAR_MONGO_RECORDS',
  
  // App state
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  SET_SYNCING: 'SET_SYNCING',
  SET_LOADING: 'SET_LOADING',
  SET_UPLOADING: 'SET_UPLOADING',
  
  // Location
  SET_LOCATION: 'SET_LOCATION',
  SET_LOCATION_LOADING: 'SET_LOCATION_LOADING',
  SET_LOCATION_ERROR: 'SET_LOCATION_ERROR',
  
  // UI
  SHOW_NOTIFICATION: 'SHOW_NOTIFICATION',
  HIDE_NOTIFICATION: 'HIDE_NOTIFICATION',
  
  // Settings
  UPDATE_SETTINGS: 'UPDATE_SETTINGS'
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.UPDATE_FORM_FIELD:
      return {
        ...state,
        currentForm: {
          ...state.currentForm,
          [action.payload.field]: action.payload.value
        }
      };
      
    case actionTypes.RESET_FORM:
      return {
        ...state,
        currentForm: {
          ...initialState.currentForm,
          timestamp: new Date().toISOString()
        }
      };
      
    case actionTypes.SET_FORM_DATA:
      return {
        ...state,
        currentForm: action.payload
      };
      
    case actionTypes.ADD_RECORD:
      return {
        ...state,
        savedRecords: [...state.savedRecords, action.payload]
      };
      
    case actionTypes.UPDATE_RECORD:
      return {
        ...state,
        savedRecords: state.savedRecords.map(record => 
          record.id === action.payload.id ? action.payload : record
        )
      };
      
    case actionTypes.DELETE_RECORD:
      return {
        ...state,
        savedRecords: state.savedRecords.filter(
          record => record.id !== action.payload
        ),
        pendingRecords: state.pendingRecords.filter(
          record => record.id !== action.payload
        )
      };
      
    case actionTypes.SET_RECORDS:
      return {
        ...state,
        savedRecords: action.payload
      };
      
    case actionTypes.ADD_PENDING_RECORD:
      return {
        ...state,
        pendingRecords: [...state.pendingRecords, action.payload]
      };
      
    case actionTypes.REMOVE_PENDING_RECORD:
      return {
        ...state,
        pendingRecords: state.pendingRecords.filter(
          record => record.id !== action.payload
        )
      };
      
    case actionTypes.MARK_RECORD_SYNCED:
      return {
        ...state,
        pendingRecords: state.pendingRecords.filter(
          record => record.id !== action.payload
        ),
        syncedRecords: [...state.syncedRecords, action.payload]
      };
      
    case actionTypes.SET_ONLINE_STATUS:
      return {
        ...state,
        isOnline: action.payload
      };
      
    case actionTypes.SET_SYNCING:
      return {
        ...state,
        isSyncing: action.payload
      };
      
    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    case actionTypes.SET_UPLOADING:
      return {
        ...state,
        isUploading: action.payload
      };
      
    case actionTypes.SET_UPLOAD_PROGRESS:
      return {
        ...state,
        uploadProgress: action.payload
      };

    case actionTypes.SET_MONGO_RECORDS:
      return {
        ...state,
        mongoRecords: action.payload,
        mongoRecordsLoaded: true
      };

    case actionTypes.CLEAR_MONGO_RECORDS:
      return {
        ...state,
        mongoRecords: [],
        mongoRecordsLoaded: false
      };
      
    case actionTypes.MARK_RECORD_UPLOADED:
      return {
        ...state,
        pendingRecords: state.pendingRecords.map(record =>
          record.localId === action.payload.localId
            ? { ...record, uploadStatus: 'uploaded', uploadedAt: new Date().toISOString() }
            : record
        )
      };
      
    case actionTypes.SET_LOCATION:
      return {
        ...state,
        currentLocation: action.payload,
        locationLoading: false,
        locationError: null
      };
      
    case actionTypes.SET_LOCATION_LOADING:
      return {
        ...state,
        locationLoading: action.payload
      };
      
    case actionTypes.SET_LOCATION_ERROR:
      return {
        ...state,
        locationError: action.payload,
        locationLoading: false
      };
      
    case actionTypes.SHOW_NOTIFICATION:
      return {
        ...state,
        notification: {
          show: true,
          message: action.payload.message,
          type: action.payload.type || 'info'
        }
      };
      
    case actionTypes.HIDE_NOTIFICATION:
      return {
        ...state,
        notification: {
          ...state.notification,
          show: false
        }
      };
      
    case actionTypes.UPDATE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };
      
    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Action creators
  const showNotification = useCallback((message, type = 'info') => {
    dispatch({
      type: actionTypes.SHOW_NOTIFICATION,
      payload: { message, type }
    });
  }, []);
  
  const hideNotification = useCallback(() => {
    dispatch({ type: actionTypes.HIDE_NOTIFICATION });
  }, []);
  
  const updateFormField = useCallback((field, value) => {
    dispatch({
      type: actionTypes.UPDATE_FORM_FIELD,
      payload: { field, value }
    });
  }, []);
  
  const resetForm = useCallback(() => {
    dispatch({ type: actionTypes.RESET_FORM });
  }, []);
  
  const addRecord = useCallback((record) => {
    dispatch({
      type: actionTypes.ADD_RECORD,
      payload: record
    });
  }, []);
  
  const addPendingRecord = useCallback((record) => {
    dispatch({
      type: actionTypes.ADD_PENDING_RECORD,
      payload: record
    });
  }, []);
  
  const removePendingRecord = useCallback((recordId) => {
    dispatch({
      type: actionTypes.REMOVE_PENDING_RECORD,
      payload: recordId
    });
  }, []);
  
  const markRecordSynced = useCallback((recordId) => {
    dispatch({
      type: actionTypes.MARK_RECORD_SYNCED,
      payload: recordId
    });
  }, []);
  
  const setLoading = useCallback((loading) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: loading });
  }, []);
  
  const setSyncing = useCallback((syncing) => {
    dispatch({ type: actionTypes.SET_SYNCING, payload: syncing });
  }, []);
  
  const setUploading = useCallback((uploading) => {
    dispatch({ type: actionTypes.SET_UPLOADING, payload: uploading });
  }, []);
  
  const setUploadProgress = useCallback((progress) => {
    dispatch({ type: actionTypes.SET_UPLOAD_PROGRESS, payload: progress });
  }, []);
  
  const markRecordUploaded = useCallback((recordData) => {
    dispatch({ type: actionTypes.MARK_RECORD_UPLOADED, payload: recordData });
  }, []);
  
  const setLocation = useCallback((location) => {
    dispatch({ type: actionTypes.SET_LOCATION, payload: location });
  }, []);
  
  const setLocationLoading = useCallback((loading) => {
    dispatch({ type: actionTypes.SET_LOCATION_LOADING, payload: loading });
  }, []);
  
  const setLocationError = useCallback((error) => {
    dispatch({ type: actionTypes.SET_LOCATION_ERROR, payload: error });
  }, []);
  
  const updateSettings = useCallback((newSettings) => {
    dispatch({ type: actionTypes.UPDATE_SETTINGS, payload: newSettings });
  }, []);

  const setOnlineStatus = useCallback((isOnline) => {
    dispatch({ type: actionTypes.SET_ONLINE_STATUS, payload: isOnline });
  }, []);

  const setMongoRecords = useCallback((records) => {
    dispatch({ type: actionTypes.SET_MONGO_RECORDS, payload: records });
  }, []);

  const clearMongoRecords = useCallback(() => {
    dispatch({ type: actionTypes.CLEAR_MONGO_RECORDS });
  }, []);

  // Load MongoDB records once after login
  const loadMongoRecords = useCallback(async (user, force = false) => {
    if (!user || !navigator.onLine) {
      return;
    }

    // Check if already loaded and not forcing refresh
    if (state.mongoRecordsLoaded && !force) {
      return;
    }

    try {
      const { fetchUserRecords } = await import('../utils/uploadService');
      const result = await fetchUserRecords(user);
      if (result.success) {
        setMongoRecords(result.data.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
        console.log(`✅ Loaded ${result.data.length} records from MongoDB`);
      } else {
        console.error('Failed to fetch user records:', result.error);
        showNotification(`Failed to load your records: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error loading user records:', error);
      showNotification('Failed to load your records from server', 'error');
    }
  }, [setMongoRecords, showNotification, state.mongoRecordsLoaded]);

  // Auto-sync function
  const triggerAutoSync = useCallback(async (user) => {
    if (!user || !state.isOnline || state.isSyncing) {
      return;
    }
    
    // Skip sync if logout is in progress
    if (window.__LOGOUT_IN_PROGRESS__) {
      console.log('⚠️ Logout in progress, skipping auto-sync trigger');
      return;
    }

    setSyncing(true);
    showNotification('Syncing offline data...', 'info');

    try {
      const result = await autoSyncOfflineRecords(user, (progress) => {
        setUploadProgress({
          current: progress.completed || 0,
          total: progress.total || 0,
          percentage: progress.percentage || 0,
          currentRecord: progress.current || null
        });
      });

      if (result.success) {
        if (result.syncedCount > 0) {
          showNotification(
            `Successfully synced ${result.syncedCount} records to server`, 
            'success'
          );
          // Refresh MongoDB records after successful sync
          await loadMongoRecords(user, true);
        }
        if (result.failedCount > 0) {
          showNotification(
            `Failed to sync ${result.failedCount} records. Please try again.`, 
            'warning'
          );
        }
      } else {
        showNotification(`Sync failed: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Auto-sync error:', error);
      showNotification('Auto-sync failed. Please try manual sync.', 'error');
    } finally {
      setSyncing(false);
      setUploadProgress({ current: 0, total: 0, percentage: 0, currentRecord: null });
    }
  }, [state.isOnline, state.isSyncing, setSyncing, showNotification, setUploadProgress, loadMongoRecords]);

  // Set up network listeners
  useEffect(() => {
    const cleanup = addNetworkListeners(
      () => {
        setOnlineStatus(true);
        console.log('🌐 Network: Back online');
      },
      () => {
        setOnlineStatus(false);
        console.log('📱 Network: Offline');
      }
    );

    return cleanup;
  }, [setOnlineStatus]);

  const value = {
    state,
    dispatch,
    // Action creators
    showNotification,
    hideNotification,
    updateFormField,
    resetForm,
    addRecord,
    addPendingRecord,
    removePendingRecord,
    markRecordSynced,
    markRecordUploaded,
    setLoading,
    setSyncing,
    setUploading,
    setUploadProgress,
    setLocation,
    setLocationLoading,
    setLocationError,
    updateSettings,
    setOnlineStatus,
    triggerAutoSync,
    setMongoRecords,
    clearMongoRecords,
    loadMongoRecords
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
