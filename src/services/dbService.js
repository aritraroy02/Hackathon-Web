import { openDB } from 'idb';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'ChildHealthDB';
const DB_VERSION = 1;
const ENCRYPTION_KEY = 'child-health-encryption-key-2024';

// Store names
const STORES = {
  PENDING_RECORDS: 'pendingRecords',
  SYNCED_RECORDS: 'syncedRecords',
  FORM_DRAFTS: 'formDrafts',
  APP_SETTINGS: 'appSettings',
};

/**
 * Database service for offline data management
 */
class DBService {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize the database
   * @returns {Promise<IDBDatabase>} Database instance
   */
  async init() {
    if (this.db) return this.db;

    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Pending records store (not yet synced)
        if (!db.objectStoreNames.contains(STORES.PENDING_RECORDS)) {
          const pendingStore = db.createObjectStore(STORES.PENDING_RECORDS, {
            keyPath: 'id',
          });
          pendingStore.createIndex('timestamp', 'timestamp');
          pendingStore.createIndex('childName', 'childName');
        }

        // Synced records store (successfully uploaded)
        if (!db.objectStoreNames.contains(STORES.SYNCED_RECORDS)) {
          const syncedStore = db.createObjectStore(STORES.SYNCED_RECORDS, {
            keyPath: 'id',
          });
          syncedStore.createIndex('timestamp', 'timestamp');
          syncedStore.createIndex('childName', 'childName');
          syncedStore.createIndex('serverId', 'serverId');
        }

        // Form drafts store (auto-saved forms)
        if (!db.objectStoreNames.contains(STORES.FORM_DRAFTS)) {
          db.createObjectStore(STORES.FORM_DRAFTS, {
            keyPath: 'id',
          });
        }

        // App settings store
        if (!db.objectStoreNames.contains(STORES.APP_SETTINGS)) {
          db.createObjectStore(STORES.APP_SETTINGS, {
            keyPath: 'key',
          });
        }
      },
    });

    return this.db;
  }

  /**
   * Encrypt sensitive data before storage
   * @param {string} data - Data to encrypt
   * @returns {string} Encrypted data
   */
  encrypt(data) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
  }

  /**
   * Decrypt data after retrieval
   * @param {string} encryptedData - Encrypted data
   * @returns {any} Decrypted data
   */
  decrypt(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  /**
   * Generate unique Health ID
   * @returns {string} Unique health ID
   */
  generateHealthId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `CH-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Add a pending record (offline-first)
   * @param {Object} recordData - Child record data
   * @returns {Promise<Object>} Saved record with ID
   */
  async addPendingRecord(recordData) {
    await this.init();

    const record = {
      id: uuidv4(),
      healthId: this.generateHealthId(),
      ...recordData,
      timestamp: new Date().toISOString(),
      status: 'pending',
      encrypted: false,
    };

    // Encrypt sensitive fields
    if (record.photo) {
      record.photo = this.encrypt(record.photo);
      record.encrypted = true;
    }

    if (record.guardianName) {
      record.guardianName = this.encrypt(record.guardianName);
    }

    await this.db.add(STORES.PENDING_RECORDS, record);
    
    // Decrypt for return (keep original format)
    const returnRecord = { ...record };
    if (returnRecord.encrypted) {
      if (returnRecord.photo) {
        returnRecord.photo = this.decrypt(returnRecord.photo);
      }
      if (returnRecord.guardianName) {
        returnRecord.guardianName = this.decrypt(returnRecord.guardianName);
      }
    }

    return returnRecord;
  }

  /**
   * Get all pending records
   * @returns {Promise<Array>} Array of pending records
   */
  async getAllPendingRecords() {
    await this.init();
    const records = await this.db.getAll(STORES.PENDING_RECORDS);
    
    // Decrypt sensitive data
    return records.map(record => {
      if (record.encrypted) {
        const decrypted = { ...record };
        if (decrypted.photo) {
          decrypted.photo = this.decrypt(decrypted.photo);
        }
        if (decrypted.guardianName) {
          decrypted.guardianName = this.decrypt(decrypted.guardianName);
        }
        return decrypted;
      }
      return record;
    });
  }

  /**
   * Get all synced records
   * @returns {Promise<Array>} Array of synced records
   */
  async getAllSyncedRecords() {
    await this.init();
    const records = await this.db.getAll(STORES.SYNCED_RECORDS);
    
    // Decrypt sensitive data
    return records.map(record => {
      if (record.encrypted) {
        const decrypted = { ...record };
        if (decrypted.photo) {
          decrypted.photo = this.decrypt(decrypted.photo);
        }
        if (decrypted.guardianName) {
          decrypted.guardianName = this.decrypt(decrypted.guardianName);
        }
        return decrypted;
      }
      return record;
    });
  }

  /**
   * Move a record from pending to synced
   * @param {string} recordId - Record ID
   * @param {string} serverId - Server-assigned ID
   * @returns {Promise<void>}
   */
  async movePendingToSynced(recordId, serverId = null) {
    await this.init();
    
    const record = await this.db.get(STORES.PENDING_RECORDS, recordId);
    if (!record) {
      throw new Error('Record not found in pending store');
    }

    // Update record for synced store
    const syncedRecord = {
      ...record,
      status: 'synced',
      serverId: serverId || record.id,
      syncedAt: new Date().toISOString(),
    };

    // Add to synced store and remove from pending
    await this.db.add(STORES.SYNCED_RECORDS, syncedRecord);
    await this.db.delete(STORES.PENDING_RECORDS, recordId);
  }

  /**
   * Delete a pending record
   * @param {string} recordId - Record ID
   * @returns {Promise<void>}
   */
  async deletePendingRecord(recordId) {
    await this.init();
    await this.db.delete(STORES.PENDING_RECORDS, recordId);
  }

  /**
   * Save form draft
   * @param {Object} formData - Form data
   * @param {string} draftId - Draft ID (optional)
   * @returns {Promise<string>} Draft ID
   */
  async saveFormDraft(formData, draftId = null) {
    await this.init();
    
    const draft = {
      id: draftId || uuidv4(),
      data: formData,
      timestamp: new Date().toISOString(),
    };

    await this.db.put(STORES.FORM_DRAFTS, draft);
    return draft.id;
  }

  /**
   * Get form draft
   * @param {string} draftId - Draft ID
   * @returns {Promise<Object|null>} Form draft or null
   */
  async getFormDraft(draftId) {
    await this.init();
    return await this.db.get(STORES.FORM_DRAFTS, draftId);
  }

  /**
   * Get latest form draft
   * @returns {Promise<Object|null>} Latest form draft or null
   */
  async getLatestFormDraft() {
    await this.init();
    const drafts = await this.db.getAll(STORES.FORM_DRAFTS);
    
    if (drafts.length === 0) return null;
    
    // Sort by timestamp and return the latest
    drafts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return drafts[0];
  }

  /**
   * Delete form draft
   * @param {string} draftId - Draft ID
   * @returns {Promise<void>}
   */
  async deleteFormDraft(draftId) {
    await this.init();
    await this.db.delete(STORES.FORM_DRAFTS, draftId);
  }

  /**
   * Save app setting
   * @param {string} key - Setting key
   * @param {any} value - Setting value
   * @returns {Promise<void>}
   */
  async saveSetting(key, value) {
    await this.init();
    await this.db.put(STORES.APP_SETTINGS, { key, value });
  }

  /**
   * Get app setting
   * @param {string} key - Setting key
   * @param {any} defaultValue - Default value if not found
   * @returns {Promise<any>} Setting value
   */
  async getSetting(key, defaultValue = null) {
    await this.init();
    const setting = await this.db.get(STORES.APP_SETTINGS, key);
    return setting ? setting.value : defaultValue;
  }

  /**
   * Search records by child name
   * @param {string} query - Search query
   * @returns {Promise<Array>} Matching records
   */
  async searchRecords(query) {
    await this.init();
    
    const [pendingRecords, syncedRecords] = await Promise.all([
      this.getAllPendingRecords(),
      this.getAllSyncedRecords(),
    ]);

    const allRecords = [...pendingRecords, ...syncedRecords];
    
    if (!query.trim()) return allRecords;

    const lowercaseQuery = query.toLowerCase();
    return allRecords.filter(record => 
      record.childName?.toLowerCase().includes(lowercaseQuery) ||
      record.healthId?.toLowerCase().includes(lowercaseQuery) ||
      record.guardianName?.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Database statistics
   */
  async getStats() {
    await this.init();
    
    const [pendingCount, syncedCount, draftCount] = await Promise.all([
      this.db.count(STORES.PENDING_RECORDS),
      this.db.count(STORES.SYNCED_RECORDS),
      this.db.count(STORES.FORM_DRAFTS),
    ]);

    return {
      pendingRecords: pendingCount,
      syncedRecords: syncedCount,
      formDrafts: draftCount,
      totalRecords: pendingCount + syncedCount,
    };
  }

  /**
   * Clear all data (for testing or reset)
   * @returns {Promise<void>}
   */
  async clearAllData() {
    await this.init();
    
    await Promise.all([
      this.db.clear(STORES.PENDING_RECORDS),
      this.db.clear(STORES.SYNCED_RECORDS), 
      this.db.clear(STORES.FORM_DRAFTS),
      this.db.clear(STORES.APP_SETTINGS),
    ]);
  }
}

// Export singleton instance
export const dbService = new DBService();
