import { supabaseAdmin } from './database';

export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  description?: string;
  category: string;
  isActive: boolean;
  updatedBy: string;
  updatedAt: Date;
}

export interface PricingConfig {
  defaultCurrency: string;
  taxRates: {
    [country: string]: number;
  };
  commissionRates: {
    mentor: number;
    ambassador: number;
    platform: number;
  };
  refundPolicy: {
    allowRefunds: boolean;
    refundWindowDays: number;
    refundPercentage: number;
  };
  discountLimits: {
    maxPercentage: number;
    maxFixedAmount: number;
  };
}

export interface FeatureFlags {
  [key: string]: {
    enabled: boolean;
    description: string;
    rolloutPercentage?: number;
    targetRoles?: string[];
  };
}

export interface IntegrationConfig {
  googleMeet: {
    enabled: boolean;
    clientId: string;
    clientSecret: string; // This should be encrypted
    redirectUri: string;
  };
  paymentGateways: {
    razorpay: {
      enabled: boolean;
      keyId: string;
      keySecret: string; // This should be encrypted
      webhookSecret: string; // This should be encrypted
    };
    stripe: {
      enabled: boolean;
      publishableKey: string;
      secretKey: string; // This should be encrypted
      webhookSecret: string; // This should be encrypted
    };
  };
  notifications: {
    email: {
      provider: 'smtp' | 'sendgrid' | 'ses';
      config: any;
    };
    sms: {
      provider: 'twilio' | 'aws-sns';
      config: any;
    };
  };
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export class SystemConfigService {
  /**
   * Get system configuration by key
   */
  async getConfig(key: string): Promise<SystemConfig | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('system_configs')
        .select('*')
        .eq('key', key)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return {
        id: data.id,
        key: data.key,
        value: data.value,
        description: data.description,
        category: data.category,
        isActive: data.is_active,
        updatedBy: data.updated_by,
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error getting system config:', error);
      throw error;
    }
  }

