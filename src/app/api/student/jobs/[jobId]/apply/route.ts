import { NextRequest, NextResponse } from 'next/server';
import { StudentCareerService } from '@/lib/studentCareerService';
import { verifyAuth } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applicationData = await request.json();
    const { jobId } = await params;

    const application = await StudentCareerService.applyToJob(
      jobId,
      authResult.user.userId,
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