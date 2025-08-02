/**
 * Geolocation utilities for fetching user location
 */

/**
 * Get current position using geolocation API
 * @param {Object} options - geolocation options
 * @returns {Promise<Object>} location object
 */
/**
 * Get current position using geolocation API
 * @param {Object} options - geolocation options
 * @returns {Promise<Object>} location object
 */
export const getCurrentLocation = (options = {}) => {
  const defaultOptions = {
    enableHighAccuracy: false, // Less strict for better compatibility
    timeout: 30000, // Longer timeout for localhost
    maximumAge: 60000 // 1 minute cache
  };

  const finalOptions = { ...defaultOptions, ...options };

  return new Promise((resolve, reject) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser. Please try using a modern browser like Chrome, Firefox, or Safari.'));
      return;
    }

    // Check for HTTPS requirement
    const isSecure = window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      reject(new Error('Location services require HTTPS. Please access this site via https:// or run it on localhost.'));
      return;
    }

    console.log('Requesting location with options:', finalOptions);

    // First check if we already have permission
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((permission) => {
        console.log('Current permission state:', permission.state);
        
        if (permission.state === 'denied') {
          reject(new Error('Location permission denied. Please enable location access in your browser settings:\n1. Click the location/lock icon in your address bar\n2. Set Location to "Allow"\n3. Refresh the page and try again'));
          return;
        }
        
        // Continue with location request
        requestLocation();
      }).catch(() => {
        // If permission query fails, try anyway
        requestLocation();
      });
    } else {
      // If permissions API not available, try anyway
      requestLocation();
    }

    function requestLocation() {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            console.log('Got position:', position);
            console.log(`Location accuracy: ${position.coords.accuracy}m`);
            
            // Always accept the position regardless of accuracy
            await processPosition(position, resolve, reject);
          } catch (error) {
            console.error('Error processing position:', error);
            reject(error);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          
          // Provide more helpful error messages with instructions
          let errorMessage = '';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. To fix this:\n• Click the location icon (🔒) in your address bar\n• Set Location to "Allow"\n• Refresh the page and try again\n• Or check your browser\'s privacy settings';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable. This may happen if:\n• GPS is disabled on your device\n• You\'re indoors with poor GPS signal\n• Location services are disabled\n• Try moving to a location with better signal';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please:\n• Check your internet connection\n• Enable location services on your device\n• Try again in a few seconds\n• Move to an area with better GPS signal';
              break;
            default:
              errorMessage = `Location error (${error.code}): ${error.message || 'Unknown error'}. Please enable location permissions and try again.`;
              break;
          }
          
          reject(new Error(errorMessage));
        },
        finalOptions
      );
    }
  });
};

async function processPosition(position, resolve, reject) {
  try {
    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date().toISOString()
    };

    // Try to get address using reverse geocoding, but don't fail if it doesn't work
    try {
      console.log('Attempting reverse geocoding...');
      const address = await reverseGeocode(location.latitude, location.longitude);
      location.address = address.display_name || '';
      location.city = address.city || address.town || address.village || '';
      location.state = address.state || '';
      console.log('Reverse geocoding successful:', address);
    } catch (geocodeError) {
      console.warn('Reverse geocoding failed, using coordinates:', geocodeError.message);
      // Don't fail the whole operation if geocoding fails
      location.address = `Lat: ${location.latitude.toFixed(6)}, Lng: ${location.longitude.toFixed(6)}`;
      location.city = 'Unknown';
      location.state = 'Unknown';
    }

    // Always resolve with location data, even if geocoding failed
    resolve(location);
  } catch (error) {
    console.error('Error processing position:', error);
    reject(error);
  }
}

