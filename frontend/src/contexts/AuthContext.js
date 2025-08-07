import React, { createContext, useContext, useReducer } from 'react';
import { clearAllUserData } from '../utils/database';

const AuthContext = createContext();

const initialState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  isLoggingOut: false,
  error: null
};

// API base URL - update this to match your backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        isLoading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: action.payload
      };
    case 'LOGOUT_START':
      return {
        ...state,
        isLoggingOut: true,
        error: null
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        isLoggingOut: false,
        error: null
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (uinNumber, otp) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // Step 1: Verify UIN exists in database
      const uinResponse = await fetch(`${API_BASE_URL}/auth/verify-uin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uinNumber }),
      });

      const uinData = await uinResponse.json();

      if (!uinResponse.ok) {
        throw new Error(uinData.message || 'UIN verification failed');
      }

      // Step 2: For now, we'll use a simple OTP validation
      // In production, you might want to implement actual OTP sending/verification
      if (otp !== '123456') {
        throw new Error('Invalid OTP. Please use 123456 for demo.');
      }

      // Step 3: If both UIN and OTP are valid, login successful
      const userData = {
        ...uinData.data,
        token: uinData.token
      };

      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { user: userData } 
      });

      // Store user data in localStorage for persistence
      localStorage.setItem('authUser', JSON.stringify(userData));
      localStorage.setItem('authToken', uinData.token);

      // Reset sync stopped flag in Service Worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
          navigator.serviceWorker.controller.postMessage({
            type: 'RESET_SYNC'
          });
        } catch (swError) {
          console.log('Could not reset Service Worker sync:', swError.message);
        }
      }

      console.log('✅ Login successful:', userData.name);
      return { success: true };

    } catch (error) {
      console.error('❌ Login failed:', error.message);
      dispatch({ 
        type: 'LOGIN_FAILURE', 
        payload: error.message 
      });
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    // Prevent double logout
    if (state.isLoggingOut) {
      console.log('⚠️ Logout already in progress, waiting for completion');
      return new Promise((resolve) => {
        // Wait for logout to complete by watching state changes
        const checkLogoutComplete = () => {
          if (!state.isLoggingOut && !state.isAuthenticated) {
            resolve();
          } else {
            setTimeout(checkLogoutComplete, 100);
          }
        };
        checkLogoutComplete();
      });
    }

    dispatch({ type: 'LOGOUT_START' });
    
    try {
      console.log('🔄 Starting secure logout process...');
      
      // Set a flag to prevent sync operations during logout
      window.__LOGOUT_IN_PROGRESS__ = true;
      
      // Notify Service Worker to stop background sync
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
          navigator.serviceWorker.controller.postMessage({
            type: 'STOP_SYNC',
            reason: 'logout'
          });
          
          // Wait a moment for the message to be processed
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (swError) {
          console.log('Could not notify Service Worker:', swError.message);
        }
      }
      
      // Clear all user data securely
      await clearAllUserData();
      
      // Clear auth-specific localStorage items
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
      
      // Clear any cached data that might cause reloads
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        } catch (cacheError) {
          console.log('Could not clear caches:', cacheError.message);
        }
      }
      
      // Unregister service worker to prevent infinite reloads
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            registrations.map(registration => registration.unregister())
          );
          console.log('✅ Service Worker unregistered');
        } catch (swError) {
          console.log('Could not unregister Service Worker:', swError.message);
        }
      }
      
      dispatch({ type: 'LOGOUT' });
      console.log('✅ User logged out securely');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Still proceed with logout even if cleanup fails
      try {
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken');
      } catch (cleanupError) {
        console.error('❌ Failed to clear localStorage:', cleanupError);
      }
      dispatch({ type: 'LOGOUT' });
      console.log('⚠️ Logout completed with errors');
    } finally {
      // Clear logout flag
      delete window.__LOGOUT_IN_PROGRESS__;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Check for existing auth on app load
  const checkExistingAuth = async () => {
    // Skip if already checking or if logout is in progress
    if (state.isLoading || window.__LOGOUT_IN_PROGRESS__) {
      return;
    }
    
    try {
      const storedUser = localStorage.getItem('authUser');
      const storedToken = localStorage.getItem('authToken');
      
      if (storedUser && storedToken) {
        try {
          const userData = JSON.parse(storedUser);
          
          // Basic validation
          if (!userData.uinNumber) {
            throw new Error('Invalid user data');
          }
          
          // For demo purposes, skip server verification to prevent network issues
          // In production, you would verify with the server
          dispatch({ 
            type: 'LOGIN_SUCCESS', 
            payload: { user: { ...userData, token: storedToken } } 
          });
          console.log('✅ Auto-login successful (local):', userData.name);
          
          // Optional: Verify with server in background
          // This won't block the UI
          fetch(`${API_BASE_URL}/auth/profile/${userData.uinNumber}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          }).then(response => {
            if (!response.ok) {
              console.warn('Server verification failed, but continuing with cached auth');
            }
          }).catch(error => {
            console.warn('Server verification error, but continuing with cached auth:', error.message);
          });
          
        } catch (parseError) {
          console.error('Failed to parse stored user data:', parseError);
          localStorage.removeItem('authUser');
          localStorage.removeItem('authToken');
        }
      }
    } catch (error) {
      console.error('Auto-login failed:', error);
      // Clear potentially corrupted data
      try {
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken');
      } catch (cleanupError) {
        console.error('Failed to clean up auth data:', cleanupError);
      }
    }
  };

  const value = {
    ...state,
    login,
    logout,
    clearError,
    checkExistingAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
