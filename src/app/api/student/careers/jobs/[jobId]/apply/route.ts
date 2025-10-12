import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { verifyToken } from '@/lib/auth';
import { CreateJobApplicationSchema } from '@/models/Job';

interface RouteParams {
    params: Promise<{
        jobId: string;
    }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

        const { jobId } = await params;
        // Check if job exists and is published
        const job = await JobService.getJobPostingById(jobId);
        if (!job || job.status !== 'published') {
            return NextResponse.json(
                { error: 'Job not found or not available for applications' },
                { status: 404 }
            );
        }

        // Check if application deadline has passed
        if (job.application_deadline && new Date() > job.application_deadline) {
            return NextResponse.json(
                { error: 'Application deadline has passed' },
                { status: 400 }
            );
        }

        // Check if max applications reached
        if (job.max_applications && job.current_applications >= job.max_applications) {
            return NextResponse.json(
                { error: 'Maximum number of applications reached' },
                { status: 400 }
            );
        }

        // Parse request body
        const body = await request.json();

        // Validate application data
        const applicationData = {
            job_posting_id: jobId,
            applicant_id: user.userId,
            resume_url: body.resume_url,
            cover_letter: body.cover_letter,
            portfolio_url: body.portfolio_url,
            application_data: body.application_data || {}
        };

        try {
            CreateJobApplicationSchema.parse(applicationData);
        } catch (validationError) {
            return NextResponse.json(
                { error: 'Invalid application data', details: validationError },
                { status: 400 }
            );
        }

        // Check if user has already applied
        const existingApplications = await JobService.getApplicationsByApplicant(user.userId);
        const hasApplied = existingApplications.some(app => app.job_posting_id === jobId);

        if (hasApplied) {
            return NextResponse.json(
                { error: 'You have already applied for this job' },
                { status: 400 }
            );
        }

        // Create application
        const application = await JobService.createJobApplication(applicationData);

        return NextResponse.json({
            success: true,
            message: 'Application submitted successfully',
            application
        });

    } catch (error) {
        console.error('Error submitting job application:', error);

        // Handle duplicate application error
        if (error instanceof Error && error.message.includes('duplicate key')) {
            return NextResponse.json(
                { error: 'You have already applied for this job' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to submit application' },
            { status: 500 }
        );
    }
}