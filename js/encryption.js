// Data encryption utilities

class EncryptionUtility {
    constructor() {
        this.initialized = false;
        this.encryptionKey = null;
        this.passwordVerified = false;
    }
    
    // Initialize encryption
    async initialize() {
        try {
            // Check if CryptoJS is available
            if (!window.CryptoJS) {
                console.error('CryptoJS library not found');
                return false;
            }
            
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Error initializing encryption:', error);
            return false;
        }
    }
    
    // Generate a secure key from password
    generateKey(password, salt) {
        if (!this.initialized) return null;
        
        try {
            return CryptoJS.PBKDF2(password, salt, {
                keySize: 256 / 32,
                iterations: 10000
            }).toString();
        } catch (error) {
            console.error('Error generating encryption key:', error);
            return null;
        }
    }
    
    // Generate a random salt
    generateSalt() {
        if (!this.initialized) return null;
        
        try {
            return CryptoJS.lib.WordArray.random(128 / 8).toString();
        } catch (error) {
            console.error('Error generating salt:', error);
            return null;
        }
    }
    
    // Encrypt data
    encrypt(data, key) {
        if (!this.initialized) return null;
        
        try {
            const jsonString = JSON.stringify(data);
            return CryptoJS.AES.encrypt(jsonString, key).toString();
        } catch (error) {
            console.error('Error encrypting data:', error);
            return null;
        }
    }
    
    // Decrypt data
    decrypt(encryptedData, key) {
        if (!this.initialized) return null;
        
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedData, key);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
            return JSON.parse(decryptedString);
        } catch (error) {
            console.error('Error decrypting data:', error);
            return null;
        }
    }
    
    // Verify a password against the stored hash
    verifyPassword(password, storedHash, salt) {
        if (!this.initialized) return false;
        
        try {
            const generatedKey = this.generateKey(password, salt);
            return generatedKey === storedHash;
        } catch (error) {
            console.error('Error verifying password:', error);
            return false;
        }
    }
    
    // Generate a hash for password storage
    hashPassword(password) {
        if (!this.initialized) return null;
        
        try {
            const salt = this.generateSalt();
            const hash = this.generateKey(password, salt);
            
            return {
                hash: hash,
                salt: salt
            };
        } catch (error) {
            console.error('Error hashing password:', error);
            return null;
        }
    }
    
    // Set the current encryption key
    setEncryptionKey(key) {
        this.encryptionKey = key;
        this.passwordVerified = true;
    }
    
    // Check if encryption is set up
    isEncryptionEnabled() {
        return this.initialized && this.encryptionKey !== null && this.passwordVerified;
    }
    
    // Encrypt an object for storage
    encryptForStorage(data) {
        if (!this.isEncryptionEnabled()) return data;
        
        try {
            return {
                encrypted: true,
                data: this.encrypt(data, this.encryptionKey)
            };
        } catch (error) {
            console.error('Error encrypting for storage:', error);
            return data;
        }
    }
    
    // Decrypt an object from storage
    decryptFromStorage(data) {
        if (!this.isEncryptionEnabled() || !data || !data.encrypted) return data;
        
        try {
            return this.decrypt(data.data, this.encryptionKey);
        } catch (error) {
            console.error('Error decrypting from storage:', error);
            return null;
        }
    }
}

// Create encryption utility instance
const encryption = new EncryptionUtility();