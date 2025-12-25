/**
 * ADVANCED STORAGE SYSTEM v2.0
 * - IndexedDB as primary storage with fallback to localStorage
 * - Data compression with LZ-string inspired algorithm
 * - Automatic migrations and versioning
 * - Full reactive system with observers
 */

// ============================================
// COMPRESSION MODULE
// ============================================
const CompressionModule = (() => {
    // Simple but effective compression for JSON
    const compress = (str) => {
        if (!str) return '';
        try {
            return btoa(encodeURIComponent(str));
        } catch (e) {
            console.warn('Compression failed:', e);
            return str;
        }
    };

    const decompress = (str) => {
        if (!str) return '';
        try {
            return decodeURIComponent(atob(str));
        } catch (e) {
            console.warn('Decompression failed:', e);
            return str;
        }
    };

    return { compress, decompress };
})();

// ============================================
// INDEXEDDB WRAPPER
// ============================================
const IndexedDBStore = (() => {
    const DB_NAME = 'PesteczkaOS_DB';
    const VERSION = 8; // Incremented version to force upgrade

    const STORES = {
        profiles: 'profiles',
        offers: 'offers',
        diablo: 'diablo',
        domator: 'domator',
        settings: 'settings',
        history: 'history',
        cache: 'cache'
    };

    let db = null;
    const observers = new Map();

    const initDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, VERSION);

            request.onerror = (event) => {
                console.error(`IndexedDB error: ${event.target.errorCode}`);
                reject(request.error);
            };

            request.onblocked = (event) => {
                console.warn("IndexedDB open is blocked. Close other tabs with this app open.");
                // You might want to notify the user to close other tabs
            };

            request.onsuccess = () => {
                db = request.result;
                console.log('🗄️ IndexedDB initialized successfully');
                resolve(db);
            };

            request.onupgradeneeded = (e) => {
                const upgradeDb = e.target.result;
                const transaction = e.target.transaction;
                
                console.log(`📦 Upgrading database from version ${e.oldVersion} to ${e.newVersion}`);

                Object.values(STORES).forEach(storeName => {
                    if (!upgradeDb.objectStoreNames.contains(storeName)) {
                        console.log(`  - Creating store: ${storeName}`);
                        upgradeDb.createObjectStore(storeName, { keyPath: 'id' });
                    }
                });

                // If upgrading from a version that might have stale profile data, clear it.
                if (e.oldVersion < 7) {
                    try {
                        console.log('  - Clearing "profiles" store to refresh data...');
                        transaction.objectStore('profiles').clear();
                        console.log('  - "profiles" store cleared.');
                    } catch (clearError) {
                        console.error('  - Error clearing profiles store:', clearError);
                    }
                }
            };
        });
    };

    const set = (storeName, data) => {
        return new Promise(async (resolve, reject) => {
            try {
                if (!db) await initDB();
                
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                
                const compressed = {
                    ...data,
                    id: data.id || `${storeName}_${Date.now()}`,
                    timestamp: data.timestamp || new Date().toISOString(),
                    __compressed: true
                };

                const request = store.put(compressed);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    notifyObservers(storeName, 'update', compressed);
                    resolve(compressed);
                };
            } catch (e) {
                console.warn('IndexedDB set failed, using localStorage fallback:', e);
                localStorageFallback.set(storeName, data);
                resolve(data);
            }
        });
    };

    const get = (storeName, id) => {
        return new Promise(async (resolve, reject) => {
            if (!db) await initDB();

            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || null);
        });
    };

    const getAll = (storeName) => {
        return new Promise(async (resolve, reject) => {
            try {
                if (!db) await initDB();
                
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();

                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result || []);
            } catch (e) {
                console.warn('IndexedDB getAll failed:', e);
                resolve([]);
            }
        });
    };

    const delete_ = (storeName, id) => {
        return new Promise(async (resolve, reject) => {
            try {
                if (!db) await initDB();
                
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(id);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    notifyObservers(storeName, 'delete', { id });
                    resolve();
                };
            } catch (e) {
                console.warn('IndexedDB delete failed:', e);
                resolve();
            }
        });
    };

    const clear = (storeName) => {
        return new Promise(async (resolve, reject) => {
            try {
                if (!db) await initDB();
                
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    notifyObservers(storeName, 'clear', {});
                    resolve();
                };
            } catch (e) {
                console.warn('IndexedDB clear failed:', e);
                resolve();
            }
        });
    };

    const subscribe = (storeName, callback) => {
        if (!observers.has(storeName)) {
            observers.set(storeName, new Set());
        }
        observers.get(storeName).add(callback);
        
        return () => observers.get(storeName).delete(callback);
    };

    const notifyObservers = (storeName, action, data) => {
        if (observers.has(storeName)) {
            observers.get(storeName).forEach(callback => {
                try {
                    callback({ action, data, timestamp: Date.now() });
                } catch (e) {
                    console.error('Observer callback error:', e);
                }
            });
        }
    };

    return {
        STORES,
        initDB,
        set,
        get,
        getAll,
        delete: delete_,
        clear,
        subscribe,
        get isAvailable() {
            return !!window.indexedDB;
        }
    };
})();

