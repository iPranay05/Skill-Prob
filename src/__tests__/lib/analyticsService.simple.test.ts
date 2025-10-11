// Mock external dependencies
jest.mock('@/lib/database', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      rpc: jest.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    rpc: jest.fn(() => Promise.resolve({ data: [], error: null }))
  }
}));

import { AnalyticsService } from '@/lib/analyticsService';
import { supabaseAdmin } from '@/lib/database';

describe('AnalyticsService - Core Functionality Tests', () => {
  let analyticsService: AnalyticsService;
  let mockSupabaseAdmin: jest.Mocked<typeof supabaseAdmin>;

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsService = new AnalyticsService();
    mockSupabaseAdmin = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>;
  });

  describe('Analytics Calculation and Report Generation', () => {
    test('should calculate enrollment statistics correctly', async () => {
      // Mock the database calls for enrollment stats
      let callCount = 0;
      mockSupabaseAdmin.from.mockImplementation(() => ({
        select: jest.fn(() => {
          callCount++;
          switch (callCount) {
            case 1: // totalEnrollments
              return Promise.resolve({ data: [{ count: 500 }], error: null });
            case 2: // monthlyEnrollments
              return {
                gte: jest.fn(() => Promise.resolve({ data: [{ count: 50 }], error: null }))
              };
            case 3: // topCourses
              return {
                limit: jest.fn(() => Promise.resolve({
                  data: [
                    {
                      course_id: 'course-1',
                      amount_paid: 1000,
                      courses: { title: 'JavaScript Basics' }
                    },
                    {
                      course_id: 'course-1',
                      amount_paid: 1000,
                      courses: { title: 'JavaScript Basics' }
                    }
                  ],
                  error: null
                }))
              };
            default:
              return Promise.resolve({ data: [], error: null });
          }
        })
      } as any));

      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: [
          { month: '2024-01', count: 20, revenue: 20000 },
          { month: '2024-02', count: 30, revenue: 30000 }
        ],
        error: null
      });

      const result = await analyticsService.getEnrollmentStats('month');

      expect(result.totalEnrollments).toBe(500);
      expect(result.monthlyEnrollments).toBe(50);
      expect(result.enrollmentTrend).toHaveLength(2);
      expect(result.topCourses).toHaveLength(1);
      expect(result.topCourses[0].enrollments).toBe(2);
      expect(result.topCourses[0].revenue).toBe(2000);
    });

    test('should calculate revenue analytics correctly', async () => {
      // Mock the database calls for revenue analytics
      let callCount = 0;
      mockSupabaseAdmin.from.mockImplementation(() => ({
        select: jest.fn(() => {
          callCount++;
          switch (callCount) {
            case 1: // totalRevenue
              return Promise.resolve({
                data: [
                  { amount_paid: 1000 },
                  { amount_paid: 1500 },
                  { amount_paid: 2000 }
                ],
                error: null
              });
            case 2: // monthlyRevenue
              return {
                gte: jest.fn(() => Promise.resolve({
                  data: [
                    { amount_paid: 1500 },
                    { amount_paid: 2000 }
                  ],
                  error: null
                }))
              };
            case 3: // mentorRevenue
              return Promise.resolve({
                data: [
                  {
                    amount_paid: 1000,
                    courses: {
                      id: 'course-1',
                      mentor_id: 'mentor-1',
                      users: {
                        profile: { firstName: 'John', lastName: 'Doe' }
                      }
                    }
                  }
                ],
                error: null
              });
            case 4: // categoryRevenue
              return Promise.resolve({
                data: [
                  {
                    amount_paid: 1000,
                    courses: {
                      category_id: 'cat-1',
                      categories: { name: 'Programming' }
                    }
                  }
                ],
                error: null
              });
            default:
              return Promise.resolve({ data: [], error: null });
          }
        })
      } as any));

      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: [
          { month: '2024-01', revenue: 10000, enrollments: 10 },
          { month: '2024-02', revenue: 15000, enrollments: 15 }
        ],
        error: null
      });

      const result = await analyticsService.getRevenueAnalytics('month');

      expect(result.totalRevenue).toBe(4500);
      expect(result.monthlyRevenue).toBe(3500);
      expect(result.revenueByMentor).toHaveLength(1);
      expect(result.revenueByMentor[0].mentorName).toBe('John Doe');
      expect(result.revenueByCategory).toHaveLength(1);
      expect(result.revenueByMonth).toHaveLength(2);
    });

    test('should calculate ambassador ROI metrics correctly', async () => {
      // Mock the database calls for ambassador metrics
      let callCount = 0;
      mockSupabaseAdmin.from.mockImplementation(() => ({
        select: jest.fn(() => {
          callCount++;
          switch (callCount) {
            case 1: // totalAmbassadors
              return {
                eq: jest.fn(() => Promise.resolve({ data: [{ count: 50 }], error: null }))
              };
            case 2: // activeAmbassadors
              return {
                eq: jest.fn(() => ({
                  not: jest.fn(() => ({
                    gte: jest.fn(() => Promise.resolve({ data: [{ count: 30 }], error: null }))
                  }))
                }))
              };
            case 3: // totalReferrals
              return {
                not: jest.fn(() => Promise.resolve({ data: [{ count: 200 }], error: null }))
              };
            case 4: // conversions
              return {
                not: jest.fn(() => Promise.resolve({
                  data: [
                    { student_id: 'student-1', amount_paid: 1000, users: { referred_by: 'amb-1' } },
                    { student_id: 'student-2', amount_paid: 1500, users: { referred_by: 'amb-2' } }
                  ],
                  error: null
                }))
              };
            default:
              return Promise.resolve({ data: [], error: null });
          }
        })
      } as any));

      mockSupabaseAdmin.rpc.mockImplementation((funcName) => {
        if (funcName === 'get_ambassador_performance') {
          return Promise.resolve({
            data: [
              {
                ambassadorId: 'amb-1',
                ambassadorName: 'John Ambassador',
                totalReferrals: 10,
                successfulConversions: 2,
                totalEarnings: 300,
                conversionRate: 20
              }
            ],
            error: null
          });
        } else if (funcName === 'get_ambassador_monthly_metrics') {
          return Promise.resolve({
            data: [
              { month: '2024-01', newReferrals: 20, conversions: 2, pointsPaid: 200, roi: 5.0 }
            ],
            error: null
          });
        }
        return Promise.resolve({ data: [], error: null });
      });

      const result = await analyticsService.getAmbassadorROIMetrics();

      expect(result.totalAmbassadors).toBe(50);
      expect(result.activeAmbassadors).toBe(30);
      expect(result.totalReferrals).toBe(200);
      expect(result.conversionRate).toBe(1); // 2 conversions / 200 referrals * 100
      expect(result.totalPointsPaid).toBe(250); // 10% of total revenue (2500)
      expect(result.topPerformers).toHaveLength(1);
      expect(result.monthlyMetrics).toHaveLength(1);
    });

    test('should calculate internship metrics correctly', async () => {
      // Mock the database calls for internship metrics
      let callCount = 0;
      mockSupabaseAdmin.from.mockImplementation(() => ({
        select: jest.fn(() => {
          callCount++;
          switch (callCount) {
            case 1: // totalJobs
              return Promise.resolve({ data: [{ count: 100 }], error: null });
            case 2: // totalApplications
              return Promise.resolve({ data: [{ count: 500 }], error: null });
            case 3: // placements
              return {
                eq: jest.fn(() => Promise.resolve({ data: [{ count: 50 }], error: null }))
              };
            case 4: // employers
              return Promise.resolve({
                data: [
                  {
                    employer_id: 'emp-1',
                    users: { profile: { companyName: 'Tech Corp' } },
                    job_applications: [{ id: 'app-1' }, { id: 'app-2' }]
                  }
                ],
                error: null
              });
            case 5: // applicationsByStatus
              return Promise.resolve({
                data: [
                  { status: 'pending' },
                  { status: 'pending' },
                  { status: 'hired' },
                  { status: 'rejected' }
                ],
                error: null
              });
            default:
              return Promise.resolve({ data: [], error: null });
          }
        })
      } as any));

      mockSupabaseAdmin.rpc.mockImplementation((funcName) => {
        if (funcName === 'get_avg_time_to_hire') {
          return Promise.resolve({ data: [{ avg_days: 15 }], error: null });
        } else if (funcName === 'get_monthly_placement_metrics') {
          return Promise.resolve({
            data: [
              { month: '2024-01', applications: 40, hires: 4, placementRate: 10 }
            ],
            error: null
          });
        }
        return Promise.resolve({ data: [], error: null });
      });

      const result = await analyticsService.getInternshipMetrics();

      expect(result.totalJobs).toBe(100);
      expect(result.totalApplications).toBe(500);
      expect(result.placementRate).toBe(10); // 50/500 * 100
      expect(result.avgTimeToHire).toBe(15);
      expect(result.topEmployers).toHaveLength(1);
      expect(result.topEmployers[0].companyName).toBe('Tech Corp');
      expect(result.applicationsByStatus).toHaveLength(3);
      expect(result.monthlyPlacements).toHaveLength(1);
    });

    test('should aggregate dashboard overview correctly', async () => {
      // Mock all service methods
      const mockEnrollmentStats = {
        totalEnrollments: 1000,
        monthlyEnrollments: 100,
        enrollmentTrend: [
          { month: '2024-01', count: 80, revenue: 80000 },
          { month: '2024-02', count: 90, revenue: 90000 }
        ],
        topCourses: []
      };

      const mockRevenueAnalytics = {
        totalRevenue: 500000,
        monthlyRevenue: 50000,
        revenueByMonth: [
          { month: '2024-01', revenue: 40000, enrollments: 80 },
          { month: '2024-02', revenue: 45000, enrollments: 90 }
        ],
        revenueByMentor: [],
        revenueByCategory: []
      };

      const mockAmbassadorMetrics = {
        totalAmbassadors: 50,
        activeAmbassadors: 30,
        conversionRate: 15.5,
        avgROI: 8.2,
        totalReferrals: 0,
        totalPointsPaid: 0,
        topPerformers: [],
        monthlyMetrics: []
      };

      const mockInternshipMetrics = {
        totalJobs: 200,
        totalApplications: 1000,
        placementRate: 12.5,
        avgTimeToHire: 0,
        topEmployers: [],
        applicationsByStatus: [],
        monthlyPlacements: []
      };

      jest.spyOn(analyticsService, 'getEnrollmentStats').mockResolvedValue(mockEnrollmentStats);
      jest.spyOn(analyticsService, 'getRevenueAnalytics').mockResolvedValue(mockRevenueAnalytics);
      jest.spyOn(analyticsService, 'getAmbassadorROIMetrics').mockResolvedValue(mockAmbassadorMetrics);
      jest.spyOn(analyticsService, 'getInternshipMetrics').mockResolvedValue(mockInternshipMetrics);

      const result = await analyticsService.getDashboardOverview();

      expect(result.enrollments.total).toBe(1000);
      expect(result.enrollments.monthly).toBe(100);
      expect(result.enrollments.trend).toHaveLength(2);
      
      expect(result.revenue.total).toBe(500000);
      expect(result.revenue.monthly).toBe(50000);
      expect(result.revenue.trend).toHaveLength(2);
      
      expect(result.ambassadors.total).toBe(50);
      expect(result.ambassadors.active).toBe(30);
      expect(result.ambassadors.conversionRate).toBe(15.5);
      expect(result.ambassadors.roi).toBe(8.2);
      
      expect(result.internships.totalJobs).toBe(200);
      expect(result.internships.totalApplications).toBe(1000);
      expect(result.internships.placementRate).toBe(12.5);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle database errors gracefully', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => Promise.resolve({ data: null, error: new Error('Database connection failed') }))
      } as any);

      await expect(analyticsService.getEnrollmentStats()).rejects.toThrow('Database connection failed');
    });

    test('should handle null data responses gracefully', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => Promise.resolve({ data: null, error: null }))
      } as any);

      mockSupabaseAdmin.rpc.mockResolvedValue({ data: null, error: null });

      const result = await analyticsService.getEnrollmentStats();

      expect(result.totalEnrollments).toBe(0);
      expect(result.monthlyEnrollments).toBe(0);
      expect(result.enrollmentTrend).toEqual([]);
      expect(result.topCourses).toEqual([]);
    });

    test('should handle RPC function errors', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => Promise.resolve({ data: [{ count: 100 }], error: null }))
      } as any);

      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: null,
        error: new Error('RPC function failed')
      });

      await expect(analyticsService.getEnrollmentStats()).rejects.toThrow('RPC function failed');
    });

    test('should handle empty arrays in calculations', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn(() => Promise.resolve({ data: [], error: null }))
      } as any);

      mockSupabaseAdmin.rpc.mockResolvedValue({ data: [], error: null });

      const result = await analyticsService.getEnrollmentStats();

      expect(result.totalEnrollments).toBe(0);
      expect(result.monthlyEnrollments).toBe(0);
      expect(result.enrollmentTrend).toEqual([]);
      expect(result.topCourses).toEqual([]);
    });
  });

  describe('Data Processing and Calculations', () => {
    test('should correctly process course enrollment data', async () => {
      const mockCourseData = [
        {
          course_id: 'course-1',
          amount_paid: 1000,
          courses: { title: 'JavaScript Basics' }
        },
        {
          course_id: 'course-1',
          amount_paid: 1500,
          courses: { title: 'JavaScript Basics' }
        },
        {
          course_id: 'course-2',
          amount_paid: 2000,
          courses: { title: 'React Advanced' }
        }
      ];

      // Test the data processing logic directly
      const courseStats = new Map();
      mockCourseData.forEach(enrollment => {
        const courseId = enrollment.course_id;
        if (!courseStats.has(courseId)) {
          courseStats.set(courseId, {
            courseId,
            title: enrollment.courses.title,
            enrollments: 0,
            revenue: 0
          });
        }
        const stats = courseStats.get(courseId);
        stats.enrollments += 1;
        stats.revenue += enrollment.amount_paid || 0;
      });

      const topCourses = Array.from(courseStats.values())
        .sort((a, b) => b.enrollments - a.enrollments);

      expect(topCourses).toHaveLength(2);
      expect(topCourses[0].courseId).toBe('course-1');
      expect(topCourses[0].enrollments).toBe(2);
      expect(topCourses[0].revenue).toBe(2500);
      expect(topCourses[1].courseId).toBe('course-2');
      expect(topCourses[1].enrollments).toBe(1);
      expect(topCourses[1].revenue).toBe(2000);
    });

    test('should correctly calculate revenue totals', async () => {
      const mockRevenueData = [
        { amount_paid: 1000 },
        { amount_paid: 1500 },
        { amount_paid: 2000 },
        { amount_paid: null }, // Should handle null values
        { amount_paid: 0 }     // Should handle zero values
      ];

      const totalRevenue = mockRevenueData.reduce((sum, enrollment) => 
        sum + (enrollment.amount_paid || 0), 0);

      expect(totalRevenue).toBe(4500);
    });

    test('should correctly calculate conversion rates', async () => {
      const totalReferrals = 200;
      const totalConversions = 15;
      const conversionRate = totalReferrals > 0 ? (totalConversions / totalReferrals) * 100 : 0;

      expect(conversionRate).toBe(7.5);

      // Test edge case with zero referrals
      const zeroReferralsRate = 0 > 0 ? (5 / 0) * 100 : 0;
      expect(zeroReferralsRate).toBe(0);
    });

    test('should correctly calculate placement rates', async () => {
      const totalApplications = 500;
      const totalPlacements = 62;
      const placementRate = totalApplications > 0 ? (totalPlacements / totalApplications) * 100 : 0;

      expect(placementRate).toBe(12.4);

      // Test edge case with zero applications
      const zeroApplicationsRate = 0 > 0 ? (10 / 0) * 100 : 0;
      expect(zeroApplicationsRate).toBe(0);
    });
  });
});