/**
 * Service Worker Registration and Management
 */

let swRegistration = null;

/**
 * Register the service worker
 */
export const registerSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Register the service worker
      swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', swRegistration);

      // Listen for updates
      swRegistration.addEventListener('updatefound', () => {
        const newWorker = swRegistration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content is available, prompt user to refresh
                showUpdateAvailableNotification();
              } else {
                // Content is cached for offline use
                console.log('Content is cached for offline use.');
              }
            }
          });
        }
      });

      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      return swRegistration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  } else {
    console.log('Service Worker is not supported');
    return null;
  }
};

/**
 * Unregister the service worker
 */
export const unregisterSW = async () => {
  if (swRegistration) {
    const result = await swRegistration.unregister();
    console.log('Service Worker unregistered:', result);
    return result;
  }
  return false;
};

/**
 * Check if there's an update available
 */
export const checkForUpdate = async () => {
  if (swRegistration) {
    try {
      await swRegistration.update();
      console.log('Checked for service worker update');
    } catch (error) {
      console.error('Failed to check for update:', error);
    }
  }
};

/**
 * Skip waiting and activate new service worker
 */
export const skipWaiting = () => {
  if (swRegistration && swRegistration.waiting) {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
};

/**
 * Show update available notification
 */
const showUpdateAvailableNotification = () => {
  // Create a simple notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #2196f3;
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    max-width: 300px;
    font-family: 'Roboto', sans-serif;
  `;
  
  notification.innerHTML = `
    <div style="margin-bottom: 12px;">
      <strong>Update Available</strong>
    </div>
    <div style="margin-bottom: 16px;">
      A new version of the app is available. Click update to get the latest features.
    </div>
    <div>
      <button onclick="this.parentElement.parentElement.updateApp()" 
              style="background: white; color: #2196f3; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 8px;">
        Update
      </button>
      <button onclick="this.parentElement.parentElement.remove()" 
              style="background: transparent; color: white; border: 1px solid white; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
        Later
      </button>
    </div>
  `;
  
  notification.updateApp = () => {
    skipWaiting();
    notification.remove();
  };
  
  document.body.appendChild(notification);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 10000);
};

/**
 * Send message to service worker
 */
export const sendMessageToSW = (message) => {
  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      if (event.data.error) {
        reject(event.data.error);
      } else {
        resolve(event.data);
      }
    };
    
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
    } else {
      reject(new Error('No service worker controller'));
    }
  });
};

/**
 * Request background sync
 */
export const requestBackgroundSync = async (tag) => {
  if (swRegistration && swRegistration.sync) {
    try {
      await swRegistration.sync.register(tag);
      console.log('Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('Background sync registration failed:', error);
      return false;
    }
  }
  return false;
};

/**
 * Check if the app is running standalone (installed as PWA)
 */
export const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

/**
 * Get cache storage usage
 */
export const getCacheStorageUsage = async () => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        quota: estimate.quota,
        usage: estimate.usage,
        available: estimate.quota - estimate.usage,
        usageDetails: estimate.usageDetails
      };
    } catch (error) {
      console.error('Failed to get storage estimate:', error);
      return null;
    }
  }
  return null;
};

/**
 * Clear all caches
 */
export const clearAllCaches = async () => {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      const deletePromises = cacheNames.map(cacheName => caches.delete(cacheName));
      await Promise.all(deletePromises);
      console.log('All caches cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear caches:', error);
      return false;
    }
  }
  return false;
};

/**
 * Cache important resources manually
 */
export const cacheImportantResources = async () => {
  if ('caches' in window) {
    try {
      const cache = await caches.open('child-health-pwa-v1');
      const urlsToCache = [
        '/',
        '/static/js/bundle.js',
        '/static/css/main.css',
        '/manifest.json',
        '/favicon.ico'
      ];
      
      await cache.addAll(urlsToCache);
      console.log('Important resources cached');
      return true;
    } catch (error) {
      console.error('Failed to cache important resources:', error);
      return false;
    }
  }
  return false;
};

const serviceWorkerUtils = {
  registerSW,
  unregisterSW,
  checkForUpdate,
  skipWaiting,
  sendMessageToSW,
  requestBackgroundSync,
  isStandalone,
  getCacheStorageUsage,
  clearAllCaches,
  cacheImportantResources
};

export default serviceWorkerUtils;
