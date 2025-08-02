/**
 * Simple Authentication Service
 * Provides basic username/password authentication for demo mode
 */

// Simulate network delay for demo auth
const simulateNetworkDelay = (min = 500, max = 1500) => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Mock user database with username/password
const mockUsers = {
  'admin': {
    username: 'admin',
    password: 'password123',
    name: 'Dr. Sarah Wilson',
    role: 'Field Worker',
    organization: 'Health Department',
    email: 'sarah.wilson@health.gov'
  },
  'user': {
    username: 'user',
    password: 'user123',
    name: 'John Smith',
    role: 'Health Assistant',
    organization: 'Community Health Center',
    email: 'john.smith@chc.org'
  },
  'demo': {
    username: 'demo',
    password: 'demo123',
    name: 'Demo User',
    role: 'Health Worker',
    organization: 'Demo Organization',
    email: 'demo@example.com'
  }
};

/**
 * Simple Authentication Class
 */
class SimpleAuth {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
  }

  /**
   * Simple login with username and password
   */
  async login(username, password) {
    console.log('Simple Auth: Attempting login for', username);
    
    // Simulate network delay
    await simulateNetworkDelay();

    // Validate inputs
    if (!username || !password) {
      return {
        success: false,
        message: 'Username and password are required'
      };
    }

    // Check if user exists
    const user = mockUsers[username.toLowerCase()];
    if (!user) {
      return {
        success: false,
        message: 'Invalid username or password'
      };
    }

    // Verify password
    if (user.password !== password) {
      return {
        success: false,
        message: 'Invalid username or password'
      };
    }

    // Generate JWT token (mock)
    const token = this.generateMockJWT(username);

    // Set authentication state
    this.isAuthenticated = true;
    this.currentUser = user;

    return {
      success: true,
      message: 'Login successful',
      token,
      user: {
        username: user.username,
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
  generateMockJWT(username) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: username,
      iss: 'simple-auth',
      aud: 'child-health-pwa',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      iat: Math.floor(Date.now() / 1000),
      scope: 'child_data_collection'
    }));
    const signature = btoa('mock-signature');
    
    return header + '.' + payload + '.' + signature;
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
    
    // Clear authentication state
    this.isAuthenticated = false;
    this.currentUser = null;
    
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
        username: user.username,
        name: user.name,
        role: user.role,
        organization: user.organization,
        email: user.email
      }
    };
  }

  /**
   * Get available demo users for testing
   */
  getDemoUsers() {
    return Object.keys(mockUsers).map(username => ({
      username,
      password: mockUsers[username].password,
      name: mockUsers[username].name
    }));
  }
}

// Create singleton instance
const simpleAuth = new SimpleAuth();

// Export utilities for testing
export const testUtils = {
  addMockUser: (username, userData) => {
    mockUsers[username] = userData;
  },
  getMockUsers: () => mockUsers
};

export default simpleAuth;
