import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type WalletUserType = 'student' | 'ambassador';
export type TransactionType = 'credit' | 'debit' | 'conversion' | 'payout' | 'referral_bonus' | 'registration_bonus';

export interface WalletBalance {
  points: number;
  credits: number;
  currency: string;
}

export interface TransactionConfig {
  walletId: string;
  type: TransactionType;
  amount: number;
  points?: number;
  description: string;
  referenceId?: string;
  metadata?: Record<string, any>;
}

export interface WalletResult {
  success: boolean;
  walletId?: string;
  transactionId?: string;
  balance?: WalletBalance;
  error?: string;
}

export interface PayoutRequest {
  ambassadorId: string;
  amount: number;
  pointsToRedeem: number;
  bankDetails?: Record<string, any>;
}

// Validation schemas
const TransactionConfigSchema = z.object({
  walletId: z.string().uuid(),
  type: z.enum(['credit', 'debit', 'conversion', 'payout', 'referral_bonus', 'registration_bonus']),
  amount: z.number().min(0),
  points: z.number().min(0).optional().default(0),
  description: z.string().min(1),
  referenceId: z.string().optional(),
  metadata: z.record(z.any()).optional().default({})
});

const PayoutRequestSchema = z.object({
  ambassadorId: z.string().uuid(),
  amount: z.number().positive(),
  pointsToRedeem: z.number().positive(),
  bankDetails: z.record(z.any()).optional()
});

class WalletService {
  async createWallet(userId: string, userType: WalletUserType): Promise<WalletResult> {
    try {
      // Check if wallet already exists
      const { data: existingWallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingWallet) {
        return { success: false, error: 'Wallet already exists for this user' };
      }

      // Create new wallet
      const { data: wallet, error } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          user_type: userType,
          balance: {
            points: 0,
            credits: 0,
            currency: 'INR'
          }
        })
        .select()
        .single();

      if (error || !wallet) {
        return { success: false, error: 'Failed to create wallet' };
      }