  /**
   * Get all configurations by category
   */
  async getConfigsByCategory(category: string): Promise<SystemConfig[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('system_configs')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('key');

      if (error) throw error;

      return data?.map(config => ({
        id: config.id,
        key: config.key,
        value: config.value,
        description: config.description,
        category: config.category,
        isActive: config.is_active,
        updatedBy: config.updated_by,
        updatedAt: new Date(config.updated_at)
      })) || [];
    } catch (error) {
      console.error('Error getting configs by category:', error);
      throw error;
    }
  }

  /**
   * Update system configuration
   */
  async updateConfig(key: string, value: any, updatedBy: string, description?: string): Promise<void> {
    try {
      // Log the change for audit
      const oldConfig = await this.getConfig(key);
      
      const { error } = await supabaseAdmin
        .from('system_configs')
        .upsert({
          key,
          value,
          description,
          updated_by: updatedBy,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Create audit log
      await this.createAuditLog({
        userId: updatedBy,
        action: oldConfig ? 'UPDATE' : 'CREATE',
        resource: 'system_config',
        resourceId: key,
        oldValues: oldConfig?.value,
        newValues: value
      });
    } catch (error) {
      console.error('Error updating system config:', error);
      throw error;
    }
  }

  /**
   * Get pricing configuration
   */
  async getPricingConfig(): Promise<PricingConfig> {
    try {
      const configs = await this.getConfigsByCategory('pricing');
      
      const defaultConfig: PricingConfig = {
        defaultCurrency: 'INR',
        taxRates: {
          'IN': 18, // GST in India
          'US': 8.5,
          'UK': 20
        },
        commissionRates: {
          mentor: 70,
          ambassador: 10,
          platform: 20
        },
        refundPolicy: {
          allowRefunds: true,
          refundWindowDays: 7,
          refundPercentage: 100
        },
        discountLimits: {
          maxPercentage: 50,
          maxFixedAmount: 5000
        }
      };

      // Override with database values
      configs.forEach(config => {
        if (config.key === 'pricing_config') {
          Object.assign(defaultConfig, config.value);
        }
      });

      return defaultConfig;
    } catch (error) {
      console.error('Error getting pricing config:', error);
      throw error;
    }
  }

  /**
   * Update pricing configuration
   */
  async updatePricingConfig(config: Partial<PricingConfig>, updatedBy: string): Promise<void> {
    try {
      const currentConfig = await this.getPricingConfig();
      const newConfig = { ...currentConfig, ...config };
      
      await this.updateConfig('pricing_config', newConfig, updatedBy, 'Global pricing configuration');
    } catch (error) {
      console.error('Error updating pricing config:', error);
      throw error;
    }
  }

  /**
   * Get feature flags
   */
  async getFeatureFlags(): Promise<FeatureFlags> {
    try {
      const configs = await this.getConfigsByCategory('feature_flags');
      const flags: FeatureFlags = {};

      configs.forEach(config => {
        flags[config.key] = config.value;
      });

      return flags;
    } catch (error) {
      console.error('Error getting feature flags:', error);
      throw error;
    }
  }

  /**
   * Update feature flag
   */
  async updateFeatureFlag(
    flagName: string, 
    enabled: boolean, 
    updatedBy: string,
    options?: {
      description?: string;
      rolloutPercentage?: number;
      targetRoles?: string[];
    }
  ): Promise<void> {
    try {
      const flagConfig = {
        enabled,
        description: options?.description || '',
        rolloutPercentage: options?.rolloutPercentage,
        targetRoles: options?.targetRoles
      };

      await this.updateConfig(
        flagName, 
        flagConfig, 
        updatedBy, 
        `Feature flag: ${options?.description || flagName}`
      );
    } catch (error) {
      console.error('Error updating feature flag:', error);
      throw error;
    }
  }

  /**
   * Check if feature is enabled for user
   */
  async isFeatureEnabled(flagName: string, userRole?: string): Promise<boolean> {
    try {
      const flags = await this.getFeatureFlags();
      const flag = flags[flagName];

      if (!flag) return false;
      if (!flag.enabled) return false;

      // Check role-based access
      if (flag.targetRoles && flag.targetRoles.length > 0 && userRole) {
        if (!flag.targetRoles.includes(userRole)) return false;
      }

      // Check rollout percentage
      if (flag.rolloutPercentage && flag.rolloutPercentage < 100) {
        // Simple hash-based rollout (in production, use more sophisticated logic)
        const hash = flagName.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        const percentage = Math.abs(hash) % 100;
        return percentage < flag.rolloutPercentage;
      }

      return true;
    } catch (error) {
      console.error('Error checking feature flag:', error);
      return false;
    }
  }

  /**
   * Get integration configurations
   */
  async getIntegrationConfig(): Promise<IntegrationConfig> {
    try {
      const configs = await this.getConfigsByCategory('integrations');
      
      const defaultConfig: IntegrationConfig = {
        googleMeet: {
          enabled: false,
          clientId: '',
          clientSecret: '',
          redirectUri: ''
        },
        paymentGateways: {
          razorpay: {
            enabled: false,
            keyId: '',
            keySecret: '',
            webhookSecret: ''
          },
          stripe: {
            enabled: false,
            publishableKey: '',
            secretKey: '',
            webhookSecret: ''
          }
        },
        notifications: {
          email: {
            provider: 'smtp',
            config: {}
          },
          sms: {
            provider: 'twilio',
            config: {}
          }
        }
      };

      // Override with database values
      configs.forEach(config => {
        if (config.key === 'integration_config') {
          Object.assign(defaultConfig, config.value);
        }
      });

      return defaultConfig;
    } catch (error) {
      console.error('Error getting integration config:', error);
      throw error;
    }
  }

  /**
   * Update integration configuration
   */
  async updateIntegrationConfig(config: Partial<IntegrationConfig>, updatedBy: string): Promise<void> {
    try {
      const currentConfig = await this.getIntegrationConfig();
      const newConfig = { ...currentConfig, ...config };
      
      await this.updateConfig('integration_config', newConfig, updatedBy, 'Integration configuration');
    } catch (error) {
      console.error('Error updating integration config:', error);
      throw error;
    }
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(logData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: logData.userId,
          action: logData.action,
          resource: logData.resource,
          resource_id: logData.resourceId,
          old_values: logData.oldValues,
          new_values: logData.newValues,
          ip_address: logData.ipAddress,
          user_agent: logData.userAgent,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw here as audit logging shouldn't break main functionality
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filters: {
    userId?: string;
    resource?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]> {
    try {
      let query = supabaseAdmin
        .from('audit_logs')
        .select(`
          *,
          users!inner(profile)
        `)
        .order('created_at', { ascending: false });

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.resource) {
        query = query.eq('resource', filters.resource);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.map(log => ({
        id: log.id,
        userId: log.user_id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resource_id,
        oldValues: log.old_values,
        newValues: log.new_values,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        timestamp: new Date(log.created_at)
      })) || [];
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Initialize default system configurations
   */
  async initializeDefaultConfigs(): Promise<void> {
    try {
      const defaultConfigs = [
        {
          key: 'pricing_config',
          category: 'pricing',
          value: {
            defaultCurrency: 'INR',
            taxRates: { 'IN': 18, 'US': 8.5, 'UK': 20 },
            commissionRates: { mentor: 70, ambassador: 10, platform: 20 },
            refundPolicy: { allowRefunds: true, refundWindowDays: 7, refundPercentage: 100 },
            discountLimits: { maxPercentage: 50, maxFixedAmount: 5000 }
          },
          description: 'Global pricing and commission configuration'
        },
        {
          key: 'live_sessions_enabled',
          category: 'feature_flags',
          value: { enabled: true, description: 'Enable live session functionality' },
          description: 'Feature flag for live sessions'
        },
        {
          key: 'ambassador_program_enabled',
          category: 'feature_flags',
          value: { enabled: true, description: 'Enable ambassador referral program' },
          description: 'Feature flag for ambassador program'
        },
        {
          key: 'internship_board_enabled',
          category: 'feature_flags',
          value: { enabled: true, description: 'Enable internship job board' },
          description: 'Feature flag for internship board'
        },
        {
          key: 'integration_config',
          category: 'integrations',
          value: {
            googleMeet: { enabled: false },
            paymentGateways: { razorpay: { enabled: false }, stripe: { enabled: false } },
            notifications: { email: { provider: 'smtp' }, sms: { provider: 'twilio' } }
          },
          description: 'External service integration configuration'
        }
      ];

      for (const config of defaultConfigs) {
        const existing = await this.getConfig(config.key);
        if (!existing) {
          await this.updateConfig(config.key, config.value, 'system', config.description);
        }
      }
    } catch (error) {
      console.error('Error initializing default configs:', error);
      throw error;
    }
  }
}

export const systemConfigService = new SystemConfigService();