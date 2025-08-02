/**
 * Authentication service with MongoDB integration via Backend API
 */

import { authAPI, childrenAPI, checkBackendAvailability } from '../services/api';

/**
 * Request OTP for authentication
 */
export const requestOtp = async (nationalId) => {
  try {
    // Check if backend is available
    const isBackendAvailable = await checkBackendAvailability();
    if (!isBackendAvailable) {
      throw new Error('Backend service is not available');
    }

    const response = await authAPI.requestOtp(nationalId);
    
    if (response.success) {
      console.log(`OTP for ${nationalId}: ${response.otp}`); // For demo - remove in production
    }

    return response;
  } catch (error) {
    console.error('OTP request failed:', error);
    return {
      success: false,
      message: error.message || 'Failed to send OTP. Please try again.'
    };
  }
};

/**
 * Verify OTP and authenticate user
 */
export const verifyOtp = async (nationalId, otp) => {
  try {
    // Check if backend is available
    const isBackendAvailable = await checkBackendAvailability();
    if (!isBackendAvailable) {
      throw new Error('Backend service is not available');
    }

    const response = await authAPI.verifyOtp(nationalId, otp);
    return response;
  } catch (error) {
    console.error('OTP verification failed:', error);
    return {
      success: false,
      message: error.message || 'Verification failed. Please try again.'
    };
  }
};

/**
 * Sync offline records to MongoDB when coming back online
 */
export const syncOfflineRecords = async (offlineRecords) => {
  try {
    // Check if backend is available
    const isBackendAvailable = await checkBackendAvailability();
    if (!isBackendAvailable) {
      throw new Error('Backend service is not available for sync');
    }

    // Filter only unsynced offline records
    const unsyncedRecords = offlineRecords.filter(
      record => !record.synced && record.isOfflineRecord
    );

    if (unsyncedRecords.length === 0) {
      return [];
    }

    const response = await childrenAPI.sync(unsyncedRecords);
    
    if (response.success) {
      return response.results;
    } else {
      throw new Error(response.message || 'Sync failed');
    }
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
};

/**
 * Create a demo user for testing
 */
export const createDemoUser = async (nationalId, userData = {}) => {
  try {
    // Check if backend is available
    const isBackendAvailable = await checkBackendAvailability();
    if (!isBackendAvailable) {
      throw new Error('Backend service is not available');
    }

    const response = await authAPI.createDemoUser({
      nationalId,
      ...userData
    });

    return response;
  } catch (error) {
    console.error('Failed to create demo user:', error);
    throw error;
  }
};

/**
 * Save child record to backend
 */
export const saveChildToBackend = async (childData) => {
  try {
    // Check if backend is available
    const isBackendAvailable = await checkBackendAvailability();
    if (!isBackendAvailable) {
      throw new Error('Backend service is not available');
    }

    const response = await childrenAPI.create(childData);
    
    if (response.success) {
      return {
        ...response.data,
        id: response.data._id,
        synced: true
      };
    } else {
      throw new Error(response.message || 'Failed to save record');
    }
  } catch (error) {
    console.error('Failed to save to backend:', error);
    throw error;
  }
};

/**
 * Get all children records from backend
 */
export const getChildrenFromBackend = async (params = {}) => {
  try {
    // Check if backend is available
    const isBackendAvailable = await checkBackendAvailability();
    if (!isBackendAvailable) {
      return [];
    }

    const response = await childrenAPI.getAll(params);
    
    if (response.success) {
      return response.data.map(child => ({
        ...child,
        id: child._id,
        synced: true
      }));
    } else {
      throw new Error(response.message || 'Failed to get records');
    }
  } catch (error) {
    console.error('Failed to get records from backend:', error);
    return [];
  }
};

const mongoAuth = {
  requestOtp,
  verifyOtp,
  syncOfflineRecords,
  createDemoUser,
  saveChildToBackend,
  getChildrenFromBackend
};

export default mongoAuth;
