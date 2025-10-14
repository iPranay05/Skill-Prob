import { NextRequest, NextResponse } from 'next/server';
import { StudentLearningService } from '@/lib/studentLearningService';
import { verifyAuth } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();
    const { noteId } = await params;

    const note = await StudentLearningService.updateNote(
      noteId,
      authResult.user.userId,
      updates
    );

    return NextResponse.json({
      success: true,
      data: { note }
    });
  } catch (error) {
    console.error('Error updating note:', error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId } = await params;
    await StudentLearningService.deleteNote(noteId, authResult.user.userId);

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    
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