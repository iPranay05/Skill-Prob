import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const SendMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  message_type: z.enum(['text', 'system']).default('text')
});

export async function GET(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
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

    // Get messages for this application
    // Note: This would require a messages table in the database
    // For now, we'll return a placeholder response
    const messages = [
      {
        id: '1',
        application_id: params.applicationId,
        sender_id: authResult.user.id,
        sender_type: authResult.user.role,
        message: 'Thank you for your application. We will review it and get back to you soon.',
        message_type: 'text',
        created_at: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      data: messages
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_MESSAGES_ERROR',
          message: error.message || 'Failed to fetch messages'
        }
      },
      { status: error.status || 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
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

    const body = await request.json();
    
    // Validate input
    const validatedData = SendMessageSchema.parse(body);

    // In a real implementation, you would save the message to a messages table
    // For now, we'll return a success response
    const message = {
      id: Date.now().toString(),
      application_id: params.applicationId,
      sender_id: authResult.user.id,
      sender_type: authResult.user.role,
      message: validatedData.message,
      message_type: validatedData.message_type,
      created_at: new Date().toISOString()
    };

    // Update communication count in job_applications table
    await supabaseAdmin
      .from('job_applications')
      .update({
        communication_count: supabaseAdmin.raw('communication_count + 1'),
        last_communication_at: new Date().toISOString()
      })
      .eq('id', params.applicationId);

    return NextResponse.json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error sending message:', error);
    
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
          code: 'SEND_MESSAGE_ERROR',
          message: error.message || 'Failed to send message'
        }
      },
      { status: error.status || 500 }
    );
  }
}