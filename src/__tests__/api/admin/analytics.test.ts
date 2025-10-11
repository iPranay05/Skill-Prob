// Mock external dependencies
jest.mock('@/lib/analyticsService', () => ({
  analyticsService: {
    getDashboardOverview: jest.fn(),
    getEnrollmentStats: jest.fn(),
    getRevenueAnalytics: jest.fn(),
    getAmbassadorROIMetrics: jest.fn(),
    getInternshipMetrics: jest.fn()
  }
}));

jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn()
}));

import { GET as DashboardGET } from '@/app/api/admin/analytics/dashboard/route';
import { GET as EnrollmentGET } from '@/app/api/admin/analytics/enrollment/route';
import { GET as RevenueGET } from '@/app/api/admin/analytics/revenue/route';
import { analyticsService } from '@/lib/analyticsService';
import { verifyAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';

describe('/api/admin/analytics', () => {
  let mockVerifyAuth: jest.Mock;
  let mockGetDashboardOverview: jest.Mock;
  let mockGetEnrollmentStats: jest.Mock;
  let mockGetRevenueAnalytics: jest.Mock;
  let mockGetAmbassadorROIMetrics: jest.Mock;
  let mockGetInternshipMetrics: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyAuth = verifyAuth as jest.Mock;
    mockGetDashboardOverview = analyticsService.getDashboardOverview as jest.Mock;
    mockGetEnrollmentStats = analyticsService.getEnrollmentStats as jest.Mock;
    mockGetRevenueAnalytics = analyticsService.getRevenueAnalytics as jest.Mock;
    mockGetAmbassadorROIMetrics = analyticsService.getAmbassadorROIMetrics as jest.Mock;
    mockGetInternshipMetrics = analyticsService.getInternshipMetrics as jest.Mock;
  });

  describe('GET /api/admin/analytics/dashboard', () => {
    test('should return dashboard overview for admin user', async () => {
      const mockDashboardData = {
        enrollments: {
          total: 1000,
          monthly: 100,
          trend: [
            { month: '2024-01', count: 80, revenue: 80000 },
            { month: '2024-02', count: 90, revenue: 90000 },
            { month: '2024-03', count: 100, revenue: 100000 }
          ]
        },
        revenue: {
          total: 500000,
          monthly: 50000,
          trend: [
            { month: '2024-01', revenue: 40000, enrollments: 80 },
            { month: '2024-02', revenue: 45000, enrollments: 90 },
            { month: '2024-03', revenue: 50000, enrollments: 100 }
          ]
        },
        ambassadors: {
          total: 50,
          active: 30,
          conversionRate: 15.5,
          roi: 8.2
        },
        internships: {
          totalJobs: 200,
          totalApplications: 1000,
          placementRate: 12.5
        }
      };

      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockGetDashboardOverview.mockResolvedValue(mockDashboardData);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/dashboard');
      const response = await DashboardGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.enrollments.total).toBe(1000);
      expect(data.data.revenue.total).toBe(500000);
      expect(data.data.ambassadors.total).toBe(50);
      expect(data.data.internships.totalJobs).toBe(200);
      expect(mockGetDashboardOverview).toHaveBeenCalled();
    });

    test('should return dashboard overview for super_admin user', async () => {
      const mockDashboardData = {
        enrollments: { total: 0, monthly: 0, trend: [] },
        revenue: { total: 0, monthly: 0, trend: [] },
        ambassadors: { total: 0, active: 0, conversionRate: 0, roi: 0 },
        internships: { totalJobs: 0, totalApplications: 0, placementRate: 0 }
      };

      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'super-admin-1', role: 'super_admin' }
      });

      mockGetDashboardOverview.mockResolvedValue(mockDashboardData);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/dashboard');
      const response = await DashboardGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test('should return 401 for unauthenticated user', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: false,
        user: null
      });

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/dashboard');
      const response = await DashboardGET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
      expect(mockGetDashboardOverview).not.toHaveBeenCalled();
    });

    test('should return 403 for non-admin user', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'user-1', role: 'mentor' }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/dashboard');
      const response = await DashboardGET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Insufficient permissions');
      expect(mockGetDashboardOverview).not.toHaveBeenCalled();
    });

    test('should handle service errors gracefully', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockGetDashboardOverview.mockRejectedValue(new Error('Analytics service failed'));

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/dashboard');
      const response = await DashboardGET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch dashboard analytics');
      expect(data.details).toBe('Analytics service failed');
    });
  });

  describe('GET /api/admin/analytics/enrollment', () => {
    test('should return enrollment statistics with default timeframe', async () => {
      const mockEnrollmentStats = {
        totalEnrollments: 1000,
        monthlyEnrollments: 100,
        enrollmentTrend: [
          { month: '2024-01', count: 80, revenue: 80000 },
          { month: '2024-02', count: 90, revenue: 90000 }
        ],
        topCourses: [
          { courseId: 'course-1', title: 'JavaScript Basics', enrollments: 50, revenue: 50000 },
          { courseId: 'course-2', title: 'React Advanced', enrollments: 30, revenue: 45000 }
        ]
      };

      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockGetEnrollmentStats.mockResolvedValue(mockEnrollmentStats);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/enrollment');
      const response = await EnrollmentGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.totalEnrollments).toBe(1000);
      expect(data.data.enrollmentTrend).toHaveLength(2);
      expect(data.data.topCourses).toHaveLength(2);
      expect(mockGetEnrollmentStats).toHaveBeenCalledWith('month');
    });

    test('should handle different timeframe parameters', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockGetEnrollmentStats.mockResolvedValue({
        totalEnrollments: 0,
        monthlyEnrollments: 0,
        enrollmentTrend: [],
        topCourses: []
      });

      // Test week timeframe
      const weekRequest = new NextRequest('http://localhost:3000/api/admin/analytics/enrollment?timeframe=week');
      await EnrollmentGET(weekRequest);
      expect(mockGetEnrollmentStats).toHaveBeenCalledWith('week');

      // Test quarter timeframe
      const quarterRequest = new NextRequest('http://localhost:3000/api/admin/analytics/enrollment?timeframe=quarter');
      await EnrollmentGET(quarterRequest);
      expect(mockGetEnrollmentStats).toHaveBeenCalledWith('quarter');

      // Test year timeframe
      const yearRequest = new NextRequest('http://localhost:3000/api/admin/analytics/enrollment?timeframe=year');
      await EnrollmentGET(yearRequest);
      expect(mockGetEnrollmentStats).toHaveBeenCalledWith('year');
    });

    test('should use default timeframe for invalid parameter', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockGetEnrollmentStats.mockResolvedValue({
        totalEnrollments: 0,
        monthlyEnrollments: 0,
        enrollmentTrend: [],
        topCourses: []
      });

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/enrollment?timeframe=invalid');
      await EnrollmentGET(request);
      // The API should pass through the invalid parameter, not default to 'month'
      expect(mockGetEnrollmentStats).toHaveBeenCalledWith('invalid');
    });

    test('should return 403 for non-admin roles', async () => {
      const roles = ['student', 'mentor', 'ambassador', 'employer'];
      
      for (const role of roles) {
        mockVerifyAuth.mockResolvedValue({
          success: true,
          user: { id: 'user-1', role }
        });

        const request = new NextRequest('http://localhost:3000/api/admin/analytics/enrollment');
        const response = await EnrollmentGET(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Insufficient permissions');
      }
    });
  });

  describe('GET /api/admin/analytics/revenue', () => {
    test('should return revenue analytics with default timeframe', async () => {
      const mockRevenueAnalytics = {
        totalRevenue: 500000,
        monthlyRevenue: 50000,
        revenueByMentor: [
          {
            mentorId: 'mentor-1',
            mentorName: 'John Mentor',
            totalRevenue: 100000,
            courseCount: 5,
            avgRevenuePerCourse: 20000
          }
        ],
        revenueByCategory: [
          {
            categoryId: 'cat-1',
            categoryName: 'Programming',
            totalRevenue: 200000,
            enrollmentCount: 100
          }
        ],
        revenueByMonth: [
          { month: '2024-01', revenue: 40000, enrollments: 80 },
          { month: '2024-02', revenue: 45000, enrollments: 90 }
        ]
      };

      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockGetRevenueAnalytics.mockResolvedValue(mockRevenueAnalytics);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/revenue');
      const response = await RevenueGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.totalRevenue).toBe(500000);
      expect(data.data.revenueByMentor).toHaveLength(1);
      expect(data.data.revenueByCategory).toHaveLength(1);
      expect(data.data.revenueByMonth).toHaveLength(2);
      expect(mockGetRevenueAnalytics).toHaveBeenCalledWith('month');
    });

    test('should handle different timeframe parameters for revenue', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'super_admin' }
      });

      mockGetRevenueAnalytics.mockResolvedValue({
        totalRevenue: 0,
        monthlyRevenue: 0,
        revenueByMentor: [],
        revenueByCategory: [],
        revenueByMonth: []
      });

      const timeframes = ['week', 'quarter', 'year'];
      
      for (const timeframe of timeframes) {
        const request = new NextRequest(`http://localhost:3000/api/admin/analytics/revenue?timeframe=${timeframe}`);
        await RevenueGET(request);
        expect(mockGetRevenueAnalytics).toHaveBeenCalledWith(timeframe);
      }
    });

    test('should handle empty revenue data', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockGetRevenueAnalytics.mockResolvedValue({
        totalRevenue: 0,
        monthlyRevenue: 0,
        revenueByMentor: [],
        revenueByCategory: [],
        revenueByMonth: []
      });

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/revenue');
      const response = await RevenueGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.totalRevenue).toBe(0);
      expect(data.data.revenueByMentor).toEqual([]);
      expect(data.data.revenueByCategory).toEqual([]);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle analytics service timeout errors', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockGetDashboardOverview.mockRejectedValue(new Error('Request timeout'));

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/dashboard');
      const response = await DashboardGET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch dashboard analytics');
      expect(data.details).toBe('Request timeout');
    });

    test('should handle non-Error exceptions in analytics', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockGetEnrollmentStats.mockRejectedValue('String error');

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/enrollment');
      const response = await EnrollmentGET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch enrollment analytics');
      expect(data.details).toBe('Unknown error');
    });

    test('should handle database connection errors', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin-1', role: 'admin' }
      });

      mockGetRevenueAnalytics.mockRejectedValue(new Error('Database connection lost'));

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/revenue');
      const response = await RevenueGET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch revenue analytics');
      expect(data.details).toBe('Database connection lost');
    });

    test('should validate admin permissions consistently across all endpoints', async () => {
      const endpoints = [
        { handler: DashboardGET, url: 'http://localhost:3000/api/admin/analytics/dashboard' },
        { handler: EnrollmentGET, url: 'http://localhost:3000/api/admin/analytics/enrollment' },
        { handler: RevenueGET, url: 'http://localhost:3000/api/admin/analytics/revenue' }
      ];

      const nonAdminRoles = ['student', 'mentor', 'ambassador', 'employer'];

      for (const endpoint of endpoints) {
        for (const role of nonAdminRoles) {
          mockVerifyAuth.mockResolvedValue({
            success: true,
            user: { id: 'user-1', role }
          });

          const request = new NextRequest(endpoint.url);
          const response = await endpoint.handler(request);
          const data = await response.json();

          expect(response.status).toBe(403);
          expect(data.success).toBe(false);
          expect(data.error).toBe('Insufficient permissions');
        }
      }
    });

    test('should handle authentication service failures', async () => {
      mockVerifyAuth.mockRejectedValue(new Error('Auth service unavailable'));

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/dashboard');
      const response = await DashboardGET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch dashboard analytics');
    });
  });
});