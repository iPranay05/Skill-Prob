import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { verifyAuth } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const verified = searchParams.get('verified');
    const industry = searchParams.get('industry');

    const filters: any = {};
    if (verified !== null) {
      filters.verified = verified === 'true';
    }
    if (industry) {
      filters.industry = industry;
    }

    const companies = await JobService.getCompanies(filters);

    return NextResponse.json({
      success: true,
      data: companies
    });
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_COMPANIES_ERROR',
          message: error.message || 'Failed to fetch companies'
        }
      },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
            message: 'Only employers and admins can create companies'
          }
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Basic validation - in a real app you'd want proper schema validation
    if (!body.company_name) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Company name is required'
          }
        },
        { status: 400 }
      );
    }

    const company = await JobService.createCompany(body, authResult.user.userId);

    return NextResponse.json({
      success: true,
      data: company
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating company:', error);
    
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
          code: 'CREATE_COMPANY_ERROR',
          message: error.message || 'Failed to create company'
        }
      },
      { status: error.status || 500 }
    );
  }
}