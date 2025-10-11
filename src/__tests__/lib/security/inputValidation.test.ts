import { describe, it, expect, beforeEach } from '@jest/globals';
import { InputValidator } from '@/lib/security/inputValidation';

describe('Input Validation Security Tests', () => {
  beforeEach(() => {
    // Set up environment variables for encryption
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.HMAC_SECRET = 'test-hmac-secret';
  });

  describe('HTML Sanitization', () => {
    it('should remove malicious script tags', () => {
      const maliciousInput = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = InputValidator.sanitizeHtml(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('<p>Safe content</p>');
    });

    it('should remove event handlers', () => {
      const maliciousInput = '<div onclick="alert(\'xss\')">Click me</div>';
      const sanitized = InputValidator.sanitizeHtml(maliciousInput);
      
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).toContain('Click me');
    });

    it('should allow safe HTML tags', () => {
      const safeInput = '<p>This is <strong>safe</strong> content with <em>emphasis</em></p>';
      const sanitized = InputValidator.sanitizeHtml(safeInput);
      
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<strong>');
      expect(sanitized).toContain('<em>');
    });
  });

  describe('String Sanitization', () => {
    it('should remove HTML tags from strings', () => {
      const input = '<script>alert("test")</script>Hello World';
      const sanitized = InputValidator.sanitizeString(input);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
      expect(sanitized).toContain('Hello World');
    });

    it('should remove quotes that could break SQL', () => {
      const input = "'; DROP TABLE users; --";
      const sanitized = InputValidator.sanitizeString(input);
      
      expect(sanitized).not.toContain("'");
      expect(sanitized).not.toContain('"');
    });
  });

  describe('File Upload Validation', () => {
    it('should accept valid file types', () => {
      const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const allowedTypes = ['application/pdf', 'image/jpeg'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      const result = InputValidator.validateFileUpload(validFile, allowedTypes, maxSize);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid file types', () => {
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const allowedTypes = ['application/pdf', 'image/jpeg'];
      const maxSize = 5 * 1024 * 1024;

      const result = InputValidator.validateFileUpload(invalidFile, allowedTypes, maxSize);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should reject files that are too large', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      const allowedTypes = ['application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      const result = InputValidator.validateFileUpload(largeFile, allowedTypes, maxSize);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds');
    });

    it('should reject malicious file extensions', () => {
      const maliciousFile = new File(['content'], 'virus.exe', { type: 'application/pdf' });
      const allowedTypes = ['application/pdf'];
      const maxSize = 5 * 1024 * 1024;

      const result = InputValidator.validateFileUpload(maliciousFile, allowedTypes, maxSize);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('security reasons');
    });
  });

  describe('Schema Validation', () => {
    it('should validate correct user registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890'
      };

      const result = InputValidator.validateApiRequest(
        InputValidator.userRegistrationSchema,
        validData
      );

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.errors).toBeUndefined();
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = InputValidator.validateApiRequest(
        InputValidator.userRegistrationSchema,
        invalidData
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Invalid email format');
    });

    it('should reject weak passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = InputValidator.validateApiRequest(
        InputValidator.userRegistrationSchema,
        invalidData
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Password must be at least 8 characters');
    });

    it('should validate course creation data', () => {
      const validCourse = {
        title: 'Introduction to Programming',
        description: 'Learn the basics of programming with hands-on examples and exercises.',
        category: 'Technology',
        price: 99.99,
        maxStudents: 50
      };

      const result = InputValidator.validateApiRequest(
        InputValidator.courseCreationSchema,
        validCourse
      );

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validCourse);
    });

    it('should validate payment data', () => {
      const validPayment = {
        amount: 99.99,
        currency: 'USD',
        courseId: 'course123',
        paymentMethodId: 'pm_123456'
      };

      const result = InputValidator.validateApiRequest(
        InputValidator.paymentSchema,
        validPayment
      );

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validPayment);
    });
  });

  describe('MongoDB Query Sanitization', () => {
    it('should remove dangerous MongoDB operators', () => {
      const maliciousQuery = {
        email: 'test@example.com',
        $where: 'function() { return true; }',
        password: { $ne: null },
        $regex: '/.*/',
        validField: 'validValue'
      };

      const sanitized = InputValidator.sanitizeMongoQuery(maliciousQuery);

      expect(sanitized).not.toHaveProperty('$where');
      expect(sanitized).not.toHaveProperty('$regex');
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.password).toEqual({ $ne: null }); // Allowed operator
      expect(sanitized.validField).toBe('validValue');
    });

    it('should recursively sanitize nested objects', () => {
      const nestedQuery = {
        user: {
          profile: {
            $where: 'malicious code',
            name: 'John Doe'
          }
        },
        $or: [{ email: 'test@example.com' }] // Should be removed
      };

      const sanitized = InputValidator.sanitizeMongoQuery(nestedQuery);

      expect(sanitized.user.profile).not.toHaveProperty('$where');
      expect(sanitized.user.profile.name).toBe('John Doe');
      expect(sanitized).not.toHaveProperty('$or');
    });
  });

  describe('JWT and UUID Validation', () => {
    it('should validate correct JWT format', () => {
      const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      const isValid = InputValidator.validateJWTFormat(validJWT);
      expect(isValid).toBe(true);
    });

    it('should reject invalid JWT format', () => {
      const invalidJWT = 'invalid.jwt.token.format';
      
      const isValid = InputValidator.validateJWTFormat(invalidJWT);
      expect(isValid).toBe(false);
    });

    it('should validate correct UUID format', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      
      const isValid = InputValidator.validateUUID(validUUID);
      expect(isValid).toBe(true);
    });

    it('should reject invalid UUID format', () => {
      const invalidUUID = 'not-a-uuid';
      
      const isValid = InputValidator.validateUUID(invalidUUID);
      expect(isValid).toBe(false);
    });
  });

  describe('Content Security Policy Validation', () => {
    it('should allow safe content', () => {
      const safeContent = 'This is safe text content with no scripts or dangerous elements.';
      
      const isValid = InputValidator.validateCSPCompliance(safeContent);
      expect(isValid).toBe(true);
    });

    it('should reject content with inline scripts', () => {
      const dangerousContent = '<script>alert("xss")</script>';
      
      const isValid = InputValidator.validateCSPCompliance(dangerousContent);
      expect(isValid).toBe(false);
    });

    it('should reject content with javascript: URLs', () => {
      const dangerousContent = '<a href="javascript:alert(\'xss\')">Click me</a>';
      
      const isValid = InputValidator.validateCSPCompliance(dangerousContent);
      expect(isValid).toBe(false);
    });

    it('should reject content with event handlers', () => {
      const dangerousContent = '<div onload="maliciousFunction()">Content</div>';
      
      const isValid = InputValidator.validateCSPCompliance(dangerousContent);
      expect(isValid).toBe(false);
    });

    it('should reject content with iframes', () => {
      const dangerousContent = '<iframe src="http://malicious.com"></iframe>';
      
      const isValid = InputValidator.validateCSPCompliance(dangerousContent);
      expect(isValid).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      expect(() => InputValidator.sanitizeString('')).not.toThrow();
      expect(() => InputValidator.sanitizeHtml('')).not.toThrow();
      expect(() => InputValidator.validateCSPCompliance('')).not.toThrow();
    });

    it('should handle very long inputs', () => {
      const longInput = 'x'.repeat(10000);
      
      expect(() => InputValidator.sanitizeString(longInput)).not.toThrow();
      expect(() => InputValidator.sanitizeHtml(longInput)).not.toThrow();
    });

    it('should handle special characters correctly', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      const sanitized = InputValidator.sanitizeString(specialChars);
      expect(sanitized).toBeDefined();
      expect(typeof sanitized).toBe('string');
    });

    it('should handle unicode characters', () => {
      const unicodeInput = '你好世界 🌍 مرحبا بالعالم';
      
      const sanitized = InputValidator.sanitizeString(unicodeInput);
      expect(sanitized).toContain('你好世界');
      expect(sanitized).toContain('🌍');
      expect(sanitized).toContain('مرحبا بالعالم');
    });
  });
});