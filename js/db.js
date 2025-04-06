// Database configuration
const DB_CONFIG = {
    name: 'timeTrackerDB',
    version: 1,
    stores: {
        activities: { keyPath: 'id', autoIncrement: true, indices: ['categoryId', 'startTime', 'endTime'] },
        categories: { keyPath: 'id', autoIncrement: true, indices: ['name'] },
        tags: { keyPath: 'id', autoIncrement: true, indices: ['name'] },
        settings: { keyPath: 'id', autoIncrement: false }
    }
};

// Database class for handling all interactions with IndexedDB
class Database {
    constructor() {
        this.db = null;
        this.encryptionEnabled = false;
        this.encryptionKey = null;
    }

    // Initialize the database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores for each entity type
                for (const [storeName, config] of Object.entries(DB_CONFIG.stores)) {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { 
                            keyPath: config.keyPath, 
                            autoIncrement: config.autoIncrement 
                        });
                        
                        // Create indices for efficient querying
                        if (config.indices) {
                            config.indices.forEach(indexName => {
                                store.createIndex(indexName, indexName, { unique: false });
                            });
                        }
                    }
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Database initialized successfully');
                this.loadEncryptionSettings()
                    .then(() => resolve())
                    .catch(error => reject(error));
            };

            request.onerror = (event) => {
                console.error('Database initialization error:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Load encryption settings from the database
    async loadEncryptionSettings() {
        try {
            const settings = await this.getItem('settings', 'encryption');
            if (settings) {
                this.encryptionEnabled = true;
                // The encryptionKey will be set when the user enters their password
                console.log('Encryption is enabled');
            }
        } catch (error) {
            console.log('No encryption settings found');
        }
    }

    // Enable encryption with the given password
    async enableEncryption(password) {
        // Generate a salt for the password
        const salt = CryptoJS.lib.WordArray.random(128/8).toString();
        
        // Derive a key from the password
        this.encryptionKey = CryptoJS.PBKDF2(password, salt, { 
            keySize: 256/32,
            iterations: 1000
        }).toString();
        
        // Store the salt (not the key) in the database
        await this.setItem('settings', { 
            id: 'encryption',
            enabled: true,
            salt: salt
        });
        
        this.encryptionEnabled = true;
        
        // Re-encrypt all existing data
        await this.reEncryptAllData();
        
        return true;
    }

    // Disable encryption and decrypt all data
    async disableEncryption() {
        if (!this.encryptionEnabled) return true;
        
        // Decrypt all existing data
        await this.decryptAllData();
        
        // Remove encryption settings
        await this.deleteItem('settings', 'encryption');
        this.encryptionEnabled = false;
        this.encryptionKey = null;
        
        return true;
    }

    // Verify the encryption password
    async verifyEncryptionPassword(password) {
        try {
            const settings = await this.getItem('settings', 'encryption');
            if (!settings) return false;
            
            // Derive the key from the password using the stored salt
            const key = CryptoJS.PBKDF2(password, settings.salt, { 
                keySize: 256/32,
                iterations: 1000
            }).toString();
            
            // Test decryption on a sample item
            const testItem = await this.getRawItem('activities', 1);
            if (testItem) {
                try {
                    const decrypted = CryptoJS.AES.decrypt(testItem.data, key).toString(CryptoJS.enc.Utf8);
                    JSON.parse(decrypted);
                    
                    // If we get here, the password is correct
                    this.encryptionKey = key;
                    return true;
                } catch (e) {
                    return false;
                }
            }
            
            // If no test item, just set the key (first time encryption setup)
            this.encryptionKey = key;
            return true;
        } catch (error) {
            console.error('Error verifying encryption password:', error);
            return false;
        }
    }

    // Re-encrypt all data with the new key
    async reEncryptAllData() {
        if (!this.encryptionEnabled || !this.encryptionKey) return;
        
        // Re-encrypt activities
        const activities = await this.getAllRaw('activities');
        for (const activity of activities) {
            if (activity.encrypted) continue;
            
            const encryptedData = CryptoJS.AES.encrypt(
                JSON.stringify(activity), 
                this.encryptionKey
            ).toString();
            
            await this.updateRawItem('activities', activity.id, {
                id: activity.id,
                data: encryptedData,
                encrypted: true
            });
        }
        
        // Re-encrypt categories
        const categories = await this.getAllRaw('categories');
        for (const category of categories) {
            if (category.encrypted) continue;
            
            const encryptedData = CryptoJS.AES.encrypt(
                JSON.stringify(category), 
                this.encryptionKey
            ).toString();
            
            await this.updateRawItem('categories', category.id, {
                id: category.id,
                data: encryptedData,
                encrypted: true
            });
        }
        
        // Re-encrypt tags
        const tags = await this.getAllRaw('tags');
        for (const tag of tags) {
            if (tag.encrypted) continue;
            
            const encryptedData = CryptoJS.AES.encrypt(
                JSON.stringify(tag), 
                this.encryptionKey
            ).toString();
            
            await this.updateRawItem('tags', tag.id, {
                id: tag.id,
                data: encryptedData,
                encrypted: true
            });
        }
    }

    // Decrypt all data
    async decryptAllData() {
        if (!this.encryptionEnabled || !this.encryptionKey) return;
        
        // Decrypt activities
        const activities = await this.getAllRaw('activities');
        for (const item of activities) {
            if (!item.encrypted) continue;
            
            try {
                const decrypted = JSON.parse(
                    CryptoJS.AES.decrypt(item.data, this.encryptionKey)
                    .toString(CryptoJS.enc.Utf8)
                );
                
                await this.updateRawItem('activities', item.id, decrypted);
            } catch (e) {
                console.error('Failed to decrypt activity:', e);
            }
        }
        
        // Decrypt categories
        const categories = await this.getAllRaw('categories');
        for (const item of categories) {
            if (!item.encrypted) continue;
            
            try {
                const decrypted = JSON.parse(
                    CryptoJS.AES.decrypt(item.data, this.encryptionKey)
                    .toString(CryptoJS.enc.Utf8)
                );
                
                await this.updateRawItem('categories', item.id, decrypted);
            } catch (e) {
                console.error('Failed to decrypt category:', e);
            }
        }
        
        // Decrypt tags
        const tags = await this.getAllRaw('tags');
        for (const item of tags) {
            if (!item.encrypted) continue;
            
            try {
                const decrypted = JSON.parse(
                    CryptoJS.AES.decrypt(item.data, this.encryptionKey)
                    .toString(CryptoJS.enc.Utf8)
                );
                
                await this.updateRawItem('tags', item.id, decrypted);
            } catch (e) {
                console.error('Failed to decrypt tag:', e);
            }
        }
    }

    // Get a raw item from the database (no decryption)
    async getRawItem(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // Get all raw items from a store (no decryption)
    async getAllRaw(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // Update a raw item directly (no encryption)
    async updateRawItem(storeName, id, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // Add an item to the database
    async addItem(storeName, item) {
        if (this.encryptionEnabled && this.encryptionKey && storeName !== 'settings') {
            return this.addEncryptedItem(storeName, item);
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(item);
            
            request.onsuccess = () => {
                resolve(request.result); // Returns the generated ID
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // Add an encrypted item to the database
    async addEncryptedItem(storeName, item) {
        const encryptedData = CryptoJS.AES.encrypt(
            JSON.stringify(item), 
            this.encryptionKey
        ).toString();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // Store the encrypted data
            const request = store.add({
                data: encryptedData,
                encrypted: true
            });
            
            request.onsuccess = () => {
                resolve(request.result); // Returns the generated ID
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // Get an item from the database
    async getItem(storeName, id) {
        const item = await this.getRawItem(storeName, id);
        
        if (!item) return null;
        
        // Handle encrypted items
        if (item.encrypted && this.encryptionKey) {
            try {
                return JSON.parse(
                    CryptoJS.AES.decrypt(item.data, this.encryptionKey)
                    .toString(CryptoJS.enc.Utf8)
                );
            } catch (e) {
                console.error('Failed to decrypt item:', e);
                return null;
            }
        }
        
        return item;
    }

    // Update an item in the database
    async updateItem(storeName, id, item) {
        if (this.encryptionEnabled && this.encryptionKey && storeName !== 'settings') {
            return this.updateEncryptedItem(storeName, id, item);
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // Ensure the ID is included in the item
            const updatedItem = { ...item, id };
            const request = store.put(updatedItem);
            
            request.onsuccess = () => {
                resolve(true);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // Update an encrypted item in the database
    async updateEncryptedItem(storeName, id, item) {
        // Ensure the ID is included in the item
        const updatedItem = { ...item, id };
        
        // Encrypt the data
        const encryptedData = CryptoJS.AES.encrypt(
            JSON.stringify(updatedItem), 
            this.encryptionKey
        ).toString();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // Store the encrypted data
            const request = store.put({
                id,
                data: encryptedData,
                encrypted: true
            });
            
            request.onsuccess = () => {
                resolve(true);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // Delete an item from the database
    async deleteItem(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                resolve(true);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // Get all items from a store
    async getAll(storeName) {
        const items = await this.getAllRaw(storeName);
        
        // Handle encrypted items
        if (this.encryptionEnabled && this.encryptionKey) {
            const decryptedItems = [];
            
            for (const item of items) {
                if (item.encrypted) {
                    try {
                        const decrypted = JSON.parse(
                            CryptoJS.AES.decrypt(item.data, this.encryptionKey)
                            .toString(CryptoJS.enc.Utf8)
                        );
                        decryptedItems.push(decrypted);
                    } catch (e) {
                        console.error('Failed to decrypt item:', e);
                    }
                } else {
                    decryptedItems.push(item);
                }
            }
            
            return decryptedItems;
        }
        
        return items;
    }

    // Set an item with a specific ID
    async setItem(storeName, item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // Query items based on an index
    async queryByIndex(storeName, indexName, value) {
        const items = await this.getAll(storeName);
        return items.filter(item => item[indexName] === value);
    }

    // Export all data as JSON
    async exportData() {
        const data = {
            activities: await this.getAll('activities'),
            categories: await this.getAll('categories'),
            tags: await this.getAll('tags')
        };
        
        return JSON.stringify(data);
    }

    // Import data from JSON
    async importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Clear existing data
            await this.clearStore('activities');
            await this.clearStore('categories');
            await this.clearStore('tags');
            
            // Import categories first (they're referenced by activities)
            if (data.categories && Array.isArray(data.categories)) {
                for (const category of data.categories) {
                    await this.addItem('categories', category);
                }
            }
            
            // Import tags
            if (data.tags && Array.isArray(data.tags)) {
                for (const tag of data.tags) {
                    await this.addItem('tags', tag);
                }
            }
            
            // Import activities
            if (data.activities && Array.isArray(data.activities)) {
                for (const activity of data.activities) {
                    await this.addItem('activities', activity);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Clear all items from a store
    async clearStore(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => {
                resolve(true);
            };
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
}

// Create and initialize the database
const db = new Database();