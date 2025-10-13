import { NextRequest, NextResponse } from 'next/server';
import { ApplicationStatus } from '@/models/Job';
import { verifyAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/database';
import { z } from 'zod';

const BulkUpdateSchema = z.object({
  application_ids: z.array(z.string().uuid()).min(1),
  status: z.nativeEnum(ApplicationStatus),
  notes: z.string().optional()
});

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
            message: 'Only employers and admins can bulk update applications'
          }
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = BulkUpdateSchema.parse(body);

    // Bulk update applications
    const { error: updateError } = await supabaseAdmin
      .from('job_applications')
      .update({
        status: validatedData.status,
        status_updated_by: authResult.user.userId,
        updated_at: new Date().toISOString(),
        ...(validatedData.notes && { notes: validatedData.notes })
      })
      .in('id', validatedData.application_ids);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update applications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${validatedData.application_ids.length} applications`
    });
  } catch (error: any) {
    console.error('Error bulk updating applications:', error);
    
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
          code: 'BULK_UPDATE_ERROR',
          message: error.message || 'Failed to bulk update applications'
        }
      },
      { status: error.status || 500 }
    );
  }
}