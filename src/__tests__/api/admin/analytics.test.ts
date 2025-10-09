import { NextRequest } from 'next/server';
import { GET as getEnrollmentAnalytics } from '@/app/api/admin/analytics/enrollment/route';
import { GET as getRevenueAnalytics } from '@/app/api/admin/analytics/revenue/route';
import { GET as getAmbassadorAnalytics } from '@/app/api/admin/analytics/ambassadors/route';
import { GET as getDashboardAnalytics } from '@/app/api/admin/analytics/dashboard/route';
import { verifyAuth } from '@/lib/auth';
import { analyticsService } from '@/lib/analyticsService';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn()
}));

jest.mock('@/lib/analyticsService', () => ({
  analyticsService: {
    getEnrollmentStats: jest.fn(),
    getRevenueAnalytics: jest.fn(),
    getAmbassadorROIMetrics: jest.fn(),
    getInternshipMetrics: jest.fn(),
    getDashboardOverview: jest.fn()
  }
}));

const mockVerifyAuth = verifyAuth as jest.MockedFunction<typeof verifyAuth>;
const mockAnalyticsService = analyticsService as jest.Mocked<typeof analyticsService>;

describe('Admin Analytics API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/analytics/enrollment', () => {
    it('should return enrollment analytics for admin users', async () => {
      const mockEnrollmentStats = {
        totalEnrollments: 100,
        monthlyEnrollments: 20,
        enrollmentTrend: [
          { month: '2024-01', count: 10, revenue: 5000 }
        ],
        topCourses: [
          { courseId: 'course1', title: 'Test Course', enrollments: 50, revenue: 25000 }
        ]
      };

      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'admin', email: 'admin@test.com' }
      });

      mockAnalyticsService.getEnrollmentStats.mockResolvedValue(mockEnrollmentStats);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/enrollment?timeframe=month');
      const response = await getEnrollmentAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockEnrollmentStats);
      expect(mockAnalyticsService.getEnrollmentStats).toHaveBeenCalledWith('month');
    });

    it('should reject unauthorized users', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: false,
        user: null
      });

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/enrollment');
      const response = await getEnrollmentAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject non-admin users', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'student1', role: 'student', email: 'student@test.com' }
      });

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/enrollment');
      const response = await getEnrollmentAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Insufficient permissions');
    });

    it('should handle service errors', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'super_admin', email: 'admin@test.com' }
      });

      mockAnalyticsService.getEnrollmentStats.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/enrollment');
      const response = await getEnrollmentAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch enrollment analytics');
      expect(data.details).toBe('Database error');
    });
  });

  describe('GET /api/admin/analytics/revenue', () => {
    it('should return revenue analytics for admin users', async () => {
      const mockRevenueAnalytics = {
        totalRevenue: 50000,
        monthlyRevenue: 10000,
        revenueByMentor: [
          { mentorId: 'mentor1', mentorName: 'John Doe', totalRevenue: 25000, courseCount: 5, avgRevenuePerCourse: 5000 }
        ],
        revenueByCategory: [
          { categoryId: 'cat1', categoryName: 'Programming', totalRevenue: 30000, enrollmentCount: 60 }
        ],
        revenueByMonth: [
          { month: '2024-01', revenue: 10000, enrollments: 20 }
        ]
      };

      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'admin', email: 'admin@test.com' }
      });

      mockAnalyticsService.getRevenueAnalytics.mockResolvedValue(mockRevenueAnalytics);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/revenue');
      const response = await getRevenueAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockRevenueAnalytics);
    });

    it('should use default timeframe when not specified', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'admin', email: 'admin@test.com' }
      });

      mockAnalyticsService.getRevenueAnalytics.mockResolvedValue({
        totalRevenue: 0,
        monthlyRevenue: 0,
        revenueByMentor: [],
        revenueByCategory: [],
        revenueByMonth: []
      });

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/revenue');
      const response = await getRevenueAnalytics(request);

      expect(mockAnalyticsService.getRevenueAnalytics).toHaveBeenCalledWith('month');
    });
  });

  describe('GET /api/admin/analytics/ambassadors', () => {
    it('should return ambassador analytics for admin users', async () => {
      const mockAmbassadorMetrics = {
        totalAmbassadors: 25,
        activeAmbassadors: 15,
        totalReferrals: 100,
        conversionRate: 30,
        totalPointsPaid: 5000,
        avgROI: 10,
        topPerformers: [
          {
            ambassadorId: 'amb1',
            ambassadorName: 'Jane Smith',
            totalReferrals: 20,
            successfulConversions: 8,
            totalEarnings: 800,
            conversionRate: 40
          }
        ],
        monthlyMetrics: [
          {
            month: '2024-01',
            newReferrals: 10,
            conversions: 3,
            pointsPaid: 300,
            roi: 10
          }
        ]
      };

      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'super_admin', email: 'admin@test.com' }
      });

      mockAnalyticsService.getAmbassadorROIMetrics.mockResolvedValue(mockAmbassadorMetrics);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/ambassadors');
      const response = await getAmbassadorAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockAmbassadorMetrics);
    });
  });

  describe('GET /api/admin/analytics/dashboard', () => {
    it('should return dashboard overview for admin users', async () => {
      const mockDashboardOverview = {
        enrollments: {
          total: 100,
          monthly: 20,
          trend: [{ month: '2024-01', count: 10, revenue: 5000 }]
        },
        revenue: {
          total: 50000,
          monthly: 10000,
          trend: [{ month: '2024-01', revenue: 10000, enrollments: 20 }]
        },
        ambassadors: {
          total: 25,
          active: 15,
          conversionRate: 30,
          roi: 10
        },
        internships: {
          totalJobs: 50,
          totalApplications: 200,
          placementRate: 25
        }
      };

      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'admin', email: 'admin@test.com' }
      });

      mockAnalyticsService.getDashboardOverview.mockResolvedValue(mockDashboardOverview);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/dashboard');
      const response = await getDashboardAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockDashboardOverview);
    });

    it('should handle partial data gracefully', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'admin', email: 'admin@test.com' }
      });

      const partialOverview = {
        enrollments: { total: 0, monthly: 0, trend: [] },
        revenue: { total: 0, monthly: 0, trend: [] },
        ambassadors: { total: 0, active: 0, conversionRate: 0, roi: 0 },
        internships: { totalJobs: 0, totalApplications: 0, placementRate: 0 }
      };

      mockAnalyticsService.getDashboardOverview.mockResolvedValue(partialOverview);

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/dashboard');
      const response = await getDashboardAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.enrollments.total).toBe(0);
      expect(data.data.revenue.total).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should handle authentication service errors', async () => {
      mockVerifyAuth.mockRejectedValue(new Error('Auth service error'));

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/enrollment');
      const response = await getEnrollmentAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle analytics service timeout', async () => {
      mockVerifyAuth.mockResolvedValue({
        success: true,
        user: { id: 'admin1', role: 'admin', email: 'admin@test.com' }
      });

      mockAnalyticsService.getEnrollmentStats.mockRejectedValue(new Error('Request timeout'));

      const request = new NextRequest('http://localhost:3000/api/admin/analytics/enrollment');
      const response = await getEnrollmentAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.details).toBe('Request timeout');
    });
  });
});