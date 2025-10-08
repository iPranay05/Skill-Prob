import { NextRequest, NextResponse } from 'next/server';
import { fileUploadService, FILE_CONFIGS } from '../../../../lib/fileUpload';
import { AuthMiddleware } from '../../../../middleware/auth';
import { APIError } from '../../../../lib/errors';

/**
 * POST /api/upload/presigned-url - Generate presigned URL for file upload
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authMiddleware(request, ['mentor', 'student']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.statusCode }
      );
    }

    const body = await request.json();
    const { fileName, contentType, fileCategory = 'document' } = body;

    if (!fileName || !contentType) {
      return NextResponse.json(
        { success: false, error: 'fileName and contentType are required' },
        { status: 400 }
      );
    }

    // Validate file category
    const validCategories = Object.keys(FILE_CONFIGS);
    if (!validCategories.includes(fileCategory)) {
      return NextResponse.json(
        { success: false, error: `Invalid file category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    const config = FILE_CONFIGS[fileCategory as keyof typeof FILE_CONFIGS];

    // Validate file type
    if (!config.allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { success: false, error: `File type ${contentType} not allowed for ${fileCategory}` },
        { status: 400 }
      );
    }

    // Generate presigned URL
    const result = await fileUploadService.generatePresignedUploadUrl(
      fileName,
      contentType,
      config.folder
    );

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        maxSize: config.maxSize,
        allowedTypes: config.allowedTypes
      }
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    
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
