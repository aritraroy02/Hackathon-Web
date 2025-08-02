/**
 * Enhanced Authentication Service
 * Uses MongoDB when online, falls back to mock for offline/demo
 */

import { requestOtp as mongoRequestOtp, verifyOtp as mongoVerifyOtp } from './mongoAuth';
import { checkNetworkStatus } from './network';

// Simulate network delay for mock auth
const simulateNetworkDelay = (min = 1000, max = 3000) => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Generate random OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Mock user database
const mockUsers = {
  '1234567890': {
    nationalId: '1234567890',
    name: 'Dr. Sarah Wilson',
    role: 'Field Worker',
    organization: 'Health Department',
    phone: '***-***-1234',
    email: 'sarah.wilson@health.gov'
  },
  '9876543210': {
    nationalId: '9876543210',
    name: 'John Smith',
    role: 'Health Assistant',
    organization: 'Community Health Center',
    phone: '***-***-5678',
    email: 'john.smith@chc.org'
  }
};

// Store OTP temporarily (in real implementation, this would be server-side)
let otpStore = {};

/**
 * Enhanced Authentication Class
 */
class EnhancedAuth {
  constructor() {
    this.baseUrl = '/api/esignet'; // Mock API endpoint
  }

  /**
   * Request OTP for National ID
   * Uses MongoDB when online, mock when offline
   */
  async requestOtp(nationalId) {
    try {
      // Check if we should use MongoDB (online) or mock (offline)
      const isOnline = navigator.onLine && await checkNetworkStatus();
      
      if (isOnline) {
        // Use MongoDB authentication
        console.log('Using MongoDB authentication');
        return await mongoRequestOtp(nationalId);
      } else {
        // Use mock authentication for offline demo
        console.log('Using mock authentication (offline mode)');
        return await this.mockRequestOtp(nationalId);
      }
    } catch (error) {
      console.error('Authentication request failed:', error);
      // Fallback to mock if MongoDB fails
      return await this.mockRequestOtp(nationalId);
    }
  }

  /**
   * Verify OTP
   * Uses MongoDB when online, mock when offline
   */
  async verifyOtp(nationalId, otp) {
    try {
      // Check if we should use MongoDB (online) or mock (offline)
      const isOnline = navigator.onLine && await checkNetworkStatus();
      
      if (isOnline) {
        // Use MongoDB authentication
        console.log('Using MongoDB verification');
        return await mongoVerifyOtp(nationalId, otp);
      } else {
        // Use mock authentication for offline demo
        console.log('Using mock verification (offline mode)');
        return await this.mockVerifyOtp(nationalId, otp);
      }
    } catch (error) {
      console.error('Authentication verification failed:', error);
      // Fallback to mock if MongoDB fails
      return await this.mockVerifyOtp(nationalId, otp);
    }
  }

  /**
   * Mock OTP request for offline/demo mode
   */
  async mockRequestOtp(nationalId) {
    console.log('eSignet: Requesting OTP for', nationalId);
    
    // Simulate network delay
    await simulateNetworkDelay(1000, 2000);

    // Validate National ID format
    if (!nationalId || nationalId.length < 10) {
      return {
        success: false,
        message: 'Invalid National ID format'
      };
    }

    // Check if user exists (in real implementation, this would be done on server)
    const user = mockUsers[nationalId];
    if (!user && nationalId.length === 10) {
      // Create a temporary user for demo purposes
      mockUsers[nationalId] = {
        nationalId,
        name: 'Health Worker',
        role: 'Field Worker',
        organization: 'Health Department',
        phone: `***-***-${nationalId.slice(-4)}`,
        email: `user${nationalId.slice(-4)}@health.gov`
      };
    }

    // Generate and store OTP
    const otp = generateOtp();
    otpStore[nationalId] = {
      otp,
      timestamp: Date.now(),
      attempts: 0,
      verified: false
    };

    // Simulate OTP sending
    console.log(`Mock OTP for ${nationalId}: ${otp}`);

    return {
      success: true,
      message: 'OTP sent successfully',
      otp, // In real implementation, this would not be returned
      maskedPhone: mockUsers[nationalId]?.phone || '***-***-' + nationalId.slice(-4),
      sessionId: `session_${nationalId}_${Date.now()}`
    };
  }

  /**
   * Mock OTP verification for offline/demo mode
   */
  async mockVerifyOtp(nationalId, otp) {
    console.log('eSignet: Verifying OTP for', nationalId);
    
    // Simulate network delay
    await simulateNetworkDelay(500, 1500);

    const storedOtpData = otpStore[nationalId];
    
    if (!storedOtpData) {
      return {
        success: false,
        message: 'No OTP request found. Please request OTP first.'
      };
    }

    // Check if OTP has expired (5 minutes)
    const otpAge = Date.now() - storedOtpData.timestamp;
    if (otpAge > 5 * 60 * 1000) {
      delete otpStore[nationalId];
      return {
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      };
    }

    // Check attempts
    storedOtpData.attempts += 1;
    if (storedOtpData.attempts > 3) {
      delete otpStore[nationalId];
      return {
        success: false,
        message: 'Maximum OTP attempts exceeded. Please request a new OTP.'
      };
    }

    // Verify OTP
    if (storedOtpData.otp !== otp) {
      return {
        success: false,
        message: `Invalid OTP. ${3 - storedOtpData.attempts} attempts remaining.`
      };
    }

    // Mark as verified
    storedOtpData.verified = true;

    // Generate JWT token (mock)
    const token = this.generateMockJWT(nationalId);

    // Get user info
    const user = mockUsers[nationalId];

    // Clean up OTP
    delete otpStore[nationalId];

    return {
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        nationalId: user.nationalId,
        name: user.name,
        role: user.role,
        organization: user.organization,
        email: user.email
      },
      permissions: [
        'child_data_collection',
        'view_records',
        'sync_data'
      ]
    };
  }

  /**
   * Generate mock JWT token
   */
  generateMockJWT(nationalId) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: nationalId,
      iss: 'mock-esignet',
      aud: 'child-health-pwa',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      iat: Math.floor(Date.now() / 1000),
      scope: 'child_data_collection'
    }));
    const signature = btoa('mock-signature');
    
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Validate JWT token
   */
  validateToken(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload.exp > Math.floor(Date.now() / 1000);
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(token) {
    await simulateNetworkDelay(500, 1000);
    
    if (!this.validateToken(token)) {
      return {
        success: false,
        message: 'Invalid token'
      };
    }

    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    
    return {
      success: true,
      token: this.generateMockJWT(payload.sub)
    };
  }

  /**
   * Logout
   */
  async logout(token) {
    await simulateNetworkDelay(200, 500);
    
    // In real implementation, would invalidate token on server
    return {
      success: true,
      message: 'Logout successful'
    };
  }

  /**
   * Get user profile
   */
  async getProfile(token) {
    await simulateNetworkDelay(300, 800);
    
    if (!this.validateToken(token)) {
      return {
        success: false,
        message: 'Invalid or expired token'
      };
    }

    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    const user = mockUsers[payload.sub];
    
    return {
      success: true,
      user: {
        nationalId: user.nationalId,
        name: user.name,
        role: user.role,
        organization: user.organization,
        email: user.email
      }
    };
  }
}

// Export singleton instance
export const mockESignetAuth = new EnhancedAuth();

// Export utilities for testing
export const testUtils = {
  clearOtpStore: () => { otpStore = {}; },
  getOtpStore: () => otpStore,
  addMockUser: (nationalId, userData) => {
    mockUsers[nationalId] = userData;
  },
  getMockUsers: () => mockUsers
};

export default mockESignetAuth;
