// Mock external dependencies
jest.mock('@/lib/database', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        gte: jest.fn(() => Promise.resolve({
          data: [],
          error: null
        })),
        limit: jest.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      }))
    })),
    rpc: jest.fn(() => Promise.resolve({
      data: [],
      error: null
    }))
  }
}));

import { AnalyticsService, analyticsService } from '@/lib/analyticsService';
import { supabaseAdmin } from '@/lib/database';

describe('AnalyticsService', () => {
  let mockSupabaseFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockRpc: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSelect = jest.fn();
    mockRpc = jest.fn();
    mockSupabaseFrom = jest.fn(() => ({
      select: mockSelect
    }));
    
    (supabaseAdmin.from as jest.Mock) = mockSupabaseFrom;
    (supabaseAdmin.rpc as jest.Mock) = mockRpc;
  });

  describe('Enrollment Statistics and Analytics', () => {
    describe('getEnrollmentStats', () => {
      test('should calculate enrollment statistics correctly', async () => {
        // Mock total enrollments
        mockSelect.mockReturnValueOnce(Promise.resolve({
          data: [{ count: 500 }],
          error: null
        }));

        // Mock monthly enrollments
        mockSelect.mockReturnValueOnce({
          gte: jest.fn(() => Promise.resolve({
            data: [{ count: 50 }],
            error: null
          }))
        });

        // Mock enrollment trend RPC
        mockRpc.mockReturnValueOnce(Promise.resolve({
          data: [
            { month: '2024-01', count: 20, revenue: 20000 },
            { month: '2024-02', count: 30, revenue: 30000 }
          ],
          error: null
        }));

        // Mock top courses data
        mockSelect.mockReturnValueOnce({
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
              },
              {
                course_id: 'course-2',
                amount_paid: 1500,
                courses: { title: 'React Advanced' }
              }
            ],
            error: null
          }))
        });

        const result = await analyticsService.getEnrollmentStats('month');

        expect(result.totalEnrollments).toBe(500);
        expect(result.monthlyEnrollments).toBe(50);
        expect(result.enrollmentTrend).toHaveLength(2);
        expect(result.topCourses).toHaveLength(2);
        expect(result.topCourses[0].enrollments).toBe(2);
        expect(result.topCourses[0].revenue).toBe(2000);
        expect(result.topCourses[1].enrollments).toBe(1);
        expect(result.topCourses[1].revenue).toBe(1500);
      });

      test('should handle different timeframes', async () => {
        mockSelect.mockReturnValue(Promise.resolve({
          data: [{ count: 100 }],
          error: null
        }));

        mockRpc.mockReturnValue(Promise.resolve({
          data: [],
          error: null
        }));

        await analyticsService.getEnrollmentStats('week');
        expect(mockRpc).toHaveBeenCalledWith('get_enrollment_trend', { timeframe_param: 'week' });

        await analyticsService.getEnrollmentStats('quarter');
        expect(mockRpc).toHaveBeenCalledWith('get_enrollment_trend', { timeframe_param: 'quarter' });

        await analyticsService.getEnrollmentStats('year');
        expect(mockRpc).toHaveBeenCalledWith('get_enrollment_trend', { timeframe_param: 'year' });
      });

      test('should handle empty enrollment data', async () => {
        mockSelect.mockReturnValue(Promise.resolve({
          data: null,
          error: null
        }));

        mockRpc.mockReturnValue(Promise.resolve({
          data: null,
          error: null
        }));

        const result = await analyticsService.getEnrollmentStats();

        expect(result.totalEnrollments).toBe(0);
        expect(result.monthlyEnrollments).toBe(0);
        expect(result.enrollmentTrend).toEqual([]);
        expect(result.topCourses).toEqual([]);
      });

      test('should handle database errors in enrollment stats', async () => {
        mockSelect.mockReturnValue(Promise.resolve({
          data: null,
          error: new Error('Database connection failed')
        }));

        await expect(analyticsService.getEnrollmentStats()).rejects.toThrow('Database connection failed');
      });
    });
  });

  describe('Revenue Analytics and Calculations', () => {
    describe('getRevenueAnalytics', () => {
      test('should calculate revenue analytics correctly', async () => {
        // Mock total revenue data
        mockSelect.mockReturnValueOnce(Promise.resolve({
          data: [
            { amount_paid: 1000 },
            { amount_paid: 1500 },
            { amount_paid: 2000 }
          ],
          error: null
        }));

        // Mock monthly revenue data
        mockSelect.mockReturnValueOnce({
          gte: jest.fn(() => Promise.resolve({
            data: [
              { amount_paid: 1500 },
              { amount_paid: 2000 }
            ],
            error: null
          }))
        });

        // Mock mentor revenue data
        mockSelect.mockReturnValueOnce(Promise.resolve({
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
            },
            {
              amount_paid: 1500,
              courses: {
                id: 'course-2',
                mentor_id: 'mentor-1',
                users: {
                  profile: { firstName: 'John', lastName: 'Doe' }
                }
              }
            },
            {
              amount_paid: 2000,
              courses: {
                id: 'course-3',
                mentor_id: 'mentor-2',
                users: {
                  profile: { firstName: 'Jane', lastName: 'Smith' }
                }
              }
            }
          ],
          error: null
        }));

        // Mock category revenue data
        mockSelect.mockReturnValueOnce(Promise.resolve({
          data: [
            {
              amount_paid: 1000,
              courses: {
                category_id: 'cat-1',
                categories: { name: 'Programming' }
              }
            },
            {
              amount_paid: 1500,
              courses: {
                category_id: 'cat-2',
                categories: { name: 'Design' }
              }
            }
          ],
          error: null
        }));

        // Mock monthly revenue RPC
        mockRpc.mockReturnValue(Promise.resolve({
          data: [
            { month: '2024-01', revenue: 10000, enrollments: 10 },
            { month: '2024-02', revenue: 15000, enrollments: 15 }
          ],
          error: null
        }));

        const result = await analyticsService.getRevenueAnalytics('month');

        expect(result.totalRevenue).toBe(4500);
        expect(result.monthlyRevenue).toBe(3500);
        expect(result.revenueByMentor).toHaveLength(2);
        expect(result.revenueByMentor[0].mentorName).toBe('John Doe');
        expect(result.revenueByMentor[0].totalRevenue).toBe(2500);
        expect(result.revenueByMentor[0].courseCount).toBe(2);
        expect(result.revenueByMentor[0].avgRevenuePerCourse).toBe(1250);
        expect(result.revenueByCategory).toHaveLength(2);
        expect(result.revenueByMonth).toHaveLength(2);
      });

      test('should handle null category data', async () => {
        mockSelect.mockReturnValue(Promise.resolve({
          data: [
            {
              amount_paid: 1000,
              courses: {
                category_id: null,
                categories: null
              }
            }
          ],
          error: null
        }));

        mockRpc.mockReturnValue(Promise.resolve({
          data: [],
          error: null
        }));

        const result = await analyticsService.getRevenueAnalytics();

        expect(result.revenueByCategory).toEqual([]);
      });

      test('should calculate average revenue per course correctly', async () => {
        mockSelect.mockReturnValue(Promise.resolve({
          data: [
            {
              amount_paid: 3000,
              courses: {
                id: 'course-1',
                mentor_id: 'mentor-1',
                users: {
                  profile: { firstName: 'Test', lastName: 'Mentor' }
                }
              }
            },
            {
              amount_paid: 2000,
              courses: {
                id: 'course-2',
                mentor_id: 'mentor-1',
                users: {
                  profile: { firstName: 'Test', lastName: 'Mentor' }
                }
              }
            },
            {
              amount_paid: 1000,
              courses: {
                id: 'course-1', // Same course, different enrollment
                mentor_id: 'mentor-1',
                users: {
                  profile: { firstName: 'Test', lastName: 'Mentor' }
                }
              }
            }
          ],
          error: null
        }));

        mockRpc.mockReturnValue(Promise.resolve({
          data: [],
          error: null
        }));

        const result = await analyticsService.getRevenueAnalytics();

        expect(result.revenueByMentor[0].totalRevenue).toBe(6000);
        expect(result.revenueByMentor[0].courseCount).toBe(2); // Unique courses
        expect(result.revenueByMentor[0].avgRevenuePerCourse).toBe(3000);
      });
    });
  });

  describe('Ambassador ROI Metrics and Performance', () => {
    describe('getAmbassadorROIMetrics', () => {
      test('should calculate ambassador ROI metrics correctly', async () => {
        // Mock total ambassadors
        mockSelect.mockReturnValueOnce({
          eq: jest.fn(() => Promise.resolve({
            data: [{ count: 50 }],
            error: null
          }))
        });

        // Mock active ambassadors
        mockSelect.mockReturnValueOnce({
          eq: jest.fn(() => ({
            not: jest.fn(() => ({
              gte: jest.fn(() => Promise.resolve({
                data: [{ count: 30 }],
                error: null
              }))
            }))
          }))
        });

        // Mock total referrals
        mockSelect.mockReturnValueOnce({
          not: jest.fn(() => Promise.resolve({
            data: [{ count: 200 }],
            error: null
          }))
        });

        // Mock conversions data
        mockSelect.mockReturnValueOnce({
          not: jest.fn(() => Promise.resolve({
            data: [
              { student_id: 'student-1', amount_paid: 1000, users: { referred_by: 'amb-1' } },
              { student_id: 'student-2', amount_paid: 1500, users: { referred_by: 'amb-2' } },
              { student_id: 'student-3', amount_paid: 2000, users: { referred_by: 'amb-1' } }
            ],
            error: null
          }))
        });

        // Mock RPC calls
        mockRpc.mockReturnValueOnce(Promise.resolve({
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
        }));

        mockRpc.mockReturnValueOnce(Promise.resolve({
          data: [
            { month: '2024-01', newReferrals: 20, conversions: 2, pointsPaid: 200, roi: 5.0 },
            { month: '2024-02', newReferrals: 25, conversions: 3, pointsPaid: 250, roi: 6.0 }
          ],
          error: null
        }));

        const result = await analyticsService.getAmbassadorROIMetrics();

        expect(result.totalAmbassadors).toBe(50);
        expect(result.activeAmbassadors).toBe(30);
        expect(result.totalReferrals).toBe(200);
        expect(result.conversionRate).toBe(1.5); // 3 conversions / 200 referrals * 100
        expect(result.totalPointsPaid).toBe(450); // 10% of total revenue
        expect(result.avgROI).toBe(10); // 4500 revenue / 450 points
        expect(result.topPerformers).toHaveLength(1);
        expect(result.monthlyMetrics).toHaveLength(2);
      });

      test('should handle zero referrals gracefully', async () => {
        mockSelect.mockReturnValue({
          eq: jest.fn(() => Promise.resolve({
            data: [{ count: 0 }],
            error: null
          })),
          not: jest.fn(() => Promise.resolve({
            data: [{ count: 0 }],
            error: null
          }))
        });

        mockRpc.mockReturnValue(Promise.resolve({
          data: [],
          error: null
        }));

        const result = await analyticsService.getAmbassadorROIMetrics();

        expect(result.conversionRate).toBe(0);
        expect(result.totalPointsPaid).toBe(0);
        expect(result.avgROI).toBe(0);
      });
    });
  });

  describe('Internship Placement Metrics', () => {
    describe('getInternshipMetrics', () => {
      test('should calculate internship metrics correctly', async () => {
        // Mock total jobs
        mockSelect.mockReturnValueOnce(Promise.resolve({
          data: [{ count: 100 }],
          error: null
        }));

        // Mock total applications
        mockSelect.mockReturnValueOnce(Promise.resolve({
          data: [{ count: 500 }],
          error: null
        }));

        // Mock placements (hired)
        mockSelect.mockReturnValueOnce({
          eq: jest.fn(() => Promise.resolve({
            data: [{ count: 50 }],
            error: null
          }))
        });

        // Mock average time to hire RPC
        mockRpc.mockReturnValueOnce(Promise.resolve({
          data: [{ avg_days: 15 }],
          error: null
        }));

        // Mock employers data
        mockSelect.mockReturnValueOnce(Promise.resolve({
          data: [
            {
              employer_id: 'emp-1',
              users: { profile: { companyName: 'Tech Corp' } },
              job_applications: [{ id: 'app-1' }, { id: 'app-2' }]
            },
            {
              employer_id: 'emp-2',
              users: { profile: { companyName: 'Design Studio' } },
              job_applications: [{ id: 'app-3' }]
            }
          ],
          error: null
        }));

        // Mock applications by status
        mockSelect.mockReturnValueOnce(Promise.resolve({
          data: [
            { status: 'pending' },
            { status: 'pending' },
            { status: 'hired' },
            { status: 'rejected' },
            { status: 'hired' }
          ],
          error: null
        }));

        // Mock monthly placement metrics RPC
        mockRpc.mockReturnValueOnce(Promise.resolve({
          data: [
            { month: '2024-01', applications: 40, hires: 4, placementRate: 10 },
            { month: '2024-02', applications: 50, hires: 6, placementRate: 12 }
          ],
          error: null
        }));

        const result = await analyticsService.getInternshipMetrics();

        expect(result.totalJobs).toBe(100);
        expect(result.totalApplications).toBe(500);
        expect(result.placementRate).toBe(10); // 50/500 * 100
        expect(result.avgTimeToHire).toBe(15);
        expect(result.topEmployers).toHaveLength(2);
        expect(result.topEmployers[0].companyName).toBe('Tech Corp');
        expect(result.topEmployers[0].applicationsReceived).toBe(2);
        expect(result.applicationsByStatus).toHaveLength(3);
        expect(result.applicationsByStatus.find(s => s.status === 'pending')?.count).toBe(2);
        expect(result.applicationsByStatus.find(s => s.status === 'hired')?.count).toBe(2);
        expect(result.monthlyPlacements).toHaveLength(2);
      });

      test('should handle zero applications gracefully', async () => {
        mockSelect.mockReturnValue(Promise.resolve({
          data: [{ count: 0 }],
          error: null
        }));

        mockRpc.mockReturnValue(Promise.resolve({
          data: [],
          error: null
        }));

        const result = await analyticsService.getInternshipMetrics();

        expect(result.placementRate).toBe(0);
        expect(result.applicationsByStatus).toEqual([]);
      });

      test('should calculate application status percentages correctly', async () => {
        mockSelect.mockReturnValue(Promise.resolve({
          data: [{ count: 0 }],
          error: null
        }));

        // Override for status data
        mockSelect.mockReturnValueOnce(Promise.resolve({
          data: [
            { status: 'pending' },
            { status: 'pending' },
            { status: 'hired' },
            { status: 'rejected' }
          ],
          error: null
        }));

        mockRpc.mockReturnValue(Promise.resolve({
          data: [],
          error: null
        }));

        // Set total applications to 4 for percentage calculation
        mockSelect.mockReturnValueOnce(Promise.resolve({
          data: [{ count: 4 }],
          error: null
        }));

        const result = await analyticsService.getInternshipMetrics();

        const pendingStatus = result.applicationsByStatus.find(s => s.status === 'pending');
        expect(pendingStatus?.percentage).toBe(50); // 2/4 * 100
        
        const hiredStatus = result.applicationsByStatus.find(s => s.status === 'hired');
        expect(hiredStatus?.percentage).toBe(25); // 1/4 * 100
      });
    });
  });

  describe('Dashboard Overview Integration', () => {
    describe('getDashboardOverview', () => {
      test('should aggregate all metrics for dashboard', async () => {
        // Mock all service methods
        const mockEnrollmentStats = {
          totalEnrollments: 1000,
          monthlyEnrollments: 100,
          enrollmentTrend: [
            { month: '2024-01', count: 80, revenue: 80000 },
            { month: '2024-02', count: 90, revenue: 90000 },
            { month: '2024-03', count: 100, revenue: 100000 }
          ],
          topCourses: []
        };

        const mockRevenueAnalytics = {
          totalRevenue: 500000,
          monthlyRevenue: 50000,
          revenueByMonth: [
            { month: '2024-01', revenue: 40000, enrollments: 80 },
            { month: '2024-02', revenue: 45000, enrollments: 90 },
            { month: '2024-03', revenue: 50000, enrollments: 100 }
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
        expect(result.enrollments.trend).toHaveLength(3);
        
        expect(result.revenue.total).toBe(500000);
        expect(result.revenue.monthly).toBe(50000);
        expect(result.revenue.trend).toHaveLength(3);
        
        expect(result.ambassadors.total).toBe(50);
        expect(result.ambassadors.active).toBe(30);
        expect(result.ambassadors.conversionRate).toBe(15.5);
        expect(result.ambassadors.roi).toBe(8.2);
        
        expect(result.internships.totalJobs).toBe(200);
        expect(result.internships.totalApplications).toBe(1000);
        expect(result.internships.placementRate).toBe(12.5);
      });

      test('should handle errors in dashboard overview', async () => {
        jest.spyOn(analyticsService, 'getEnrollmentStats').mockRejectedValue(new Error('Enrollment stats failed'));

        await expect(analyticsService.getDashboardOverview()).rejects.toThrow('Enrollment stats failed');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle RPC function errors', async () => {
      mockSelect.mockReturnValue(Promise.resolve({
        data: [{ count: 100 }],
        error: null
      }));

      mockRpc.mockReturnValue(Promise.resolve({
        data: null,
        error: new Error('RPC function failed')
      }));

      await expect(analyticsService.getEnrollmentStats()).rejects.toThrow('RPC function failed');
    });

    test('should handle missing profile data in revenue analytics', async () => {
      mockSelect.mockReturnValue(Promise.resolve({
        data: [
          {
            amount_paid: 1000,
            courses: {
              id: 'course-1',
              mentor_id: 'mentor-1',
              users: {
                profile: null // Missing profile
              }
            }
          }
        ],
        error: null
      }));

      mockRpc.mockReturnValue(Promise.resolve({
        data: [],
        error: null
      }));

      const result = await analyticsService.getRevenueAnalytics();

      expect(result.revenueByMentor[0].mentorName).toBe('');
    });

    test('should handle null data responses gracefully', async () => {
      mockSelect.mockReturnValue(Promise.resolve({
        data: null,
        error: null
      }));

      mockRpc.mockReturnValue(Promise.resolve({
        data: null,
        error: null
      }));

      const result = await analyticsService.getEnrollmentStats();

      expect(result.totalEnrollments).toBe(0);
      expect(result.monthlyEnrollments).toBe(0);
      expect(result.enrollmentTrend).toEqual([]);
      expect(result.topCourses).toEqual([]);
    });
  });
});