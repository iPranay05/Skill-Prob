import { supabaseAdmin } from './database';

export interface EnrollmentStats {
  totalEnrollments: number;
  monthlyEnrollments: number;
  enrollmentTrend: Array<{
    month: string;
    count: number;
    revenue: number;
  }>;
  topCourses: Array<{
    courseId: string;
    title: string;
    enrollments: number;
    revenue: number;
  }>;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueByMentor: Array<{
    mentorId: string;
    mentorName: string;
    totalRevenue: number;
    courseCount: number;
    avgRevenuePerCourse: number;
  }>;
  revenueByCategory: Array<{
    categoryId: string;
    categoryName: string;
    totalRevenue: number;
    enrollmentCount: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    enrollments: number;
  }>;
}

export interface AmbassadorROIMetrics {
  totalAmbassadors: number;
  activeAmbassadors: number;
  totalReferrals: number;
  conversionRate: number;
  totalPointsPaid: number;
  avgROI: number;
  topPerformers: Array<{
    ambassadorId: string;
    ambassadorName: string;
    totalReferrals: number;
    successfulConversions: number;
    totalEarnings: number;
    conversionRate: number;
  }>;
  monthlyMetrics: Array<{
    month: string;
    newReferrals: number;
    conversions: number;
    pointsPaid: number;
    roi: number;
  }>;
}

export interface InternshipMetrics {
  totalJobs: number;
  totalApplications: number;
  placementRate: number;
  avgTimeToHire: number;
  topEmployers: Array<{
    employerId: string;
    companyName: string;
    jobsPosted: number;
    applicationsReceived: number;
    hires: number;
  }>;
  applicationsByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  monthlyPlacements: Array<{
    month: string;
    applications: number;
    hires: number;
    placementRate: number;
  }>;
}

