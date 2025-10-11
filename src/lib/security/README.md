# Security Module

This module provides comprehensive security features for the Skill Probe LMS platform, including data protection, compliance, and fraud prevention measures.

## Components

### 1. Input Validation (`inputValidation.ts`)
- **XSS Prevention**: Sanitizes HTML content using DOMPurify
- **SQL/NoSQL Injection Prevention**: Validates and sanitizes database queries
- **File Upload Validation**: Checks file types, sizes, and malicious extensions
- **Schema Validation**: Uses Zod for robust input validation
- **Rate Limiting**: Placeholder for Redis-based rate limiting

**Key Features:**
- User registration schema validation
- Course creation validation
- Payment data validation
- JWT token format validation
- Content Security Policy compliance checks

### 2. Encryption Service (`encryption.ts`)
- **AES-256-GCM Encryption**: Industry-standard encryption for sensitive data
- **Field-level Encryption**: Encrypt specific PII fields
- **File Encryption**: Secure file storage with encryption
- **HMAC Signatures**: Data integrity verification
- **Secure Token Generation**: Cryptographically secure random tokens

**Key Features:**
- Environment-based encryption keys
- Secure data masking for logging
- Key derivation for different purposes
- Memory-safe operations

### 3. GDPR Compliance (`gdprCompliance.ts`)
- **Data Export**: Right to data portability
- **Data Deletion**: Right to be forgotten with retention checks
- **Consent Management**: Track and manage user consents
- **Data Anonymization**: Anonymize data while preserving analytics
- **Privacy Impact Assessment**: Framework for privacy assessments

**Key Features:**
- Automated data compilation for export
- Legal retention requirement checks
- Consent recording and retrieval
- Data breach notification system

### 4. Secure File Upload (`secureFileUpload.ts`)
- **Virus Scanning**: Heuristic-based malware detection
- **Content Validation**: Magic number verification against MIME types
- **File Encryption**: Automatic encryption of uploaded files
- **Duplicate Detection**: Checksum-based duplicate prevention
- **Secure Download**: Encrypted file retrieval with access controls

**Key Features:**
- Configurable upload policies
- Thumbnail generation for images
- Secure file path generation
- File integrity verification

### 5. Audit Logging (`auditLogger.ts`)
- **Security Event Logging**: Comprehensive audit trail
- **Suspicious Activity Detection**: Pattern-based threat detection
- **Audit Reports**: Configurable reporting system
- **Real-time Monitoring**: Immediate security alerts
- **Compliance Logging**: Structured logs for compliance requirements

**Key Features:**
- Multiple severity levels
- Categorized event types
- Automated threat detection
- Fallback logging mechanisms

## Usage Examples

### Input Validation
```typescript
import { InputValidator } from './security';

// Validate user registration
const result = InputValidator.validateApiRequest(
  InputValidator.userRegistrationSchema,
  userData
);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}

// Sanitize HTML content
const cleanHtml = InputValidator.sanitizeHtml(userInput);
```

### Encryption
```typescript
import { EncryptionService } from './security';

// Encrypt sensitive data
const encrypted = EncryptionService.encrypt('sensitive data');
const decrypted = EncryptionService.decrypt(encrypted);

// Encrypt PII fields
const userData = { email: 'user@example.com', phone: '123456789' };
const encryptedData = EncryptionService.encryptPII(userData, ['email', 'phone']);
```

### GDPR Compliance
```typescript
import { GDPRComplianceService } from './security';

// Request data export
const exportId = await GDPRComplianceService.requestDataExport(userId);

// Record consent
await GDPRComplianceService.recordConsent({
  userId,
  consentType: 'marketing',
  granted: true,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date(),
  version: '1.0'
});
```

### Secure File Upload
```typescript
import { SecureFileUploadService } from './security';

// Process file upload
const uploadedFile = await SecureFileUploadService.processFileUpload(
  fileBuffer,
  originalName,
  mimeType,
  userId,
  {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    scanForViruses: true,
    encryptFiles: true
  }
);
```

### Audit Logging
```typescript
import { AuditLogger } from './security';

// Log security event
await AuditLogger.logSecurityEvent({
  type: 'login_success',
  userId,
  details: { method: 'email' },
  metadata: {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    sessionId: req.sessionID
  }
});

// Log user action
await AuditLogger.logUserAction(
  userId,
  'course_enrollment',
  'course',
  courseId,
  { enrollmentType: 'paid' },
  { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
);
```

## Environment Variables

```env
# Encryption
ENCRYPTION_KEY=64_character_hex_string
HMAC_SECRET=your_hmac_secret

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf

# Security
RATE_LIMIT_WINDOW=3600
RATE_LIMIT_MAX_REQUESTS=100
```

## Security Best Practices

1. **Key Management**: Store encryption keys securely, rotate regularly
2. **Access Control**: Implement role-based access to security functions
3. **Monitoring**: Set up alerts for security events
4. **Regular Audits**: Review audit logs and security configurations
5. **Updates**: Keep dependencies updated for security patches
6. **Testing**: Regular security testing and penetration testing
7. **Backup**: Secure backup of audit logs and security configurations

## Compliance Features

- **GDPR**: Data export, deletion, consent management
- **CCPA**: Data access and deletion rights
- **SOX**: Audit logging and data integrity
- **HIPAA**: Data encryption and access controls (if applicable)
- **PCI DSS**: Secure payment data handling

## Integration Points

- **Database**: MongoDB for audit logs and compliance records
- **Cache**: Redis for rate limiting and session management
- **Storage**: S3-compatible storage for encrypted files
- **Notifications**: Email/SMS for security alerts
- **Monitoring**: Integration with monitoring systems

## Testing

Each security component includes comprehensive test coverage:
- Unit tests for individual functions
- Integration tests for end-to-end workflows
- Security tests for vulnerability assessment
- Performance tests for encryption operations

## Maintenance

- Regular security updates
- Key rotation procedures
- Audit log archival
- Performance monitoring
- Compliance reporting