import { InputValidator } from './inputValidation';
import { EncryptionService } from './encryption';
import crypto from 'crypto';
import path from 'path';

export interface FileUploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  scanForViruses: boolean;
  encryptFiles: boolean;
  generateThumbnails: boolean;
}

export interface UploadedFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  encrypted: boolean;
  virusScanned: boolean;
  scanResult: 'clean' | 'infected' | 'pending' | 'error';
  uploadedBy: string;
  uploadedAt: Date;
  checksum: string;
}

export interface VirusScanResult {
  clean: boolean;
  threats: string[];
  scanEngine: string;
  scanDate: Date;
}

export class SecureFileUploadService {
  private static readonly DEFAULT_CONFIG: FileUploadConfig = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.doc', '.docx'],
    scanForViruses: true,
    encryptFiles: true,
    generateThumbnails: false
  };

  // Validate file before upload
  static validateFile(file: File, config: Partial<FileUploadConfig> = {}): { valid: boolean; error?: string } {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    // Basic validation using InputValidator
    const basicValidation = InputValidator.validateFileUpload(
      file,
      finalConfig.allowedMimeTypes,
      finalConfig.maxFileSize
    );

    if (!basicValidation.valid) {
      return basicValidation;
    }

    // Additional security checks
    const fileName = file.name.toLowerCase();
    const fileExtension = path.extname(fileName);

    // Check file extension
    if (!finalConfig.allowedExtensions.includes(fileExtension)) {
      return { valid: false, error: `File extension ${fileExtension} not allowed` };
    }

    // Check for double extensions (e.g., .jpg.exe)
    const extensionCount = (fileName.match(/\./g) || []).length;
    if (extensionCount > 1) {
      return { valid: false, error: 'Multiple file extensions not allowed' };
    }

    // Check for suspicious file names
    const suspiciousPatterns = [
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i, // Windows reserved names
      /[<>:"|?*]/,  // Invalid characters
      /^\./,        // Hidden files
      /\s+$/        // Trailing spaces
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(fileName))) {
      return { valid: false, error: 'Invalid file name' };
    }

    return { valid: true };
  }

  // Process file upload with security measures
  static async processFileUpload(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    uploadedBy: string,
    config: Partial<FileUploadConfig> = {}
  ): Promise<UploadedFile> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const fileId = crypto.randomUUID();
    
    try {
      // Calculate file checksum
      const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      
      // Check for duplicate files
      const existingFile = await this.findFileByChecksum(checksum);
      if (existingFile) {
        return existingFile;
      }

      // Virus scanning
      let scanResult: 'clean' | 'infected' | 'pending' | 'error' = 'pending';
      if (finalConfig.scanForViruses) {
        const virusScanResult = await this.scanForViruses(fileBuffer, originalName);
        scanResult = virusScanResult.clean ? 'clean' : 'infected';
        
        if (!virusScanResult.clean) {
          throw new Error(`File infected with: ${virusScanResult.threats.join(', ')}`);
        }
      } else {
        scanResult = 'clean';
      }

      // File type validation based on content (magic numbers)
      const contentValidation = await this.validateFileContent(fileBuffer, mimeType);
      if (!contentValidation.valid) {
        throw new Error(contentValidation.error);
      }

      // Encrypt file if required
      let processedBuffer = fileBuffer;
      let encrypted = false;
      let encryptionMetadata = '';

      if (finalConfig.encryptFiles) {
        const encryptionResult = EncryptionService.encryptFile(fileBuffer);
        processedBuffer = encryptionResult.encryptedData;
        encryptionMetadata = encryptionResult.metadata;
        encrypted = true;
      }

      // Generate secure file path
      const fileExtension = path.extname(originalName);
      const secureFileName = `${fileId}${fileExtension}`;
      const filePath = await this.generateSecureFilePath(secureFileName, uploadedBy);

      // Save file to storage
      await this.saveFileToStorage(processedBuffer, filePath);

      // Create file record
      const uploadedFile: UploadedFile = {
        id: fileId,
        originalName,
        mimeType,
        size: fileBuffer.length,
        path: filePath,
        encrypted,
        virusScanned: finalConfig.scanForViruses,
        scanResult,
        uploadedBy,
        uploadedAt: new Date(),
        checksum
      };

      // Save file metadata to database
      await this.saveFileMetadata(uploadedFile, encryptionMetadata);

      // Generate thumbnails if required
      if (finalConfig.generateThumbnails && this.isImageFile(mimeType)) {
        await this.generateThumbnails(fileId, fileBuffer);
      }

      return uploadedFile;

    } catch (error) {
      console.error('File upload processing failed:', error);
      throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Virus scanning implementation
  static async scanForViruses(fileBuffer: Buffer, fileName: string): Promise<VirusScanResult> {
    try {
      // This would integrate with a virus scanning service like ClamAV
      // For now, we'll implement basic heuristic checks
      
      const threats: string[] = [];
      
      // Check for executable file signatures
      const executableSignatures = [
        Buffer.from([0x4D, 0x5A]), // PE executable (MZ)
        Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF executable
        Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]), // Mach-O executable
      ];

      for (const signature of executableSignatures) {
        if (fileBuffer.subarray(0, signature.length).equals(signature)) {
          threats.push('Executable file detected');
          break;
        }
      }

      // Check for suspicious patterns in file content
      const suspiciousPatterns = [
        /eval\s*\(/gi,
        /document\.write\s*\(/gi,
        /javascript:/gi,
        /<script[^>]*>/gi,
        /cmd\.exe/gi,
        /powershell/gi
      ];

      const fileContent = fileBuffer.toString('utf8', 0, Math.min(fileBuffer.length, 1024));
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(fileContent)) {
          threats.push('Suspicious script content detected');
          break;
        }
      }

      // Check file name for suspicious patterns
      const suspiciousFilePatterns = [
        /\.(exe|bat|cmd|scr|pif|com|vbs|js)$/i,
        /\.(php|asp|jsp|cgi)$/i
      ];

      for (const pattern of suspiciousFilePatterns) {
        if (pattern.test(fileName)) {
          threats.push('Suspicious file extension');
          break;
        }
      }

      return {
        clean: threats.length === 0,
        threats,
        scanEngine: 'Internal Heuristic Scanner',
        scanDate: new Date()
      };

    } catch (error) {
      console.error('Virus scanning failed:', error);
      return {
        clean: false,
        threats: ['Scan error'],
        scanEngine: 'Internal Heuristic Scanner',
        scanDate: new Date()
      };
    }
  }

  // Validate file content against declared MIME type
  static async validateFileContent(fileBuffer: Buffer, declaredMimeType: string): Promise<{ valid: boolean; error?: string }> {
    const magicNumbers: { [key: string]: Buffer[] } = {
      'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
      'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
      'image/gif': [Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])],
      'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])],
      'image/webp': [Buffer.from([0x52, 0x49, 0x46, 0x46])] // RIFF header, need to check WEBP at offset 8
    };

    const expectedSignatures = magicNumbers[declaredMimeType];
    if (!expectedSignatures) {
      // If we don't have magic numbers for this type, allow it
      return { valid: true };
    }

    const fileHeader = fileBuffer.subarray(0, 16);
    const isValid = expectedSignatures.some(signature => 
      fileHeader.subarray(0, signature.length).equals(signature)
    );

    if (!isValid) {
      return { 
        valid: false, 
        error: `File content does not match declared MIME type ${declaredMimeType}` 
      };
    }

    return { valid: true };
  }

  // Generate secure file path
  static async generateSecureFilePath(fileName: string, userId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Create directory structure: uploads/YYYY/MM/DD/userId/
    const directory = `uploads/${year}/${month}/${day}/${userId}`;
    return `${directory}/${fileName}`;
  }

  // Save file to storage (placeholder - would integrate with cloud storage)
  static async saveFileToStorage(fileBuffer: Buffer, filePath: string): Promise<void> {
    // This would integrate with AWS S3, Google Cloud Storage, etc.
    console.log(`Saving file to storage: ${filePath}, size: ${fileBuffer.length} bytes`);
  }

  // Save file metadata to database
  static async saveFileMetadata(file: UploadedFile, encryptionMetadata: string): Promise<void> {
    // This would save to your database
    console.log(`Saving file metadata: ${file.id}`);
  }

  // Find file by checksum to prevent duplicates
  static async findFileByChecksum(checksum: string): Promise<UploadedFile | null> {
    // This would query your database
    console.log(`Checking for duplicate file with checksum: ${checksum}`);
    return null;
  }

  // Check if file is an image
  static isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  // Generate thumbnails for images
  static async generateThumbnails(fileId: string, imageBuffer: Buffer): Promise<void> {
    // This would integrate with an image processing library like Sharp
    console.log(`Generating thumbnails for file: ${fileId}`);
  }

  // Secure file download
  static async downloadFile(fileId: string, userId: string): Promise<{ buffer: Buffer; metadata: UploadedFile }> {
    try {
      // Get file metadata
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        throw new Error('File not found');
      }

      // Check permissions
      if (!await this.checkFileAccess(fileId, userId)) {
        throw new Error('Access denied');
      }

      // Load file from storage
      const fileBuffer = await this.loadFileFromStorage(metadata.path);

      // Decrypt if necessary
      let processedBuffer = fileBuffer;
      if (metadata.encrypted) {
        const encryptionMetadata = await this.getFileEncryptionMetadata(fileId);
        processedBuffer = EncryptionService.decryptFile(fileBuffer, encryptionMetadata);
      }

      // Verify file integrity
      const checksum = crypto.createHash('sha256').update(processedBuffer).digest('hex');
      if (checksum !== metadata.checksum) {
        throw new Error('File integrity check failed');
      }

      return { buffer: processedBuffer, metadata };

    } catch (error) {
      console.error('File download failed:', error);
      throw new Error(`File download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get file metadata from database
  static async getFileMetadata(fileId: string): Promise<UploadedFile | null> {
    // This would query your database
    console.log(`Getting file metadata: ${fileId}`);
    return null;
  }

  // Check file access permissions
  static async checkFileAccess(fileId: string, userId: string): Promise<boolean> {
    // This would check permissions in your database
    console.log(`Checking file access: ${fileId} for user: ${userId}`);
    return true;
  }

  // Load file from storage
  static async loadFileFromStorage(filePath: string): Promise<Buffer> {
    // This would load from your storage system
    console.log(`Loading file from storage: ${filePath}`);
    return Buffer.alloc(0);
  }

  // Get file encryption metadata
  static async getFileEncryptionMetadata(fileId: string): Promise<string> {
    // This would get encryption metadata from database
    console.log(`Getting encryption metadata: ${fileId}`);
    return '';
  }

  // Delete file securely
  static async deleteFile(fileId: string, userId: string): Promise<void> {
    try {
      // Check permissions
      if (!await this.checkFileAccess(fileId, userId)) {
        throw new Error('Access denied');
      }

      // Get file metadata
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        throw new Error('File not found');
      }

      // Delete from storage
      await this.deleteFromStorage(metadata.path);

      // Delete thumbnails if they exist
      await this.deleteThumbnails(fileId);

      // Remove from database
      await this.removeFileMetadata(fileId);

    } catch (error) {
      console.error('File deletion failed:', error);
      throw new Error(`File deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete from storage
  static async deleteFromStorage(filePath: string): Promise<void> {
    console.log(`Deleting file from storage: ${filePath}`);
  }

  // Delete thumbnails
  static async deleteThumbnails(fileId: string): Promise<void> {
    console.log(`Deleting thumbnails for file: ${fileId}`);
  }

  // Remove file metadata from database
  static async removeFileMetadata(fileId: string): Promise<void> {
    console.log(`Removing file metadata: ${fileId}`);
  }
}