export class AnalyticsService {
  /**
   * Get comprehensive enrollment statistics and trends
   */
  async getEnrollmentStats(timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<EnrollmentStats> {
    try {
      // Get total enrollments
      const { data: totalEnrollmentsData, error: totalError } = await supabaseAdmin
        .from('course_enrollments')
        .select('count');

      if (totalError) throw totalError;

      // Get monthly enrollments (current month)
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const { data: monthlyEnrollmentsData, error: monthlyError } = await supabaseAdmin
        .from('course_enrollments')
        .select('count')
        .gte('enrolled_at', currentMonth.toISOString());

      if (monthlyError) throw monthlyError;

      // Get enrollment trend data
      const { data: trendData, error: trendError } = await supabaseAdmin
        .rpc('get_enrollment_trend', { timeframe_param: timeframe });

      if (trendError) throw trendError;

      // Get top courses by enrollment
      const { data: topCoursesData, error: topCoursesError } = await supabaseAdmin
        .from('course_enrollments')
        .select(`
          course_id,
          amount_paid,
          courses!inner(title)
        `)
        .limit(10);

      if (topCoursesError) throw topCoursesError;

      // Process top courses data
      const courseStats = new Map();
      topCoursesData?.forEach(enrollment => {
        const courseId = enrollment.course_id;
        if (!courseStats.has(courseId)) {
          courseStats.set(courseId, {
            courseId,
            title: enrollment.courses[0]?.title,
            enrollments: 0,
            revenue: 0
          });
        }
        const stats = courseStats.get(courseId);
        stats.enrollments += 1;
        stats.revenue += enrollment.amount_paid || 0;
      });

      const topCourses = Array.from(courseStats.values())
        .sort((a, b) => b.enrollments - a.enrollments)
        .slice(0, 10);

      return {
        totalEnrollments: totalEnrollmentsData?.[0]?.count || 0,
        monthlyEnrollments: monthlyEnrollmentsData?.[0]?.count || 0,
        enrollmentTrend: trendData || [],
        topCourses
      };
    } catch (error) {
      console.error('Error getting enrollment stats:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive revenue analytics
   */
  async getRevenueAnalytics(timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<RevenueAnalytics> {
    try {
      // Get total revenue
      const { data: totalRevenueData, error: totalError } = await supabaseAdmin
        .from('course_enrollments')
        .select('amount_paid');

      if (totalError) throw totalError;

      const totalRevenue = totalRevenueData?.reduce((sum, enrollment) => 
        sum + (enrollment.amount_paid || 0), 0) || 0;

      // Get monthly revenue
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const { data: monthlyRevenueData, error: monthlyError } = await supabaseAdmin
        .from('course_enrollments')
        .select('amount_paid')
        .gte('enrolled_at', currentMonth.toISOString());

      if (monthlyError) throw monthlyError;

      const monthlyRevenue = monthlyRevenueData?.reduce((sum, enrollment) => 
        sum + (enrollment.amount_paid || 0), 0) || 0;

      // Get revenue by mentor
      const { data: mentorRevenueData, error: mentorError } = await supabaseAdmin
        .from('course_enrollments')
        .select(`
          amount_paid,
          courses!inner(
            mentor_id,
            users!inner(profile)
          )
        `);

      if (mentorError) throw mentorError;

      // Process mentor revenue data
      const mentorStats = new Map();
      mentorRevenueData?.forEach(enrollment => {
        const mentorId = enrollment.courses[0]?.mentor_id;
        if (!mentorStats.has(mentorId)) {
          const profile = enrollment.courses[0]?.users?.[0]?.profile as any;
          mentorStats.set(mentorId, {
            mentorId,
            mentorName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
            totalRevenue: 0,
            courseCount: new Set(),
            enrollmentCount: 0
          });
        }
        const stats = mentorStats.get(mentorId);
        stats.totalRevenue += enrollment.amount_paid || 0;
        const courseId = (enrollment.courses as any)?.[0]?.id || (enrollment as any).course_id;
        if (courseId) stats.courseCount.add(courseId);
        stats.enrollmentCount += 1;
      });

      const revenueByMentor = Array.from(mentorStats.values())
        .map(stats => ({
          ...stats,
          courseCount: stats.courseCount.size,
          avgRevenuePerCourse: stats.courseCount.size > 0 ? stats.totalRevenue / stats.courseCount.size : 0
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      // Get revenue by category
      const { data: categoryRevenueData, error: categoryError } = await supabaseAdmin
        .from('course_enrollments')
        .select(`
          amount_paid,
          courses!inner(
            category_id,
            categories!inner(name)
          )
        `);

      if (categoryError) throw categoryError;

      // Process category revenue data
      const categoryStats = new Map();
      categoryRevenueData?.forEach(enrollment => {
        const categoryId = enrollment.courses[0]?.category_id;
        if (categoryId && !categoryStats.has(categoryId)) {
          categoryStats.set(categoryId, {
            categoryId,
            categoryName: enrollment.courses[0]?.categories?.[0]?.name || 'Uncategorized',
            totalRevenue: 0,
            enrollmentCount: 0
          });
        }
        if (categoryId) {
          const stats = categoryStats.get(categoryId);
          stats.totalRevenue += enrollment.amount_paid || 0;
          stats.enrollmentCount += 1;
        }
      });

      const revenueByCategory = Array.from(categoryStats.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      // Get revenue by month (last 12 months)
      const { data: monthlyRevenueData2, error: monthlyError2 } = await supabaseAdmin
        .rpc('get_revenue_by_month', { months_back: 12 });

      if (monthlyError2) throw monthlyError2;

      return {
        totalRevenue,
        monthlyRevenue,
        revenueByMentor,
        revenueByCategory,
        revenueByMonth: monthlyRevenueData2 || []
      };
    } catch (error) {
      console.error('Error getting revenue analytics:', error);
      throw error;
    }
  }

  /**
   * Get ambassador ROI metrics and performance tracking
   */
  async getAmbassadorROIMetrics(): Promise<AmbassadorROIMetrics> {
    try {
      // Get total ambassadors
      const { data: totalAmbassadorsData, error: totalError } = await supabaseAdmin
        .from('users')
        .select('count')
        .eq('role', 'ambassador');

      if (totalError) throw totalError;

      // Get active ambassadors (those with referrals in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: activeAmbassadorsData, error: activeError } = await supabaseAdmin
        .from('users')
        .select('count')
        .eq('role', 'ambassador')
        .not('referred_by', 'is', null)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (activeError) throw activeError;

      // Get total referrals
      const { data: totalReferralsData, error: referralsError } = await supabaseAdmin
        .from('users')
        .select('count')
        .not('referred_by', 'is', null);

      if (referralsError) throw referralsError;

      // Get conversion data (referrals who made purchases)
      const { data: conversionsData, error: conversionsError } = await supabaseAdmin
        .from('course_enrollments')
        .select(`
          student_id,
          amount_paid,
          users!inner(referred_by)
        `)
        .not('users.referred_by', 'is', null);

      if (conversionsError) throw conversionsError;

      const totalConversions = conversionsData?.length || 0;
      const totalReferrals = totalReferralsData?.[0]?.count || 0;
      const conversionRate = totalReferrals > 0 ? (totalConversions / totalReferrals) * 100 : 0;

      // Calculate total points paid (assuming 10% commission)
      const totalPointsPaid = conversionsData?.reduce((sum, enrollment) => 
        sum + ((enrollment.amount_paid || 0) * 0.1), 0) || 0;

      // Calculate average ROI
      const totalRevenue = conversionsData?.reduce((sum, enrollment) => 
        sum + (enrollment.amount_paid || 0), 0) || 0;
      const avgROI = totalPointsPaid > 0 ? (totalRevenue / totalPointsPaid) : 0;

      // Get top performers
      const { data: performersData, error: performersError } = await supabaseAdmin
        .rpc('get_ambassador_performance');

      if (performersError) throw performersError;

      // Get monthly metrics
      const { data: monthlyMetricsData, error: monthlyError } = await supabaseAdmin
        .rpc('get_ambassador_monthly_metrics', { months_back: 12 });

      if (monthlyError) throw monthlyError;

      return {
        totalAmbassadors: totalAmbassadorsData?.[0]?.count || 0,
        activeAmbassadors: activeAmbassadorsData?.[0]?.count || 0,
        totalReferrals,
        conversionRate,
        totalPointsPaid,
        avgROI,
        topPerformers: performersData || [],
        monthlyMetrics: monthlyMetricsData || []
      };
    } catch (error) {
      console.error('Error getting ambassador ROI metrics:', error);
      throw error;
    }
  }

  /**
   * Get internship placement metrics and success rates
   */
  async getInternshipMetrics(): Promise<InternshipMetrics> {
    try {
      // Get total jobs
      const { data: totalJobsData, error: jobsError } = await supabaseAdmin
        .from('job_postings')
        .select('count');

      if (jobsError) throw jobsError;

      // Get total applications
      const { data: totalApplicationsData, error: applicationsError } = await supabaseAdmin
        .from('job_applications')
        .select('count');

      if (applicationsError) throw applicationsError;

      // Get placement data (hired applications)
      const { data: placementsData, error: placementsError } = await supabaseAdmin
        .from('job_applications')
        .select('count')
        .eq('status', 'hired');

      if (placementsError) throw placementsError;

      const totalJobs = totalJobsData?.[0]?.count || 0;
      const totalApplications = totalApplicationsData?.[0]?.count || 0;
      const totalPlacements = placementsData?.[0]?.count || 0;
      const placementRate = totalApplications > 0 ? (totalPlacements / totalApplications) * 100 : 0;

      // Get average time to hire
      const { data: timeToHireData, error: timeError } = await supabaseAdmin
        .rpc('get_avg_time_to_hire');

      if (timeError) throw timeError;

      // Get top employers
      const { data: employersData, error: employersError } = await supabaseAdmin
        .from('job_postings')
        .select(`
          employer_id,
          users!inner(profile),
          job_applications(count)
        `);

      if (employersError) throw employersError;

      // Process employer data
      const employerStats = new Map();
      employersData?.forEach(job => {
        const employerId = job.employer_id;
        if (!employerStats.has(employerId)) {
          const profile = job.users[0]?.profile as any;
          employerStats.set(employerId, {
            employerId,
            companyName: profile.companyName || profile.firstName || 'Unknown',
            jobsPosted: 0,
            applicationsReceived: 0,
            hires: 0
          });
        }
        const stats = employerStats.get(employerId);
        stats.jobsPosted += 1;
        stats.applicationsReceived += job.job_applications?.length || 0;
      });

      const topEmployers = Array.from(employerStats.values())
        .sort((a, b) => b.jobsPosted - a.jobsPosted)
        .slice(0, 10);

      // Get applications by status
      const { data: statusData, error: statusError } = await supabaseAdmin
        .from('job_applications')
        .select('status');

      if (statusError) throw statusError;

      const statusCounts = new Map();
      statusData?.forEach(app => {
        const status = app.status || 'pending';
        statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
      });

      const applicationsByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
        status,
        count,
        percentage: totalApplications > 0 ? (count / totalApplications) * 100 : 0
      }));

      // Get monthly placement data
      const { data: monthlyPlacementsData, error: monthlyPlacementsError } = await supabaseAdmin
        .rpc('get_monthly_placement_metrics', { months_back: 12 });

      if (monthlyPlacementsError) throw monthlyPlacementsError;

      return {
        totalJobs,
        totalApplications,
        placementRate,
        avgTimeToHire: timeToHireData?.[0]?.avg_days || 0,
        topEmployers,
        applicationsByStatus,
        monthlyPlacements: monthlyPlacementsData || []
      };
    } catch (error) {
      console.error('Error getting internship metrics:', error);
      throw error;
    }
  }

  /**
   * Get dashboard overview with key metrics
   */
  async getDashboardOverview() {
    try {
      const [enrollmentStats, revenueAnalytics, ambassadorMetrics, internshipMetrics] = await Promise.all([
        this.getEnrollmentStats(),
        this.getRevenueAnalytics(),
        this.getAmbassadorROIMetrics(),
        this.getInternshipMetrics()
      ]);

      return {
        enrollments: {
          total: enrollmentStats.totalEnrollments,
          monthly: enrollmentStats.monthlyEnrollments,
          trend: enrollmentStats.enrollmentTrend.slice(-6) // Last 6 months
        },
        revenue: {
          total: revenueAnalytics.totalRevenue,
          monthly: revenueAnalytics.monthlyRevenue,
          trend: revenueAnalytics.revenueByMonth.slice(-6)
        },
        ambassadors: {
          total: ambassadorMetrics.totalAmbassadors,
          active: ambassadorMetrics.activeAmbassadors,
          conversionRate: ambassadorMetrics.conversionRate,
          roi: ambassadorMetrics.avgROI
        },
        internships: {
          totalJobs: internshipMetrics.totalJobs,
          totalApplications: internshipMetrics.totalApplications,
          placementRate: internshipMetrics.placementRate
        }
      };
    } catch (error) {
      console.error('Error getting dashboard overview:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();