import { supabaseAdmin } from './database';
import { 
  Ambassador, 
  AmbassadorStatus, 
  AmbassadorApplication,
  PayoutDetails,
  Referral,
  Wallet,
  WalletTransaction,
  PayoutRequest,
  PointConfiguration,
  TransactionType,
  PayoutStatus,
  ReferralEventType,
  ConversionEvent
} from '../models/Ambassador';
import { APIError } from './errors';

export class AmbassadorService {
  
  // Ambassador Management
  static async applyForAmbassador(
    userId: string, 
    application: AmbassadorApplication
  ): Promise<Ambassador> {
    try {
      // Check if user already has an ambassador application
      const { data: existingAmbassador } = await supabaseAdmin
        .from('ambassadors')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingAmbassador) {
        throw new APIError('User already has an ambassador application', 409);
      }

      // Generate unique referral code
      const { data: referralCode } = await supabaseAdmin
        .rpc('generate_referral_code');

      if (!referralCode) {
        throw new APIError('Failed to generate referral code', 500);
      }

      // Create ambassador record
      const { data: ambassador, error } = await supabaseAdmin
        .from('ambassadors')
        .insert({
          user_id: userId,
          referral_code: referralCode,
          status: AmbassadorStatus.PENDING,
          application: application,
          performance: {
            totalReferrals: 0,
            successfulConversions: 0,
            totalEarnings: 0,
            currentPoints: 0,
            lifetimePoints: 0
          },
          payout_details: { verified: false }
        })
        .select()
        .single();

      if (error) {
        throw new APIError(`Failed to create ambassador application: ${error.message}`, 500);
      }

      // Create wallet for ambassador
      await this.createWallet(userId, 'ambassador');

      return ambassador;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Ambassador application failed: ${error}`, 500);
    }
  }

  static async approveAmbassador(
    ambassadorId: string, 
    reviewedBy: string, 
    notes?: string
  ): Promise<Ambassador> {
    try {
      const { data: ambassador, error } = await supabaseAdmin
        .from('ambassadors')
        .update({
          status: AmbassadorStatus.ACTIVE,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewedBy,
          review_notes: notes
        })
        .eq('id', ambassadorId)
        .select()
        .single();

      if (error) {
        throw new APIError(`Failed to approve ambassador: ${error.message}`, 500);
      }

      return ambassador;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Ambassador approval failed: ${error}`, 500);
    }
  }

  static async rejectAmbassador(
    ambassadorId: string, 
    reviewedBy: string, 
    reason: string
  ): Promise<Ambassador> {
    try {
      const { data: ambassador, error } = await supabaseAdmin
        .from('ambassadors')
        .update({
          status: AmbassadorStatus.REJECTED,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewedBy,
          review_notes: reason
        })
        .eq('id', ambassadorId)
        .select()
        .single();

      if (error) {
        throw new APIError(`Failed to reject ambassador: ${error.message}`, 500);
      }

      return ambassador;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Ambassador rejection failed: ${error}`, 500);
    }
  }

  static async getAmbassadorByUserId(userId: string): Promise<Ambassador | null> {
    try {
      const { data: ambassador, error } = await supabaseAdmin
        .from('ambassadors')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new APIError(`Failed to fetch ambassador: ${error.message}`, 500);
      }

      return ambassador;
    } catch (error) {
      if (error instanceof APIError) throw error;
      return null;
    }
  }

  static async getAmbassadorByReferralCode(referralCode: string): Promise<Ambassador | null> {
    try {
      const { data: ambassador, error } = await supabaseAdmin
        .from('ambassadors')
        .select('*')
        .eq('referral_code', referralCode)
        .eq('status', AmbassadorStatus.ACTIVE)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new APIError(`Failed to fetch ambassador: ${error.message}`, 500);
      }

      return ambassador;
    } catch (error) {
      if (error instanceof APIError) throw error;
      return null;
    }
  }

  // Wallet Management
  static async createWallet(userId: string, userType: 'student' | 'ambassador'): Promise<Wallet> {
    try {
      const { data: wallet, error } = await supabaseAdmin
        .from('wallets')
        .insert({
          user_id: userId,
          user_type: userType,
          balance: {
            points: 0,
            credits: 0,
            currency: 'INR'
          },
          total_earned: 0,
          total_spent: 0,
          total_withdrawn: 0
        })
        .select()
        .single();

      if (error) {
        throw new APIError(`Failed to create wallet: ${error.message}`, 500);
      }

      return wallet;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Wallet creation failed: ${error}`, 500);
    }
  }

  static async getWalletByUserId(userId: string): Promise<Wallet | null> {
    try {
      const { data: wallet, error } = await supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new APIError(`Failed to fetch wallet: ${error.message}`, 500);
      }

      return wallet;
    } catch (error) {
      if (error instanceof APIError) throw error;
      return null;
    }
  }

  static async addWalletTransaction(
    walletId: string,
    type: TransactionType,
    amount: number,
    points: number,
    description: string,
    referenceId?: string,
    metadata?: any
  ): Promise<WalletTransaction> {
    try {
      const { data: transactionId, error } = await supabaseAdmin
        .rpc('add_wallet_transaction', {
          wallet_uuid: walletId,
          trans_type: type,
          trans_amount: amount,
          trans_points: points,
          trans_description: description,
          reference: referenceId,
          trans_metadata: metadata || {}
        });

      if (error) {
        throw new APIError(`Failed to add wallet transaction: ${error.message}`, 500);
      }

      // Fetch the created transaction
      const { data: transaction, error: fetchError } = await supabaseAdmin
        .from('wallet_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (fetchError) {
        throw new APIError(`Failed to fetch transaction: ${fetchError.message}`, 500);
      }

      return transaction;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Transaction failed: ${error}`, 500);
    }
  }

  static async getWalletTransactions(
    walletId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<WalletTransaction[]> {
    try {
      const { data: transactions, error } = await supabaseAdmin
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new APIError(`Failed to fetch transactions: ${error.message}`, 500);
      }

      return transactions || [];
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Failed to fetch transactions: ${error}`, 500);
    }
  }

  // Referral Management
  static async processReferralRegistration(
    referralCode: string,
    studentId: string,
    sourceData?: any
  ): Promise<Referral> {
    try {
      const { data: referralId, error } = await supabaseAdmin
        .rpc('process_referral_registration', {
          referral_code_param: referralCode,
          student_uuid: studentId,
          source_metadata: sourceData || {}
        });

      if (error) {
        throw new APIError(`Failed to process referral: ${error.message}`, 500);
      }

      // Fetch the created referral
      const { data: referral, error: fetchError } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('id', referralId)
        .single();

      if (fetchError) {
        throw new APIError(`Failed to fetch referral: ${fetchError.message}`, 500);
      }

      return referral;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Referral processing failed: ${error}`, 500);
    }
  }

  static async addConversionEvent(
    referralId: string,
    eventType: ReferralEventType,
    value: number,
    metadata?: any
  ): Promise<void> {
    try {
      // Get referral and ambassador info
      const { data: referral, error: referralError } = await supabaseAdmin
        .from('referrals')
        .select(`
          *,
          ambassadors (
            id,
            user_id,
            performance
          )
        `)
        .eq('id', referralId)
        .single();

      if (referralError) {
        throw new APIError(`Failed to fetch referral: ${referralError.message}`, 500);
      }

      // Get point configuration for this event type
      const { data: pointConfig, error: configError } = await supabaseAdmin
        .from('point_configurations')
        .select('*')
        .eq('event_type', eventType)
        .eq('is_active', true)
        .single();

      if (configError && configError.code !== 'PGRST116') {
        throw new APIError(`Failed to fetch point configuration: ${configError.message}`, 500);
      }

      const pointsAwarded = pointConfig?.points_awarded || 0;

      // Create conversion event
      const conversionEvent: ConversionEvent = {
        type: eventType,
        date: new Date().toISOString(),
        value: value,
        pointsEarned: pointsAwarded,
        metadata: metadata
      };

      // Update referral with new conversion event
      const updatedEvents = [...(referral.conversion_events || []), conversionEvent];
      
      const { error: updateError } = await supabaseAdmin
        .from('referrals')
        .update({
          conversion_events: updatedEvents,
          status: 'converted'
        })
        .eq('id', referralId);

      if (updateError) {
        throw new APIError(`Failed to update referral: ${updateError.message}`, 500);
      }

      // Award points to ambassador if configuration exists
      if (pointConfig && pointsAwarded > 0) {
        const { data: wallet } = await supabaseAdmin
          .from('wallets')
          .select('id')
          .eq('user_id', referral.ambassadors.user_id)
          .single();

        if (wallet) {
          await this.addWalletTransaction(
            wallet.id,
            TransactionType.REFERRAL_BONUS,
            0, // no money for conversion events
            pointsAwarded,
            `${eventType} conversion bonus`,
            referralId,
            { event_type: eventType, value: value, ...metadata }
          );

          // Update ambassador performance
          const currentPerformance = referral.ambassadors.performance;
          const updatedPerformance = {
            ...currentPerformance,
            successfulConversions: (currentPerformance.successfulConversions || 0) + 1,
            totalEarnings: (currentPerformance.totalEarnings || 0) + value,
            currentPoints: (currentPerformance.currentPoints || 0) + pointsAwarded,
            lifetimePoints: (currentPerformance.lifetimePoints || 0) + pointsAwarded
          };

          await supabaseAdmin
            .from('ambassadors')
            .update({ performance: updatedPerformance })
            .eq('id', referral.ambassadors.id);
        }
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Conversion event failed: ${error}`, 500);
    }
  }

  static async getReferralsByAmbassador(
    ambassadorId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Referral[]> {
    try {
      const { data: referrals, error } = await supabaseAdmin
        .from('referrals')
        .select(`
          *,
          users!referrals_student_id_fkey (
            id,
            email,
            profile
          )
        `)
        .eq('ambassador_id', ambassadorId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new APIError(`Failed to fetch referrals: ${error.message}`, 500);
      }

      return referrals || [];
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Failed to fetch referrals: ${error}`, 500);
    }
  }

  // Payout Management
  static async requestPayout(
    ambassadorId: string,
    pointsToRedeem: number,
    conversionRate: number = 1
  ): Promise<PayoutRequest> {
    try {
      // Get ambassador and wallet info
      const { data: ambassador, error: ambassadorError } = await supabaseAdmin
        .from('ambassadors')
        .select(`
          *,
          wallets (*)
        `)
        .eq('id', ambassadorId)
        .single();

      if (ambassadorError) {
        throw new APIError(`Failed to fetch ambassador: ${ambassadorError.message}`, 500);
      }

      const wallet = ambassador.wallets;
      if (!wallet || wallet.balance.points < pointsToRedeem) {
        throw new APIError('Insufficient points for payout', 400);
      }

      const payoutAmount = pointsToRedeem * conversionRate;

      // Create payout request
      const { data: payoutRequest, error } = await supabaseAdmin
        .from('payout_requests')
        .insert({
          ambassador_id: ambassadorId,
          wallet_id: wallet.id,
          amount: payoutAmount,
          points_redeemed: pointsToRedeem,
          status: PayoutStatus.PENDING
        })
        .select()
        .single();

      if (error) {
        throw new APIError(`Failed to create payout request: ${error.message}`, 500);
      }

      // Deduct points from wallet (pending payout)
      await this.addWalletTransaction(
        wallet.id,
        TransactionType.PAYOUT,
        payoutAmount,
        pointsToRedeem,
        `Payout request #${payoutRequest.id}`,
        payoutRequest.id,
        { status: 'pending' }
      );

      return payoutRequest;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Payout request failed: ${error}`, 500);
    }
  }

  static async processPayoutRequest(
    payoutRequestId: string,
    processedBy: string,
    approved: boolean,
    transactionId?: string,
    notes?: string
  ): Promise<PayoutRequest> {
    try {
      const status = approved ? PayoutStatus.PROCESSED : PayoutStatus.REJECTED;
      
      const { data: payoutRequest, error } = await supabaseAdmin
        .from('payout_requests')
        .update({
          status: status,
          processed_at: new Date().toISOString(),
          processed_by: processedBy,
          transaction_id: transactionId,
          admin_notes: notes,
          rejection_reason: approved ? null : notes
        })
        .eq('id', payoutRequestId)
        .select()
        .single();

      if (error) {
        throw new APIError(`Failed to process payout request: ${error.message}`, 500);
      }

      // If rejected, refund points to wallet
      if (!approved) {
        await this.addWalletTransaction(
          payoutRequest.wallet_id,
          TransactionType.CREDIT,
          0,
          payoutRequest.points_redeemed,
          `Payout request #${payoutRequestId} rejected - points refunded`,
          payoutRequestId,
          { status: 'refunded' }
        );
      }

      return payoutRequest;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Payout processing failed: ${error}`, 500);
    }
  }

  static async getPayoutRequests(
    ambassadorId?: string,
    status?: PayoutStatus,
    limit: number = 50,
    offset: number = 0
  ): Promise<PayoutRequest[]> {
    try {
      let query = supabaseAdmin
        .from('payout_requests')
        .select(`
          *,
          ambassadors (
            referral_code,
            users (
              email,
              profile
            )
          )
        `);

      if (ambassadorId) {
        query = query.eq('ambassador_id', ambassadorId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data: payoutRequests, error } = await query
        .order('requested_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new APIError(`Failed to fetch payout requests: ${error.message}`, 500);
      }

      return payoutRequests || [];
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Failed to fetch payout requests: ${error}`, 500);
    }
  }

  // Point Configuration Management
  static async getPointConfigurations(): Promise<PointConfiguration[]> {
    try {
      const { data: configurations, error } = await supabaseAdmin
        .from('point_configurations')
        .select('*')
        .eq('is_active', true)
        .order('event_type');

      if (error) {
        throw new APIError(`Failed to fetch point configurations: ${error.message}`, 500);
      }

      return configurations || [];
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Failed to fetch point configurations: ${error}`, 500);
    }
  }

  static async updatePointConfiguration(
    eventType: ReferralEventType,
    pointsAwarded: number,
    conditions: any,
    updatedBy: string
  ): Promise<PointConfiguration> {
    try {
      const { data: configuration, error } = await supabaseAdmin
        .from('point_configurations')
        .upsert({
          event_type: eventType,
          points_awarded: pointsAwarded,
          conditions: conditions,
          is_active: true,
          created_by: updatedBy
        })
        .select()
        .single();

      if (error) {
        throw new APIError(`Failed to update point configuration: ${error.message}`, 500);
      }

      return configuration;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Point configuration update failed: ${error}`, 500);
    }
  }

  // Analytics and Reporting
  static async getAmbassadorAnalytics(ambassadorId: string): Promise<any> {
    try {
      // Get ambassador with referrals and wallet
      const { data: ambassador, error } = await supabaseAdmin
        .from('ambassadors')
        .select(`
          *,
          referrals (*),
          wallets (*)
        `)
        .eq('id', ambassadorId)
        .single();

      if (error) {
        throw new APIError(`Failed to fetch ambassador analytics: ${error.message}`, 500);
      }

      const referrals = ambassador.referrals || [];
      const wallet = ambassador.wallets;

      // Calculate analytics
      const totalReferrals = referrals.length;
      const convertedReferrals = referrals.filter(r => r.status === 'converted').length;
      const conversionRate = totalReferrals > 0 ? (convertedReferrals / totalReferrals) * 100 : 0;

      const totalEarnings = referrals.reduce((sum, referral) => {
        return sum + (referral.conversion_events || []).reduce((eventSum, event) => {
          return eventSum + event.value;
        }, 0);
      }, 0);

      const monthlyReferrals = referrals.filter(r => {
        const referralDate = new Date(r.registration_date);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return referralDate >= oneMonthAgo;
      }).length;

      return {
        ambassador,
        analytics: {
          totalReferrals,
          convertedReferrals,
          conversionRate,
          totalEarnings,
          monthlyReferrals,
          currentPoints: wallet?.balance.points || 0,
          availableForPayout: wallet?.balance.points || 0,
          lifetimeEarnings: wallet?.total_earned || 0
        }
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Analytics fetch failed: ${error}`, 500);
    }
  }
}
