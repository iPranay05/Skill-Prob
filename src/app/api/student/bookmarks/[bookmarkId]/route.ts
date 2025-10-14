import { NextRequest, NextResponse } from 'next/server';
import { StudentLearningService } from '@/lib/studentLearningService';
import { verifyToken } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bookmarkId: string }> }
) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    const { bookmarkId } = await params;
    await StudentLearningService.deleteBookmark(bookmarkId, authResult.user.userId);

    return NextResponse.json({
      success: true,
      message: 'Bookmark deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}