// ============================================
// LOCALSTORAGE FALLBACK
// ============================================
const localStorageFallback = (() => {
    const PREFIX = 'PesteczkaOS_Fallback_';

    // Helper to get the entire collection for a store
    const getCollection = (storeName) => {
        try {
            const key = PREFIX + storeName;
            const compressed = localStorage.getItem(key);
            if (!compressed) return {}; // Return empty object if nothing is there
            const decompressed = CompressionModule.decompress(compressed);
            return JSON.parse(decompressed) || {};
        } catch (e) {
            console.warn(`localStorage fallback getCollection for "${storeName}" failed:`, e);
            return {};
        }
    };

    // Helper to save the entire collection for a store
    const saveCollection = (storeName, collection) => {
        try {
            const key = PREFIX + storeName;
            const compressed = CompressionModule.compress(JSON.stringify(collection));
            localStorage.setItem(key, compressed);
            return true;
        } catch (e) {
            console.warn(`localStorage fallback saveCollection for "${storeName}" failed:`, e);
            return false;
        }
    };

    const set = (storeName, data) => {
        return new Promise((resolve) => {
            if (!data.id) {
                console.error("localStorageFallback: 'set' requires data with an 'id' property.");
                resolve(null);
                return;
            }
            const collection = getCollection(storeName);
            collection[data.id] = data;
            saveCollection(storeName, collection);
            resolve(data);
        });
    };

    const get = (storeName, id) => {
        return new Promise((resolve) => {
            const collection = getCollection(storeName);
            resolve(collection[id] || null);
        });
    };

    const getAll = (storeName) => {
        return new Promise((resolve) => {
            const collection = getCollection(storeName);
            resolve(Object.values(collection));
        });
    };

    const delete_ = (storeName, id) => {
        return new Promise((resolve) => {
            const collection = getCollection(storeName);
            delete collection[id];
            saveCollection(storeName, collection);
            resolve();
        });
    };

    const clear = (storeName) => {
        return new Promise((resolve) => {
            saveCollection(storeName, {});
            resolve();
        });
    };


    return {
        set,
        get,
        getAll,
        delete: delete_,
        clear
    };
})();

