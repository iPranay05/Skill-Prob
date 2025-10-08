import { supabaseAdmin } from '@/lib/database';
import { OTPVerification } from '@/types/user';

export class OTPVerificationModel {
  // Convert camelCase to snake_case for database
  private static toDbFormat(otpData: any): any {
    const dbData = { ...otpData };
    if (dbData.userId !== undefined) {
      dbData.user_id = dbData.userId;
      delete dbData.userId;
    }
    if (dbData.expiresAt !== undefined) {
      dbData.expires_at = dbData.expiresAt;
      delete dbData.expiresAt;
    }
    if (dbData.createdAt !== undefined) {
      dbData.created_at = dbData.createdAt;
      delete dbData.createdAt;
    }
    return dbData;
  }

  // Convert snake_case to camelCase from database
  private static fromDbFormat(dbData: any): OTPVerification {
    if (!dbData) return dbData;
    
    const otpData = { ...dbData };
    if (otpData.user_id !== undefined) {
      otpData.userId = otpData.user_id;
      delete otpData.user_id;
    }
    if (otpData.expires_at !== undefined) {
      otpData.expiresAt = otpData.expires_at;
      delete otpData.expires_at;
    }
    if (otpData.created_at !== undefined) {
      otpData.createdAt = otpData.created_at;
      delete otpData.created_at;
    }
    return otpData;
  }

  static async create(otpData: Omit<OTPVerification, 'id' | 'createdAt'>): Promise<OTPVerification> {
    const dbData = this.toDbFormat(otpData);
    const { data, error } = await supabaseAdmin
      .from('otp_verifications')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create OTP verification: ${error.message}`);
    }

    return this.fromDbFormat(data);
  }

  static async findById(id: string): Promise<OTPVerification | null> {
    const { data, error } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find OTP verification: ${error.message}`);
    }

    return this.fromDbFormat(data);
  }

  static async findByUserIdAndType(userId: string, type: 'email' | 'phone', code: string): Promise<OTPVerification | null> {
    const { data, error } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('code', code)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find OTP verification: ${error.message}`);
    }

    return this.fromDbFormat(data);
  }

  static async update(id: string, updates: Partial<OTPVerification>): Promise<OTPVerification> {
    const dbUpdates = this.toDbFormat(updates);
    const { data, error } = await supabaseAdmin
      .from('otp_verifications')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update OTP verification: ${error.message}`);
    }

    return this.fromDbFormat(data);
  }

  static async markAsVerified(id: string): Promise<OTPVerification> {
    return this.update(id, { verified: true });
  }

  static async deleteUnverifiedByUserAndType(userId: string, type: 'email' | 'phone'): Promise<void> {
    const { error } = await supabaseAdmin
      .from('otp_verifications')
      .delete()
      .eq('user_id', userId)
      .eq('type', type)
      .eq('verified', false);

    if (error) {
      throw new Error(`Failed to delete unverified OTPs: ${error.message}`);
    }
  }

  static async deleteExpired(): Promise<void> {
    const { error } = await supabaseAdmin
      .from('otp_verifications')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      throw new Error(`Failed to delete expired OTPs: ${error.message}`);
    }
  }

  static async findValidOTP(userId: string, type: 'email' | 'phone', code: string): Promise<OTPVerification | null> {
    const { data, error } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('code', code)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find valid OTP: ${error.message}`);
    }

    return this.fromDbFormat(data);
  }
}