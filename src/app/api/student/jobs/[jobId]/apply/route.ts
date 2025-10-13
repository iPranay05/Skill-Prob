import { NextRequest, NextResponse } from 'next/server';
import { StudentCareerService } from '@/lib/studentCareerService';
import { verifyToken } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const applicationData = await request.json();
    const { jobId } = await params;

    const application = await StudentCareerService.applyToJob(
      jobId,
      decoded.userId,
      applicationData
    );

    return NextResponse.json({
      success: true,
      data: { application }
    });
  } catch (error) {
    console.error('Error applying to job:', error);
    
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