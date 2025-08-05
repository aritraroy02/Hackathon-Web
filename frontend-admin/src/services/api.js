import axios from 'axios';

// Base URL for the backend API - adjust this based on your backend deployment
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

console.log('🔗 Frontend connecting to backend API at:', BASE_URL);

// Create axios instance with default configuration
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API functions
export const apiService = {
  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Backend health check failed');
    }
  },

  // Get all children records
  getChildren: async (params = {}) => {
    try {
      // Set a high limit to get all records (you can adjust this based on your needs)
      const requestParams = { limit: 1000, ...params };
      const response = await api.get('/api/children', { params: requestParams });
      return {
        data: response.data.data || [],
        pagination: response.data.pagination || {},
        success: response.data.success
      };
    } catch (error) {
      console.error('Failed to fetch children records:', error);
      throw error;
    }
  },

  // Get specific child record
  getChild: async (id) => {
    try {
      const response = await api.get(`/api/children/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch child record ${id}:`, error);
      throw error;
    }
  },

  // Create new child record
  createChild: async (childData) => {
    try {
      const response = await api.post('/api/children', childData);
      return response.data;
    } catch (error) {
      console.error('Failed to create child record:', error);
      throw error;
    }
  },

  // Update child record
  updateChild: async (id, childData) => {
    try {
      const response = await api.put(`/api/children/${id}`, childData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update child record ${id}:`, error);
      throw error;
    }
  },

  // Delete child record
  deleteChild: async (id) => {
    try {
      const response = await api.delete(`/api/children/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete child record ${id}:`, error);
      throw error;
    }
  },

  // Get statistics for a user
  getStats: async (uin) => {
    try {
      const response = await api.get(`/api/stats/${uin}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch stats for UIN ${uin}:`, error);
      throw error;
    }
  },

  // Batch upload records
  batchUpload: async (records) => {
    try {
      const response = await api.post('/api/children/batch', { records });
      return response.data;
    } catch (error) {
      console.error('Failed to batch upload records:', error);
      throw error;
    }
  },

  // Get aggregated dashboard data
  getDashboardData: async () => {
    try {
      const childrenResponse = await api.get('/api/children', { 
        params: { limit: 100 } // Get more records for better analytics
      });
      
      const children = childrenResponse.data.data || [];
      
      // Calculate dashboard statistics
      const stats = {
        totalChildren: children.length,
        averageAge: children.length > 0 
          ? (children.reduce((sum, child) => sum + (parseFloat(child.age) || 0), 0) / children.length).toFixed(1)
          : 0,
        genderDistribution: {
          Male: children.filter(child => child.gender === 'Male').length,
          Female: children.filter(child => child.gender === 'Female').length,
          Other: children.filter(child => child.gender === 'Other').length,
        },
        cityDistribution: {},
        stateDistribution: {},
        uploaderStats: {},
        recentUploads: children
          .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
          .slice(0, 10)
      };

      // Calculate city and state distribution
      children.forEach(child => {
        const city = child.location?.city || 'Unknown';
        const state = child.location?.state || 'Unknown';
        const uploader = child.uploadedBy || 'Unknown';

        stats.cityDistribution[city] = (stats.cityDistribution[city] || 0) + 1;
        stats.stateDistribution[state] = (stats.stateDistribution[state] || 0) + 1;
        stats.uploaderStats[uploader] = (stats.uploaderStats[uploader] || 0) + 1;
      });

      return {
        success: true,
        data: stats,
        rawData: children
      };
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      throw error;
    }
  }
};

export default api;
