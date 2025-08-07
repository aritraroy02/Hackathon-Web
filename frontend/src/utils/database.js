/**
 * Database utilities for Child Health PWA
 * Offline-first version - uses IndexedDB for local storage
 */

import CryptoJS from 'crypto-js';

const DB_NAME = 'ChildHealthPWA';
const DB_VERSION = 1;
const STORES = {
  RECORDS: 'child_records',
  SETTINGS: 'app_settings',
  SYNC_QUEUE: 'sync_queue'
};

// Encryption key - in production, this should be more secure
const ENCRYPTION_KEY = 'child-health-pwa-key-2024';

let db = null;

/**
 * Initialize IndexedDB database
 */
export const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log('Database initialized successfully');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Create records store
      if (!database.objectStoreNames.contains(STORES.RECORDS)) {
        const recordsStore = database.createObjectStore(STORES.RECORDS, { 
          keyPath: 'id' 
        });
        recordsStore.createIndex('timestamp', 'timestamp', { unique: false });
        recordsStore.createIndex('synced', 'synced', { unique: false });
        recordsStore.createIndex('childName', 'childName', { unique: false });
      }

      // Create settings store
      if (!database.objectStoreNames.contains(STORES.SETTINGS)) {
        database.createObjectStore(STORES.SETTINGS, { 
          keyPath: 'key' 
        });
      }

      // Create sync queue store
      if (!database.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = database.createObjectStore(STORES.SYNC_QUEUE, { 
          keyPath: 'id' 
        });
        syncStore.createIndex('priority', 'priority', { unique: false });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

/**
 * Encrypt data before storing
 */
const encryptData = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return data;
  }
};

/**
 * Decrypt data after retrieving
 */
const decryptData = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedData;
  }
};

/**
 * Save a child health record to IndexedDB
 */
export const saveRecord = async (record) => {
  try {
    return await saveRecordToIndexedDB(record);
  } catch (error) {
    console.error('Error saving record:', error);
    throw error;
  }
};

/**
 * Save record to IndexedDB (offline storage)
 */
const saveRecordToIndexedDB = async (record) => {
  if (!db) await initializeDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.RECORDS], 'readwrite');
    const store = transaction.objectStore(STORES.RECORDS);
    
    // First check if a record with this healthId already exists
    const healthId = record.healthId || generateHealthId(record.childName, record.timestamp);
    
    // Get all records to check for duplicates
    const getAllRequest = store.getAll();
    
    getAllRequest.onsuccess = () => {
      const existingRecords = getAllRequest.result || [];
      const existingRecord = existingRecords.find(r => r.healthId === healthId);
      
      // If record exists, update it instead of creating a new one
      const recordWithMeta = {
        ...(existingRecord || {}),
        ...record,
        id: existingRecord?.id || record.id || generateId(),
        healthId: healthId,
        timestamp: record.timestamp || existingRecord?.timestamp || new Date().toISOString(),
        synced: record.synced || false,
        isOfflineRecord: true,
        createdAt: existingRecord?.createdAt || record.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    
      // Ensure timestamp is valid
      if (!recordWithMeta.timestamp || isNaN(new Date(recordWithMeta.timestamp).getTime())) {
        recordWithMeta.timestamp = new Date().toISOString();
      }
      
      // Encrypt sensitive data
      const encryptedRecord = {
        ...recordWithMeta,
        encryptedData: encryptData({
          childName: recordWithMeta.childName,
          guardianName: recordWithMeta.guardianName,
          photo: recordWithMeta.photo,
          malnutritionSigns: recordWithMeta.malnutritionSigns,
          recentIllnesses: recordWithMeta.recentIllnesses
        })
      };
      
      // Remove sensitive data from main object
      delete encryptedRecord.childName;
      delete encryptedRecord.guardianName;
      delete encryptedRecord.photo;
      delete encryptedRecord.malnutritionSigns;
      delete encryptedRecord.recentIllnesses;
      
      const request = store.put(encryptedRecord);
      
      request.onsuccess = () => {
        console.log('Record saved to IndexedDB:', recordWithMeta.id);
        // Clear cache when new record is saved
        unsyncedRecordsCache = null;
        cacheTimestamp = 0;
        resolve(recordWithMeta);
      };
      
      request.onerror = () => {
        console.error('Failed to save record to IndexedDB:', request.error);
        reject(new Error('Failed to save record'));
      };
    };
    
    getAllRequest.onerror = () => {
      console.error('Failed to get records for duplicate check:', getAllRequest.error);
      reject(new Error('Failed to check for duplicates'));
    };
  });
};

