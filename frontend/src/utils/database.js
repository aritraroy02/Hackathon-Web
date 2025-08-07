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
    
    // Add metadata
    const recordWithMeta = {
      ...record,
      id: record.id || generateId(),
      healthId: record.healthId || generateHealthId(),
      timestamp: record.timestamp || new Date().toISOString(),
      synced: false,
      isOfflineRecord: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
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
      resolve(recordWithMeta);
    };
    
    request.onerror = () => {
      console.error('Failed to save record to IndexedDB:', request.error);
      reject(new Error('Failed to save record'));
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
export const getUnsyncedRecords = async () => {
  try {
    // Skip entirely if logout is in progress
    if (window.__LOGOUT_IN_PROGRESS__) {
      console.log('⚠️ Skipping getUnsyncedRecords - logout in progress');
      return [];
    }
    
    if (!db) await initializeDatabase();
    
    return new Promise((resolve) => {
      try {
        const transaction = db.transaction([STORES.RECORDS], 'readonly');
        const store = transaction.objectStore(STORES.RECORDS);
        
        // Use store.getAll() instead of index to avoid index corruption issues
        const request = store.getAll();
        
        request.onsuccess = () => {
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
            resolve(unsyncedRecords);
          } catch (processingError) {
            console.error('Error processing records:', processingError);
            resolve([]);
          }
        };
        
        request.onerror = () => {
          console.error('Failed to get records from IndexedDB:', request.error);
          resolve([]);
        };
        
        transaction.onerror = () => {
          console.error('Transaction failed for records:', transaction.error);
          resolve([]);
        };
        
        // Add timeout to prevent hanging
        setTimeout(() => {
          console.warn('⚠️ Database query timeout, returning empty array');
          resolve([]);
        }, 5000);
        
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
  return updateRecord(id, {
    synced: true,
    syncedAt: new Date().toISOString(),
    serverResponse
  });
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