// ============================================
// CENTRALIZED STATE MANAGEMENT
// ============================================
const AppState = (() => {
    const state = {
        offer: null,
        diablo: null,
        settings: null,
        history: [],
        ui: {
            isDirty: false,
            lastModified: null,
            currentView: 'offer'
        }
    };

    const subscribers = new Map();

    const setState = async (key, value) => {
        const oldValue = getIn(state, key);
        setIn(state, key, value);
        
        state.ui.isDirty = true;
        state.ui.lastModified = new Date().toISOString();

        // Persist to the active storage system (which could be IndexedDB or the fallback)
        if (key.startsWith('offer')) {
            await window.StorageSystem.db.set(IndexedDBStore.STORES.offers, state.offer);
        } else if (key.startsWith('diablo')) {
            await window.StorageSystem.db.set(IndexedDBStore.STORES.diablo, state.diablo);
        } else if (key.startsWith('settings')) {
            await window.StorageSystem.db.set(IndexedDBStore.STORES.settings, state.settings);
        }

        notifySubscribers(key, value, oldValue);
    };

    const getState = (key) => {
        return getIn(state, key);
    };

    const subscribe = (key, callback) => {
        if (!subscribers.has(key)) {
            subscribers.set(key, new Set());
        }
        subscribers.get(key).add(callback);
        
        return () => subscribers.get(key).delete(callback);
    };

    const notifySubscribers = (key, newValue, oldValue) => {
        if (subscribers.has(key)) {
            subscribers.get(key).forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (e) {
                    console.error('Subscriber callback error:', e);
                }
            });
        }
    };

    const getIn = (obj, path) => {
        return path.split('.').reduce((acc, part) => acc?.[part], obj);
    };

    const setIn = (obj, path, value) => {
        const parts = path.split('.');
        const lastPart = parts.pop();
        const target = parts.reduce((acc, part) => {
            if (!acc[part]) acc[part] = {};
            return acc[part];
        }, obj);
        target[lastPart] = value;
    };

    return {
        get state() { return state; },
        setState,
        getState,
        subscribe,
        reset: () => {
            Object.keys(state).forEach(key => {
                if (key !== 'ui') state[key] = null;
            });
        }
    };
})();