/**
 * Get all records from IndexedDB
 */
export const getAllRecords = async () => {
  try {
    return await getRecordsFromIndexedDB();
  } catch (error) {
    console.error('Error getting records:', error);
    return [];
  }
};

/**
 * Get records from IndexedDB
 */
const getRecordsFromIndexedDB = async () => {
  if (!db) await initializeDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.RECORDS], 'readonly');
    const store = transaction.objectStore(STORES.RECORDS);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const records = request.result.map(record => {
        // Decrypt sensitive data
        if (record.encryptedData) {
          const decryptedData = decryptData(record.encryptedData);
          return {
            ...record,
            ...decryptedData
          };
        }
        return record;
      });
      
      resolve(records);
    };
    
    request.onerror = () => {
      console.error('Failed to get records from IndexedDB:', request.error);
      reject(new Error('Failed to get records'));
    };
  });
};

/**
 * Get a specific record by ID
 */
export const getRecord = async (id) => {
  if (!db) await initializeDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.RECORDS], 'readonly');
    const store = transaction.objectStore(STORES.RECORDS);
    const request = store.get(id);
    
    request.onsuccess = () => {
      const record = request.result;
      if (record && record.encryptedData) {
        const decryptedData = decryptData(record.encryptedData);
        resolve({
          ...record,
          ...decryptedData
        });
      } else {
        resolve(record);
      }
    };
    
    request.onerror = () => {
      console.error('Failed to get record:', request.error);
      reject(new Error('Failed to get record'));
    };
  });
};

/**
 * Update a record
 */
export const updateRecord = async (id, updates) => {
  if (!db) await initializeDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.RECORDS], 'readwrite');
    const store = transaction.objectStore(STORES.RECORDS);
    
    // First get the existing record
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const existingRecord = getRequest.result;
      if (!existingRecord) {
        reject(new Error('Record not found'));
        return;
      }
      
      // Decrypt existing data
      let existingData = {};
      if (existingRecord.encryptedData) {
        existingData = decryptData(existingRecord.encryptedData);
      }
      
      // Merge updates
      const updatedRecord = {
        ...existingRecord,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // Encrypt sensitive data
      const sensitiveData = {
        childName: updatedRecord.childName || existingData.childName,
        guardianName: updatedRecord.guardianName || existingData.guardianName,
        photo: updatedRecord.photo || existingData.photo,
        malnutritionSigns: updatedRecord.malnutritionSigns || existingData.malnutritionSigns,
        recentIllnesses: updatedRecord.recentIllnesses || existingData.recentIllnesses
      };
      
      updatedRecord.encryptedData = encryptData(sensitiveData);
      
      // Remove sensitive data from main object
      delete updatedRecord.childName;
      delete updatedRecord.guardianName;
      delete updatedRecord.photo;
      delete updatedRecord.malnutritionSigns;
      delete updatedRecord.recentIllnesses;
      
      const putRequest = store.put(updatedRecord);
      
      putRequest.onsuccess = () => {
        resolve({
          ...updatedRecord,
          ...sensitiveData
        });
      };
      
      putRequest.onerror = () => {
        reject(new Error('Failed to update record'));
      };
    };
    
    getRequest.onerror = () => {
      reject(new Error('Failed to get record for update'));
    };
  });
};

/**
 * Delete a record
 */
export const deleteRecord = async (id) => {
  if (!db) await initializeDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.RECORDS], 'readwrite');
    const store = transaction.objectStore(STORES.RECORDS);
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve(true);
    };
    
    request.onerror = () => {
      reject(new Error('Failed to delete record'));
    };
  });
};

/**
 * Get unsynced records
 */
// Cache for unsynced records to prevent repeated queries
let unsyncedRecordsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5000; // 5 seconds

