import { openDB } from 'idb';

const DB_NAME = 'ChildHealthDB';
const DB_VERSION = 1;
const STORE_NAME = 'children';

class StorageService {
  constructor() {
    this.db = null;
    this.initDB();
  }

  async initDB() {
    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Create the main store for child records
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { 
              keyPath: '_id',
              autoIncrement: false 
            });
            
            // Create indexes for efficient querying
            store.createIndex('healthId', 'healthId', { unique: false });
            store.createIndex('uploadedBy', 'uploadedBy', { unique: false });
            store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
            store.createIndex('city', ['location', 'city'], { unique: false });
            store.createIndex('state', ['location', 'state'], { unique: false });
            store.createIndex('gender', 'gender', { unique: false });
          }

          // Create metadata store for sync information
          if (!db.objectStoreNames.contains('metadata')) {
            db.createObjectStore('metadata', { keyPath: 'key' });
          }
        },
      });
      
      console.log('IndexedDB initialized successfully');
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  }

  async ensureDB() {
    if (!this.db) {
      await this.initDB();
    }
    return this.db;
  }

  // Store children data
  async storeChildren(children) {
    try {
      const db = await this.ensureDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      // Store each child record
      for (const child of children) {
        await store.put({
          ...child,
          _lastSync: new Date().toISOString()
        });
      }

      await tx.complete;
      
      // Update metadata
      await this.setMetadata('lastSync', new Date().toISOString());
      await this.setMetadata('totalRecords', children.length);
      
      console.log(`Stored ${children.length} child records in IndexedDB`);
      return true;
    } catch (error) {
      console.error('Failed to store children data:', error);
      return false;
    }
  }

  // Get all children data
  async getChildren(filters = {}) {
    try {
      const db = await this.ensureDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);

      let children = await store.getAll();

      // Apply filters
      if (filters.gender) {
        children = children.filter(child => child.gender === filters.gender);
      }
      
      if (filters.city) {
        children = children.filter(child => 
          child.location?.city?.toLowerCase().includes(filters.city.toLowerCase())
        );
      }
      
      if (filters.state) {
        children = children.filter(child => 
          child.location?.state?.toLowerCase().includes(filters.state.toLowerCase())
        );
      }
      
      if (filters.uploaderUIN) {
        children = children.filter(child => child.uploaderUIN === filters.uploaderUIN);
      }

      // Sort by upload date (newest first)
      children.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

      console.log(`Retrieved ${children.length} child records from IndexedDB`);
      return children;
    } catch (error) {
      console.error('Failed to get children data:', error);
      return [];
    }
  }

  // Get a specific child by ID
  async getChild(id) {
    try {
      const db = await this.ensureDB();
      const child = await db.get(STORE_NAME, id);
      return child || null;
    } catch (error) {
      console.error(`Failed to get child ${id}:`, error);
      return null;
    }
  }

  // Store a single child record
  async storeChild(child) {
    try {
      const db = await this.ensureDB();
      const result = await db.put(STORE_NAME, {
        ...child,
        _lastSync: new Date().toISOString()
      });
      
      console.log(`Stored child record ${child._id || child.healthId} in IndexedDB`);
      return result;
    } catch (error) {
      console.error('Failed to store child record:', error);
      return null;
    }
  }

  // Delete a child record
  async deleteChild(id) {
    try {
      const db = await this.ensureDB();
      await db.delete(STORE_NAME, id);
      console.log(`Deleted child record ${id} from IndexedDB`);
      return true;
    } catch (error) {
      console.error(`Failed to delete child ${id}:`, error);
      return false;
    }
  }

  // Get dashboard statistics from offline data
  async getDashboardStats() {
    try {
      const children = await this.getChildren();
      
      const stats = {
        totalChildren: children.length,
        averageAge: children.length > 0 
          ? (children.reduce((sum, child) => sum + (parseFloat(child.age) || 0), 0) / children.length).toFixed(1)
          : 0,
        genderDistribution: {
          Male: children.filter(child => child.gender === 'Male').length,
          Female: children.filter(child => child.gender === 'Female').length,
          Other: children.filter(child => child.gender === 'Other').length,
        },
        cityDistribution: {},
        stateDistribution: {},
        uploaderStats: {},
        recentUploads: children.slice(0, 10)
      };

      // Calculate distributions
      children.forEach(child => {
        const city = child.location?.city || 'Unknown';
        const state = child.location?.state || 'Unknown';
        const uploader = child.uploadedBy || 'Unknown';

        stats.cityDistribution[city] = (stats.cityDistribution[city] || 0) + 1;
        stats.stateDistribution[state] = (stats.stateDistribution[state] || 0) + 1;
        stats.uploaderStats[uploader] = (stats.uploaderStats[uploader] || 0) + 1;
      });

      return {
        success: true,
        data: stats,
        rawData: children,
        offline: true
      };
    } catch (error) {
      console.error('Failed to get dashboard stats from IndexedDB:', error);
      return null;
    }
  }

  // Metadata management
  async setMetadata(key, value) {
    try {
      const db = await this.ensureDB();
      await db.put('metadata', { key, value, timestamp: new Date().toISOString() });
      return true;
    } catch (error) {
      console.error(`Failed to set metadata ${key}:`, error);
      return false;
    }
  }

  async getMetadata(key) {
    try {
      const db = await this.ensureDB();
      const result = await db.get('metadata', key);
      return result?.value || null;
    } catch (error) {
      console.error(`Failed to get metadata ${key}:`, error);
      return null;
    }
  }

  // Clear all data
  async clearAll() {
    try {
      const db = await this.ensureDB();
      
      // Clear children data
      const tx1 = db.transaction(STORE_NAME, 'readwrite');
      await tx1.objectStore(STORE_NAME).clear();
      await tx1.complete;
      
      // Clear metadata
      const tx2 = db.transaction('metadata', 'readwrite');
      await tx2.objectStore('metadata').clear();
      await tx2.complete;
      
      console.log('Cleared all IndexedDB data');
      return true;
    } catch (error) {
      console.error('Failed to clear IndexedDB data:', error);
      return false;
    }
  }

  // Get storage usage statistics
  async getStorageStats() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage,
          available: estimate.quota,
          percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2)
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return null;
    }
  }
}

// Create and export a singleton instance
const storageService = new StorageService();
export default storageService;
