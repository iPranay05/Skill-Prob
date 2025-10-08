import { NextRequest, NextResponse } from 'next/server';
import { CourseContentService } from '../../../../../../../lib/courseContentService';
import { fileUploadService } from '../../../../../../../lib/fileUpload';
import { AuthMiddleware } from '../../../../../../../middleware/auth';
import { UserRole } from '../../../../../../../types/user';
import { APIError } from '../../../../../../../lib/errors';
import { createClient } from '@supabase/supabase-js';

const courseContentService = new CourseContentService();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/courses/[courseId]/resources/[resourceId]/download - Download a resource
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string; resourceId: string } }
) {
  try {
    // Authenticate user
    const authResult = await AuthMiddleware.requireAuth(request, [UserRole.STUDENT, UserRole.MENTOR]);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const { userId, role } = user;
    const { courseId, resourceId } = params;

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(courseId) || !uuidRegex.test(resourceId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    // Get resource details
    const { data: resource, error: resourceError } = await supabase
      .from('course_resources')
      .select('*')
      .eq('id', resourceId)
      .eq('course_id', courseId)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (!resource.is_free) {
      // For paid resources, check if user is enrolled or is the mentor
      if (role === 'mentor') {
        // Check if mentor owns the course
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('mentor_id')
          .eq('id', courseId)
          .single();

        if (courseError || !course || course.mentor_id !== userId) {
          return NextResponse.json(
            { success: false, error: 'Unauthorized access' },
            { status: 403 }
          );
        }
      } else {
        // Check if student is enrolled
        const { data: enrollment, error: enrollmentError } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('course_id', courseId)
          .eq('student_id', userId)
          .single();

        if (enrollmentError || !enrollment) {
          return NextResponse.json(
            { success: false, error: 'You must be enrolled to download this resource' },
            { status: 403 }
          );
        }
      }
    }

    // Extract S3 key from file URL
    const fileUrl = resource.file_url;
    let s3Key: string;

    try {
      const url = new URL(fileUrl);
      // Extract key from S3 URL or CDN URL
      if (url.hostname.includes('amazonaws.com')) {
        s3Key = url.pathname.substring(1); // Remove leading slash
      } else if (url.hostname.includes('cloudfront.net') || process.env.AWS_CLOUDFRONT_URL?.includes(url.hostname)) {
        s3Key = url.pathname.substring(1); // Remove leading slash
      } else {
        throw new Error('Invalid file URL format');
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid file URL' },
        { status: 400 }
      );
    }

    // Generate presigned download URL
    const downloadUrl = await fileUploadService.generatePresignedDownloadUrl(s3Key, 3600); // 1 hour expiry

    // Increment download count
    await courseContentService.incrementDownloadCount(resourceId);

    return NextResponse.json({
      success: true,
      data: {
        downloadUrl,
        fileName: resource.title,
        fileSize: resource.file_size,
        fileType: resource.file_type
      }
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}