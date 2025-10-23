import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  contentType: string;
}

export class SupabaseStorageService {
  private bucketName = 'courses';

  /**
   * Initialize storage bucket if it doesn't exist
   */
  async initializeBucket() {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName);
      
      if (!bucketExists) {
        // Simple bucket creation without restrictions
        const { error } = await supabase.storage.createBucket(this.bucketName, {
          public: true
        });
        
        if (error) {
          console.error('Error creating bucket:', error);
          console.log('Please create the "courses" bucket manually in Supabase dashboard');
        } else {
          console.log('✅ Courses bucket created successfully');
        }
      } else {
        console.log('✅ Courses bucket already exists');
      }
    } catch (error) {
      console.error('Error initializing bucket:', error);
    }
  }

  /**
   * Generate unique file path
   */
  private generateFilePath(originalName: string, type: 'thumbnail' | 'trailer'): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${type}s/${timestamp}-${randomString}.${extension}`;
  }

  /**
   * Upload course media file
   */
  async uploadCourseMedia(file: File, type: 'thumbnail' | 'trailer'): Promise<UploadResult> {
    try {
      // Initialize bucket if needed
      await this.initializeBucket();

      // Generate unique file path
      const filePath = this.generateFilePath(file.name, type);

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        path: filePath,
        size: file.size,
        contentType: file.type
      };

    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Delete course media file
   */
  async deleteCourseMedia(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Get signed URL for private files (if needed)
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw new Error(`Failed to get signed URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      throw error;
    }
  }

  /**
   * Validate file type and size
   */
  validateFile(file: File, type: 'thumbnail' | 'trailer'): void {
    const maxSizes = {
      thumbnail: 10 * 1024 * 1024, // 10MB
      trailer: 50 * 1024 * 1024    // 50MB for Supabase free tier
    };

    const allowedTypes = {
      thumbnail: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      trailer: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov']
    };

    // Check file size
    if (file.size > maxSizes[type]) {
      throw new Error(`File size exceeds limit of ${Math.round(maxSizes[type] / 1024 / 1024)}MB. Please compress your video or use a smaller file.`);
    }

    // Check file type
    if (!allowedTypes[type].includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed for ${type}`);
    }
  }
}

// Export singleton instance
export const supabaseStorageService = new SupabaseStorageService();

// Convenience function for course media upload
export async function uploadCourseMedia(file: File, type: 'thumbnail' | 'trailer'): Promise<UploadResult> {
  // Validate file first
  supabaseStorageService.validateFile(file, type);
  
  // Upload file
  return supabaseStorageService.uploadCourseMedia(file, type);
}
