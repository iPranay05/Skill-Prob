import Razorpay from 'razorpay';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Payment gateway types
export type PaymentGateway = 'razorpay' | 'stripe' | 'wallet';

export interface PaymentConfig {
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  description: string;
  studentId: string;
  courseId?: string;
  subscriptionId?: string;
  enrollmentId?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  paymentLink?: string;
  error?: string;
  gatewayResponse?: any;
  refundId?: string;
}

export interface WebhookResult {
  success: boolean;
  paymentId?: string;
  status?: string;
  error?: string;
}

// Validation schemas
const PaymentConfigSchema = z.object({
  gateway: z.enum(['razorpay', 'stripe', 'wallet'] as const),
  amount: z.number().positive(),
  currency: z.string().length(3),
  description: z.string().min(1),
  studentId: z.string().uuid(),
  courseId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional(),
  enrollmentId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

class PaymentService {
  private razorpay: Razorpay | null = null;
  private stripe: Stripe | null = null;
  private gatewayConfigs: Map<PaymentGateway, any> = new Map();

  constructor() {
    this.initializeGateways();
  }

  private async initializeGateways() {
    try {
      // Load gateway configurations from database
      const { data: configs } = await supabase
        .from('payment_gateway_configs')
        .select('*')
        .eq('is_active', true);

      if (configs) {
        for (const config of configs) {
          this.gatewayConfigs.set(config.gateway, config);
          
          // Initialize gateway clients
          if (config.gateway === 'razorpay' && config.config.key_id && config.config.key_secret) {
            this.razorpay = new Razorpay({
              key_id: config.config.key_id,
              key_secret: config.config.key_secret
            });
          }
          
          if (config.gateway === 'stripe' && config.config.secret_key) {
            this.stripe = new Stripe(config.config.secret_key, {
              apiVersion: '2023-10-16' as any
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize payment gateways:', error);
    }
  }

  async createPayment(config: PaymentConfig): Promise<PaymentResult> {
    try {
      // Validate input
      const validatedConfig = PaymentConfigSchema.parse(config);
      
      // Create payment record in database first
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          student_id: validatedConfig.studentId,
          enrollment_id: validatedConfig.enrollmentId,
          subscription_id: validatedConfig.subscriptionId,
          amount: validatedConfig.amount,
          currency: validatedConfig.currency,
          gateway: validatedConfig.gateway,
          status: 'pending'
        })
        .select()
        .single();

      if (paymentError || !payment) {
        return { success: false, error: 'Failed to create payment record' };
      }

      // Process based on gateway
      switch (validatedConfig.gateway) {
        case 'razorpay':
          return await this.createRazorpayPayment(validatedConfig, payment.id);
        case 'stripe':
          return await this.createStripePayment(validatedConfig, payment.id);
        case 'wallet':
          return await this.processWalletPayment(validatedConfig, payment.id);
        default:
          return { success: false, error: 'Unsupported payment gateway' };
      }
    } catch (error) {
      console.error('Payment creation failed:', error);
      return { success: false, error: 'Payment creation failed' };
    }
  }

  private async createRazorpayPayment(config: PaymentConfig, paymentId: string): Promise<PaymentResult> {
    if (!this.razorpay) {
      return { success: false, error: 'Razorpay not configured' };
    }

    try {
      const order = await this.razorpay.orders.create({
        amount: Math.round(config.amount * 100), // Convert to paise
        currency: config.currency,
        receipt: paymentId,
        notes: {
          student_id: config.studentId,
          course_id: config.courseId || '',
          subscription_id: config.subscriptionId || '',
          ...config.metadata
        }
      });

      // Update payment record with gateway order ID
      await supabase
        .from('payments')
        .update({
          gateway_order_id: order.id,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
        })
        .eq('id', paymentId);

      return {
        success: true,
        paymentId,
        orderId: order.id,
        gatewayResponse: order
      };
    } catch (error) {
      console.error('Razorpay order creation failed:', error);
      return { success: false, error: 'Failed to create Razorpay order' };
    }
  }

  private async createStripePayment(config: PaymentConfig, paymentId: string): Promise<PaymentResult> {
    if (!this.stripe) {
      return { success: false, error: 'Stripe not configured' };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(config.amount * 100), // Convert to cents
        currency: config.currency.toLowerCase(),
        metadata: {
          payment_id: paymentId,
          student_id: config.studentId,
          course_id: config.courseId || '',
          subscription_id: config.subscriptionId || '',
          ...config.metadata
        },
        description: config.description
      });

      // Update payment record with gateway payment intent ID
      await supabase
        .from('payments')
        .update({
          gateway_payment_id: paymentIntent.id,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
        })
        .eq('id', paymentId);

      return {
        success: true,
        paymentId,
        orderId: paymentIntent.id,
        gatewayResponse: paymentIntent
      };
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      return { success: false, error: 'Failed to create Stripe payment intent' };
    }
  }

  private async processWalletPayment(config: PaymentConfig, paymentId: string): Promise<PaymentResult> {
    try {
      // Get student's wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', config.studentId)
        .single();

      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      const availableCredits = parseFloat(wallet.balance.credits || '0');
      
      if (availableCredits < config.amount) {
        return { success: false, error: 'Insufficient wallet balance' };
      }

      // Use wallet credits
      const { data: usedAmount, error: useError } = await supabase
        .rpc('use_wallet_credits', {
          wallet_uuid: wallet.id,
          required_amount: config.amount
        });

      if (useError || usedAmount < config.amount) {
        return { success: false, error: 'Failed to use wallet credits' };
      }

      // Update payment status to completed
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          payment_date: new Date().toISOString(),
          payment_method: 'wallet'
        })
        .eq('id', paymentId);

      // Create wallet transaction
      await supabase
        .rpc('add_wallet_transaction', {
          wallet_uuid: wallet.id,
          trans_type: 'debit',
          trans_amount: config.amount,
          trans_points: 0,
          trans_description: `Payment for ${config.description}`,
          reference: paymentId,
          trans_metadata: { payment_id: paymentId, ...config.metadata }
        });

      return {
        success: true,
        paymentId,
        orderId: paymentId
      };
    } catch (error) {
      console.error('Wallet payment failed:', error);
      return { success: false, error: 'Wallet payment failed' };
    }
  }

  async handleWebhook(gateway: PaymentGateway, payload: any, signature?: string): Promise<WebhookResult> {
    try {
      // Log webhook for debugging
      const { data: webhookLog } = await supabase
        .from('payment_webhooks')
        .insert({
          gateway,
          event_type: payload.event || payload.type || 'unknown',
          payload,
          signature,
          verified: false
        })
        .select()
        .single();

      switch (gateway) {
        case 'razorpay':
          return await this.handleRazorpayWebhook(payload, signature, webhookLog?.id);
        case 'stripe':
          return await this.handleStripeWebhook(payload, signature, webhookLog?.id);
        default:
          return { success: false, error: 'Unsupported gateway for webhook' };
      }
    } catch (error) {
      console.error('Webhook handling failed:', error);
      return { success: false, error: 'Webhook processing failed' };
    }
  }

  private async handleRazorpayWebhook(payload: any, signature?: string, webhookLogId?: string): Promise<WebhookResult> {
    try {
      const config = this.gatewayConfigs.get('razorpay');
      if (!config || !signature) {
        return { success: false, error: 'Invalid webhook configuration' };
      }

      // Verify webhook signature
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', config.config.webhook_secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signature !== expectedSignature) {
        return { success: false, error: 'Invalid webhook signature' };
      }

      // Mark webhook as verified
      if (webhookLogId) {
        await supabase
          .from('payment_webhooks')
          .update({ verified: true })
          .eq('id', webhookLogId);
      }

      // Process payment based on event
      if (payload.event === 'payment.captured') {
        const paymentData = payload.payload.payment.entity;
        
        // Find payment by gateway order ID
        const { data: payment } = await supabase
          .from('payments')
          .select('*')
          .eq('gateway_order_id', paymentData.order_id)
          .single();

        if (payment) {
          await supabase
            .from('payments')
            .update({
              status: 'completed',
              gateway_payment_id: paymentData.id,
              payment_date: new Date(paymentData.created_at * 1000).toISOString(),
              payment_method: paymentData.method,
              webhook_verified: true
            })
            .eq('id', payment.id);

          // Create invoice
          await supabase.rpc('create_invoice_for_payment', {
            payment_uuid: payment.id
          });

          return { success: true, paymentId: payment.id, status: 'completed' };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Razorpay webhook processing failed:', error);
      return { success: false, error: 'Razorpay webhook processing failed' };
    }
  }

  private async handleStripeWebhook(payload: any, signature?: string, webhookLogId?: string): Promise<WebhookResult> {
    try {
      const config = this.gatewayConfigs.get('stripe');
      if (!config || !signature || !this.stripe) {
        return { success: false, error: 'Invalid webhook configuration' };
      }

      // Verify webhook signature
      const event = this.stripe.webhooks.constructEvent(
        JSON.stringify(payload),
        signature,
        config.config.webhook_secret
      );

      // Mark webhook as verified
      if (webhookLogId) {
        await supabase
          .from('payment_webhooks')
          .update({ verified: true })
          .eq('id', webhookLogId);
      }

      // Process payment based on event type
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Find payment by gateway payment ID
        const { data: payment } = await supabase
          .from('payments')
          .select('*')
          .eq('gateway_payment_id', paymentIntent.id)
          .single();

        if (payment) {
          await supabase
            .from('payments')
            .update({
              status: 'completed',
              payment_date: new Date(paymentIntent.created * 1000).toISOString(),
              payment_method: paymentIntent.payment_method_types[0],
              webhook_verified: true
            })
            .eq('id', payment.id);

          // Create invoice
          await supabase.rpc('create_invoice_for_payment', {
            payment_uuid: payment.id
          });

          return { success: true, paymentId: payment.id, status: 'completed' };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Stripe webhook processing failed:', error);
      return { success: false, error: 'Stripe webhook processing failed' };
    }
  }

  async processRefund(paymentId: string, amount: number, reason: string, requestedBy: string): Promise<PaymentResult> {
    try {
      // Get payment details
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      if (payment.status !== 'completed') {
        return { success: false, error: 'Cannot refund incomplete payment' };
      }

      // Process refund through database function
      const { data: refundId, error: refundError } = await supabase
        .rpc('process_refund', {
          payment_uuid: paymentId,
          refund_amount: amount,
          refund_reason: reason,
          requested_by_uuid: requestedBy
        });

      if (refundError) {
        return { success: false, error: 'Failed to process refund' };
      }

      // Process gateway refund
      let gatewayResult;
      switch (payment.gateway) {
        case 'razorpay':
          gatewayResult = await this.processRazorpayRefund(payment, amount);
          break;
        case 'stripe':
          gatewayResult = await this.processStripeRefund(payment, amount);
          break;
        case 'wallet':
          // Wallet refunds are handled in the database function
          gatewayResult = { success: true };
          break;
        default:
          gatewayResult = { success: false, error: 'Unsupported gateway for refund' };
      }

      if (gatewayResult.success) {
        // Update refund status
        await supabase
          .from('refunds')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            gateway_refund_id: gatewayResult.refundId
          })
          .eq('id', refundId);
      }

      return gatewayResult;
    } catch (error) {
      console.error('Refund processing failed:', error);
      return { success: false, error: 'Refund processing failed' };
    }
  }

  private async processRazorpayRefund(payment: any, amount: number): Promise<PaymentResult> {
    if (!this.razorpay) {
      return { success: false, error: 'Razorpay not configured' };
    }

    try {
      const refund = await this.razorpay.payments.refund(payment.gateway_payment_id, {
        amount: Math.round(amount * 100) // Convert to paise
      });

      return {
        success: true,
        paymentId: payment.id,
        orderId: refund.id
      };
    } catch (error) {
      console.error('Razorpay refund failed:', error);
      return { success: false, error: 'Razorpay refund failed' };
    }
  }

  private async processStripeRefund(payment: any, amount: number): Promise<PaymentResult> {
    if (!this.stripe) {
      return { success: false, error: 'Stripe not configured' };
    }

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.gateway_payment_id,
        amount: Math.round(amount * 100) // Convert to cents
      });

      return {
        success: true,
        paymentId: payment.id,
        orderId: refund.id
      };
    } catch (error) {
      console.error('Stripe refund failed:', error);
      return { success: false, error: 'Stripe refund failed' };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<any> {
    const { data: payment } = await supabase
      .from('payments')
      .select(`
        *,
        invoices(*),
        refunds(*)
      `)
      .eq('id', paymentId)
      .single();

    return payment;
  }
}

export const paymentService = new PaymentService();