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

    const notes = await StudentLearningService.getStudentNotes(
      decoded.userId,
      courseId || undefined
    );

    return NextResponse.json({
      success: true,
      data: { notes }
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    
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

    const noteData = await request.json();

    if (!noteData.course_id || !noteData.content) {
      return NextResponse.json(
        { error: 'Course ID and content are required' },
        { status: 400 }
      );
    }

    const note = await StudentLearningService.createNote({
      student_id: decoded.userId,
      is_private: true,
      ...noteData
    });

    return NextResponse.json({
      success: true,
      data: { note }
    });
  } catch (error) {
    console.error('Error creating note:', error);
    
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