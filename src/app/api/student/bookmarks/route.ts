import { NextRequest, NextResponse } from 'next/server';
import { StudentLearningService } from '@/lib/studentLearningService';
import { verifyToken } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    const bookmarks = await StudentLearningService.getStudentBookmarks(
      decoded.userId,
      courseId || undefined
    );

    return NextResponse.json({
      success: true,
      data: { bookmarks }
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    
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

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const bookmarkData = await request.json();

    if (!bookmarkData.course_id || !bookmarkData.title) {
      return NextResponse.json(
        { error: 'Course ID and title are required' },
        { status: 400 }
      );
    }

    const bookmark = await StudentLearningService.createBookmark({
      student_id: decoded.userId,
      ...bookmarkData
    });

    return NextResponse.json({
      success: true,
      data: { bookmark }
    });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    
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