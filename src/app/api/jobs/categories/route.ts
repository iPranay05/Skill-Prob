import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobService';
import { JobCategorySchema } from '@/models/Job';
import { verifyAuth } from '@/lib/auth';

export async function GET() {
  try {
    const categories = await JobService.getJobCategories();

    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error getting job categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get job categories'
        }
      },
      { status: 500 }
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

    // Check if user is admin
    if (!['admin', 'super_admin'].includes(authResult.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only admins can create job categories'
          }
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = JobCategorySchema.omit({ id: true, created_at: true }).safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid category data',
            details: validationResult.error.issues
          }
        },
        { status: 400 }
      );
    }

    const category = await JobService.createJobCategory(validationResult.data);

    return NextResponse.json({
      success: true,
      data: category
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating job category:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create job category'
        }
      },
      { status: 500 }
    );
  }
}