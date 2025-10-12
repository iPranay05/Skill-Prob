import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { UpdateCompanySchema } from '@/models/JobPosting';
import { verifyAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const company = await JobService.getCompany(params.companyId);

    if (!company) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'COMPANY_NOT_FOUND',
            message: 'Company not found'
          }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: company
    });
  } catch (error: any) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_COMPANY_ERROR',
          message: error.message || 'Failed to fetch company'
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
            message: 'Only employers and admins can update companies'
          }
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = UpdateCompanySchema.parse(body);

    const company = await JobService.updateCompany(
      params.companyId,
      validatedData,
      authResult.user.id
    );

    return NextResponse.json({
      success: true,
      data: company
    });
  } catch (error: any) {
    console.error('Error updating company:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors
          }
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_COMPANY_ERROR',
          message: error.message || 'Failed to update company'
        }
      },
      { status: error.status || 500 }
    );
  }
}