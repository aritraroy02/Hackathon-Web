/**
 * Network utilities for connectivity detection and status management
 */

/**
 * Check if the device has internet connectivity
 */
export const checkNetworkStatus = async () => {
  // First check navigator.onLine
  if (!navigator.onLine) {
    return false;
  }

  // Try to fetch a small resource to verify actual connectivity
  try {
    const response = await fetch('/favicon.ico', {
      method: 'HEAD',
      cache: 'no-cache',
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    console.log('Network check failed:', error);
    return false;
  }
};

/**
 * Get network connection information
 */
export const getNetworkInfo = () => {
  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
  return null;
};

/**
 * Determine if the connection is fast enough for uploads
 */
export const isFastConnection = () => {
  const networkInfo = getNetworkInfo();
  if (!networkInfo) return true; // Assume good connection if unknown
  
  // Consider 3G and above as fast enough
  const fastTypes = ['4g', '3g'];
  return fastTypes.includes(networkInfo.effectiveType) || networkInfo.downlink > 1.5;
};

/**
 * Network status listener
 */
export class NetworkStatusListener {
  constructor() {
    this.listeners = [];
    this.isOnline = navigator.onLine;
    
    // Add event listeners
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Listen for connection changes if supported
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      connection.addEventListener('change', this.handleConnectionChange.bind(this));
    }
  }

  /**
   * Add a listener for network status changes
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove a listener
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Notify all listeners of status change
   */
  notifyListeners(status) {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Network listener error:', error);
      }
    });
  }

  /**
   * Handle online event
   */
  async handleOnline() {
    console.log('Network: Device reports online');
    
    // Verify actual connectivity
    const hasConnectivity = await checkNetworkStatus();
    this.isOnline = hasConnectivity;
    
    this.notifyListeners({
      isOnline: hasConnectivity,
      type: 'online',
      timestamp: new Date().toISOString(),
      networkInfo: getNetworkInfo()
    });
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    console.log('Network: Device reports offline');
    this.isOnline = false;
    
    this.notifyListeners({
      isOnline: false,
      type: 'offline',
      timestamp: new Date().toISOString(),
      networkInfo: null
    });
  }

  /**
   * Handle connection change
   */
  handleConnectionChange() {
    console.log('Network: Connection changed');
    
    const networkInfo = getNetworkInfo();
    
    this.notifyListeners({
      isOnline: this.isOnline,
      type: 'change',
      timestamp: new Date().toISOString(),
      networkInfo
    });
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      networkInfo: getNetworkInfo(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cleanup listeners
   */
  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      connection.removeEventListener('change', this.handleConnectionChange);
    }
    
    this.listeners = [];
  }
}

/**
 * Retry mechanism for network requests
 */
export class NetworkRetryManager {
  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  /**
   * Execute a network request with retry logic
   */
  async executeWithRetry(requestFn, options = {}) {
    const { 
      maxRetries = this.maxRetries, 
      baseDelay = this.baseDelay,
      exponentialBackoff = true 
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay (exponential backoff or fixed)
        const delay = exponentialBackoff 
          ? baseDelay * Math.pow(2, attempt)
          : baseDelay;

        console.log(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, error);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

/**
 * Queue manager for offline requests
 */
export class OfflineRequestQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.storageKey = 'child_health_request_queue';
    
    // Load queue from storage
    this.loadQueue();
  }

  /**
   * Add request to queue
   */
  addRequest(request) {
    const queueItem = {
      id: this.generateId(),
      request,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    this.queue.push(queueItem);
    this.saveQueue();
    
    return queueItem.id;
  }

  /**
   * Process all queued requests
   */
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    
    try {
      // Check network connectivity first
      const hasNetwork = await checkNetworkStatus();
      if (!hasNetwork) {
        console.log('No network connectivity, skipping queue processing');
        return;
      }

      const results = [];
      
      for (let i = this.queue.length - 1; i >= 0; i--) {
        const queueItem = this.queue[i];
        
        try {
          const result = await this.executeRequest(queueItem);
          
          // Remove successful request from queue
          this.queue.splice(i, 1);
          results.push({ id: queueItem.id, success: true, result });
          
        } catch (error) {
          // Increment retry count
          queueItem.retryCount++;
          
          // Remove if max retries exceeded
          if (queueItem.retryCount >= 3) {
            this.queue.splice(i, 1);
            results.push({ id: queueItem.id, success: false, error: error.message });
          }
        }
      }
      
      this.saveQueue();
      return results;
      
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a queued request
   */
  async executeRequest(queueItem) {
    const { request } = queueItem;
    
    const response = await fetch(request.url, {
      method: request.method || 'GET',
      headers: request.headers || {},
      body: request.body || null
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      oldestRequest: this.queue.length > 0 ? this.queue[0].timestamp : null
    };
  }

  /**
   * Clear queue
   */
  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }

  /**
   * Save queue to localStorage
   */
  saveQueue() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save request queue:', error);
    }
  }

  /**
   * Load queue from localStorage
   */
  loadQueue() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.queue = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load request queue:', error);
      this.queue = [];
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global instances
export const networkStatusListener = new NetworkStatusListener();
export const networkRetryManager = new NetworkRetryManager();
export const offlineRequestQueue = new OfflineRequestQueue();

// Utility functions
export const isOnline = () => networkStatusListener.isOnline;
export const addNetworkListener = (callback) => networkStatusListener.addListener(callback);
export const removeNetworkListener = (callback) => networkStatusListener.removeListener(callback);
