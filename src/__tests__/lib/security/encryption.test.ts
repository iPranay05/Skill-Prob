import { describe, it, expect, beforeEach } from '@jest/globals';
import { EncryptionService } from '@/lib/security/encryption';

describe('Encryption Service Security Tests', () => {
  beforeEach(() => {
    // Set up environment variables for encryption
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.HMAC_SECRET = 'test-hmac-secret';
  });

  describe('Basic Encryption/Decryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      const plaintext = 'sensitive data that needs protection';
      
      const encrypted = EncryptionService.encrypt(plaintext);
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(plaintext.length);

      const decrypted = EncryptionService.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different encrypted outputs for same input', () => {
      const plaintext = 'same input data';
      
      const encrypted1 = EncryptionService.encrypt(plaintext);
      const encrypted2 = EncryptionService.encrypt(plaintext);
      
      expect(encrypted1).not.toBe(encrypted2); // Due to random IV
      expect(EncryptionService.decrypt(encrypted1)).toBe(plaintext);
      expect(EncryptionService.decrypt(encrypted2)).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      const plaintext = '';
      
      const encrypted = EncryptionService.encrypt(plaintext);
      const decrypted = EncryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = '你好世界 🌍 مرحبا بالعالم';
      
      const encrypted = EncryptionService.encrypt(plaintext);
      const decrypted = EncryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('Password Hashing', () => {
    it('should hash passwords securely', () => {
      const password = 'mySecurePassword123!';
      
      const { hash, salt } = EncryptionService.hash(password);
      
      expect(hash).not.toBe(password);
      expect(salt).toBeDefined();
      expect(hash.length).toBe(128); // 64 bytes = 128 hex chars
      expect(salt.length).toBe(32); // 16 bytes = 32 hex chars
    });

    it('should verify correct passwords', () => {
      const password = 'correctPassword123!';
      
      const { hash, salt } = EncryptionService.hash(password);
      const isValid = EncryptionService.verifyHash(password, hash, salt);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect passwords', () => {
      const password = 'correctPassword123!';
      const wrongPassword = 'wrongPassword123!';
      
      const { hash, salt } = EncryptionService.hash(password);
      const isValid = EncryptionService.verifyHash(wrongPassword, hash, salt);
      
      expect(isValid).toBe(false);
    });

    it('should produce different hashes for same password with different salts', () => {
      const password = 'samePassword123!';
      
      const result1 = EncryptionService.hash(password);
      const result2 = EncryptionService.hash(password);
      
      expect(result1.hash).not.toBe(result2.hash);
      expect(result1.salt).not.toBe(result2.salt);
      
      // Both should verify correctly
      expect(EncryptionService.verifyHash(password, result1.hash, result1.salt)).toBe(true);
      expect(EncryptionService.verifyHash(password, result2.hash, result2.salt)).toBe(true);
    });
  });

  describe('PII Encryption', () => {
    it('should encrypt specified PII fields', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        ssn: '123-45-6789',
        publicInfo: 'This is public'
      };

      const fieldsToEncrypt = ['ssn', 'email'];
      
      const encrypted = EncryptionService.encryptPII(userData, fieldsToEncrypt);
      
      expect(encrypted.ssn).not.toBe(userData.ssn);
      expect(encrypted.email).not.toBe(userData.email);
      expect(encrypted.name).toBe(userData.name); // Not encrypted
      expect(encrypted.publicInfo).toBe(userData.publicInfo); // Not encrypted
      expect(encrypted.ssn_encrypted).toBe(true);
      expect(encrypted.email_encrypted).toBe(true);
    });

    it('should decrypt PII fields correctly', () => {
      const userData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        ssn: '987-65-4321',
        phone: '+1234567890'
      };

      const fieldsToEncrypt = ['ssn', 'email', 'phone'];
      
      const encrypted = EncryptionService.encryptPII(userData, fieldsToEncrypt);
      const decrypted = EncryptionService.decryptPII(encrypted, fieldsToEncrypt);
      
      expect(decrypted.ssn).toBe(userData.ssn);
      expect(decrypted.email).toBe(userData.email);
      expect(decrypted.phone).toBe(userData.phone);
      expect(decrypted.name).toBe(userData.name);
      expect(decrypted.ssn_encrypted).toBeUndefined();
      expect(decrypted.email_encrypted).toBeUndefined();
      expect(decrypted.phone_encrypted).toBeUndefined();
    });

    it('should handle missing fields gracefully', () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com'
      };

      const fieldsToEncrypt = ['ssn', 'email', 'phone']; // ssn and phone don't exist
      
      const encrypted = EncryptionService.encryptPII(userData, fieldsToEncrypt);
      
      expect(encrypted.email).not.toBe(userData.email);
      expect(encrypted.name).toBe(userData.name);
      expect(encrypted.email_encrypted).toBe(true);
      expect(encrypted.ssn).toBeUndefined();
      expect(encrypted.phone).toBeUndefined();
    });
  });

  describe('Token Generation', () => {
    it('should generate secure random tokens', () => {
      const token1 = EncryptionService.generateSecureToken(32);
      const token2 = EncryptionService.generateSecureToken(32);
      
      expect(token1).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
      expect(/^[0-9a-f]+$/i.test(token1)).toBe(true); // Valid hex
      expect(/^[0-9a-f]+$/i.test(token2)).toBe(true); // Valid hex
    });

    it('should generate tokens of different lengths', () => {
      const token16 = EncryptionService.generateSecureToken(16);
      const token64 = EncryptionService.generateSecureToken(64);
      
      expect(token16).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(token64).toHaveLength(128); // 64 bytes = 128 hex chars
    });

    it('should generate cryptographically secure random numbers', () => {
      const min = 1;
      const max = 100;
      const numbers = Array.from({ length: 100 }, () => 
        EncryptionService.generateSecureRandomNumber(min, max)
      );
      
      // All numbers should be within range
      numbers.forEach(num => {
        expect(num).toBeGreaterThanOrEqual(min);
        expect(num).toBeLessThanOrEqual(max);
      });
      
      // Should have some distribution (not all the same)
      const unique = new Set(numbers);
      expect(unique.size).toBeGreaterThan(10);
    });
  });

  describe('HMAC Signatures', () => {
    it('should create and verify HMAC signatures', () => {
      const data = 'important data to sign';
      const secret = 'secret-signing-key';
      
      const signature = EncryptionService.createHMAC(data, secret);
      
      expect(signature).toBeDefined();
      expect(signature.length).toBe(64); // SHA256 hex = 64 chars
      expect(/^[0-9a-f]+$/i.test(signature)).toBe(true);
      
      const isValid = EncryptionService.verifyHMAC(data, signature, secret);
      expect(isValid).toBe(true);
    });

    it('should reject tampered data', () => {
      const originalData = 'original data';
      const tamperedData = 'tampered data';
      const secret = 'secret-key';
      
      const signature = EncryptionService.createHMAC(originalData, secret);
      const isValid = EncryptionService.verifyHMAC(tamperedData, signature, secret);
      
      expect(isValid).toBe(false);
    });

    it('should reject wrong secret', () => {
      const data = 'data to sign';
      const correctSecret = 'correct-secret';
      const wrongSecret = 'wrong-secret';
      
      const signature = EncryptionService.createHMAC(data, correctSecret);
      const isValid = EncryptionService.verifyHMAC(data, signature, wrongSecret);
      
      expect(isValid).toBe(false);
    });

    it('should use default secret when none provided', () => {
      const data = 'test data';
      
      const signature1 = EncryptionService.createHMAC(data);
      const signature2 = EncryptionService.createHMAC(data);
      
      expect(signature1).toBe(signature2); // Same secret should produce same signature
      
      const isValid = EncryptionService.verifyHMAC(data, signature1);
      expect(isValid).toBe(true);
    });
  });

  describe('Data Masking', () => {
    it('should mask sensitive data for logging', () => {
      const creditCard = '1234567890123456';
      const masked = EncryptionService.maskSensitiveData(creditCard, 4);
      
      expect(masked).toBe('1234********3456');
      expect(masked).not.toBe(creditCard);
    });

    it('should handle short strings', () => {
      const shortString = '123';
      const masked = EncryptionService.maskSensitiveData(shortString, 4);
      
      expect(masked).toBe('***'); // All masked when shorter than visible chars * 2
    });

    it('should handle different visible character counts', () => {
      const data = '1234567890';
      
      const masked2 = EncryptionService.maskSensitiveData(data, 2);
      const masked3 = EncryptionService.maskSensitiveData(data, 3);
      
      expect(masked2).toBe('12****90');
      expect(masked3).toBe('123**890');
    });
  });

  describe('Key Derivation', () => {
    it('should derive keys for different purposes', () => {
      const masterKey = 'master-key-for-derivation';
      
      const key1 = EncryptionService.deriveKey(masterKey, 'purpose1', 32);
      const key2 = EncryptionService.deriveKey(masterKey, 'purpose2', 32);
      const key3 = EncryptionService.deriveKey(masterKey, 'purpose1', 32); // Same purpose
      
      expect(key1).not.toEqual(key2); // Different purposes = different keys
      expect(key1).toEqual(key3); // Same purpose = same key
      expect(key1.length).toBe(32);
      expect(key2.length).toBe(32);
    });

    it('should derive keys of different lengths', () => {
      const masterKey = 'master-key';
      const purpose = 'test-purpose';
      
      const key16 = EncryptionService.deriveKey(masterKey, purpose, 16);
      const key32 = EncryptionService.deriveKey(masterKey, purpose, 32);
      const key64 = EncryptionService.deriveKey(masterKey, purpose, 64);
      
      expect(key16.length).toBe(16);
      expect(key32.length).toBe(32);
      expect(key64.length).toBe(64);
    });
  });

  describe('File Encryption', () => {
    it('should encrypt and decrypt file buffers', () => {
      const fileContent = Buffer.from('This is file content that needs to be encrypted');
      
      const { encryptedData, metadata } = EncryptionService.encryptFile(fileContent);
      
      expect(encryptedData).not.toEqual(fileContent);
      expect(encryptedData.length).toBeGreaterThan(fileContent.length);
      expect(metadata).toBeDefined();
      
      const decryptedData = EncryptionService.decryptFile(encryptedData, metadata);
      expect(decryptedData).toEqual(fileContent);
    });

    it('should handle binary file data', () => {
      const binaryData = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header
      
      const { encryptedData, metadata } = EncryptionService.encryptFile(binaryData);
      const decryptedData = EncryptionService.decryptFile(encryptedData, metadata);
      
      expect(decryptedData).toEqual(binaryData);
    });

    it('should include correct metadata', () => {
      const fileContent = Buffer.from('test file content');
      
      const { metadata } = EncryptionService.encryptFile(fileContent);
      const parsedMetadata = JSON.parse(metadata);
      
      expect(parsedMetadata).toHaveProperty('algorithm');
      expect(parsedMetadata).toHaveProperty('ivLength');
      expect(parsedMetadata).toHaveProperty('tagLength');
      expect(parsedMetadata).toHaveProperty('originalSize');
      expect(parsedMetadata.originalSize).toBe(fileContent.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid encrypted data gracefully', () => {
      const invalidEncrypted = 'invalid-encrypted-data';
      
      expect(() => EncryptionService.decrypt(invalidEncrypted)).toThrow();
    });

    it('should handle missing encryption key', () => {
      delete process.env.ENCRYPTION_KEY;
      
      expect(() => EncryptionService.encrypt('test')).toThrow('ENCRYPTION_KEY environment variable is not set');
    });

    it('should handle invalid encryption key length', () => {
      process.env.ENCRYPTION_KEY = 'too-short';
      
      expect(() => EncryptionService.encrypt('test')).toThrow('ENCRYPTION_KEY must be 64 hex characters');
    });

    it('should handle corrupted file metadata', () => {
      const fileContent = Buffer.from('test content');
      const { encryptedData } = EncryptionService.encryptFile(fileContent);
      const invalidMetadata = 'invalid json metadata';
      
      expect(() => EncryptionService.decryptFile(encryptedData, invalidMetadata)).toThrow();
    });
  });

  describe('Key Generation', () => {
    it('should generate valid encryption keys', () => {
      const key = EncryptionService.generateEncryptionKey();
      
      expect(key).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(/^[0-9a-f]+$/i.test(key)).toBe(true); // Valid hex
      
      // Test that generated key works
      process.env.ENCRYPTION_KEY = key;
      const testData = 'test encryption with generated key';
      const encrypted = EncryptionService.encrypt(testData);
      const decrypted = EncryptionService.decrypt(encrypted);
      
      expect(decrypted).toBe(testData);
    });

    it('should generate different keys each time', () => {
      const key1 = EncryptionService.generateEncryptionKey();
      const key2 = EncryptionService.generateEncryptionKey();
      
      expect(key1).not.toBe(key2);
    });
  });
});