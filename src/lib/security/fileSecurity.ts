import crypto from 'crypto';
import { EncryptionService } from './encryption';

export interface FileSecurityResult {
  safe: boolean;
  threats: string[];
  fileHash: string;
  metadata: {
    size: number;
    type: string;
    name: string;
    uploadDate: Date;
  };
}

export interface QuarantineRecord {
  id?: string;
  fileHash: string;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  threats: string[];
  quarantineDate: Date;
  status: 'quarantined' | 'cleaned' | 'deleted';
  reviewedBy?: string;
  reviewDate?: Date;
}

export class FileSecurityService {
  // Allowed file types for different contexts
  static readonly ALLOWED_TYPES = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    videos: ['video/mp4', 'video/webm', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    archives: ['application/zip', 'application/x-rar-compressed'],
    courseContent: ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4', 'audio/mpeg']
  };

  // Maximum file sizes (in bytes)
  static readonly MAX_SIZES = {
    image: 10 * 1024 * 1024, // 10MB
    document: 50 * 1024 * 1024, // 50MB
    video: 500 * 1024 * 1024, // 500MB
    audio: 100 * 1024 * 1024, // 100MB
    default: 10 * 1024 * 1024 // 10MB
  };

  // Dangerous file extensions
  static readonly DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.app', '.deb', '.pkg', '.dmg', '.rpm', '.msi', '.run', '.bin',
    '.sh', '.ps1', '.php', '.asp', '.jsp', '.py', '.rb', '.pl'
  ];

  // Virus signature patterns (simplified - in production use proper antivirus)
  static readonly VIRUS_SIGNATURES = [
    'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*', // EICAR test
    'TVqQAAMAAAAEAAAA//8AALgAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // PE header
    '4D5A', // DOS header
    '504B0304', // ZIP header (potential zip bomb)
  ];

  // Scan file for security threats
  static async scanFile(fileBuffer: Buffer, fileName: string, uploadedBy: string): Promise<FileSecurityResult> {
    const fileHash = this.calculateFileHash(fileBuffer);
    const fileType = this.detectFileType(fileBuffer, fileName);
    
    const result: FileSecurityResult = {
      safe: true,
      threats: [],
      fileHash,
      metadata: {
        size: fileBuffer.length,
        type: fileType,
        name: fileName,
        uploadDate: new Date()
      }
    };

    // Check file extension
    const extensionThreats = this.checkFileExtension(fileName);
    result.threats.push(...extensionThreats);

    // Check file size
    const sizeThreats = this.checkFileSize(fileBuffer.length, fileType);
    result.threats.push(...sizeThreats);

    // Check for virus signatures
    const virusThreats = this.checkVirusSignatures(fileBuffer);
    result.threats.push(...virusThreats);

    // Check for malicious content
    const contentThreats = await this.checkMaliciousContent(fileBuffer, fileType);
    result.threats.push(...contentThreats);

    // Check for zip bombs
    if (this.isArchiveFile(fileType)) {
      const zipBombThreats = await this.checkZipBomb(fileBuffer);
      result.threats.push(...zipBombThreats);
    }

    result.safe = result.threats.length === 0;

    // Quarantine if threats found
    if (!result.safe) {
      await this.quarantineFile(fileHash, fileName, fileBuffer.length, uploadedBy, result.threats);
    }

    return result;
  }

  // Calculate file hash for identification
  static calculateFileHash(fileBuffer: Buffer): string {
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  // Detect file type from content
  static detectFileType(fileBuffer: Buffer, fileName: string): string {
    // Check magic numbers
    const header = fileBuffer.slice(0, 16).toString('hex').toUpperCase();
    
    // Common file signatures
    const signatures: Record<string, string> = {
      'FFD8FF': 'image/jpeg',
      '89504E47': 'image/png',
      '47494638': 'image/gif',
      '52494646574542': 'image/webp',
      '25504446': 'application/pdf',
      '504B0304': 'application/zip',
      '526172211A07': 'application/x-rar-compressed',
      '00000018667479706D703432': 'video/mp4',
      '1A45DFA3': 'video/webm',
      'ID3': 'audio/mpeg',
      '52494646': 'audio/wav'
    };

    for (const [signature, mimeType] of Object.entries(signatures)) {
      if (header.startsWith(signature)) {
        return mimeType;
      }
    }

    // Fallback to file extension
    const extension = fileName.toLowerCase().split('.').pop();
    const extensionMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'mp4': 'video/mp4',
      'mp3': 'audio/mpeg',
      'zip': 'application/zip'
    };

    return extensionMap[extension || ''] || 'application/octet-stream';
  }

  // Check file extension for dangerous types
  static checkFileExtension(fileName: string): string[] {
    const threats: string[] = [];
    const extension = '.' + fileName.toLowerCase().split('.').pop();
    
    if (this.DANGEROUS_EXTENSIONS.includes(extension)) {
      threats.push(`Dangerous file extension: ${extension}`);
    }

    // Check for double extensions (e.g., file.pdf.exe)
    const parts = fileName.toLowerCase().split('.');
    if (parts.length > 2) {
      const secondLastExtension = '.' + parts[parts.length - 2];
      if (this.DANGEROUS_EXTENSIONS.includes(secondLastExtension)) {
        threats.push(`Hidden dangerous extension: ${secondLastExtension}`);
      }
    }

    return threats;
  }

  // Check file size limits
  static checkFileSize(size: number, fileType: string): string[] {
    const threats: string[] = [];
    
    let maxSize = this.MAX_SIZES.default;
    
    if (fileType.startsWith('image/')) maxSize = this.MAX_SIZES.image;
    else if (fileType.startsWith('video/')) maxSize = this.MAX_SIZES.video;
    else if (fileType.startsWith('audio/')) maxSize = this.MAX_SIZES.audio;
    else if (fileType.includes('pdf') || fileType.includes('document')) maxSize = this.MAX_SIZES.document;

    if (size > maxSize) {
      threats.push(`File size ${size} exceeds maximum allowed size ${maxSize}`);
    }

    // Check for suspiciously small files that claim to be certain types
    if (fileType.startsWith('video/') && size < 1024) {
      threats.push('Suspiciously small video file');
    }

    return threats;
  }

  // Check for virus signatures
  static checkVirusSignatures(fileBuffer: Buffer): string[] {
    const threats: string[] = [];
    const content = fileBuffer.toString('hex').toUpperCase();
    const textContent = fileBuffer.toString('ascii');

    for (const signature of this.VIRUS_SIGNATURES) {
      if (content.includes(signature) || textContent.includes(signature)) {
        threats.push(`Virus signature detected: ${signature.substring(0, 20)}...`);
      }
    }

    return threats;
  }

  // Check for malicious content patterns
  static async checkMaliciousContent(fileBuffer: Buffer, fileType: string): Promise<string[]> {
    const threats: string[] = [];
    const content = fileBuffer.toString('ascii', 0, Math.min(fileBuffer.length, 10000)); // Check first 10KB

    // Check for script injections
    const scriptPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /document\.write/i,
      /window\.location/i
    ];

    scriptPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        threats.push('Potential script injection detected');
      }
    });

    // Check for SQL injection patterns
    const sqlPatterns = [
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /update\s+set/i
    ];

    sqlPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        threats.push('Potential SQL injection pattern detected');
      }
    });

    // Check for suspicious URLs
    const urlPattern = /https?:\/\/[^\s<>"']+/gi;
    const urls = content.match(urlPattern);
    if (urls && urls.length > 10) {
      threats.push('Suspicious number of URLs detected');
    }

    return threats;
  }

  // Check for zip bombs
  static async checkZipBomb(fileBuffer: Buffer): Promise<string[]> {
    const threats: string[] = [];
    
    // Simple zip bomb detection - check compression ratio
    // In production, use a proper zip library with safety limits
    const header = fileBuffer.slice(0, 4).toString('hex');
    
    if (header === '504b0304') { // ZIP file
      // Check for suspicious compression patterns
      const compressionRatio = fileBuffer.length / 1024; // Simplified
      
      if (compressionRatio < 0.01) { // Less than 1% of original size
        threats.push('Potential zip bomb detected - suspicious compression ratio');
      }
    }

    return threats;
  }

  // Check if file is an archive
  static isArchiveFile(fileType: string): boolean {
    return ['application/zip', 'application/x-rar-compressed', 'application/x-tar', 'application/gzip'].includes(fileType);
  }

  // Quarantine suspicious file
  static async quarantineFile(
    fileHash: string,
    fileName: string,
    fileSize: number,
    uploadedBy: string,
    threats: string[]
  ): Promise<void> {
    try {
      const quarantineRecord: QuarantineRecord = {
        fileHash,
        fileName,
        fileSize,
        uploadedBy,
        threats,
        quarantineDate: new Date(),
        status: 'quarantined'
      };

      // In production, store in database
      console.warn('FILE QUARANTINED:', quarantineRecord);
      
      // Alert security team
      await this.alertSecurityTeam(quarantineRecord);
    } catch (error) {
      console.error('Error quarantining file:', error);
    }
  }

  // Alert security team about threats
  static async alertSecurityTeam(quarantineRecord: QuarantineRecord): Promise<void> {
    // In production, integrate with alerting system (email, Slack, etc.)
    console.error('SECURITY ALERT - File quarantined:', {
      fileName: quarantineRecord.fileName,
      uploadedBy: quarantineRecord.uploadedBy,
      threats: quarantineRecord.threats,
      timestamp: quarantineRecord.quarantineDate
    });
  }

  // Sanitize file name
  static sanitizeFileName(fileName: string): string {
    // Remove dangerous characters
    let sanitized = fileName.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
    
    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');
    
    // Limit length
    if (sanitized.length > 255) {
      const extension = sanitized.split('.').pop();
      const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
      sanitized = nameWithoutExt.substring(0, 255 - extension!.length - 1) + '.' + extension;
    }
    
    // Ensure it's not empty
    if (!sanitized) {
      sanitized = 'unnamed_file';
    }
    
    return sanitized;
  }

  // Generate secure file path
  static generateSecureFilePath(userId: string, fileName: string, category: string): string {
    const sanitizedName = this.sanitizeFileName(fileName);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    
    return `${category}/${userId}/${timestamp}_${random}_${sanitizedName}`;
  }

  // Validate file type for context
  static validateFileTypeForContext(fileType: string, context: keyof typeof FileSecurityService.ALLOWED_TYPES): boolean {
    const allowedTypes = this.ALLOWED_TYPES[context];
    return allowedTypes.includes(fileType);
  }

  // Create file upload token (for secure uploads)
  static createUploadToken(userId: string, fileName: string, fileSize: number): string {
    const payload = {
      userId,
      fileName,
      fileSize,
      timestamp: Date.now(),
      expires: Date.now() + (60 * 60 * 1000) // 1 hour
    };
    
    return EncryptionService.encrypt(JSON.stringify(payload));
  }

  // Verify upload token
  static verifyUploadToken(token: string): { valid: boolean; payload?: any } {
    try {
      const decrypted = EncryptionService.decrypt(token);
      const payload = JSON.parse(decrypted);
      
      if (payload.expires < Date.now()) {
        return { valid: false };
      }
      
      return { valid: true, payload };
    } catch (error) {
      return { valid: false };
    }
  }

  // Secure file deletion
  static async secureDeleteFile(filePath: string): Promise<void> {
    try {
      // In production, this would securely overwrite the file before deletion
      // For cloud storage, ensure proper deletion with verification
      console.log(`Securely deleting file: ${filePath}`);
      
      // Overwrite with random data multiple times (for local files)
      // await this.overwriteFile(filePath);
      
      // Delete the file
      // await fs.unlink(filePath);
      
    } catch (error) {
      console.error('Error securely deleting file:', error);
      throw new Error('Failed to securely delete file');
    }
  }

  // Check file integrity
  static verifyFileIntegrity(fileBuffer: Buffer, expectedHash: string): boolean {
    const actualHash = this.calculateFileHash(fileBuffer);
    return crypto.timingSafeEqual(
      Buffer.from(expectedHash, 'hex'),
      Buffer.from(actualHash, 'hex')
    );
  }

  // Generate file access token
  static generateFileAccessToken(userId: string, filePath: string, expiryMinutes: number = 60): string {
    const payload = {
      userId,
      filePath,
      expires: Date.now() + (expiryMinutes * 60 * 1000)
    };
    
    return EncryptionService.encrypt(JSON.stringify(payload));
  }

  // Verify file access token
  static verifyFileAccessToken(token: string, userId: string, filePath: string): boolean {
    try {
      const decrypted = EncryptionService.decrypt(token);
      const payload = JSON.parse(decrypted);
      
      return payload.userId === userId && 
             payload.filePath === filePath && 
             payload.expires > Date.now();
    } catch (error) {
      return false;
    }
  }
}