import { createClient } from '@supabase/supabase-js';
import { paymentService } from './paymentService';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'paused';
export type BillingCycle = 'monthly' | 'yearly';

export interface SubscriptionConfig {
  studentId: string;
  courseId: string;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  autoRenew?: boolean;
  startDate?: Date;
}

export interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  paymentId?: string;
  error?: string;
}

// Validation schemas
const SubscriptionConfigSchema = z.object({
  studentId: z.string().uuid(),
  courseId: z.string().uuid(),
  billingCycle: z.enum(['monthly', 'yearly']),
  amount: z.number().positive(),
  currency: z.string().length(3),
  autoRenew: z.boolean().optional().default(true),
  startDate: z.date().optional()
});

class SubscriptionService {
  async createSubscription(config: SubscriptionConfig): Promise<SubscriptionResult> {
    try {
      // Validate input
      const validatedConfig = SubscriptionConfigSchema.parse(config);
      
      // Check if student already has active subscription for this course
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('student_id', validatedConfig.studentId)
        .eq('course_id', validatedConfig.courseId)
        .eq('status', 'active')
        .single();

      if (existingSubscription) {
        return { success: false, error: 'Active subscription already exists for this course' };
      }

      // Calculate billing period
      const startDate = validatedConfig.startDate || new Date();
      const endDate = this.calculateNextBillingDate(startDate, validatedConfig.billingCycle);

      // Create subscription record
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          student_id: validatedConfig.studentId,
          course_id: validatedConfig.courseId,
          subscription_type: 'active',
          status: 'active',
          amount: validatedConfig.amount,
          currency: validatedConfig.currency,
          billing_cycle: validatedConfig.billingCycle,
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          next_billing_date: endDate.toISOString(),
          auto_renew: validatedConfig.autoRenew
        })
        .select()
        .single();

      if (subscriptionError || !subscription) {
        return { success: false, error: 'Failed to create subscription' };
      }

      // Create initial payment
      const paymentResult = await paymentService.createPayment({
        gateway: 'razorpay', // Default gateway, can be made configurable
        amount: validatedConfig.amount,
        currency: validatedConfig.currency,
        description: `Subscription payment for course`,
        studentId: validatedConfig.studentId,
        courseId: validatedConfig.courseId,
        subscriptionId: subscription.id,
        metadata: {
          billing_cycle: validatedConfig.billingCycle,
          subscription_type: 'initial'
        }
      });

      if (!paymentResult.success) {
        // Rollback subscription creation
        await supabase
          .from('subscriptions')
          .delete()
          .eq('id', subscription.id);
        
        return { success: false, error: paymentResult.error };
      }

