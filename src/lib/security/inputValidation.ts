import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

export class InputValidator {
  // XSS Prevention - Sanitize HTML content
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: []
    });
  }

  // SQL Injection Prevention - Validate and escape inputs
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes that could break SQL
      .trim();
  }

  // File upload validation
  static validateFileUpload(file: File, allowedTypes: string[], maxSize: number): { valid: boolean; error?: string } {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `File type ${file.type} not allowed` };
    }

    // Check file size
    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds ${maxSize} bytes` };
    }

    // Check for malicious file extensions
    const maliciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const fileName = file.name.toLowerCase();
    if (maliciousExtensions.some(ext => fileName.endsWith(ext))) {
      return { valid: false, error: 'File type not allowed for security reasons' };
    }

    return { valid: true };
  }

  // Validate user input schemas
  static readonly userRegistrationSchema = z.object({
    email: z.string().email({ message: 'Invalid email format' }),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
        'Password must contain uppercase, lowercase, number and special character'),
    firstName: z.string()
      .min(1, 'First name required')
      .max(50, 'First name too long')
      .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),
    lastName: z.string()
      .min(1, 'Last name required')
      .max(50, 'Last name too long')
      .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),
    phone: z.string()
      .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format')
      .optional(),
    referralCode: z.string()
      .regex(/^[A-Z0-9]{6}$/, 'Invalid referral code format')
      .optional()
  });

  static readonly courseCreationSchema = z.object({
    title: z.string()
      .min(5, 'Title must be at least 5 characters')
      .max(200, 'Title too long'),
    description: z.string()
      .min(20, 'Description must be at least 20 characters')
      .max(2000, 'Description too long'),
    category: z.string().min(1, 'Category required'),
    price: z.number().min(0, 'Price cannot be negative'),
    maxStudents: z.number().min(1, 'Must allow at least 1 student').optional()
  });

  static readonly paymentSchema = z.object({
    amount: z.number().min(1, 'Amount must be positive'),
    currency: z.string().length(3, 'Invalid currency code'),
    courseId: z.string().min(1, 'Course ID required'),
    paymentMethodId: z.string().min(1, 'Payment method required')
  });

  // Rate limiting validation
  static validateRateLimit(_identifier: string, _limit: number, _window: number): boolean {
    // This would integrate with Redis-based rate limiting
    // Implementation depends on the rate limiting service
    return true; // Placeholder
  }

  // Validate API request structure
  static validateApiRequest<T>(schema: z.ZodSchema<T>, data: unknown): { valid: boolean; data?: T; errors?: string[] } {
    try {
      const validatedData = schema.parse(data);
      return { valid: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`);
        return { valid: false, errors };
      }
      return { valid: false, errors: ['Validation failed'] };
    }
  }

  // Prevent NoSQL injection
  static sanitizeMongoQuery(query: any): any {
    if (typeof query !== 'object' || query === null) {
      return query;
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(query)) {
      // Remove operators that could be used for injection
      if (key.startsWith('$') && !['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin'].includes(key)) {
        continue;
      }
      
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeMongoQuery(value);
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  // Validate JWT token format
  static validateJWTFormat(token: string): boolean {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    return jwtRegex.test(token);
  }

  // Validate UUID format
  static validateUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // Content Security Policy validation
  static validateCSPCompliance(content: string): boolean {
    // Check for inline scripts or dangerous content
    const dangerousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers
      /<iframe[^>]*>/i,
      /<object[^>]*>/i,
      /<embed[^>]*>/i
    ];

    return !dangerousPatterns.some(pattern => pattern.test(content));
  }
}