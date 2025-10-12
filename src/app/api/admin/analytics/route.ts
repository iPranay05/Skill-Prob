import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';
import { APIError } from '../../../../lib/errors';
import { UserRole } from '../../../../types/user';
import { supabaseAdmin } from '../../../../lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (authResult.user.role !== UserRole.ADMIN && authResult.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. User Analytics
    const { data: allUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, role, created_at, last_login_at, status');

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    const totalUsers = allUsers?.length || 0;
    const newUsersInRange = allUsers?.filter(user => 
      new Date(user.created_at) >= startDate
    ).length || 0;

    const newUsersThisMonth = allUsers?.filter(user => 
      new Date(user.created_at) >= firstDayOfMonth
    ).length || 0;

    const activeUsers = allUsers?.filter(user => 
      user.last_login_at && new Date(user.last_login_at) >= startDate
    ).length || 0;

    const usersByRole = allUsers?.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Calculate retention rate (users who logged in within the time range)
    const userRetentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    // 2. Course Analytics
    const { data: allCourses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('id, status, category, created_at, ratings');

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
    }

    const totalCourses = allCourses?.length || 0;
    const publishedCourses = allCourses?.filter(course => course.status === 'published').length || 0;

    // Calculate average rating
    const coursesWithRatings = allCourses?.filter(course => course.ratings?.count > 0) || [];
    const averageRating = coursesWithRatings.length > 0
      ? coursesWithRatings.reduce((sum, course) => sum + (course.ratings?.average || 0), 0) / coursesWithRatings.length
      : 0;

    // Top categories by course count and revenue
    const categoryCounts = allCourses?.reduce((acc, course) => {
      if (course.category) {
        acc[course.category] = (acc[course.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>) || {};

    // 3. Enrollment and Revenue Analytics
    const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
      .from('enrollments')
      .select('id, course_id, amount_paid, created_at, status');

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
    }

    const totalEnrollments = enrollments?.length || 0;
    const totalRevenue = enrollments?.reduce((sum, enrollment) => 
      sum + (enrollment.amount_paid || 0), 0) || 0;

    const enrollmentsInRange = enrollments?.filter(enrollment => 
      new Date(enrollment.created_at) >= startDate
    ) || [];

    const revenueInRange = enrollmentsInRange.reduce((sum, enrollment) => 
      sum + (enrollment.amount_paid || 0), 0);

    const completedEnrollments = enrollments?.filter(enrollment => 
      enrollment.status === 'completed'
    ).length || 0;

    const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

    // Calculate average order value
    const averageOrderValue = totalEnrollments > 0 ? totalRevenue / totalEnrollments : 0;

    // Monthly revenue trend (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthRevenue = enrollments?.filter(enrollment => {
        const enrollmentDate = new Date(enrollment.created_at);
        return enrollmentDate >= monthStart && enrollmentDate <= monthEnd;
      }).reduce((sum, enrollment) => sum + (enrollment.amount_paid || 0), 0) || 0;
      
      monthlyRevenue.push(monthRevenue);
    }

    // 4. Ambassador Analytics
    const { data: ambassadors, error: ambassadorsError } = await supabaseAdmin
      .from('ambassadors')
      .select('id, user_id, status, performance, created_at');

    if (ambassadorsError) {
      console.error('Error fetching ambassadors:', ambassadorsError);
    }

    const totalAmbassadors = ambassadors?.length || 0;
    const activeAmbassadors = ambassadors?.filter(amb => amb.status === 'active').length || 0;

    const { data: referrals, error: referralsError } = await supabaseAdmin
      .from('referrals')
      .select('id, status, created_at, ambassador_id');

    if (referralsError) {
      console.error('Error fetching referrals:', referralsError);
    }

    const totalReferrals = referrals?.length || 0;
    const convertedReferrals = referrals?.filter(ref => ref.status === 'converted').length || 0;
    const conversionRate = totalReferrals > 0 ? (convertedReferrals / totalReferrals) * 100 : 0;

    // Top performing ambassadors
    const ambassadorPerformance = ambassadors?.map(ambassador => ({
      id: ambassador.id,
      userId: ambassador.user_id,
      performance: ambassador.performance || {},
      referralCount: referrals?.filter(ref => ref.ambassador_id === ambassador.id).length || 0
    })) || [];

    // Get ambassador user details for top performers
    const topAmbassadorIds = ambassadorPerformance
      .sort((a, b) => (b.performance.totalEarnings || 0) - (a.performance.totalEarnings || 0))
      .slice(0, 5)
      .map(amb => amb.userId);

    const { data: ambassadorUsers } = await supabaseAdmin
      .from('users')
      .select('id, profile')
      .in('id', topAmbassadorIds);

    const topPerformers = ambassadorPerformance
      .slice(0, 5)
      .map(ambassador => {
        const user = ambassadorUsers?.find(u => u.id === ambassador.userId);
        return {
          name: user?.profile?.firstName && user?.profile?.lastName
            ? `${user.profile.firstName} ${user.profile.lastName}`
            : user?.profile?.firstName || 'Unknown',
          referrals: ambassador.referralCount,
          earnings: ambassador.performance.totalEarnings || 0
        };
      });

    // 5. Revenue breakdown
    const courseRevenue = totalRevenue * 0.85; // Assuming 85% goes to courses
    const subscriptionRevenue = totalRevenue * 0.10; // 10% subscriptions
    const commissionRevenue = totalRevenue * 0.05; // 5% commissions

    // 6. Top categories with revenue
    const { data: courseCategories } = await supabaseAdmin
      .from('courses')
      .select(`
        id,
        category,
        enrollments!inner(amount_paid)
      `);

    const categoryRevenue = courseCategories?.reduce((acc, course) => {
      if (course.category) {
        const revenue = course.enrollments?.reduce((sum: number, enrollment: any) => 
          sum + (enrollment.amount_paid || 0), 0) || 0;
        
        if (!acc[course.category]) {
          acc[course.category] = { count: 0, revenue: 0 };
        }
        acc[course.category].count += 1;
        acc[course.category].revenue += revenue;
      }
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>) || {};

    const topCategories = Object.entries(categoryRevenue)
      .map(([category, data]) => ({
        category,
        count: data.count,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const analyticsData = {
      overview: {
        totalUsers,
        totalCourses,
        totalRevenue,
        totalEnrollments,
        growthRate: newUsersInRange
      },
      userMetrics: {
        newUsersThisMonth,
        activeUsers,
        userRetentionRate: Math.round(userRetentionRate * 10) / 10,
        usersByRole: {
          students: usersByRole.student || 0,
          mentors: usersByRole.mentor || 0,
          ambassadors: usersByRole.ambassador || 0
        }
      },
      courseMetrics: {
        publishedCourses,
        averageRating: Math.round(averageRating * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        topCategories
      },
      revenueMetrics: {
        monthlyRevenue,
        revenueBySource: {
          courses: Math.round(courseRevenue),
          subscriptions: Math.round(subscriptionRevenue),
          commissions: Math.round(commissionRevenue)
        },
        averageOrderValue: Math.round(averageOrderValue)
      },
      ambassadorMetrics: {
        totalAmbassadors,
        activeAmbassadors,
        totalReferrals,
        conversionRate: Math.round(conversionRate * 10) / 10,
        topPerformers
      }
    };

    return NextResponse.json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}