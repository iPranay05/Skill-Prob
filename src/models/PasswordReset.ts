import { supabaseAdmin } from '@/lib/database';

export interface PasswordReset {
  id?: string;
  userId: string;
  token: string;
  expiresAt: string;
  used: boolean;
  createdAt?: string;
}

export class PasswordResetModel {
  static async create(resetData: Omit<PasswordReset, 'id' | 'createdAt'>): Promise<PasswordReset> {
    const { data, error } = await supabaseAdmin
      .from('password_resets')
      .insert([resetData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create password reset: ${error.message}`);
    }

    return data;
  }

  static async findByToken(token: string): Promise<PasswordReset | null> {
    const { data, error } = await supabaseAdmin
      .from('password_resets')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expiresAt', new Date().toISOString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find password reset: ${error.message}`);
    }

    return data;
  }

  static async markAsUsed(id: string): Promise<PasswordReset> {
    const { data, error } = await supabaseAdmin
      .from('password_resets')
      .update({ used: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark password reset as used: ${error.message}`);
    }

    return data;
  }

  static async deleteUnusedByUserId(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('password_resets')
      .delete()
      .eq('userId', userId)
      .eq('used', false);

    if (error) {
      throw new Error(`Failed to delete unused password resets: ${error.message}`);
    }
  }

  static async deleteExpired(): Promise<void> {
    const { error } = await supabaseAdmin
      .from('password_resets')
      .delete()
      .lt('expiresAt', new Date().toISOString());

    if (error) {
      throw new Error(`Failed to delete expired password resets: ${error.message}`);
    }
  }
}