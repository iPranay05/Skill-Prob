import { analyticsService } from '@/lib/analyticsService';
import { supabaseAdmin } from '@/lib/database';

// Mock the database
jest.mock('@/lib/database', () => ({
  supabaseAdmin: {
    from: jest.fn(),
    rpc: jest.fn()
  }
}));

const mockSupabaseAdmin = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>;

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEnrollmentStats', () => {
    it('should return enrollment statistics with correct structure', async () => {
      // Mock database responses
      const mockFrom = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockGte = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockReturnThis();
      const mockSingle = jest.fn();

      mockSupabaseAdmin.from.mockImplementation(() => ({
        select: mockSelect,
        eq: mockEq,
        gte: mockGte,
        limit: mockLimit,
        single: mockSingle
      } as any));

      // Mock total enrollments
      mockSelect.mockReturnValueOnce({
        eq: () => ({ data: [{ count: 150 }], error: null })
      } as any);

      // Mock monthly enrollments
      mockSelect.mockReturnValueOnce({
        gte: () => ({ data: [{ count: 25 }], error: null })
      } as any);

      // Mock RPC calls
      mockSupabaseAdmin.rpc
        .mockResolvedValueOnce({
          data: [
            { month: '2024-01', count: 10, revenue: 5000 },
            { month: '2024-02', count: 15, revenue: 7500 }
          ],
          error: null
        })
        .mockResolvedValueOnce({
          data: [
            { course_id: 'course1', courses: { title: 'Test Course 1' }, amount_paid: 500 },
            { course_id: 'course1', courses: { title: 'Test Course 1' }, amount_paid: 500 },
            { course_id: 'course2', courses: { title: 'Test Course 2' }, amount_paid: 750 }
          ],
          error: null
        });

      const result = await analyticsService.getEnrollmentStats('month');

      expect(result).toHaveProperty('totalEnrollments');
      expect(result).toHaveProperty('monthlyEnrollments');
      expect(result).toHaveProperty('enrollmentTrend');
      expect(result).toHaveProperty('topCourses');
      expect(Array.isArray(result.enrollmentTrend)).toBe(true);
      expect(Array.isArray(result.topCourses)).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabaseAdmin.from.mockImplementation(() => ({
        select: () => ({ data: null, error: { message: 'Database error' } })
      } as any));

      await expect(analyticsService.getEnrollmentStats()).rejects.toThrow();
    });
  });

  describe('getRevenueAnalytics', () => {
    it('should calculate revenue metrics correctly', async () => {
      // Mock enrollment data with revenue
      const mockEnrollmentData = [
        { amount_paid: 1000 },
        { amount_paid: 1500 },
        { amount_paid: 2000 }
      ];

      mockSupabaseAdmin.from.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue({
          data: mockEnrollmentData,
          error: null
        })
      } as any));

      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: [
          { month: '2024-01', revenue: 2500, enrollments: 5 },
          { month: '2024-02', revenue: 2000, enrollments: 3 }
        ],
        error: null
      });

      const result = await analyticsService.getRevenueAnalytics();

      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('monthlyRevenue');
      expect(result).toHaveProperty('revenueByMentor');
      expect(result).toHaveProperty('revenueByCategory');
      expect(result).toHaveProperty('revenueByMonth');
      expect(typeof result.totalRevenue).toBe('number');
    });

    it('should handle zero revenue correctly', async () => {
      mockSupabaseAdmin.from.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      } as any));

      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await analyticsService.getRevenueAnalytics();

      expect(result.totalRevenue).toBe(0);
      expect(result.monthlyRevenue).toBe(0);
      expect(Array.isArray(result.revenueByMentor)).toBe(true);
      expect(result.revenueByMentor).toHaveLength(0);
    });
  });

  describe('getAmbassadorROIMetrics', () => {
    it('should calculate ambassador ROI correctly', async () => {
      // Mock ambassador data
      mockSupabaseAdmin.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({
          data: [{ count: 50 }],
          error: null
        })
      } as any));

      // Mock RPC calls for performance data
      mockSupabaseAdmin.rpc
        .mockResolvedValueOnce({
          data: [
            {
              ambassador_id: 'amb1',
              ambassador_name: 'John Doe',
              total_referrals: 10,
              successful_conversions: 5,
              total_earnings: 500,
              conversion_rate: 50
            }
          ],
          error: null
        })
        .mockResolvedValueOnce({
          data: [
            {
              month: '2024-01',
              new_referrals: 5,
              conversions: 2,
              points_paid: 200,
              roi: 10
            }
          ],
          error: null
        });

      const result = await analyticsService.getAmbassadorROIMetrics();

      expect(result).toHaveProperty('totalAmbassadors');
      expect(result).toHaveProperty('activeAmbassadors');
      expect(result).toHaveProperty('totalReferrals');
      expect(result).toHaveProperty('conversionRate');
      expect(result).toHaveProperty('totalPointsPaid');
      expect(result).toHaveProperty('avgROI');
      expect(result).toHaveProperty('topPerformers');
      expect(result).toHaveProperty('monthlyMetrics');
      expect(Array.isArray(result.topPerformers)).toBe(true);
      expect(Array.isArray(result.monthlyMetrics)).toBe(true);
    });

    it('should handle zero conversion rate correctly', async () => {
      mockSupabaseAdmin.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({
          data: [{ count: 0 }],
          error: null
        })
      } as any));

      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await analyticsService.getAmbassadorROIMetrics();

      expect(result.conversionRate).toBe(0);
      expect(result.avgROI).toBe(0);
    });
  });

  describe('getInternshipMetrics', () => {
    it('should calculate placement metrics correctly', async () => {
      // Mock job and application data
      mockSupabaseAdmin.from.mockImplementation((table) => {
        if (table === 'job_postings') {
          return {
            select: jest.fn().mockResolvedValue({
              data: [{ count: 25 }],
              error: null
            })
          };
        } else if (table === 'job_applications') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [{ count: 100 }],
              error: null
            })
          };
        }
        return { select: jest.fn() };
      });

      // Mock RPC calls
      mockSupabaseAdmin.rpc
        .mockResolvedValueOnce({
          data: [{ avg_days: 15 }],
          error: null
        })
        .mockResolvedValueOnce({
          data: [
            {
              month: '2024-01',
              applications: 20,
              hires: 5,
              placement_rate: 25
            }
          ],
          error: null
        });

      const result = await analyticsService.getInternshipMetrics();

      expect(result).toHaveProperty('totalJobs');
      expect(result).toHaveProperty('totalApplications');
      expect(result).toHaveProperty('placementRate');
      expect(result).toHaveProperty('avgTimeToHire');
      expect(result).toHaveProperty('topEmployers');
      expect(result).toHaveProperty('applicationsByStatus');
      expect(result).toHaveProperty('monthlyPlacements');
      expect(typeof result.placementRate).toBe('number');
      expect(typeof result.avgTimeToHire).toBe('number');
    });

    it('should handle zero applications correctly', async () => {
      mockSupabaseAdmin.from.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue({
          data: [{ count: 0 }],
          error: null
        })
      }));

      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await analyticsService.getInternshipMetrics();

      expect(result.placementRate).toBe(0);
      expect(result.avgTimeToHire).toBe(0);
    });
  });

  describe('getDashboardOverview', () => {
    it('should return comprehensive dashboard data', async () => {
      // Mock all the individual service methods
      jest.spyOn(analyticsService, 'getEnrollmentStats').mockResolvedValue({
        totalEnrollments: 100,
        monthlyEnrollments: 20,
        enrollmentTrend: [
          { month: '2024-01', count: 10, revenue: 5000 }
        ],
        topCourses: []
      });

      jest.spyOn(analyticsService, 'getRevenueAnalytics').mockResolvedValue({
        totalRevenue: 50000,
        monthlyRevenue: 10000,
        revenueByMentor: [],
        revenueByCategory: [],
        revenueByMonth: [
          { month: '2024-01', revenue: 10000, enrollments: 20 }
        ]
      });

      jest.spyOn(analyticsService, 'getAmbassadorROIMetrics').mockResolvedValue({
        totalAmbassadors: 25,
        activeAmbassadors: 15,
        totalReferrals: 100,
        conversionRate: 30,
        totalPointsPaid: 5000,
        avgROI: 10,
        topPerformers: [],
        monthlyMetrics: []
      });

      jest.spyOn(analyticsService, 'getInternshipMetrics').mockResolvedValue({
        totalJobs: 50,
        totalApplications: 200,
        placementRate: 25,
        avgTimeToHire: 15,
        topEmployers: [],
        applicationsByStatus: [],
        monthlyPlacements: []
      });

      const result = await analyticsService.getDashboardOverview();

      expect(result).toHaveProperty('enrollments');
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('ambassadors');
      expect(result).toHaveProperty('internships');
      expect(result.enrollments.total).toBe(100);
      expect(result.revenue.total).toBe(50000);
      expect(result.ambassadors.total).toBe(25);
      expect(result.internships.totalJobs).toBe(50);
    });

    it('should handle errors from individual services', async () => {
      jest.spyOn(analyticsService, 'getEnrollmentStats').mockRejectedValue(new Error('Database error'));

      await expect(analyticsService.getDashboardOverview()).rejects.toThrow('Database error');
    });
  });
});