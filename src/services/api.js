/**
 * API Service for communicating with the backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Make HTTP request to the API
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

/**
 * Authentication API calls
 */
export const authAPI = {
  requestOtp: (nationalId) => 
    apiRequest('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ nationalId }),
    }),

  verifyOtp: (nationalId, otp) =>
    apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ nationalId, otp }),
    }),

  createDemoUser: (userData) =>
    apiRequest('/auth/create-demo-user', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
};

/**
 * Children API calls
 */
export const childrenAPI = {
  create: (childData) =>
    apiRequest('/children', {
      method: 'POST',
      body: JSON.stringify(childData),
    }),

  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/children${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id) =>
    apiRequest(`/children/${id}`),

  getByHealthId: (healthId) =>
    apiRequest(`/children/health-id/${healthId}`),

  getBySubmitter: (submitterId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/children/submitter/${submitterId}${queryString ? `?${queryString}` : ''}`);
  },

  update: (id, childData) =>
    apiRequest(`/children/${id}`, {
      method: 'PUT',
      body: JSON.stringify(childData),
    }),

  delete: (id) =>
    apiRequest(`/children/${id}`, {
      method: 'DELETE',
    }),

  sync: (records) =>
    apiRequest('/children/sync', {
      method: 'POST',
      body: JSON.stringify({ records }),
    }),

  getStatistics: () =>
    apiRequest('/children/stats'),
};

/**
 * Health check
 */
export const healthAPI = {
  check: () =>
    apiRequest('/health'),
};

/**
 * Check if backend is available
 */
export const checkBackendAvailability = async () => {
  try {
    await healthAPI.check();
    return true;
  } catch (error) {
    console.warn('Backend not available:', error.message);
    return false;
  }
};

// Export API services
const apiServices = {
  authAPI,
  childrenAPI,
  healthAPI,
  checkBackendAvailability,
};

export default apiServices;