export const getUnsyncedRecords = async () => {
  try {
    // Skip entirely if logout is in progress
    if (window.__LOGOUT_IN_PROGRESS__) {
      console.log('⚠️ Skipping getUnsyncedRecords - logout in progress');
      return [];
    }
    
    // Return cached result if still valid
    const now = Date.now();
    if (unsyncedRecordsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('📋 Returning cached unsynced records');
      return unsyncedRecordsCache;
    }
    
    // Run cleanup before getting unsynced records
    await cleanupDatabase();
    
    if (!db) await initializeDatabase();
    
    return new Promise((resolve) => {
      try {
        const transaction = db.transaction([STORES.RECORDS], 'readonly');
        const store = transaction.objectStore(STORES.RECORDS);
        
        // Use store.getAll() instead of index to avoid index corruption issues
        const request = store.getAll();
        

        
        request.onerror = () => {
          console.error('Failed to get records from IndexedDB:', request.error);
          resolve([]);
        };
        
        transaction.onerror = () => {
          console.error('Transaction failed for records:', transaction.error);
          resolve([]);
        };
        
        // Add timeout to prevent hanging - only if request is still pending
        const timeoutId = setTimeout(() => {
          if (request.readyState === 'pending') {
            console.warn('⚠️ Database query timeout, returning empty array');
            resolve([]);
          }
        }, 3000); // Reduced timeout to 3 seconds
        
        // Clear timeout if request completes
        request.onsuccess = () => {
          clearTimeout(timeoutId);
          try {
            const allRecords = request.result || [];
            const unsyncedRecords = [];
            
            // Filter for unsynced records manually
            for (const record of allRecords) {
              // Skip if logout started during processing
              if (window.__LOGOUT_IN_PROGRESS__) {
                console.log('⚠️ Logout detected during processing, stopping');
                resolve([]);
                return;
              }
              
              // Check if record is not synced
              if (record.synced !== true) {
                try {
                  if (record.encryptedData) {
                    const decryptedData = decryptData(record.encryptedData);
                    unsyncedRecords.push({
                      ...record,
                      ...decryptedData
                    });
                  } else {
                    unsyncedRecords.push(record);
                  }
                } catch (decryptError) {
                  console.warn('Failed to decrypt record, skipping:', decryptError);
                  // Still add record without decryption if needed for basic operations
                  unsyncedRecords.push(record);
                }
              }
            }
            
            console.log(`✅ Found ${unsyncedRecords.length} unsynced records`);
            // Cache the result
            unsyncedRecordsCache = unsyncedRecords;
            cacheTimestamp = Date.now();
            resolve(unsyncedRecords);
          } catch (processingError) {
            console.error('Error processing records:', processingError);
            resolve([]);
          }
        };
        
      } catch (setupError) {
        console.error('Error setting up records query:', setupError);
        resolve([]);
      }
    });
  } catch (initError) {
    console.error('Failed to initialize database for unsynced records:', initError);
    return [];
  }
};
/**
 * Mark record as synced
 */
export const markRecordSynced = async (id, serverResponse = null) => {
  try {
    // Clear cache when marking record as synced
    unsyncedRecordsCache = null;
    cacheTimestamp = 0;
    
    // Get the record first to check its healthId
    const record = await getRecord(id);
    if (!record) {
      throw new Error('Record not found');
    }
    
    // Check for any other records with the same healthId
    const allRecords = await getAllRecords();
    const duplicates = allRecords.filter(r => 
      r.healthId === record.healthId && 
      r.id !== record.id
    );
    
    // Delete any duplicate records
    for (const duplicate of duplicates) {
      console.log(`🗑️ Removing duplicate record: ${duplicate.id}`);
      await deleteRecord(duplicate.id);
    }
    
    // Update the original record
    return await updateRecord(id, {
      synced: true,
      syncedAt: new Date().toISOString(),
      serverResponse,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to mark record as synced:', error);
    throw error;
  }
};

/**
 * Save app settings
 */
export const saveSettings = async (settings) => {
  if (!db) await initializeDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.SETTINGS], 'readwrite');
    const store = transaction.objectStore(STORES.SETTINGS);
    
    const settingsRecord = {
      key: 'app_settings',
      value: settings,
      updatedAt: new Date().toISOString()
    };
    
    const request = store.put(settingsRecord);
    
    request.onsuccess = () => {
      resolve(settings);
    };
    
    request.onerror = () => {
      reject(new Error('Failed to save settings'));
    };
  });
};