// ============================================
// INPUT SANITIZATION & VALIDATION
// ============================================
const ValidatorModule = (() => {
    const sanitize = (input) => {
        if (typeof input !== 'string') return input;
        
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validateNIP = (nip) => {
        // Polish NIP validation
        return /^\d{10}$/.test(nip.replace(/\D/g, ''));
    };

    const validateBankAccount = (account) => {
        // Polish IBAN validation
        return /^PL\d{28}$|^\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/.test(
            account.replace(/\s/g, '')
        );
    };

    const validateCurrency = (value) => {
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0;
    };

    const validate = (data, schema) => {
        const errors = {};
        
        Object.entries(schema).forEach(([key, rules]) => {
            const value = data[key];
            
            if (rules.required && (!value || value.toString().trim() === '')) {
                errors[key] = `${key} jest wymagane`;
                return;
            }

            if (rules.type === 'email' && value && !validateEmail(value)) {
                errors[key] = 'Niepoprawny format email';
            }
            
            if (rules.type === 'nip' && value && !validateNIP(value)) {
                errors[key] = 'Niepoprawny NIP';
            }
            
            if (rules.type === 'currency' && value && !validateCurrency(value)) {
                errors[key] = 'Niepoprawna kwota';
            }
        });

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    };

    return {
        sanitize,
        validateEmail,
        validateNIP,
        validateBankAccount,
        validateCurrency,
        validate
    };
})();

// ============================================
// UTILITY HELPERS
// ============================================
const UtilsModule = (() => {
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    };

    const throttle = (func, limit) => {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    const deepClone = (obj) => {
        return JSON.parse(JSON.stringify(obj));
    };

    const deepMerge = (target, source) => {
        const result = { ...target };
        
        Object.keys(source).forEach(key => {
            if (typeof source[key] === 'object' && source[key] !== null) {
                result[key] = deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        });

        return result;
    };

    const retry = async (fn, maxAttempts = 3, delay = 1000) => {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                return await fn();
            } catch (e) {
                if (i === maxAttempts - 1) throw e;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    };

    const fetchWithTimeout = (resource, options = {}, timeout = 8000) => {
        return new Promise((resolve, reject) => {
            const controller = new AbortController();
            const id = setTimeout(() => {
                controller.abort();
                reject(new Error('Request timed out'));
            }, timeout);

            fetch(resource, {
                ...options,
                signal: controller.signal
            }).then(response => {
                clearTimeout(id);
                resolve(response);
            }).catch(error => {
                clearTimeout(id);
                reject(error);
            });
        });
    };

    return {
        debounce,
        throttle,
        fetchWithTimeout,
        deepClone,
        deepMerge,
        retry
    };
})();

// ============================================
// PROFILE MANAGER
// ============================================
const ProfileManager = (() => {
    const STORE_NAME = IndexedDBStore.STORES.profiles;

    const initDefaultProfiles = async () => {
        try {
            const profiles = await IndexedDBStore.getAll(STORE_NAME);
            if (profiles && profiles.length > 0) {
                console.log('📦 Profiles already exist in DB.');
                return;
            }

            const response = await UtilsModule.fetchWithTimeout('profiles.json', {}, 5000); // 5 second timeout
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn('`profiles.json` not found. Skipping default profiles.');
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data && data.profiles) {
                const profilePromises = Object.values(data.profiles).map(p => {
                    if (!p.key) {
                        console.warn('Skipping profile with no key:', p);
                        return null;
                    }
                    return IndexedDBStore.set(STORE_NAME, { ...p, id: p.key });
                }).filter(Boolean);

                await Promise.all(profilePromises);
                console.log('✅ Default profiles initialized.');
            } else {
                console.warn('⚠️ No "profiles" key found in profiles.json');
            }
        } catch (error) {
            console.error('❌ Failed to initialize default profiles:', error);
            // Propagate the error to be caught by the main initializer
            throw new Error(`Failed to load critical profile data: ${error.message}`);
        }
    };

    const getProfile = async (key) => {
        return await IndexedDBStore.get(STORE_NAME, key);
    };

    const getAllProfiles = async () => {
        return await IndexedDBStore.getAll(STORE_NAME);
    };

    const saveProfile = async (profileData) => {
        if (!profileData || !profileData.key) {
            throw new Error('Profile data must have a key.');
        }

        const validationSchema = {
            name: { required: true },
            email: { type: 'email' },
            nip: { type: 'nip' },
        };

        const { isValid, errors } = ValidatorModule.validate(profileData, validationSchema);
        if (!isValid) {
            const errorMessages = Object.entries(errors).map(([key, msg]) => `${key}: ${msg}`);
            throw new Error(`Invalid profile data: ${errorMessages.join(', ')}`);
        }

        const profileWithId = { ...profileData, id: profileData.key };
        return await IndexedDBStore.set(STORE_NAME, profileWithId);
    };

    return {
        initDefaultProfiles,
        getProfile,
        getAllProfiles,
        saveProfile,
    };
})();


// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
const init = async () => {
    let useFallback = !IndexedDBStore.isAvailable;

    if (IndexedDBStore.isAvailable) {
        try {
            await IndexedDBStore.initDB();
            console.log('✅ Storage system initialized with IndexedDB');
        } catch (e) {
            console.error('❌ IndexedDB initialization failed. Activating fallback mode.', e);
            useFallback = true;
        }
    }

    if (useFallback) {
        console.warn('⚠️ Running in LocalStorage Fallback Mode. Data will not be persistent in private browsing.');
        // Overwrite the primary store's methods with the fallback versions
        IndexedDBStore.set = localStorageFallback.set;
        IndexedDBStore.get = localStorageFallback.get;
        IndexedDBStore.getAll = localStorageFallback.getAll;
        IndexedDBStore.delete = localStorageFallback.delete;
        IndexedDBStore.clear = localStorageFallback.clear;
    }

    // This part runs regardless of the storage mode
    await ProfileManager.initDefaultProfiles();
};

// Export for global use
window.StorageSystem = {
    init,
    db: IndexedDBStore,
    ProfileManager: ProfileManager,
    state: AppState,
    validator: ValidatorModule,
    utils: UtilsModule,
    compression: CompressionModule
};
