import { NextRequest, NextResponse } from 'next/server';
import { StudentCareerService } from '@/lib/studentCareerService';
import { verifyToken } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    let userId: string | undefined;

    if (token) {
      const decoded = verifyToken(token);
      userId = decoded?.userId;
    }

    const job = await StudentCareerService.getJobById(params.jobId, userId);

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