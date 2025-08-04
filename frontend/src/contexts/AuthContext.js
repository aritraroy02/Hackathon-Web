import React, { createContext, useContext, useReducer } from 'react';

const AuthContext = createContext();

const initialState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null
};

const mockUser = {
  uinNumber: "1234567890",
  uin: "1234567890", // Add uin property for upload service
  name: "ARITRADITYA ROY",
  firstName: "ARITRADITYA",
  lastName: "ROY",
  email: "aritraditya.roy@gmail.com",
  phone: "+91-9876543210",
  address: "123 Main Street, New Delhi, Delhi 110001",
  dateOfBirth: "1985-06-15",
  gender: "Male",
  photo: null,
  isActive: true,
  employeeId: "HW-567890",
  role: "health_worker",
  department: "Child Health Services",
  designation: "Senior Health Worker",
  token: "demo-token" // Add token for authentication
};

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
        user: action.payload,
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
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
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
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock validation
      if (uinNumber === mockUser.uinNumber && otp === '123456') {
        dispatch({ type: 'LOGIN_SUCCESS', payload: mockUser });
        return { success: true };
      } else {
        throw new Error('Invalid UIN Number or OTP');
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    logout,
    clearError
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