      // Log subscription event
      await this.logSubscriptionEvent(subscription.id, 'created', null, 'active', {
        payment_id: paymentResult.paymentId,
        billing_cycle: validatedConfig.billingCycle
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        paymentId: paymentResult.paymentId
      };
    } catch (error) {
      console.error('Subscription creation failed:', error);
      return { success: false, error: 'Subscription creation failed' };
    }
  }

  async renewSubscription(subscriptionId: string): Promise<SubscriptionResult> {
    try {
      // Get subscription details
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      if (subscription.status !== 'active') {
        return { success: false, error: 'Cannot renew inactive subscription' };
      }

      // Calculate new billing period
      const currentEnd = new Date(subscription.current_period_end);
      const newEnd = this.calculateNextBillingDate(currentEnd, subscription.billing_cycle);

      // Create renewal payment
      const paymentResult = await paymentService.createPayment({
        gateway: 'razorpay', // Default gateway
        amount: subscription.amount,
        currency: subscription.currency,
        description: `Subscription renewal for course`,
        studentId: subscription.student_id,
        courseId: subscription.course_id,
        subscriptionId: subscription.id,
        metadata: {
          billing_cycle: subscription.billing_cycle,
          subscription_type: 'renewal'
        }
      });

      if (!paymentResult.success) {
        // Mark subscription as having failed payment
        await supabase
          .from('subscriptions')
          .update({
            failed_payment_count: subscription.failed_payment_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscriptionId);

        // Log failed renewal
        await this.logSubscriptionEvent(subscriptionId, 'payment_failed', 'active', 'active', {
          payment_error: paymentResult.error,
          failed_count: subscription.failed_payment_count + 1
        });

        return { success: false, error: paymentResult.error };
      }

      // Update subscription with new billing period
      await supabase
        .from('subscriptions')
        .update({
          current_period_start: currentEnd.toISOString(),
          current_period_end: newEnd.toISOString(),
          next_billing_date: newEnd.toISOString(),
          failed_payment_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      // Log renewal event
      await this.logSubscriptionEvent(subscriptionId, 'renewed', 'active', 'active', {
        payment_id: paymentResult.paymentId,
        new_period_end: newEnd.toISOString()
      });

      return {
        success: true,
        subscriptionId,
        paymentId: paymentResult.paymentId
      };
    } catch (error) {
      console.error('Subscription renewal failed:', error);
      return { success: false, error: 'Subscription renewal failed' };
    }
  }

  async cancelSubscription(subscriptionId: string, reason?: string): Promise<SubscriptionResult> {
    try {
      // Get subscription details
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      if (subscription.status === 'cancelled') {
        return { success: false, error: 'Subscription already cancelled' };
      }

      // Update subscription status
      await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
          auto_renew: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      // Log cancellation event
      await this.logSubscriptionEvent(subscriptionId, 'cancelled', subscription.status, 'cancelled', {
        reason,
        cancelled_by: 'user' // Could be enhanced to track who cancelled
      });

      return { success: true, subscriptionId };
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      return { success: false, error: 'Subscription cancellation failed' };
    }
  }

  async pauseSubscription(subscriptionId: string, reason?: string): Promise<SubscriptionResult> {
    try {
      // Get subscription details
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      if (subscription.status !== 'active') {
        return { success: false, error: 'Can only pause active subscriptions' };
      }

      // Update subscription status
      await supabase
        .from('subscriptions')
        .update({
          status: 'paused',
          auto_renew: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      // Log pause event
      await this.logSubscriptionEvent(subscriptionId, 'paused', 'active', 'paused', {
        reason,
        paused_at: new Date().toISOString()
      });

      return { success: true, subscriptionId };
    } catch (error) {
      console.error('Subscription pause failed:', error);
      return { success: false, error: 'Subscription pause failed' };
    }
  }

  async resumeSubscription(subscriptionId: string): Promise<SubscriptionResult> {
    try {
      // Get subscription details
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      if (subscription.status !== 'paused') {
        return { success: false, error: 'Can only resume paused subscriptions' };
      }

      // Calculate new billing period from now
      const now = new Date();
      const newEnd = this.calculateNextBillingDate(now, subscription.billing_cycle);

      // Update subscription status
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: newEnd.toISOString(),
          next_billing_date: newEnd.toISOString(),
          auto_renew: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      // Log resume event
      await this.logSubscriptionEvent(subscriptionId, 'resumed', 'paused', 'active', {
        resumed_at: now.toISOString(),
        new_period_end: newEnd.toISOString()
      });

      return { success: true, subscriptionId };
    } catch (error) {
      console.error('Subscription resume failed:', error);
      return { success: false, error: 'Subscription resume failed' };
    }
  }

  async processScheduledRenewals(): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    try {
      // Get subscriptions due for renewal
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active')
        .eq('auto_renew', true)
        .lte('next_billing_date', new Date().toISOString())
        .limit(100); // Process in batches

      if (!subscriptions || subscriptions.length === 0) {
        return { processed: 0, failed: 0 };
      }

      for (const subscription of subscriptions) {
        try {
          const result = await this.renewSubscription(subscription.id);
          if (result.success) {
            processed++;
          } else {
            failed++;
            console.error(`Failed to renew subscription ${subscription.id}:`, result.error);
          }
        } catch (error) {
          failed++;
          console.error(`Error processing subscription ${subscription.id}:`, error);
        }
      }

      return { processed, failed };
    } catch (error) {
      console.error('Scheduled renewals processing failed:', error);
      return { processed, failed };
    }
  }

  async expireSubscriptions(): Promise<number> {
    try {
      // Find subscriptions that should be expired
      const { data: expiredSubscriptions } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('status', 'active')
        .eq('auto_renew', false)
        .lt('current_period_end', new Date().toISOString());

      if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
        return 0;
      }

      // Update status to expired
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .in('id', expiredSubscriptions.map(s => s.id));

      if (error) {
        console.error('Failed to expire subscriptions:', error);
        return 0;
      }

      // Log expiration events
      for (const subscription of expiredSubscriptions) {
        await this.logSubscriptionEvent(subscription.id, 'expired', 'active', 'expired', {
          expired_at: new Date().toISOString()
        });
      }

      return expiredSubscriptions.length;
    } catch (error) {
      console.error('Subscription expiration failed:', error);
      return 0;
    }
  }

  async getSubscriptionDetails(subscriptionId: string): Promise<any> {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        *,
        courses(title, description),
        users(email, profile),
        payments(*)
      `)
      .eq('id', subscriptionId)
      .single();

    return subscription;
  }

  async getUserSubscriptions(userId: string): Promise<any[]> {
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select(`
        *,
        courses(title, description, media),
        subscription_events(*)
      `)
      .eq('student_id', userId)
      .order('created_at', { ascending: false });

    return subscriptions || [];
  }

  private calculateNextBillingDate(fromDate: Date, billingCycle: BillingCycle): Date {
    const nextDate = new Date(fromDate);
    
    if (billingCycle === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (billingCycle === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    
    return nextDate;
  }

  private async logSubscriptionEvent(
    subscriptionId: string,
    eventType: string,
    previousStatus: SubscriptionStatus | null,
    newStatus: SubscriptionStatus,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      await supabase
        .from('subscription_events')
        .insert({
          subscription_id: subscriptionId,
          event_type: eventType,
          previous_status: previousStatus,
          new_status: newStatus,
          metadata,
          payment_id: metadata.payment_id || null
        });
    } catch (error) {
      console.error('Failed to log subscription event:', error);
    }
  }
}

export const subscriptionService = new SubscriptionService();