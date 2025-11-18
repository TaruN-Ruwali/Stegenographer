const crypto = require('crypto');

// Generate key from password
function generateKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

// Encrypt data
function encryptData(data, password) {
    try {
        const salt = crypto.randomBytes(16);
        const key = generateKey(password, salt);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipher('aes-256-cbc', key);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        // Return salt:iv:encrypted
        return salt.toString('hex') + ':' + iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        throw new Error(`Encryption failed: ${error.message}`);
    }
}

// Decrypt data
function decryptData(encryptedData, password) {
    try {
        const parts = encryptedData.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format');
        }
        
        const salt = Buffer.from(parts[0], 'hex');
        const iv = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        
        const key = generateKey(password, salt);
        const decipher = crypto.createDecipher('aes-256-cbc', key);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        throw new Error(`Decryption failed: ${error.message}`);
    }
}

module.exports = {
    encryptData,
    decryptData
};