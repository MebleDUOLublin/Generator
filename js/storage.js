/**
 * PESTECZKA OS - STORAGE SYSTEM
 * Handles all interactions with IndexedDB for data persistence.
 */

const DB_NAME = 'PesteczkaOSDB';
const VERSION = 1;
const PROFILES_STORE = 'profiles';
const SETTINGS_STORE = 'settings';

let db;

const StorageSystem = {
    /**
     * Initializes the IndexedDB database.
     * This must be called before any other database operations.
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, VERSION);

            request.onupgradeneeded = (event) => {
                db = event.target.result;
                if (!db.objectStoreNames.contains(PROFILES_STORE)) {
                    db.createObjectStore(PROFILES_STORE, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
                    db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
                }
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                console.log('✅ Database initialized successfully');
                resolve();
            };

            request.onerror = (event) => {
                console.error('❌ Database error:', event.target.errorCode);
                reject(event.target.error);
            };
        });
    },

    /**
     * Retrieves an item from a specified object store.
     * @param {string} storeName The name of the object store.
     * @param {string} key The key of the item to retrieve.
     * @returns {Promise<any>} The retrieved item, or undefined if not found.
     */
    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('Database not initialized.');
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    },

    /**
     * Saves or updates an item in a specified object store.
     * @param {string} storeName The name of the object store.
     * @param {object} item The item to save.
     * @returns {Promise<void>}
     */
    async set(storeName, item) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('Database not initialized.');
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    },

    /**
     * Retrieves all items from a specified object store.
     * @param {string} storeName The name of the object store.
     * @returns {Promise<Array<any>>} A promise that resolves with an array of all items.
     */
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            if (!db) return reject('Database not initialized.');
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }
};

export { StorageSystem };
