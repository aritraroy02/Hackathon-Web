import { openDB, encrypt, decrypt, saveRecord, getRecords, updateRecord, deleteRecord } from '../utils/database';

// Mock IndexedDB
const mockDB = {
  transaction: jest.fn(),
  objectStore: jest.fn(),
  add: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

const mockTransaction = {
  objectStore: jest.fn(() => ({
    add: jest.fn().mockResolvedValue({}),
    get: jest.fn().mockResolvedValue({}),
    getAll: jest.fn().mockResolvedValue([]),
    put: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  })),
};

global.indexedDB = {
  open: jest.fn().mockImplementation(() => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      ...mockDB,
      transaction: jest.fn(() => mockTransaction),
    },
  })),
};

describe('Database Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Encryption/Decryption', () => {
    test('encrypts and decrypts data correctly', () => {
      const originalData = 'sensitive health data';
      const encrypted = encrypt(originalData);
      const decrypted = decrypt(encrypted);

      expect(encrypted).not.toBe(originalData);
      expect(decrypted).toBe(originalData);
    });

    test('handles empty strings', () => {
      const encrypted = encrypt('');
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe('');
    });

    test('handles JSON objects', () => {
      const originalData = { name: 'John', age: 5, health: 'good' };
      const jsonString = JSON.stringify(originalData);
      const encrypted = encrypt(jsonString);
      const decrypted = decrypt(encrypted);
      const parsedData = JSON.parse(decrypted);

      expect(parsedData).toEqual(originalData);
    });
  });

  describe('Database Operations', () => {
    test('saves record successfully', async () => {
      const testRecord = {
        childName: 'Test Child',
        dateOfBirth: '2022-01-01',
        gender: 'Male',
        weight: 12,
        height: 85
      };

      // Mock successful save
      const mockStore = {
        add: jest.fn().mockResolvedValue('test-id-123'),
      };
      
      mockTransaction.objectStore.mockReturnValue(mockStore);

      const result = await saveRecord(testRecord);

      expect(result).toBeDefined();
      expect(mockStore.add).toHaveBeenCalled();
    });

    test('retrieves all records', async () => {
      const mockRecords = [
        { id: '1', childName: 'Child 1', encrypted: true },
        { id: '2', childName: 'Child 2', encrypted: true },
      ];

      const mockStore = {
        getAll: jest.fn().mockResolvedValue(mockRecords),
      };
      
      mockTransaction.objectStore.mockReturnValue(mockStore);

      const records = await getRecords();

      expect(Array.isArray(records)).toBe(true);
      expect(mockStore.getAll).toHaveBeenCalled();
    });

    test('updates existing record', async () => {
      const recordId = 'test-id-123';
      const updatedData = {
        childName: 'Updated Child',
        weight: 15,
      };

      const mockStore = {
        put: jest.fn().mockResolvedValue({}),
      };
      
      mockTransaction.objectStore.mockReturnValue(mockStore);

      await updateRecord(recordId, updatedData);

      expect(mockStore.put).toHaveBeenCalled();
    });

    test('deletes record', async () => {
      const recordId = 'test-id-123';

      const mockStore = {
        delete: jest.fn().mockResolvedValue({}),
      };
      
      mockTransaction.objectStore.mockReturnValue(mockStore);

      await deleteRecord(recordId);

      expect(mockStore.delete).toHaveBeenCalledWith(recordId);
    });

    test('handles database errors gracefully', async () => {
      const mockStore = {
        add: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      
      mockTransaction.objectStore.mockReturnValue(mockStore);

      const testRecord = { childName: 'Test' };

      await expect(saveRecord(testRecord)).rejects.toThrow('Database error');
    });
  });

  describe('Data Validation', () => {
    test('validates required fields before saving', async () => {
      const incompleteRecord = {
        childName: '', // Empty required field
        dateOfBirth: '2022-01-01',
      };

      await expect(saveRecord(incompleteRecord)).rejects.toThrow();
    });

    test('validates data types', async () => {
      const invalidRecord = {
        childName: 'Test Child',
        dateOfBirth: '2022-01-01',
        weight: 'invalid-weight', // Should be number
        height: 'invalid-height', // Should be number
      };

      await expect(saveRecord(invalidRecord)).rejects.toThrow();
    });

    test('validates date formats', async () => {
      const invalidDateRecord = {
        childName: 'Test Child',
        dateOfBirth: 'invalid-date',
        gender: 'Male',
      };

      await expect(saveRecord(invalidDateRecord)).rejects.toThrow();
    });
  });

  describe('Offline Sync Queue', () => {
    test('queues records for sync when offline', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const testRecord = {
        childName: 'Offline Child',
        dateOfBirth: '2022-01-01',
        gender: 'Female',
      };

      const result = await saveRecord(testRecord);

      // Should save locally and mark for sync
      expect(result.needsSync).toBe(true);
    });

    test('processes sync queue when online', async () => {
      // Mock online state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      // This would test the sync queue processing
      // Implementation depends on your sync strategy
    });
  });

  describe('Performance', () => {
    test('handles large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `record-${i}`,
        childName: `Child ${i}`,
        dateOfBirth: '2022-01-01',
        weight: 10 + i * 0.1,
        height: 70 + i * 0.5,
      }));

      const mockStore = {
        getAll: jest.fn().mockResolvedValue(largeDataset),
      };
      
      mockTransaction.objectStore.mockReturnValue(mockStore);

      const start = performance.now();
      const records = await getRecords();
      const end = performance.now();

      expect(records.length).toBe(1000);
      expect(end - start).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
