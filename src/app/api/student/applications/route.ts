import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { verifyToken } from '@/lib/auth';
import { ApplicationStatus } from '@/models/Job';

export async function GET(request: NextRequest) {
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

    // Get applications for the student
    const applications = await JobService.getApplicationsByApplicant(user.userId);

    // Calculate stats
    const stats = applications.reduce((acc, app) => {
      acc.total_applications++;
      acc[app.status as keyof typeof acc]++;
      return acc;
    }, {
      total_applications: 0,
      pending: 0,
      reviewed: 0,
      shortlisted: 0,
      interview_scheduled: 0,
      rejected: 0,
      selected: 0,
      withdrawn: 0
    });

    return NextResponse.json({
      success: true,
      applications,
      stats
    });

  } catch (error) {
    console.error('Error fetching student applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}