import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Initial state
const initialState = {
  // Form data
  currentForm: {
    childName: '',
    photo: null,
    age: '',
    healthId: '',
    weight: '',
    height: '',
    guardianName: '',
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
  
  // App state
  isOnline: navigator.onLine,
  isSyncing: false,
  isLoading: false,
  
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
  
  // App state
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  SET_SYNCING: 'SET_SYNCING',
  SET_LOADING: 'SET_LOADING',
  
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
  
  const updateSettings = useCallback((newSettings) => {
    dispatch({ type: actionTypes.UPDATE_SETTINGS, payload: newSettings });
  }, []);

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
    setLoading,
    setSyncing,
    updateSettings
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