/**
 * Get app settings
 */
export const getSettings = async () => {
  if (!db) await initializeDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.SETTINGS], 'readonly');
    const store = transaction.objectStore(STORES.SETTINGS);
    const request = store.get('app_settings');
    
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.value : null);
    };
    
    request.onerror = () => {
      reject(new Error('Failed to get settings'));
    };
  });
};

/**
 * Clear all data
 */
export const clearAllData = async () => {
  if (!db) await initializeDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.RECORDS, STORES.SETTINGS, STORES.SYNC_QUEUE], 'readwrite');
    
    let completed = 0;
    const stores = [STORES.RECORDS, STORES.SETTINGS, STORES.SYNC_QUEUE];
    
    stores.forEach(storeName => {
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        completed++;
        if (completed === stores.length) {
          resolve(true);
        }
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to clear ${storeName}`));
      };
    });
  });
};

/**
 * Generate unique ID
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate Health ID for child
 */
export const generateHealthId = (childName, timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const nameInitials = childName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('')
    .substring(0, 3);
  
  const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
  
  return `CH${year}${month}${day}${nameInitials}${randomSuffix}`;
};

/**
 * Get database stats
 */
export const getDatabaseStats = async () => {
  if (!db) await initializeDatabase();
  
  const totalRecords = await getAllRecords();
  const unsyncedRecords = await getUnsyncedRecords();
  
  return {
    totalRecords: totalRecords.length,
    syncedRecords: totalRecords.length - unsyncedRecords.length,
    unsyncedRecords: unsyncedRecords.length,
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Clean up duplicate records and fix invalid timestamps
 */
export const cleanupDatabase = async () => {
  if (!db) await initializeDatabase();
  
  try {
    console.log('🧹 Starting database cleanup...');
    
    const allRecords = await getAllRecords();
    const recordsToUpdate = [];
    const recordsToDelete = [];
    
    // Group records by healthId to find duplicates
    const recordsByHealthId = {};
    
    for (const record of allRecords) {
      if (!record.healthId) continue;
      
      if (!recordsByHealthId[record.healthId]) {
        recordsByHealthId[record.healthId] = [];
      }
      recordsByHealthId[record.healthId].push(record);
    }
    
    // Process each group of records
    for (const [healthId, records] of Object.entries(recordsByHealthId)) {
      if (records.length > 1) {
        console.log(`Found ${records.length} duplicate records for healthId: ${healthId}`);
        
        // Sort records by priority:
        // 1. Synced records first
        // 2. Most recent timestamp
        // 3. Has valid date
        const sortedRecords = records.sort((a, b) => {
          // Synced records take precedence
          if (a.synced && !b.synced) return -1;
          if (!a.synced && b.synced) return 1;
          
          // Then check for valid dates
          const dateA = new Date(a.timestamp || a.createdAt || 0);
          const dateB = new Date(b.timestamp || b.createdAt || 0);
          const isValidA = !isNaN(dateA.getTime());
          const isValidB = !isNaN(dateB.getTime());
          
          if (isValidA && !isValidB) return -1;
          if (!isValidA && isValidB) return 1;
          
          // Finally sort by timestamp
          return dateB.getTime() - dateA.getTime();
        });
        
        // Keep the first (highest priority) record, mark others for deletion
        const keepRecord = sortedRecords[0];
        const deleteRecords = sortedRecords.slice(1);
        
        // Fix timestamp if invalid
        if (!keepRecord.timestamp || isNaN(new Date(keepRecord.timestamp).getTime())) {
          keepRecord.timestamp = keepRecord.createdAt || new Date().toISOString();
          recordsToUpdate.push(keepRecord);
        }
        
        // Mark duplicates for deletion
        recordsToDelete.push(...deleteRecords.map(r => r.id));
      } else {
        // Single record - just fix timestamp if needed
        const record = records[0];
        if (!record.timestamp || isNaN(new Date(record.timestamp).getTime())) {
          record.timestamp = record.createdAt || new Date().toISOString();
          recordsToUpdate.push(record);
        }
      }
    }
    
    // Update records with fixed timestamps
    for (const record of recordsToUpdate) {
      await updateRecord(record.id, {
        timestamp: record.timestamp,
        updatedAt: new Date().toISOString()
      });
    }
    
    // Delete duplicate records
    for (const recordId of recordsToDelete) {
      await deleteRecord(recordId);
    }
    
    console.log(`✅ Database cleanup completed: ${recordsToUpdate.length} records updated, ${recordsToDelete.length} duplicates removed`);
    
    return {
      success: true,
      updatedCount: recordsToUpdate.length,
      deletedCount: recordsToDelete.length
    };
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Recover from corrupted database by deleting and recreating it
 */
export const recoverDatabase = async () => {
  try {
    console.log('🛠️ Starting database recovery...');
    
    // Close existing database connection
    if (db) {
      db.close();
      db = null;
    }
    
    // Delete the corrupted database
    await new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
      deleteRequest.onsuccess = () => {
        console.log('🗑️ Deleted corrupted database');
        resolve();
      };
      deleteRequest.onerror = () => {
        console.warn('⚠️ Failed to delete database, continuing anyway');
        resolve(); // Don't fail the recovery
      };
      deleteRequest.onblocked = () => {
        console.warn('⚠️ Database deletion blocked, continuing anyway');
        resolve();
      };
    });
    
    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Reinitialize the database
    await initializeDatabase();
    
    console.log('✅ Database recovery completed successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Database recovery failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clear unsynced records cache
 */
export const clearUnsyncedRecordsCache = () => {
  unsyncedRecordsCache = null;
  cacheTimestamp = 0;
  console.log('🗑️ Cleared unsynced records cache');
};

/**
 * Clear all user data from IndexedDB and localStorage
 * This is used for secure logout
 */
export const clearAllUserData = async () => {
  try {
    console.log('🔄 Starting user data cleanup...');
    
    // Clear IndexedDB data with recovery fallback
    try {
      if (!db) await initializeDatabase();
      
      const transaction = db.transaction([STORES.RECORDS, STORES.SETTINGS, STORES.SYNC_QUEUE], 'readwrite');
      
      // Clear all stores with timeout protection
      await Promise.all([
        new Promise((resolve, reject) => {
          const request = transaction.objectStore(STORES.RECORDS).clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
          
          // Add timeout
          setTimeout(() => {
            if (request.readyState === 'pending') {
              console.warn('⚠️ Records clear timeout, continuing');
              resolve();
            }
          }, 3000);
        }),
        new Promise((resolve, reject) => {
          const request = transaction.objectStore(STORES.SETTINGS).clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
          
          // Add timeout
          setTimeout(() => {
            if (request.readyState === 'pending') {
              console.warn('⚠️ Settings clear timeout, continuing');
              resolve();
            }
          }, 3000);
        }),
        new Promise((resolve, reject) => {
          const request = transaction.objectStore(STORES.SYNC_QUEUE).clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
          
          // Add timeout
          setTimeout(() => {
            if (request.readyState === 'pending') {
              console.warn('⚠️ Sync queue clear timeout, continuing');
              resolve();
            }
          }, 3000);
        })
      ]);
      
      console.log('✅ IndexedDB cleared successfully');
    } catch (dbError) {
      console.warn('⚠️ Database clear failed, attempting recovery:', dbError.message);
      // If database operations fail, try recovery
      await recoverDatabase();
    }

    // Clear localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('child-health-') ||
        key.startsWith('auth') ||
        key === 'savedRecords' ||
        key === 'userSettings' ||
        key === 'offlineRecords' ||
        key === 'pendingUploads'
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Clear sessionStorage
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
        key.startsWith('child-health-') ||
        key.startsWith('auth') ||
        key === 'userSession' ||
        key === 'tempData'
      )) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));

    console.log('✅ All user data cleared successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to clear user data:', error);
    return { success: false, error: error.message };
  }
};
