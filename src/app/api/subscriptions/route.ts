import { NextRequest, NextResponse } from 'next/server';
import { EnrollmentService } from '../../../lib/enrollmentService';
import { CreateSubscriptionInput, SubscriptionQuery } from '../../../models/Enrollment';
import { APIError } from '../../../lib/errors';
import { verifyJWT } from '../../../lib/auth';

const enrollmentService = new EnrollmentService();

/**
 * POST /api/subscriptions - Create new subscription
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyJWT(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.course_id || !body.amount || !body.billing_cycle) {
      return NextResponse.json(
        { success: false, error: 'Course ID, amount, and billing cycle are required' },
        { status: 400 }
      );
    }

    // Prepare subscription data
    const subscriptionData: CreateSubscriptionInput = {
      student_id: authResult.user.id,
      course_id: body.course_id,
      subscription_type: body.subscription_type || 'monthly',
      amount: body.amount,
      currency: body.currency || 'INR',
      billing_cycle: body.billing_cycle,
      current_period_start: new Date(),
      current_period_end: body.billing_cycle === 'monthly' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 365 days
      gateway_subscription_id: body.gateway_subscription_id,
      gateway_customer_id: body.gateway_customer_id,
      auto_renew: body.auto_renew !== undefined ? body.auto_renew : true,
      next_billing_date: body.next_billing_date ? new Date(body.next_billing_date) : undefined
    };

    const subscription = await enrollmentService.createSubscription(subscriptionData);

    return NextResponse.json({
      success: true,
      data: subscription
    }, { status: 201 });
  } catch (error) {
    console.error('Create subscription error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
