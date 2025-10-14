import { NextRequest, NextResponse } from 'next/server';
import { StudentCareerService } from '@/lib/studentCareerService';
import { verifyAuth } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    let userId: string | undefined;

    try {
      const authResult = await verifyAuth(request);
      if (authResult.success && authResult.user) {
        userId = authResult.user.userId;
      }
    } catch {
      // Optional authentication - continue without userId
    }

    const { jobId } = await params;
    const job = await StudentCareerService.getJobById(jobId, userId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { job }
    });
  } catch (error) {
    console.error('Error fetching job:', error);

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