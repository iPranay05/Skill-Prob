import { NextRequest, NextResponse } from 'next/server';
import { StudentLearningService } from '@/lib/studentLearningService';
import { verifyAuth } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    const assignments = await StudentLearningService.getCourseAssignments(courseId);

    return NextResponse.json({
      success: true,
      data: { assignments }
    });
  } catch (error) {
    console.error('Error fetching course assignments:', error);
    
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