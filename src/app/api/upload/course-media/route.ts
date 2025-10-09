import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';
import { APIError } from '../../../../lib/errors';
import { UserRole } from '../../../../types/user';

import { fileUploadService, FILE_CONFIGS } from '../../../../lib/fileUpload';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a mentor
    if (authResult.user.role !== UserRole.MENTOR) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Mentor role required.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!type || !['thumbnail', 'trailer'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Must be thumbnail or trailer' },
        { status: 400 }
      );
    }

    // Validate file type and size
    if (type === 'thumbnail') {
      const config = FILE_CONFIGS.image;
      fileUploadService.validateFile(
        { size: file.size, mimetype: file.type },
        config.allowedTypes,
        config.maxSize
      );
    } else if (type === 'trailer') {
      const config = FILE_CONFIGS.video;
      fileUploadService.validateFile(
        { size: file.size, mimetype: file.type },
        config.allowedTypes,
        config.maxSize
      );
    }

    // Upload file
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await fileUploadService.uploadFile(
      buffer,
      file.name,
      file.type,
      `courses/${type}s`
    );

    return NextResponse.json({
      success: true,
      data: {
        url: uploadResult.url,
        key: uploadResult.key,
        fileSize: file.size,
        fileType: file.type
      }
    });

  } catch (error) {
    console.error('Course media upload error:', error);
    
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