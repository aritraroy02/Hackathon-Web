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
      return;
    }

    dispatch({ type: 'LOGOUT_START' });
    
    try {
      // Clear all user data securely
      await clearAllUserData();
      
      // Clear auth-specific localStorage items
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
      
      dispatch({ type: 'LOGOUT' });
      console.log('👋 User logged out securely');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still proceed with logout even if cleanup fails
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Check for existing auth on app load
  const checkExistingAuth = async () => {
    try {
      const storedUser = localStorage.getItem('authUser');
      const storedToken = localStorage.getItem('authToken');
      
      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        
        // Verify user still exists and is active
        const response = await fetch(`${API_BASE_URL}/auth/profile/${userData.uinNumber}`);
        
        if (response.ok) {
          const profileData = await response.json();
          dispatch({ 
            type: 'LOGIN_SUCCESS', 
            payload: { user: { ...profileData.data, token: storedToken } } 
          });
          console.log('✅ Auto-login successful:', profileData.data.name);
        } else {
          // Clear invalid stored data
          localStorage.removeItem('authUser');
          localStorage.removeItem('authToken');
        }
      }
    } catch (error) {
      console.error('Auto-login failed:', error);
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
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