      return {
        success: true,
        walletId: wallet.id,
        balance: wallet.balance as WalletBalance
      };
    } catch (error) {
      console.error('Wallet creation failed:', error);
      return { success: false, error: 'Wallet creation failed' };
    }
  }

  async getWallet(userId: string): Promise<WalletResult> {
    try {
      const { data: wallet } = await supabase
        .from('wallets')
        .select(`
          *,
          wallet_transactions(*),
          wallet_credits(*)
        `)
        .eq('user_id', userId)
        .single();

      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      return {
        success: true,
        walletId: wallet.id,
        balance: wallet.balance as WalletBalance
      };
    } catch (error) {
      console.error('Failed to get wallet:', error);
      return { success: false, error: 'Failed to get wallet' };
    }
  }

  async addTransaction(config: TransactionConfig): Promise<WalletResult> {
    try {
      // Validate input
      const validatedConfig = TransactionConfigSchema.parse(config);

      // Use database function to add transaction
      const { data: transactionId, error } = await supabase
        .rpc('add_wallet_transaction', {
          wallet_uuid: validatedConfig.walletId,
          trans_type: validatedConfig.type,
          trans_amount: validatedConfig.amount,
          trans_points: validatedConfig.points,
          trans_description: validatedConfig.description,
          reference: validatedConfig.referenceId,
          trans_metadata: validatedConfig.metadata
        });

      if (error) {
        return { success: false, error: 'Failed to add transaction' };
      }

      // Get updated wallet balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', validatedConfig.walletId)
        .single();

      return {
        success: true,
        transactionId,
        balance: wallet?.balance as WalletBalance
      };
    } catch (error) {
      console.error('Transaction failed:', error);
      return { success: false, error: 'Transaction failed' };
    }
  }

  async convertPointsToCredits(walletId: string, points: number, conversionRate: number = 0.1): Promise<WalletResult> {
    try {
      // Get current wallet balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', walletId)
        .single();

      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      const currentBalance = wallet.balance as WalletBalance;
      
      if (currentBalance.points < points) {
        return { success: false, error: 'Insufficient points' };
      }

      const creditsToAdd = points * conversionRate;

      // Add conversion transaction
      const result = await this.addTransaction({
        walletId,
        type: 'conversion',
        amount: creditsToAdd,
        points: -points, // Deduct points
        description: `Converted ${points} points to ${creditsToAdd} credits`,
        metadata: {
          conversion_rate: conversionRate,
          points_converted: points,
          credits_added: creditsToAdd
        }
      });

      return result;
    } catch (error) {
      console.error('Points conversion failed:', error);
      return { success: false, error: 'Points conversion failed' };
    }
  }

  async addWalletCredit(userId: string, amount: number, source: string, expiresAt?: Date, sourcePaymentId?: string): Promise<WalletResult> {
    try {
      // Get user's wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      // Add wallet credit
      const { data: credit, error } = await supabase
        .from('wallet_credits')
        .insert({
          wallet_id: wallet.id,
          amount,
          currency: 'INR',
          source,
          expires_at: expiresAt?.toISOString(),
          source_payment_id: sourcePaymentId,
          remaining_amount: amount
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: 'Failed to add wallet credit' };
      }

      // Add transaction record
      await this.addTransaction({
        walletId: wallet.id,
        type: 'credit',
        amount,
        description: `Wallet credit from ${source}`,
        referenceId: credit.id,
        metadata: {
          source,
          expires_at: expiresAt?.toISOString(),
          source_payment_id: sourcePaymentId
        }
      });

      return { success: true, walletId: wallet.id };
    } catch (error) {
      console.error('Failed to add wallet credit:', error);
      return { success: false, error: 'Failed to add wallet credit' };
    }
  }

  async useWalletCredits(walletId: string, amount: number): Promise<WalletResult> {
    try {
      // Use database function to consume credits
      const { data: usedAmount, error } = await supabase
        .rpc('use_wallet_credits', {
          wallet_uuid: walletId,
          required_amount: amount
        });

      if (error) {
        return { success: false, error: 'Failed to use wallet credits' };
      }

      if (usedAmount < amount) {
        return { success: false, error: 'Insufficient wallet credits' };
      }

      // Add debit transaction
      await this.addTransaction({
        walletId,
        type: 'debit',
        amount: usedAmount,
        description: `Used wallet credits for payment`,
        metadata: {
          amount_used: usedAmount,
          amount_requested: amount
        }
      });

      return { success: true, walletId };
    } catch (error) {
      console.error('Failed to use wallet credits:', error);
      return { success: false, error: 'Failed to use wallet credits' };
    }
  }

  async requestPayout(request: PayoutRequest): Promise<WalletResult> {
    try {
      // Validate input
      const validatedRequest = PayoutRequestSchema.parse(request);

      // Get ambassador details
      const { data: ambassador } = await supabase
        .from('ambassadors')
        .select(`
          *,
          wallets(*)
        `)
        .eq('id', validatedRequest.ambassadorId)
        .single();

      if (!ambassador) {
        return { success: false, error: 'Ambassador not found' };
      }

      if (!ambassador.wallets || ambassador.wallets.length === 0) {
        return { success: false, error: 'Ambassador wallet not found' };
      }

      const wallet = ambassador.wallets[0];
      const currentBalance = wallet.balance as WalletBalance;

      // Check if ambassador has enough points
      if (currentBalance.points < validatedRequest.pointsToRedeem) {
        return { success: false, error: 'Insufficient points for payout' };
      }

      // Create payout request
      const { data: payoutRequest, error } = await supabase
        .from('payout_requests')
        .insert({
          ambassador_id: validatedRequest.ambassadorId,
          wallet_id: wallet.id,
          amount: validatedRequest.amount,
          points_redeemed: validatedRequest.pointsToRedeem,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: 'Failed to create payout request' };
      }

      // Deduct points (they will be restored if payout is rejected)
      await this.addTransaction({
        walletId: wallet.id,
        type: 'payout',
        amount: validatedRequest.amount,
        points: -validatedRequest.pointsToRedeem,
        description: `Payout request for ${validatedRequest.amount} INR`,
        referenceId: payoutRequest.id,
        metadata: {
          payout_request_id: payoutRequest.id,
          points_redeemed: validatedRequest.pointsToRedeem,
          bank_details: validatedRequest.bankDetails
        }
      });

      return { success: true, walletId: wallet.id };
    } catch (error) {
      console.error('Payout request failed:', error);
      return { success: false, error: 'Payout request failed' };
    }
  }

  async processPayoutRequest(payoutRequestId: string, approved: boolean, adminId: string, notes?: string): Promise<WalletResult> {
    try {
      // Get payout request details
      const { data: payoutRequest } = await supabase
        .from('payout_requests')
        .select(`
          *,
          ambassadors(*),
          wallets(*)
        `)
        .eq('id', payoutRequestId)
        .single();

      if (!payoutRequest) {
        return { success: false, error: 'Payout request not found' };
      }

      if (payoutRequest.status !== 'pending') {
        return { success: false, error: 'Payout request already processed' };
      }

      const newStatus = approved ? 'approved' : 'rejected';

      // Update payout request
      await supabase
        .from('payout_requests')
        .update({
          status: newStatus,
          processed_at: new Date().toISOString(),
          processed_by: adminId,
          admin_notes: notes
        })
        .eq('id', payoutRequestId);

      if (!approved) {
        // Restore points if rejected
        await this.addTransaction({
          walletId: payoutRequest.wallet_id,
          type: 'credit',
          amount: 0,
          points: payoutRequest.points_redeemed,
          description: `Payout request rejected - points restored`,
          referenceId: payoutRequestId,
          metadata: {
            payout_request_id: payoutRequestId,
            rejection_reason: notes
          }
        });
      }

      return { success: true, walletId: payoutRequest.wallet_id };
    } catch (error) {
      console.error('Payout processing failed:', error);
      return { success: false, error: 'Payout processing failed' };
    }
  }

  async getTransactionHistory(walletId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    const { data: transactions } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return transactions || [];
  }

  async getWalletCredits(walletId: string): Promise<any[]> {
    const { data: credits } = await supabase
      .from('wallet_credits')
      .select('*')
      .eq('wallet_id', walletId)
      .gt('remaining_amount', 0)
      .eq('is_expired', false)
      .order('created_at', { ascending: true });

    return credits || [];
  }

  async expireWalletCredits(): Promise<number> {
    try {
      const { data: expiredCount, error } = await supabase
        .rpc('expire_wallet_credits');

      if (error) {
        console.error('Failed to expire wallet credits:', error);
        return 0;
      }

      return expiredCount || 0;
    } catch (error) {
      console.error('Wallet credits expiration failed:', error);
      return 0;
    }
  }

  async getAmbassadorEarnings(ambassadorId: string): Promise<any> {
    const { data: ambassador } = await supabase
      .from('ambassadors')
      .select(`
        *,
        wallets(*),
        payout_requests(*),
        referrals(*)
      `)
      .eq('id', ambassadorId)
      .single();

    if (!ambassador) {
      return null;
    }

    // Calculate earnings summary
    const wallet = ambassador.wallets[0];
    const payoutRequests = ambassador.payout_requests || [];
    const referrals = ambassador.referrals || [];

    const totalPaidOut = payoutRequests
      .filter((p: any) => p.status === 'processed')
      .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

    const pendingPayouts = payoutRequests
      .filter((p: any) => p.status === 'pending')
      .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

    return {
      ambassador,
      wallet,
      earnings: {
        totalReferrals: referrals.length,
        currentPoints: wallet?.balance?.points || 0,
        currentCredits: wallet?.balance?.credits || 0,
        totalPaidOut,
        pendingPayouts,
        availableForPayout: (wallet?.balance?.points || 0) * 0.1 // Assuming 0.1 INR per point
      },
      recentTransactions: await this.getTransactionHistory(wallet?.id, 10),
      payoutHistory: payoutRequests
    };
  }
}

export const walletService = new WalletService();