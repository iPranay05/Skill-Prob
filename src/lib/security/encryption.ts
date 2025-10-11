import crypto from 'crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits

  // Get encryption key from environment
  private static getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    
    // Ensure key is exactly 32 bytes
    if (key.length !== 64) { // 32 bytes = 64 hex characters
      throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }
    
    return Buffer.from(key, 'hex');
  }

  // Generate a new encryption key (for setup)
  static generateEncryptionKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
  }

  // Encrypt sensitive data
  static encrypt(plaintext: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipherGCM(this.ALGORITHM, key, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Combine IV, tag, and encrypted data
      const combined = iv.toString('hex') + tag.toString('hex') + encrypted;
      return combined;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt sensitive data
  static decrypt(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey();
      
      // Extract IV, tag, and encrypted data
      const iv = Buffer.from(encryptedData.slice(0, this.IV_LENGTH * 2), 'hex');
      const tag = Buffer.from(encryptedData.slice(this.IV_LENGTH * 2, (this.IV_LENGTH + this.TAG_LENGTH) * 2), 'hex');
      const encrypted = encryptedData.slice((this.IV_LENGTH + this.TAG_LENGTH) * 2);
      
      const decipher = crypto.createDecipherGCM(this.ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Hash sensitive data (one-way)
  static hash(data: string, salt?: string): { hash: string; salt: string } {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 100000, 64, 'sha512').toString('hex');
    return { hash, salt: actualSalt };
  }

  // Verify hashed data
  static verifyHash(data: string, hash: string, salt: string): boolean {
    const { hash: computedHash } = this.hash(data, salt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
  }

  // Encrypt PII data with field-level encryption
  static encryptPII(data: Record<string, any>, fieldsToEncrypt: string[]): Record<string, any> {
    const encrypted = { ...data };
    
    fieldsToEncrypt.forEach(field => {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = this.encrypt(encrypted[field]);
        encrypted[`${field}_encrypted`] = true;
      }
    });
    
    return encrypted;
  }

  // Decrypt PII data
  static decryptPII(data: Record<string, any>, fieldsToDecrypt: string[]): Record<string, any> {
    const decrypted = { ...data };
    
    fieldsToDecrypt.forEach(field => {
      if (decrypted[field] && decrypted[`${field}_encrypted`]) {
        try {
          decrypted[field] = this.decrypt(decrypted[field]);
          delete decrypted[`${field}_encrypted`];
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
        }
      }
    });
    
    return decrypted;
  }

  // Generate secure random tokens
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate cryptographically secure random numbers
  static generateSecureRandomNumber(min: number, max: number): number {
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxValue = Math.pow(256, bytesNeeded);
    const threshold = maxValue - (maxValue % range);
    
    let randomValue;
    do {
      const randomBytes = crypto.randomBytes(bytesNeeded);
      randomValue = randomBytes.readUIntBE(0, bytesNeeded);
    } while (randomValue >= threshold);
    
    return min + (randomValue % range);
  }

  // Create HMAC signature for data integrity
  static createHMAC(data: string, secret?: string): string {
    const hmacSecret = secret || process.env.HMAC_SECRET || 'default-secret';
    return crypto.createHmac('sha256', hmacSecret).update(data).digest('hex');
  }

  // Verify HMAC signature
  static verifyHMAC(data: string, signature: string, secret?: string): boolean {
    const expectedSignature = this.createHMAC(data, secret);
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  }

  // Mask sensitive data for logging
  static maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars * 2) {
      return '*'.repeat(data.length);
    }
    
    const start = data.slice(0, visibleChars);
    const end = data.slice(-visibleChars);
    const middleLength = Math.max(4, data.length - visibleChars * 2); // Minimum 4 asterisks
    const middle = '*'.repeat(middleLength);
    
    return start + middle + end;
  }

  // Secure data deletion (overwrite memory)
  static secureDelete(data: string | Buffer): void {
    if (typeof data === 'string') {
      // For strings, we can't directly overwrite memory in JavaScript
      // But we can at least clear the reference
      data = '';
    } else if (Buffer.isBuffer(data)) {
      // For buffers, we can overwrite with random data
      crypto.randomFillSync(data);
    }
  }

  // Key derivation for different purposes
  static deriveKey(masterKey: string, purpose: string, length: number = 32): Buffer {
    return crypto.pbkdf2Sync(masterKey, purpose, 100000, length, 'sha512');
  }

  // Encrypt file content
  static encryptFile(fileBuffer: Buffer): { encryptedData: Buffer; metadata: string } {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipherGCM(this.ALGORITHM, key, iv);
      
      const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
      const tag = cipher.getAuthTag();
      
      // Combine IV, tag, and encrypted data
      const encryptedData = Buffer.concat([iv, tag, encrypted]);
      const metadata = JSON.stringify({
        algorithm: this.ALGORITHM,
        ivLength: this.IV_LENGTH,
        tagLength: this.TAG_LENGTH,
        originalSize: fileBuffer.length
      });
      
      return { encryptedData, metadata };
    } catch (error) {
      console.error('File encryption error:', error);
      throw new Error('Failed to encrypt file');
    }
  }

  // Decrypt file content
  static decryptFile(encryptedData: Buffer, metadata: string): Buffer {
    try {
      const key = this.getEncryptionKey();
      const meta = JSON.parse(metadata);
      
      // Extract IV, tag, and encrypted content
      const iv = encryptedData.subarray(0, meta.ivLength);
      const tag = encryptedData.subarray(meta.ivLength, meta.ivLength + meta.tagLength);
      const encrypted = encryptedData.subarray(meta.ivLength + meta.tagLength);
      
      const decipher = crypto.createDecipherGCM(meta.algorithm, key, iv);
      decipher.setAuthTag(tag);
      
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      
      return decrypted;
    } catch (error) {
      console.error('File decryption error:', error);
      throw new Error('Failed to decrypt file');
    }
  }
}