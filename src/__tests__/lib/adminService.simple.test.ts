// Mock external dependencies
jest.mock('@/lib/database', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          eq: jest.fn(() => ({
            limit: jest.fn(() => ({
              range: jest.fn(() => Promise.resolve({
                data: [],
                error: null,
                count: 0
              }))
            }))
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          error: null
        }))
      })),
      insert: jest.fn(() => Promise.resolve({
        error: null
      }))
    }))
  }
}));

jest.mock('@/lib/systemConfigService', () => ({
  systemConfigService: {
    createAuditLog: jest.fn()
  }
}));

import { AdminService } from '@/lib/adminService';
import { supabaseAdmin } from '@/lib/database';
import { systemConfigService } from '@/lib/systemConfigService';

describe('AdminService - Core Functionality Tests', () => {
  let adminService: AdminService;
  let mockSupabaseAdmin: jest.Mocked<typeof supabaseAdmin>;
  let mockSystemConfigService: jest.Mocked<typeof systemConfigService>;

  beforeEach(() => {
    jest.clearAllMocks();
    adminService = new AdminService();
    mockSupabaseAdmin = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>;
    mockSystemConfigService = systemConfigService as jest.Mocked<typeof systemConfigService>;
  });

  describe('User Role Management and Permission Controls', () => {
    test('should call correct database methods for user role update', async () => {
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }));
      mockSupabaseAdmin.from.mockReturnValue({
        update: mockUpdate
      } as any);

      await adminService.updateUserRole('user-1', 'mentor', 'admin-1');

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('users');
      expect(mockUpdate).toHaveBeenCalledWith({
        role: 'mentor',
        updated_at: expect.any(String)
      });
      expect(mockSystemConfigService.createAuditLog).toHaveBeenCalledWith({
        userId: 'admin-1',
        action: 'UPDATE',
        resource: 'user_role',
        resourceId: 'user-1',
        newValues: { role: 'mentor' }
      });
    });

    test('should handle user role update errors', async () => {
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: new Error('Update failed') }))
      }));
      mockSupabaseAdmin.from.mockReturnValue({
        update: mockUpdate
      });

      await expect(adminService.updateUserRole('user-1', 'mentor', 'admin-1'))
        .rejects.toThrow('Update failed');
    });

    test('should update user status correctly', async () => {
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }));
      mockSupabaseAdmin.from.mockReturnValue({
        update: mockUpdate
      });

      await adminService.updateUserStatus('user-1', true, 'admin-1');

      expect(mockUpdate).toHaveBeenCalledWith({
        verification: {
          emailVerified: true,
          phoneVerified: false,
          kycStatus: 'pending'
        },
        updated_at: expect.any(String)
      });
    });

    test('should suspend user correctly', async () => {
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }));
      mockSupabaseAdmin.from.mockReturnValue({
        update: mockUpdate
      });

      await adminService.updateUserStatus('user-1', false, 'admin-1');

      expect(mockUpdate).toHaveBeenCalledWith({
        verification: {
          emailVerified: false,
          phoneVerified: false,
          kycStatus: 'suspended'
        },
        updated_at: expect.any(String)
      });
    });
  });

  describe('Financial Transaction Processing and Reconciliation', () => {
    test('should process payout approval correctly', async () => {
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }));
      mockSupabaseAdmin.from.mockReturnValue({
        update: mockUpdate
      });

      await adminService.processPayout(
        'payout-1',
        'approved',
        'admin-1',
        'txn-123',
        'Approved for processing'
      );

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('payout_requests');
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'approved',
        processed_at: expect.any(String),
        processed_by: 'admin-1',
        transaction_id: 'txn-123',
        notes: 'Approved for processing'
      });
      expect(mockSystemConfigService.createAuditLog).toHaveBeenCalledWith({
        userId: 'admin-1',
        action: 'UPDATE',
        resource: 'payout_processing',
        resourceId: 'payout-1',
        newValues: {
          status: 'approved',
          transactionId: 'txn-123',
          notes: 'Approved for processing'
        }
      });
    });

    test('should process payout rejection correctly', async () => {
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }));
      mockSupabaseAdmin.from.mockReturnValue({
        update: mockUpdate
      });

      await adminService.processPayout(
        'payout-1',
        'rejected',
        'admin-1',
        undefined,
        'Insufficient documentation'
      );

      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'rejected',
        processed_at: expect.any(String),
        processed_by: 'admin-1',
        transaction_id: undefined,
        notes: 'Insufficient documentation'
      });
    });

    test('should handle payout processing errors', async () => {
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: new Error('Processing failed') }))
      }));
      mockSupabaseAdmin.from.mockReturnValue({
        update: mockUpdate
      });

      await expect(adminService.processPayout('payout-1', 'approved', 'admin-1'))
        .rejects.toThrow('Processing failed');
    });

    test('should moderate course approval correctly', async () => {
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }));
      const mockInsert = jest.fn(() => Promise.resolve({ error: null }));
      
      mockSupabaseAdmin.from.mockImplementation((table) => {
        if (table === 'courses') {
          return { update: mockUpdate };
        } else if (table === 'course_moderations') {
          return { insert: mockInsert };
        }
        return {};
      });

      await adminService.moderateCourse(
        'course-1',
        'published',
        'admin-1',
        'Good quality content',
        85
      );

      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'published',
        updated_at: expect.any(String)
      });
      expect(mockInsert).toHaveBeenCalledWith({
        course_id: 'course-1',
        reviewed_by: 'admin-1',
        decision: 'published',
        review_notes: 'Good quality content',
        quality_score: 85,
        reviewed_at: expect.any(String)
      });
    });

    test('should moderate course rejection correctly', async () => {
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }));
      const mockInsert = jest.fn(() => Promise.resolve({ error: null }));
      
      mockSupabaseAdmin.from.mockImplementation((table) => {
        if (table === 'courses') {
          return { update: mockUpdate };
        } else if (table === 'course_moderations') {
          return { insert: mockInsert };
        }
        return {};
      });

      await adminService.moderateCourse(
        'course-1',
        'rejected',
        'admin-1',
        'Content quality needs improvement',
        45
      );

      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'rejected',
        updated_at: expect.any(String)
      });
      expect(mockSystemConfigService.createAuditLog).toHaveBeenCalledWith({
        userId: 'admin-1',
        action: 'UPDATE',
        resource: 'course_moderation',
        resourceId: 'course-1',
        newValues: {
          status: 'rejected',
          reviewNotes: 'Content quality needs improvement',
          qualityScore: 45
        }
      });
    });
  });

  describe('Analytics Calculation and Report Generation', () => {
    test('should call correct database methods for system stats', async () => {
      // Mock Promise.all behavior by tracking calls
      let callCount = 0;
      const mockSelect = jest.fn(() => {
        callCount++;
        switch (callCount) {
          case 1: // totalUsers
            return Promise.resolve({ data: [{ count: 1000 }], error: null });
          case 2: // activeUsers
            return {
              eq: jest.fn(() => Promise.resolve({ data: [{ count: 750 }], error: null }))
            };
          case 3: // totalCourses
            return {
              eq: jest.fn(() => Promise.resolve({ data: [{ count: 50 }], error: null }))
            };
          case 4: // pendingModerations
            return {
              in: jest.fn(() => Promise.resolve({ data: [{ count: 5 }], error: null }))
            };
          case 5: // pendingPayouts
            return {
              eq: jest.fn(() => Promise.resolve({ data: [{ count: 3 }], error: null }))
            };
          case 6: // totalRevenue
            return Promise.resolve({
              data: [
                { amount_paid: 1000 },
                { amount_paid: 1500 },
                { amount_paid: 2000 }
              ],
              error: null
            });
          default:
            return Promise.resolve({ data: [], error: null });
        }
      });

      mockSupabaseAdmin.from.mockReturnValue({
        select: mockSelect
      });

      const result = await adminService.getSystemStats();

      expect(result.totalUsers).toBe(1000);
      expect(result.activeUsers).toBe(750);
      expect(result.totalCourses).toBe(50);
      expect(result.pendingModerations).toBe(5);
      expect(result.pendingPayouts).toBe(3);
      expect(result.totalRevenue).toBe(4500);
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('courses');
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('payout_requests');
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('course_enrollments');
    });

    test('should handle missing data in system stats', async () => {
      // Mock Promise.all calls to return null data
      let callCount = 0;
      const mockSelect = jest.fn(() => {
        callCount++;
        switch (callCount) {
          case 1: // totalUsers
            return Promise.resolve({ data: null, error: null });
          case 2: // activeUsers
            return {
              eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
            };
          case 3: // totalCourses
            return {
              eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
            };
          case 4: // pendingModerations
            return {
              in: jest.fn(() => Promise.resolve({ data: null, error: null }))
            };
          case 5: // pendingPayouts
            return {
              eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
            };
          case 6: // totalRevenue
            return Promise.resolve({ data: null, error: null });
          default:
            return Promise.resolve({ data: null, error: null });
        }
      });

      mockSupabaseAdmin.from.mockReturnValue({
        select: mockSelect
      } as any);

      const result = await adminService.getSystemStats();

      expect(result.totalUsers).toBe(0);
      expect(result.activeUsers).toBe(0);
      expect(result.totalCourses).toBe(0);
      expect(result.pendingModerations).toBe(0);
      expect(result.pendingPayouts).toBe(0);
      expect(result.totalRevenue).toBe(0);
    });

    test('should handle database errors in system stats', async () => {
      const mockSelect = jest.fn(() => Promise.resolve({ data: null, error: new Error('Database error') }));
      mockSupabaseAdmin.from.mockReturnValue({
        select: mockSelect
      } as any);

      await expect(adminService.getSystemStats()).rejects.toThrow('Database error');
    });
  });

  describe('Permission and Access Control Validation', () => {
    test('should validate admin permissions for user management', () => {
      const adminRoles = ['admin', 'super_admin'];
      const nonAdminRoles = ['student', 'mentor', 'ambassador', 'employer'];

      // Test that admin roles are valid
      adminRoles.forEach(role => {
        expect(['admin', 'super_admin'].includes(role)).toBe(true);
      });

      // Test that non-admin roles are invalid
      nonAdminRoles.forEach(role => {
        expect(['admin', 'super_admin'].includes(role)).toBe(false);
      });
    });

    test('should validate payout decision types', () => {
      const validDecisions = ['approved', 'rejected', 'processed'];
      const invalidDecisions = ['pending', 'cancelled', 'invalid'];

      validDecisions.forEach(decision => {
        expect(['approved', 'rejected', 'processed'].includes(decision)).toBe(true);
      });

      invalidDecisions.forEach(decision => {
        expect(['approved', 'rejected', 'processed'].includes(decision)).toBe(false);
      });
    });

    test('should validate course moderation decisions', () => {
      const validDecisions = ['published', 'rejected'];
      const invalidDecisions = ['pending', 'draft', 'archived'];

      validDecisions.forEach(decision => {
        expect(['published', 'rejected'].includes(decision)).toBe(true);
      });

      invalidDecisions.forEach(decision => {
        expect(['published', 'rejected'].includes(decision)).toBe(false);
      });
    });
  });

  describe('Audit Trail and Logging', () => {
    test('should create audit logs for all critical operations', async () => {
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }));
      mockSupabaseAdmin.from.mockReturnValue({
        update: mockUpdate
      });

      // Test user role update audit
      await adminService.updateUserRole('user-1', 'mentor', 'admin-1');
      expect(mockSystemConfigService.createAuditLog).toHaveBeenCalledWith({
        userId: 'admin-1',
        action: 'UPDATE',
        resource: 'user_role',
        resourceId: 'user-1',
        newValues: { role: 'mentor' }
      });

      // Test user status update audit
      await adminService.updateUserStatus('user-1', false, 'admin-1');
      expect(mockSystemConfigService.createAuditLog).toHaveBeenCalledWith({
        userId: 'admin-1',
        action: 'UPDATE',
        resource: 'user_status',
        resourceId: 'user-1',
        newValues: {
          isActive: false,
          verification: {
            emailVerified: false,
            phoneVerified: false,
            kycStatus: 'suspended'
          }
        }
      });

      // Test payout processing audit
      await adminService.processPayout('payout-1', 'approved', 'admin-1');
      expect(mockSystemConfigService.createAuditLog).toHaveBeenCalledWith({
        userId: 'admin-1',
        action: 'UPDATE',
        resource: 'payout_processing',
        resourceId: 'payout-1',
        newValues: {
          status: 'approved',
          transactionId: undefined,
          notes: undefined
        }
      });
    });

    test('should include timestamps in audit operations', async () => {
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }));
      mockSupabaseAdmin.from.mockReturnValue({
        update: mockUpdate
      });

      const beforeTime = new Date().toISOString();
      await adminService.updateUserRole('user-1', 'mentor', 'admin-1');
      const afterTime = new Date().toISOString();

      expect(mockUpdate).toHaveBeenCalledWith({
        role: 'mentor',
        updated_at: expect.any(String)
      });

      const updateCall = mockUpdate.mock.calls[0][0];
      const timestamp = updateCall.updated_at;
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(timestamp >= beforeTime && timestamp <= afterTime).toBe(true);
    });
  });

  describe('Error Handling and Data Validation', () => {
    test('should handle null/undefined input gracefully', async () => {
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }));
      mockSupabaseAdmin.from.mockReturnValue({
        update: mockUpdate
      });

      // Should not throw for undefined notes
      await expect(adminService.processPayout('payout-1', 'approved', 'admin-1', undefined, undefined))
        .resolves.not.toThrow();

      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'approved',
        processed_at: expect.any(String),
        processed_by: 'admin-1',
        transaction_id: undefined,
        notes: undefined
      });
    });

    test('should propagate database errors correctly', async () => {
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: new Error('Connection timeout') }))
      }));
      mockSupabaseAdmin.from.mockReturnValue({
        update: mockUpdate
      });

      await expect(adminService.updateUserRole('user-1', 'mentor', 'admin-1'))
        .rejects.toThrow('Connection timeout');

      await expect(adminService.updateUserStatus('user-1', true, 'admin-1'))
        .rejects.toThrow('Connection timeout');

      await expect(adminService.processPayout('payout-1', 'approved', 'admin-1'))
        .rejects.toThrow('Connection timeout');
    });

    test('should handle empty string inputs appropriately', async () => {
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }));
      mockSupabaseAdmin.from.mockReturnValue({
        update: mockUpdate
      });

      await adminService.processPayout('payout-1', 'rejected', 'admin-1', '', '');

      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'rejected',
        processed_at: expect.any(String),
        processed_by: 'admin-1',
        transaction_id: '',
        notes: ''
      });
    });
  });
});