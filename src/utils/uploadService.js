/**
 * Backend API service for uploading data to MongoDB via Google Cloud
 */

// Configuration - Update these URLs after deployment
const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://child-health-backend-747316458447.us-central1.run.app';

// Note: MongoDB URI is now securely stored on the backend server
// The frontend no longer needs direct MongoDB access

/**
 * Upload a single child record to the backend
 * @param {Object} record - child record data
 * @param {Object} user - authenticated user data
 * @returns {Promise<Object>} upload result
 */
export const uploadChildRecord = async (record, user) => {
  try {
    // Prepare the record with upload metadata
    const recordWithUploadInfo = {
      ...record,
      uploadedBy: user.name || user.firstName + ' ' + user.lastName,
      uploaderUIN: user.uin,
      uploaderEmployeeId: user.employeeId,
      uploadedAt: new Date().toISOString(),
      isOffline: false, // Mark as uploaded
      uploadStatus: 'uploaded'
    };

    const response = await fetch(`${BACKEND_BASE_URL}/api/children`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token || 'demo-token'}` // In real app, use actual auth token
      },
      body: JSON.stringify(recordWithUploadInfo)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result,
      recordId: record.localId
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message,
      recordId: record.localId
    };
  }
};

/**
 * Upload multiple records in batch
 * @param {Array} records - array of child records
 * @param {Object} user - authenticated user data
 * @param {Function} onProgress - progress callback
 * @returns {Promise<Object>} batch upload result
 */
export const uploadRecordsBatch = async (records, user, onProgress = null) => {
  try {
    // Use the dedicated batch upload endpoint for better performance
    const response = await fetch(`${BACKEND_BASE_URL}/api/children/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token || 'demo-token'}`
      },
      body: JSON.stringify({
        records: records.map(record => ({
          ...record,
          uploadedBy: user.name || `${user.firstName} ${user.lastName}`,
          uploaderUIN: user.uin,
          uploaderEmployeeId: user.employeeId,
          uploadedAt: new Date().toISOString()
        }))
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Batch upload failed: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    
    // Simulate progress for UI feedback
    if (onProgress) {
      onProgress({
        completed: records.length,
        total: records.length,
        percentage: 100
      });
    }

    return {
      successful: result.data.successful.map(item => ({
        recordId: item.localId,
        data: item
      })),
      failed: result.data.failed.map(item => ({
        recordId: item.record.localId,
        error: item.error
      })),
      total: result.data.total
    };
  } catch (error) {
    console.error('Batch upload error:', error);
    
    // Fallback to individual uploads if batch fails
    console.log('Falling back to individual uploads...');
    return await uploadRecordsIndividually(records, user, onProgress);
  }
};

/**
 * Fallback: Upload records individually
 * @param {Array} records - array of child records
 * @param {Object} user - authenticated user data
 * @param {Function} onProgress - progress callback
 * @returns {Promise<Object>} upload result
 */
const uploadRecordsIndividually = async (records, user, onProgress = null) => {
  const results = {
    successful: [],
    failed: [],
    total: records.length
  };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    
    try {
      const result = await uploadChildRecord(record, user);
      
      if (result.success) {
        results.successful.push({
          recordId: record.localId,
          data: result.data
        });
      } else {
        results.failed.push({
          recordId: record.localId,
          error: result.error
        });
      }
      
      // Call progress callback
      if (onProgress) {
        onProgress({
          completed: i + 1,
          total: records.length,
          current: record,
          percentage: Math.round(((i + 1) / records.length) * 100)
        });
      }
      
      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      results.failed.push({
        recordId: record.localId,
        error: error.message
      });
    }
  }

  return results;
};

/**
 * Test backend connectivity
 * @returns {Promise<boolean>} true if backend is reachable
 */
export const testBackendConnection = async () => {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/health`, {
      method: 'GET',
      timeout: 5000
    });
    
    return response.ok;
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return false;
  }
};

/**
 * Get upload statistics from backend
 * @param {string} userUIN - user UIN
 * @returns {Promise<Object>} upload stats
 */
export const getUploadStats = async (userUIN) => {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/stats/${userUIN}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return await response.json();
    } else {
      return {
        totalUploaded: 0,
        lastUpload: null,
        error: 'Could not fetch stats'
      };
    }
  } catch (error) {
    console.error('Error fetching upload stats:', error);
    return {
      totalUploaded: 0,
      lastUpload: null,
      error: error.message
    };
  }
};

/**
 * Validate record before upload
 * @param {Object} record - child record
 * @returns {Object} validation result
 */
export const validateRecordForUpload = (record) => {
  const errors = [];
  const warnings = [];

  // Required fields validation
  const requiredFields = [
    'childName', 'age', 'gender', 'weight', 'height', 
    'guardianName', 'relation', 'phone', 'parentsConsent'
  ];

  requiredFields.forEach(field => {
    if (!record[field] || record[field] === '') {
      errors.push(`${field} is required`);
    }
  });

  // Data type validation
  if (record.age && isNaN(record.age)) {
    errors.push('Age must be a number');
  }

  if (record.weight && isNaN(record.weight)) {
    errors.push('Weight must be a number');
  }

  if (record.height && isNaN(record.height)) {
    errors.push('Height must be a number');
  }

  // Phone validation
  if (record.phone && !/^\d{10}$/.test(record.phone.replace(/\D/g, ''))) {
    warnings.push('Phone number should be 10 digits');
  }

  // Check if location is available
  if (!record.location) {
    warnings.push('Location data not available');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};
