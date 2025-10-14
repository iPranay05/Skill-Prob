import crypto from 'crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits

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
      const cipher = crypto.createCipher(this.ALGORITHM, key);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Combine IV and encrypted data
      const combined = iv.toString('hex') + encrypted;
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

      // Extract IV and encrypted data
      const iv = Buffer.from(encryptedData.slice(0, this.IV_LENGTH * 2), 'hex');
      const encrypted = encryptedData.slice(this.IV_LENGTH * 2);

      const decipher = crypto.createDecipher(this.ALGORITHM, key);

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
    return computedHash === hash;
  }

  // Generate secure random token
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate secure random password
  static generatePassword(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  // Encrypt API keys and tokens
  static encryptApiKey(apiKey: string): string {
    return this.encrypt(apiKey);
  }

  // Decrypt API keys and tokens
  static decryptApiKey(encryptedApiKey: string): string {
    return this.decrypt(encryptedApiKey);
  }

  // Encrypt PII (Personally Identifiable Information)
  static encryptPII(piiData: string): string {
    return this.encrypt(piiData);
  }

  // Decrypt PII
  static decryptPII(encryptedPII: string): string {
    return this.decrypt(encryptedPII);
  }

  // Encrypt payment information
  static encryptPaymentInfo(paymentData: string): string {
    return this.encrypt(paymentData);
  }

  // Decrypt payment information
  static decryptPaymentInfo(encryptedPaymentData: string): string {
    return this.decrypt(encryptedPaymentData);
  }

  // Hash password with salt
  static hashPassword(password: string): { hash: string; salt: string } {
    return this.hash(password);
  }

  // Verify password
  static verifyPassword(password: string, hash: string, salt: string): boolean {
    return this.verifyHash(password, hash, salt);
  }

  // Encrypt session data
  static encryptSession(sessionData: object): string {
    return this.encrypt(JSON.stringify(sessionData));
  }

  // Decrypt session data
  static decryptSession(encryptedSession: string): object {
    const decrypted = this.decrypt(encryptedSession);
    return JSON.parse(decrypted);
  }

  // Generate HMAC signature
  static generateHMAC(data: string, secret?: string): string {
    const key = secret || this.getEncryptionKey().toString('hex');
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  // Verify HMAC signature
  static verifyHMAC(data: string, signature: string, secret?: string): boolean {
    const expectedSignature = this.generateHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  // Encrypt file data
  static encryptFile(fileBuffer: Buffer): { encryptedData: Buffer; metadata: string } {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipher(this.ALGORITHM, key);

      const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);

      // Combine IV and encrypted data
      const encryptedData = Buffer.concat([iv, encrypted]);
      const metadata = JSON.stringify({
        algorithm: this.ALGORITHM,
        ivLength: this.IV_LENGTH,
        originalSize: fileBuffer.length
      });

      return { encryptedData, metadata };
    } catch (error) {
      console.error('File encryption error:', error);
      throw new Error('Failed to encrypt file');
    }
  }

  // Decrypt file data
  static decryptFile(encryptedData: Buffer, metadata: string): Buffer {
    try {
      const key = this.getEncryptionKey();
      const meta = JSON.parse(metadata);

      // Extract IV and encrypted content
      const iv = encryptedData.subarray(0, meta.ivLength);
      const encrypted = encryptedData.subarray(meta.ivLength);

      const decipher = crypto.createDecipher(meta.algorithm, key);

      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

      return decrypted;
    } catch (error) {
      console.error('File decryption error:', error);
      throw new Error('Failed to decrypt file');
    }
  }

  // Secure data comparison (timing-safe)
  static secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(
      Buffer.from(a, 'utf8'),
      Buffer.from(b, 'utf8')
    );
  }

  // Generate cryptographically secure UUID
  static generateSecureUUID(): string {
    return crypto.randomUUID();
  }

  // Key derivation function
  static deriveKey(password: string, salt: string, iterations: number = 100000): Buffer {
    return crypto.pbkdf2Sync(password, salt, iterations, this.KEY_LENGTH, 'sha512');
  }

  // Encrypt with derived key
  static encryptWithPassword(plaintext: string, password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const key = this.deriveKey(password, salt);
    const iv = crypto.randomBytes(this.IV_LENGTH);
    
    const cipher = crypto.createCipher(this.ALGORITHM, key);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combine salt, IV, and encrypted data
    return salt + iv.toString('hex') + encrypted;
  }

  // Decrypt with derived key
  static decryptWithPassword(encryptedData: string, password: string): string {
    const salt = encryptedData.slice(0, 32); // 16 bytes = 32 hex chars
    const iv = Buffer.from(encryptedData.slice(32, 64), 'hex'); // 16 bytes = 32 hex chars
    const encrypted = encryptedData.slice(64);
    
    const key = this.deriveKey(password, salt);
    const decipher = crypto.createDecipher(this.ALGORITHM, key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}