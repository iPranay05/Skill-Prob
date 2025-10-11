// Mock external dependencies
jest.mock('@/lib/adminService', () => ({
  adminService: {
    getUsers: jest.fn(),
    updateUserRole: jest.fn(),
    updateUserStatus: jest.fn()
  }
}));

jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn()
}));

import { GET } from '@/app/api/admin/users/route';
import { adminService } from '@/lib/adminService';
import { verifyAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';

describe('/api/admin/users', () => {
  let mockVerifyAuth: jest.Mock;
  let mockGetUsers: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyAuth = verifyAuth as jest.Mock;
    mockGetUsers = adminService.getUsers as jest.Mock;
  });

  describe('GET /api/admin/users', () => {
    test('should return users for admin user', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'test@example.com',
          role: 'student',
          profile: { firstName: 'John', lastName: 'Doe' },
          verification: { emailVerified: true },
          createdAt: new Date('2024-01-01'),
          isActive: true
        }
      ];

      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockGetUsers.mockResolvedValue({
        users: mockUsers,
        total: 1
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users?role=student&limit=10&offset=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].email).toBe('test@example.com');
      expect(data.pagination.total).toBe(1);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.offset).toBe(0);

      expect(mockGetUsers).toHaveBeenCalledWith({
        role: 'student',
        status: undefined,
        search: undefined,
        limit: 10,
        offset: 0
      });
    });

    test('should return users for super_admin user', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'super-admin-1', role: 'super_admin' }
      });

      mockGetUsers.mockResolvedValue({
        users: [],
        total: 0
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test('should handle search and filter parameters', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockGetUsers.mockResolvedValue({
        users: [],
        total: 0
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users?search=john&status=active&limit=25&offset=50');
      const response = await GET(request);

      expect(mockGetUsers).toHaveBeenCalledWith({
        role: undefined,
        status: 'active',
        search: 'john',
        limit: 25,
        offset: 50
      });
    });

    test('should use default pagination values', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockGetUsers.mockResolvedValue({
        users: [],
        total: 0
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);

      expect(mockGetUsers).toHaveBeenCalledWith({
        role: undefined,
        status: undefined,
        search: undefined,
        limit: 50,
        offset: 0
      });
    });

    test('should return 401 for unauthenticated user', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: false,
        user: null
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
      expect(mockGetUsers).not.toHaveBeenCalled();
    });

    test('should return 403 for non-admin user', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'user-1', role: 'student' }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Insufficient permissions');
      expect(mockGetUsers).not.toHaveBeenCalled();
    });

    test('should return 403 for mentor user', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'mentor-1', role: 'mentor' }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Insufficient permissions');
    });

    test('should return 403 for ambassador user', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'ambassador-1', role: 'ambassador' }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Insufficient permissions');
    });

    test('should handle service errors gracefully', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockGetUsers.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch users');
      expect(data.details).toBe('Database connection failed');
    });

    test('should handle non-Error exceptions', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockGetUsers.mockRejectedValue('String error');

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch users');
      expect(data.details).toBe('Unknown error');
    });

    test('should set hasMore pagination flag correctly', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      // Mock exactly 10 users returned with limit 10
      const mockUsers = Array.from({ length: 10 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@example.com`,
        role: 'student',
        profile: {},
        verification: {},
        createdAt: new Date(),
        isActive: true
      }));

      mockGetUsers.mockResolvedValue({
        users: mockUsers,
        total: 100
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users?limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.hasMore).toBe(true);
    });

    test('should set hasMore to false when fewer results than limit', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockGetUsers.mockResolvedValue({
        users: [{ id: 'user-1', email: 'test@example.com', role: 'student', profile: {}, verification: {}, createdAt: new Date(), isActive: true }],
        total: 1
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users?limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.hasMore).toBe(false);
    });
  });
});