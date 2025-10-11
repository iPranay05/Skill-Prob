// Mock external dependencies
jest.mock('@/lib/adminService', () => ({
  adminService: {
    getPendingPayouts: jest.fn(),
    processPayout: jest.fn()
  }
}));

jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn()
}));

import { GET, PUT } from '@/app/api/admin/payouts/route';
import { adminService } from '@/lib/adminService';
import { verifyAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';

describe('/api/admin/payouts', () => {
  let mockVerifyAuth: jest.Mock;
  let mockGetPendingPayouts: jest.Mock;
  let mockProcessPayout: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyAuth = verifyAuth as jest.Mock;
    mockGetPendingPayouts = adminService.getPendingPayouts as jest.Mock;
    mockProcessPayout = adminService.processPayout as jest.Mock;
  });

  describe('GET /api/admin/payouts', () => {
    test('should return pending payouts for admin user', async () => {
      const mockPayouts = [
        {
          id: 'payout-1',
          userId: 'user-1',
          userType: 'mentor' as const,
          userName: 'John Mentor',
          amount: 5000,
          currency: 'INR',
          status: 'pending' as const,
          requestedAt: new Date('2024-01-01'),
          notes: 'Monthly payout request'
        },
        {
          id: 'payout-2',
          userId: 'user-2',
          userType: 'ambassador' as const,
          userName: 'Jane Ambassador',
          amount: 2500,
          currency: 'INR',
          status: 'pending' as const,
          requestedAt: new Date('2024-01-02')
        }
      ];

      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockGetPendingPayouts.mockResolvedValue(mockPayouts);

      const request = new NextRequest('http://localhost:3000/api/admin/payouts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].id).toBe('payout-1');
      expect(data.data[0].userType).toBe('mentor');
      expect(data.data[0].amount).toBe(5000);
      expect(data.data[1].userType).toBe('ambassador');
      expect(mockGetPendingPayouts).toHaveBeenCalled();
    });

    test('should return empty array when no pending payouts', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'super_admin' }
      });

      mockGetPendingPayouts.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/admin/payouts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    test('should return 401 for unauthenticated user', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: false,
        user: null
      });

      const request = new NextRequest('http://localhost:3000/api/admin/payouts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
      expect(mockGetPendingPayouts).not.toHaveBeenCalled();
    });

    test('should return 403 for non-admin user', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'user-1', role: 'mentor' }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/payouts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Insufficient permissions');
      expect(mockGetPendingPayouts).not.toHaveBeenCalled();
    });

    test('should handle service errors gracefully', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockGetPendingPayouts.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/admin/payouts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch pending payouts');
      expect(data.details).toBe('Database error');
    });
  });

  describe('PUT /api/admin/payouts', () => {
    test('should approve payout successfully', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockProcessPayout.mockResolvedValue();

      const requestBody = {
        payoutId: 'payout-1',
        decision: 'approved',
        transactionId: 'txn-123',
        notes: 'Approved for processing'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/payouts', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Payout approved successfully');

      expect(mockProcessPayout).toHaveBeenCalledWith(
        'payout-1',
        'approved',
        'admin-1',
        'txn-123',
        'Approved for processing'
      );
    });

    test('should reject payout successfully', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'super_admin' }
      });

      mockProcessPayout.mockResolvedValue();

      const requestBody = {
        payoutId: 'payout-1',
        decision: 'rejected',
        notes: 'Insufficient documentation'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/payouts', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Payout rejected successfully');

      expect(mockProcessPayout).toHaveBeenCalledWith(
        'payout-1',
        'rejected',
        'admin-1',
        undefined,
        'Insufficient documentation'
      );
    });

    test('should process payout with transaction ID', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockProcessPayout.mockResolvedValue();

      const requestBody = {
        payoutId: 'payout-1',
        decision: 'processed',
        transactionId: 'bank-txn-456',
        notes: 'Payment completed via bank transfer'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/payouts', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Payout processed successfully');

      expect(mockProcessPayout).toHaveBeenCalledWith(
        'payout-1',
        'processed',
        'admin-1',
        'bank-txn-456',
        'Payment completed via bank transfer'
      );
    });

    test('should return 400 for missing payout ID', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      const requestBody = {
        decision: 'approved'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/payouts', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Payout ID and decision are required');
      expect(mockProcessPayout).not.toHaveBeenCalled();
    });

    test('should return 400 for missing decision', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      const requestBody = {
        payoutId: 'payout-1'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/payouts', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Payout ID and decision are required');
      expect(mockProcessPayout).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid decision', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      const requestBody = {
        payoutId: 'payout-1',
        decision: 'invalid'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/payouts', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Decision must be approved, rejected, or processed');
      expect(mockProcessPayout).not.toHaveBeenCalled();
    });

    test('should return 400 for processed decision without transaction ID', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      const requestBody = {
        payoutId: 'payout-1',
        decision: 'processed'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/payouts', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Transaction ID is required for processed payouts');
      expect(mockProcessPayout).not.toHaveBeenCalled();
    });

    test('should return 401 for unauthenticated user', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: false,
        user: null
      });

      const requestBody = {
        payoutId: 'payout-1',
        decision: 'approved'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/payouts', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
      expect(mockProcessPayout).not.toHaveBeenCalled();
    });

    test('should return 403 for non-admin user', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'user-1', role: 'student' }
      });

      const requestBody = {
        payoutId: 'payout-1',
        decision: 'approved'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/payouts', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Insufficient permissions');
      expect(mockProcessPayout).not.toHaveBeenCalled();
    });

    test('should handle service errors gracefully', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockProcessPayout.mockRejectedValue(new Error('Processing failed'));

      const requestBody = {
        payoutId: 'payout-1',
        decision: 'approved'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/payouts', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to process payout');
      expect(data.details).toBe('Processing failed');
    });

    test('should handle malformed JSON gracefully', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/payouts', {
        method: 'PUT',
        body: 'invalid json'
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to process payout');
      expect(mockProcessPayout).not.toHaveBeenCalled();
    });
  });
});