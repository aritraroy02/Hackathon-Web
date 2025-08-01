import axios from 'axios';

const API_ENDPOINT = '/api';

/**
 * Network service for server communication
 */
class NetworkService {
  /**
   * Authenticate user with eSignet (mock)
   * @param {string} nationalId - National ID
   * @param {string} otp - OTP code
   * @returns {Promise<Object>} Authenticated user data
   */
  async authenticateWithESignet(nationalId, otp) {
    try {
      // Mock JWT Token generation
      const token = `JWT-${nationalId}-${otp}`;

      // Mock response
      const user = {
        id: nationalId,
        token,
        name: 'Test User',
        authenticated: true,
      };
      return Promise.resolve(user);
    } catch (error) {
      console.error('Authentication failed', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Sync records with the server
   * @param {Array<Object>} records - Array of records to sync
   * @returns {Promise<Array<Object>>} Array of sync results
   */
  async syncRecords(records) {
    try {
      const response = await axios.post(`${API_ENDPOINT}/sync`, records, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Sync failed', error);
      throw new Error('Sync failed');
    }
  }
}

// Export singleton instance
export const networkService = new NetworkService();
