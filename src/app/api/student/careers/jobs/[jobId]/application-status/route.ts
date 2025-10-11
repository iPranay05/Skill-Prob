import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { verifyToken } from '@/lib/auth';

interface RouteParams {
  params: {
    jobId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { success, user } = await verifyToken(request);
    
    if (!success || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is a student
    if (user.role !== 'student') {
      return NextResponse.json(
        { error: 'Access denied. Student role required.' },
        { status: 403 }
      );
    }

    // Get user's applications
    const applications = await JobService.getApplicationsByApplicant(user.userId);
    
    // Check if user has applied for this job
    const hasApplied = applications.some(app => app.job_posting_id === params.jobId);
    
    // Get the application if it exists
    const application = applications.find(app => app.job_posting_id === params.jobId);

    return NextResponse.json({
      success: true,
      hasApplied,
      application: application || null
    });

  } catch (error) {
    console.error('Error checking application status:', error);
    return NextResponse.json(
      { error: 'Failed to check application status' },
      { status: 500 }
    );
  }
}