import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { verifyToken } from '@/lib/auth';

interface RouteParams {
  params: {
    applicationId: string;
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

    // Get application details
    const application = await JobService.getJobApplicationById(params.applicationId);

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Verify the application belongs to the current user
    if (application.applicant_id !== user.userId) {
      return NextResponse.json(
        { error: 'Access denied. You can only view your own applications.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      application
    });

  } catch (error) {
    console.error('Error fetching application details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application details' },
      { status: 500 }
    );
  }
}