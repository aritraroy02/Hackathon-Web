/**
 * Backend API service for uploading data to MongoDB via Google Cloud
 */

// Configuration - Use Google Cloud backend with full CORS support
const BACKEND_BASE_URL = 'https://child-health-backend-747316458447.us-central1.run.app';

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
    // Validate user object
    if (!user) {
      throw new Error('User authentication required for upload');
    }

    // Prepare the record with upload metadata
    const cleanRecord = { ...record };
    delete cleanRecord._id; // Remove IndexedDB _id
    delete cleanRecord.id; // Remove any id field
    delete cleanRecord.__v; // Remove MongoDB version field
    
    const recordWithUploadInfo = {
      ...cleanRecord,
      uploadedBy: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
      uploaderUIN: user.uin || user.uinNumber || 'UNKNOWN_UIN',
      uploaderEmployeeId: user.employeeId || 'UNKNOWN_EMP',
      uploadedAt: new Date().toISOString(),
      isOffline: false, // Mark as uploaded
      uploadStatus: 'uploaded'
    };

    console.log('Uploading record to:', `${BACKEND_BASE_URL}/api/children`);
    console.log('User data:', {
      name: user.name,
      uin: user.uin || user.uinNumber,
      employeeId: user.employeeId,
      hasToken: !!user.token
    });
    console.log('Record data:', JSON.stringify(recordWithUploadInfo, null, 2));

    const response = await fetch(`${BACKEND_BASE_URL}/api/children`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token || 'demo-token'}` // In real app, use actual auth token
      },
      body: JSON.stringify(recordWithUploadInfo)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Upload error response:', errorData);
      throw new Error(`Upload failed: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log('Upload success:', result);
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
  console.log('🚀 Starting batch upload...');
  console.log('Records count:', records.length);
  console.log('User data:', {
    name: user?.name,
    uin: user?.uin || user?.uinNumber,
    employeeId: user?.employeeId,
    hasToken: !!user?.token
  });

  try {
    // Validate inputs
    if (!records || records.length === 0) {
      throw new Error('No records to upload');
    }

    if (!user) {
      throw new Error('User authentication required for upload');
    }

    const recordsWithMetadata = records.map(record => {
      // Remove any fields that might cause MongoDB validation issues
      const cleanRecord = { ...record };
      delete cleanRecord._id; // Remove IndexedDB _id
      delete cleanRecord.id; // Remove any id field
      delete cleanRecord.__v; // Remove MongoDB version field
      
      return {
        ...cleanRecord,
        uploadedBy: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
        uploaderUIN: user.uin || user.uinNumber || 'UNKNOWN_UIN',
        uploaderEmployeeId: user.employeeId || 'UNKNOWN_EMP',
        uploadedAt: new Date().toISOString()
      };
    });

    console.log('First record with metadata:', recordsWithMetadata[0]);

    // Use the dedicated batch upload endpoint for better performance
    const response = await fetch(`${BACKEND_BASE_URL}/api/children/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token || 'demo-token'}`
      },
      body: JSON.stringify({
        records: recordsWithMetadata
      })
    });

    console.log('Batch upload response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Batch upload error response:', errorData);
      throw new Error(`Batch upload failed: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log('Batch upload result:', result);
    
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
 * Fetch user-specific records from MongoDB
 * @param {Object} user - authenticated user data
 * @param {number} page - page number for pagination
 * @param {number} limit - records per page
 * @returns {Promise<Object>} user records from MongoDB
 */
export const fetchUserRecords = async (user, page = 1, limit = 50) => {
  try {
    if (!user || !user.uin && !user.uinNumber) {
      throw new Error('User UIN is required to fetch records');
    }

    const userUIN = user.uin || user.uinNumber;
    const response = await fetch(`${BACKEND_BASE_URL}/api/children?uploaderUIN=${userUIN}&page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token || 'demo-token'}`
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to fetch records: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data || [],
      pagination: result.pagination || { current: 1, pages: 1, total: 0 }
    };
  } catch (error) {
    console.error('Error fetching user records:', error);
    return {
      success: false,
      error: error.message,
      data: [],
      pagination: { current: 1, pages: 1, total: 0 }
    };
  }
};

/**
 * Auto-sync offline records when user comes online
 * @param {Object} user - authenticated user data
 * @param {Function} onProgress - progress callback
 * @returns {Promise<Object>} sync result
 */
export const autoSyncOfflineRecords = async (user, onProgress = null) => {
  try {
    if (!user) {
      throw new Error('User authentication required for auto-sync');
    }

    // Import database functions dynamically to avoid circular dependency
    const { getAllRecords, markRecordSynced, getUnsyncedRecords } = await import('./database');
    
    // Get unsynced records only
    const unsyncedRecords = await getUnsyncedRecords();
    
    if (unsyncedRecords.length === 0) {
      console.log('✅ No offline records to sync');
      return { success: true, syncedCount: 0, failedCount: 0 };
    }

    console.log(`🔄 Auto-syncing ${unsyncedRecords.length} offline records...`);

    // Upload records in batch
    const result = await uploadRecordsBatch(unsyncedRecords, user, onProgress);
    
    // Mark successfully uploaded records as synced
    for (const successfulRecord of result.successful) {
      try {
        await markRecordSynced(successfulRecord.recordId);
      } catch (error) {
        console.error('Failed to mark record as synced:', error);
      }
    }

    console.log(`✅ Auto-sync completed: ${result.successful.length} synced, ${result.failed.length} failed`);
    
    return {
      success: true,
      syncedCount: result.successful.length,
      failedCount: result.failed.length,
      details: result
    };
  } catch (error) {
    console.error('❌ Auto-sync failed:', error);
    return {
      success: false,
      error: error.message,
      syncedCount: 0,
      failedCount: 0
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
