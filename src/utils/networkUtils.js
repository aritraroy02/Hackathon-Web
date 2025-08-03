/**
 * Network utilities for connection status and online checking
 */

/**
 * Check if the device is online
 * @returns {boolean} - true if online, false if offline
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Check internet connectivity by making a test request
 * @returns {Promise<boolean>} - true if internet is available, false otherwise
 */
export const checkInternetConnectivity = async () => {
  try {
    // Try to fetch a small resource to test connectivity
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal
    });
    
          clearTimeout(timeoutHandler);
    return true;
  } catch (error) {
    console.log('Internet connectivity check failed:', error.message);
    return false;
  }
};

/**
 * Wait for internet connection
 * @param {number} timeout - timeout in milliseconds
 * @returns {Promise<boolean>} - resolves when online or timeout
 */
export const waitForConnection = (timeout = 30000) => {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve(true);
      return;
    }

    const checkConnection = () => {
      if (isOnline()) {
        resolve(true);
      }
    };

    const timeoutHandler = setTimeout(() => {
      window.removeEventListener('online', checkConnection);
      resolve(false);
    }, timeout);

    window.addEventListener('online', checkConnection);
  });
};

/**
 * Add network event listeners
 * @param {Function} onOnline - callback when going online
 * @param {Function} onOffline - callback when going offline
 * @returns {Function} cleanup function
 */
export const addNetworkListeners = (onOnline, onOffline) => {
  const handleOnline = () => {
    console.log('Network: Device is online');
    if (onOnline) onOnline();
  };

  const handleOffline = () => {
    console.log('Network: Device is offline');
    if (onOffline) onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};