/**
 * Reverse geocode coordinates to address
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<Object>} address object
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    console.log(`Reverse geocoding: ${latitude}, ${longitude}`);
    
    // Use a controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'ChildHealthPWA/1.0',
          'Accept': 'application/json'
        },
        signal: controller.signal,
        mode: 'cors' // Explicitly set CORS mode
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Geocoding service error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Geocoding response:', data);
    
    if (data.error) {
      throw new Error(`Geocoding API error: ${data.error}`);
    }

    if (!data.display_name) {
      throw new Error('No address found for these coordinates');
    }

    return {
      display_name: data.display_name,
      city: data.address?.city || data.address?.town || data.address?.village,
      state: data.address?.state,
      country: data.address?.country,
      postcode: data.address?.postcode,
      road: data.address?.road,
      house_number: data.address?.house_number
    };
  } catch (error) {
    console.warn('Reverse geocoding failed:', error.message);
    
    // If it's a timeout or network error, provide a more helpful message
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new Error('Address lookup timed out. Coordinates will be shown instead.');
    }
    
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Network error during address lookup. Check your internet connection.');
    }
    
    throw error;
  }
};

/**
 * Check if geolocation permission is granted
 * @returns {Promise<string>} permission state
 */
export const checkLocationPermission = async () => {
  if (!navigator.permissions) {
    return 'unknown';
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return permission.state; // 'granted', 'denied', or 'prompt'
  } catch (error) {
    console.warn('Could not check location permission:', error.message);
    return 'unknown';
  }
};

/**
 * Request location permission
 * @returns {Promise<boolean>} true if permission granted
 */
export const requestLocationPermission = async () => {
  try {
    await getCurrentLocation({ timeout: 5000 });
    return true;
  } catch (error) {
    console.warn('Location permission request failed:', error.message);
    return false;
  }
};

/**
 * Get location with fallback options
 * @param {Object} options - location options
 * @returns {Promise<Object>} location object
 */
export const getLocationWithFallback = async (options = {}) => {
  console.log('Starting location fetch with fallback...');
  
  // First, check permissions
  try {
    const permissionState = await checkLocationPermission();
    console.log('Permission state:', permissionState);
    
    if (permissionState === 'denied') {
      throw new Error('Location permission denied. Please enable location access in your browser settings.');
    }
  } catch (permissionError) {
    console.warn('Could not check permissions:', permissionError.message);
  }

  // Try different location strategies
  const strategies = [
    {
      name: 'High Accuracy GPS',
      options: {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
        ...options
      }
    },
    {
      name: 'Standard GPS',
      options: {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 300000, // 5 minutes
        ...options
      }
    },
    {
      name: 'Cached Location',
      options: {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000, // 10 minutes
        ...options
      }
    }
  ];

  let lastError;
  
  for (const strategy of strategies) {
    try {
      console.log(`Trying ${strategy.name}...`);
      const location = await getCurrentLocation(strategy.options);
      console.log(`${strategy.name} succeeded:`, location);
      return location;
    } catch (error) {
      console.warn(`${strategy.name} failed:`, error.message);
      lastError = error;
      
      // If permission was denied, don't try other strategies
      if (error.message.includes('denied')) {
        throw error;
      }
    }
  }

  // If all GPS strategies failed, try IP geolocation as last resort
  try {
    console.log('Trying IP geolocation as fallback...');
    const approxLocation = await getApproximateLocation();
    console.log('IP geolocation succeeded:', approxLocation);
    return approxLocation;
  } catch (ipError) {
    console.error('IP geolocation also failed:', ipError.message);
  }

  // If everything failed, throw the last GPS error
  throw new Error(`All location methods failed. Last error: ${lastError?.message || 'Unknown error'}`);
};

/**
 * Get approximate location using IP geolocation (fallback)
 * @returns {Promise<Object>} approximate location object
 */
export const getApproximateLocation = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      timeout: 5000
    });
    
    if (!response.ok) {
      throw new Error('IP geolocation service unavailable');
    }
    
    const data = await response.json();
    
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: 50000, // Very rough accuracy
      address: `${data.city}, ${data.region}, ${data.country_name}`,
      city: data.city,
      state: data.region,
      country: data.country_name,
      timestamp: new Date().toISOString(),
      isApproximate: true
    };
  } catch (error) {
    console.warn('IP geolocation failed:', error.message);
    throw new Error('Could not determine approximate location');
  }
};
