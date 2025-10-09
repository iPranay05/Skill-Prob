import { NextRequest } from 'next/server';
import { GET as getConfig, PUT as updateConfig } from '@/app/api/admin/config/route';
import { GET as getPricingConfig, PUT as updatePricingConfig } from '@/app/api/admin/config/pricing/route';
import { GET as getFeatureFlags, PUT as updateFeatureFlags } from '@/app/api/admin/config/features/route';
import { verifyAuth } from '@/lib/auth';
import { systemConfigService } from '@/lib/systemConfigService';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn()
}));

jest.mock('@/lib/systemConfigService', () => ({
  systemConfigService: {
    getConfig: jest.fn(),
    getConfigsByCategory: jest.fn(),
    updateConfig: jest.fn(),
    getPricingConfig: jest.fn(),
    updatePricingConfig: jest.fn(),
    getFeatureFlags: jest.fn(),
    updateFeatureFlag: jest.fn(),
    createAuditLog: jest.fn(),
    getAuditLogs: jest.fn()
  }
}));

const mockVerifyAuth = verifyAuth as jest.MockedFunction<typeof verifyAuth>;
const mockSystemConfigService = systemConfigService as jest.Mocked<typeof systemConfigService>;

describe('Admin Config API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/config', () => {
    it('should return specific configuration by key', async () => {
      const mockConfig = {
        id: 'config1',
        key: 'test_config',
        value: { setting: 'value' },
        description: 'Test configuration',
        category: 'general',
        isActive: true,
        updatedBy: 'user1',
        updatedAt: new Date()
      };

      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'admin', email: 'admin@test.com' }
      });

      mockSystemConfigService.getConfig.mockResolvedValue(mockConfig);

      const request = new NextRequest('http://localhost:3000/api/admin/config?key=test_config');
      const response = await getConfig(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockConfig);
      expect(mockSystemConfigService.getConfig).toHaveBeenCalledWith('test_config');
    });

    it('should return configurations by category', async () => {
      const mockConfigs = [
        {
          id: 'config1',
          key: 'pricing_config',
          value: { currency: 'INR' },
          description: 'Pricing configuration',
          category: 'pricing',
          isActive: true,
          updatedBy: 'user1',
          updatedAt: new Date()
        }
      ];

      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'admin', email: 'admin@test.com' }
      });

      mockSystemConfigService.getConfigsByCategory.mockResolvedValue(mockConfigs);

      const request = new NextRequest('http://localhost:3000/api/admin/config?category=pricing');
      const response = await getConfig(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockConfigs);
      expect(mockSystemConfigService.getConfigsByCategory).toHaveBeenCalledWith('pricing');
    });

    it('should return all configurations for super admin', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'super_admin', email: 'admin@test.com' }
      });

      mockSystemConfigService.getConfigsByCategory
        .mockResolvedValueOnce([]) // pricing
        .mockResolvedValueOnce([]) // integrations
        .mockResolvedValueOnce([]) // feature_flags
        .mockResolvedValueOnce([]); // general

      const request = new NextRequest('http://localhost:3000/api/admin/config');
      const response = await getConfig(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('pricing');
      expect(data.data).toHaveProperty('integrations');
      expect(data.data).toHaveProperty('feature_flags');
      expect(data.data).toHaveProperty('general');
    });

    it('should reject non-super admin for all configs', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'admin', email: 'admin@test.com' }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/config');
      const response = await getConfig(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Super admin access required');
    });
  });

  describe('PUT /api/admin/config', () => {
    it('should update configuration for super admin', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'super_admin', email: 'admin@test.com' }
      });

      mockSystemConfigService.updateConfig.mockResolvedValue();

      const requestBody = {
        key: 'test_config',
        value: { setting: 'new_value' },
        description: 'Updated configuration'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/config', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      const response = await updateConfig(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Configuration updated successfully');
      expect(mockSystemConfigService.updateConfig).toHaveBeenCalledWith(
        'test_config',
        { setting: 'new_value' },
        'admin1',
        'Updated configuration'
      );
    });

    it('should reject non-super admin users', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'admin', email: 'admin@test.com' }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/config', {
        method: 'PUT',
        body: JSON.stringify({ key: 'test', value: 'value' })
      });

      const response = await updateConfig(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Super admin access required');
    });

    it('should validate required fields', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'super_admin', email: 'admin@test.com' }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/config', {
        method: 'PUT',
        body: JSON.stringify({ key: 'test' }) // Missing value
      });

      const response = await updateConfig(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Key and value are required');
    });
  });

  describe('GET /api/admin/config/pricing', () => {
    it('should return pricing configuration', async () => {
      const mockPricingConfig = {
        defaultCurrency: 'INR',
        taxRates: { 'IN': 18 },
        commissionRates: { mentor: 70, ambassador: 10, platform: 20 },
        refundPolicy: { allowRefunds: true, refundWindowDays: 7, refundPercentage: 100 },
        discountLimits: { maxPercentage: 50, maxFixedAmount: 5000 }
      };

      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'admin', email: 'admin@test.com' }
      });

      mockSystemConfigService.getPricingConfig.mockResolvedValue(mockPricingConfig);

      const request = new NextRequest('http://localhost:3000/api/admin/config/pricing');
      const response = await getPricingConfig(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockPricingConfig);
    });
  });

  describe('PUT /api/admin/config/pricing', () => {
    it('should update pricing configuration', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'super_admin', email: 'admin@test.com' }
      });

      mockSystemConfigService.updatePricingConfig.mockResolvedValue();

      const requestBody = {
        defaultCurrency: 'USD',
        commissionRates: { mentor: 75, ambassador: 15, platform: 10 }
      };

      const request = new NextRequest('http://localhost:3000/api/admin/config/pricing', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      const response = await updatePricingConfig(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Pricing configuration updated successfully');
      expect(mockSystemConfigService.updatePricingConfig).toHaveBeenCalledWith(requestBody, 'admin1');
    });

    it('should validate commission rates sum to 100%', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'super_admin', email: 'admin@test.com' }
      });

      const requestBody = {
        commissionRates: { mentor: 60, ambassador: 10, platform: 20 } // Sum = 90%
      };

      const request = new NextRequest('http://localhost:3000/api/admin/config/pricing', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      const response = await updatePricingConfig(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Commission rates must sum to 100%');
    });

    it('should validate field names', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'super_admin', email: 'admin@test.com' }
      });

      const requestBody = {
        invalidField: 'value'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/config/pricing', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      const response = await updatePricingConfig(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid fields: invalidField');
    });
  });

  describe('GET /api/admin/config/features', () => {
    it('should return feature flags', async () => {
      const mockFeatureFlags = {
        live_sessions_enabled: { enabled: true, description: 'Enable live sessions' },
        ambassador_program_enabled: { enabled: false, description: 'Enable ambassador program' }
      };

      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'admin', email: 'admin@test.com' }
      });

      mockSystemConfigService.getFeatureFlags.mockResolvedValue(mockFeatureFlags);

      const request = new NextRequest('http://localhost:3000/api/admin/config/features');
      const response = await getFeatureFlags(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockFeatureFlags);
    });
  });

  describe('PUT /api/admin/config/features', () => {
    it('should update feature flag', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'super_admin', email: 'admin@test.com' }
      });

      mockSystemConfigService.updateFeatureFlag.mockResolvedValue();

      const requestBody = {
        flagName: 'test_feature',
        enabled: true,
        description: 'Test feature',
        rolloutPercentage: 50,
        targetRoles: ['admin']
      };

      const request = new NextRequest('http://localhost:3000/api/admin/config/features', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      const response = await updateFeatureFlags(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Feature flag updated successfully');
      expect(mockSystemConfigService.updateFeatureFlag).toHaveBeenCalledWith(
        'test_feature',
        true,
        'admin1',
        {
          description: 'Test feature',
          rolloutPercentage: 50,
          targetRoles: ['admin']
        }
      );
    });

    it('should validate rollout percentage', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'super_admin', email: 'admin@test.com' }
      });

      const requestBody = {
        flagName: 'test_feature',
        enabled: true,
        rolloutPercentage: 150 // Invalid
      };

      const request = new NextRequest('http://localhost:3000/api/admin/config/features', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      const response = await updateFeatureFlags(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Rollout percentage must be between 0 and 100');
    });

    it('should validate target roles', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'super_admin', email: 'admin@test.com' }
      });

      const requestBody = {
        flagName: 'test_feature',
        enabled: true,
        targetRoles: ['invalid_role']
      };

      const request = new NextRequest('http://localhost:3000/api/admin/config/features', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      const response = await updateFeatureFlags(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid roles: invalid_role');
    });
  });
});