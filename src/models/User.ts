import { supabaseAdmin } from '@/lib/database';
import { User, UserRole, VerificationStatus } from '@/types/user';

// Export User type for other files to import
export type { User } from '@/types/user';

export class UserModel {
  // Convert camelCase to snake_case for database
  private static toDbFormat(userData: any): any {
    const dbData = { ...userData };
    if (dbData.referralCode !== undefined) {
      dbData.referral_code = dbData.referralCode;
      delete dbData.referralCode;
    }
    if (dbData.referredBy !== undefined) {
      dbData.referred_by = dbData.referredBy;
      delete dbData.referredBy;
    }
    if (dbData.createdAt !== undefined) {
      dbData.created_at = dbData.createdAt;
      delete dbData.createdAt;
    }
    if (dbData.updatedAt !== undefined) {
      dbData.updated_at = dbData.updatedAt;
      delete dbData.updatedAt;
    }
    return dbData;
  }

  // Convert snake_case to camelCase from database
  private static fromDbFormat(dbData: any): User {
    if (!dbData) return dbData;
    
    const userData = { ...dbData };
    if (userData.referral_code !== undefined) {
      userData.referralCode = userData.referral_code;
      delete userData.referral_code;
    }
    if (userData.referred_by !== undefined) {
      userData.referredBy = userData.referred_by;
      delete userData.referred_by;
    }
    if (userData.created_at !== undefined) {
      userData.createdAt = userData.created_at;
      delete userData.created_at;
    }
    if (userData.updated_at !== undefined) {
      userData.updatedAt = userData.updated_at;
      delete userData.updated_at;
    }
    return userData;
  }

  static async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const dbData = this.toDbFormat(userData);
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return this.fromDbFormat(data);
  }

  static async findById(id: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return this.fromDbFormat(data);
  }

  static async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find user by email: ${error.message}`);
    }

    return this.fromDbFormat(data);
  }

  static async findByPhone(phone: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find user by phone: ${error.message}`);
    }

    return this.fromDbFormat(data);
  }

  static async findByReferralCode(referralCode: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('referral_code', referralCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find user by referral code: ${error.message}`);
    }

    return this.fromDbFormat(data);
  }

  static async findByEmailOrPhone(email: string, phone?: string): Promise<User | null> {
    let query = supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase());

    if (phone) {
      query = query.or(`phone.eq.${phone}`);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return data;
  }

  static async update(id: string, updates: Partial<User>): Promise<User> {
    const dbUpdates = this.toDbFormat(updates);
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return this.fromDbFormat(data);
  }

  static async updateVerification(id: string, verificationType: 'email' | 'phone', verified: boolean): Promise<User> {
    const field = verificationType === 'email' ? 'verification.emailVerified' : 'verification.phoneVerified';
    
    // First get the current verification object
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedVerification = {
      ...user.verification,
      [verificationType === 'email' ? 'emailVerified' : 'phoneVerified']: verified
    };

    return this.update(id, { verification: updatedVerification });
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  static async list(limit: number = 50, offset: number = 0): Promise<User[]> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    return data || [];
  }

  static async countByRole(role: UserRole): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', role);

    if (error) {
      throw new Error(`Failed to count users by role: ${error.message}`);
    }

    return count || 0;
  }
}