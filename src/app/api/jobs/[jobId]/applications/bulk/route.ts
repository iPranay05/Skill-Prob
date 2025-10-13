import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { ApplicationStatus } from '@/models/Job';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const BulkUpdateSchema = z.object({
  applicationIds: z.array(z.string().uuid()).min(1),
  status: z.enum(['pending', 'reviewed', 'shortlisted', 'interview_scheduled', 'rejected', 'selected', 'withdrawn']),
  notes: z.string().optional()
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        },
        { status: 401 }
      );
    }

    const { jobId } = await params;

    // Get the job posting to check ownership
    const jobPosting = await JobService.getJobPostingById(jobId);
    if (!jobPosting) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Job posting not found'
          }
        },
        { status: 404 }
      );
    }

    // Check if user can update applications for this job
    const canUpdate = authResult.user.id === jobPosting.employer_id || 
                     ['admin', 'super_admin'].includes(authResult.user.role);

    if (!canUpdate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update applications for your own job postings'
          }
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = BulkUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid bulk update data',
            details: validationResult.error.errors
          }
        },
        { status: 400 }
      );
    }

    const { applicationIds, status, notes } = validationResult.data;

    await JobService.bulkUpdateApplicationStatus(
      applicationIds,
      status as ApplicationStatus,
      authResult.user.id,
      notes
    );

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${applicationIds.length} applications`
    });
  } catch (error) {
    console.error('Error bulk updating applications:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BULK_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to bulk update applications'
        }
      },
      { status: 500 }
    );
  }
}