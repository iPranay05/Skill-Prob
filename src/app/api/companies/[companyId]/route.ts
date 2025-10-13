import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const jobs = await JobService.getJobsByCompany(companyId);

    return NextResponse.json({
      success: true,
      data: {
        companyName: companyId,
        jobs: jobs
      }
    });
  } catch (error: any) {
    console.error('Error fetching company jobs:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_COMPANY_ERROR',
          message: error.message || 'Failed to fetch company jobs'
        }
      },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
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

    // Check if user is employer or admin
    if (!['employer', 'admin', 'super_admin'].includes(authResult.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only employers and admins can update company information'
          }
        },
        { status: 403 }
      );
    }

    const { companyId } = await params;
    const body = await request.json();
    
    // Update company information across all job postings
    const updatedJobs = await JobService.updateCompanyInfo(
      companyId,
      body,
      authResult.user.userId
    );

    return NextResponse.json({
      success: true,
      data: {
        companyName: companyId,
        updatedJobs: updatedJobs.length,
        message: `Updated ${updatedJobs.length} job postings`
      }
    });
  } catch (error: any) {
    console.error('Error updating company:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_COMPANY_ERROR',
          message: error.message || 'Failed to update company information'
        }
      },
      { status: error.status || 500 }
    );
  }
}