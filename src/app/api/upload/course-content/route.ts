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

        if (!type || !['video', 'document', 'audio'].includes(type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid file type. Must be video, document, or audio' },
                { status: 400 }
            );
        }

        // Validate file type and size using the file upload service
        let config;
        if (type === 'video') {
            config = FILE_CONFIGS.video;
        } else if (type === 'document') {
            config = FILE_CONFIGS.document;
        } else if (type === 'audio') {
            config = FILE_CONFIGS.audio;
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid file type' },
                { status: 400 }
            );
        }

        fileUploadService.validateFile(
            { size: file.size, mimetype: file.type },
            config.allowedTypes,
            config.maxSize
        );

        // Upload file
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadResult = await fileUploadService.uploadFile(
            buffer,
            file.name,
            file.type,
            `courses/content/${type}s`
        );

        return NextResponse.json({
            success: true,
            data: {
                url: uploadResult.url,
                key: uploadResult.key,
                fileSize: file.size,
                fileType: file.type,
                duration: type === 'video' || type === 'audio' ? await getMediaDuration(file) : undefined
            }
        });

    } catch (error) {
        console.error('Course content upload error:', error);

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

// Helper function to get media duration (simplified - returns 0 for now)
// In production, you'd use a proper media processing library like ffprobe
async function getMediaDuration(file: File): Promise<number> {
    // For now, return 0. In production, you would use a library like:
    // - ffprobe to extract video/audio metadata
    // - A media processing service
    // - Client-side duration detection before upload
    return 0;
}