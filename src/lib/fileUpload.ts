import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { APIError } from './errors';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;
const CDN_URL = process.env.AWS_CLOUDFRONT_URL;

export interface UploadResult {
  key: string;
  url: string;
  cdnUrl?: string;
  size: number;
  contentType: string;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

export class FileUploadService {
  /**
   * Generate a unique file key
   */
  private generateFileKey(originalName: string, folder: string = 'uploads'): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${folder}/${timestamp}-${randomString}.${extension}`;
  }

  /**
   * Get public URL for a file
   */
  private getPublicUrl(key: string): string {
    if (CDN_URL) {
      return `${CDN_URL}/${key}`;
    }
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  }

  /**
   * Upload file directly to S3
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    contentType: string,
    folder: string = 'uploads'
  ): Promise<UploadResult> {
    try {
      const key = this.generateFileKey(originalName, folder);
      
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read',
      });

      await s3Client.send(command);

      const url = this.getPublicUrl(key);

      return {
        key,
        url,
        cdnUrl: CDN_URL ? `${CDN_URL}/${key}` : undefined,
        size: buffer.length,
        contentType,
      };
    } catch (error) {
      throw new APIError('Failed to upload file', 500, 'UPLOAD_ERROR', error);
    }
  }

  /**
   * Generate presigned URL for direct upload from client
   */
  async generatePresignedUploadUrl(
    fileName: string,
    contentType: string,
    folder: string = 'uploads',
    expiresIn: number = 3600 // 1 hour
  ): Promise<PresignedUrlResult> {
    try {
      const key = this.generateFileKey(fileName, folder);
      
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        ACL: 'public-read',
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
      const publicUrl = this.getPublicUrl(key);

      return {
        uploadUrl,
        key,
        publicUrl,
      };
    } catch (error) {
      throw new APIError('Failed to generate presigned URL', 500, 'PRESIGNED_URL_ERROR', error);
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
    } catch (error) {
      throw new APIError('Failed to delete file', 500, 'DELETE_ERROR', error);
    }
  }

  /**
   * Generate presigned URL for downloading private files
   */
  async generatePresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600 // 1 hour
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      throw new APIError('Failed to generate download URL', 500, 'DOWNLOAD_URL_ERROR', error);
    }
  }

  /**
   * Validate file type and size
   */
  validateFile(
    file: { size: number; mimetype: string },
    allowedTypes: string[],
    maxSize: number
  ): void {
    if (file.size > maxSize) {
      throw new APIError(
        `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`,
        400,
        'FILE_TOO_LARGE'
      );
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new APIError(
        `File type ${file.mimetype} is not allowed`,
        400,
        'INVALID_FILE_TYPE'
      );
    }
  }

  /**
   * Get file type category
   */
  getFileCategory(mimetype: string): string {
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype.includes('pdf')) return 'document';
    if (mimetype.includes('document') || mimetype.includes('text')) return 'document';
    return 'other';
  }
}

// File type configurations
export const FILE_CONFIGS = {
  video: {
    allowedTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'],
    maxSize: 500 * 1024 * 1024, // 500MB
    folder: 'videos',
  },
  image: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    folder: 'images',
  },
  document: {
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    folder: 'documents',
  },
  audio: {
    allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
    maxSize: 100 * 1024 * 1024, // 100MB
    folder: 'audio',
  },
};

export const fileUploadService = new FileUploadService();