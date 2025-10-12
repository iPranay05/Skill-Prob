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

    // Get current date for monthly calculations
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // 1. User Statistics
    const { data: allUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, role, created_at');

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    const totalUsers = allUsers?.length || 0;
    const newUsersThisMonth = allUsers?.filter(user => 
      new Date(user.created_at) >= firstDayOfMonth
    ).length || 0;

    const usersByRole = allUsers?.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // 2. Course Statistics
    const { data: allCourses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('id, status, created_at');

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
    }

    const totalCourses = allCourses?.length || 0;
    const publishedCourses = allCourses?.filter(course => course.status === 'published').length || 0;
    const draftCourses = allCourses?.filter(course => course.status === 'draft').length || 0;

    // 3. Enrollment Statistics
    const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
      .from('enrollments')
      .select('id, created_at, amount_paid');

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
    }

    const totalEnrollments = enrollments?.length || 0;

    // 4. Revenue Statistics
    const totalRevenue = enrollments?.reduce((sum, enrollment) => 
      sum + (enrollment.amount_paid || 0), 0) || 0;

    const monthlyRevenue = enrollments?.filter(enrollment => 
      new Date(enrollment.created_at) >= firstDayOfMonth
    ).reduce((sum, enrollment) => sum + (enrollment.amount_paid || 0), 0) || 0;

    // 5. Payout Statistics
    const { data: payoutRequests, error: payoutsError } = await supabaseAdmin
      .from('payout_requests')
      .select('id, amount, status');

    if (payoutsError) {
      console.error('Error fetching payouts:', payoutsError);
    }

    const pendingPayouts = payoutRequests?.filter(payout => 
      payout.status === 'pending'
    ).reduce((sum, payout) => sum + (payout.amount || 0), 0) || 0;

    const completedPayouts = payoutRequests?.filter(payout => 
      payout.status === 'processed'
    ).reduce((sum, payout) => sum + (payout.amount || 0), 0) || 0;

    // 6. Live Session Statistics
    const { data: liveSessions, error: sessionsError } = await supabaseAdmin
      .from('live_sessions')
      .select('id, status, created_at');

    if (sessionsError) {
      console.error('Error fetching live sessions:', sessionsError);
    }

    const activeSessions = liveSessions?.filter(session => 
      session.status === 'active' || session.status === 'live'
    ).length || 0;

    const totalSessions = liveSessions?.length || 0;

    // 7. Calculate growth rate (comparing this month to last month)
    const lastMonthUsers = allUsers?.filter(user => {
      const createdAt = new Date(user.created_at);
      return createdAt >= firstDayOfLastMonth && createdAt < firstDayOfMonth;
    }).length || 0;

    const growthRate = lastMonthUsers > 0 
      ? ((newUsersThisMonth - lastMonthUsers) / lastMonthUsers) * 100 
      : newUsersThisMonth > 0 ? 100 : 0;

    // 8. Average Rating (from course reviews)
    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from('course_reviews')
      .select('rating');

    const averageRating = reviews && reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    // 9. Support Tickets (if table exists)
    const { data: supportTickets } = await supabaseAdmin
      .from('support_tickets')
      .select('id, status')
      .eq('status', 'open');

    const openSupportTickets = supportTickets?.length || 0;

    const dashboardStats = {
      users: {
        total: totalUsers,
        students: usersByRole.student || 0,
        mentors: usersByRole.mentor || 0,
        ambassadors: usersByRole.ambassador || 0,
        newThisMonth: newUsersThisMonth
      },
      courses: {
        total: totalCourses,
        published: publishedCourses,
        draft: draftCourses,
        totalEnrollments: totalEnrollments
      },
      revenue: {
        totalRevenue: totalRevenue,
        monthlyRevenue: monthlyRevenue,
        pendingPayouts: pendingPayouts,
        completedPayouts: completedPayouts
      },
      activity: {
        activeSessions: activeSessions,
        totalSessions: totalSessions,
        averageRating: Math.round(averageRating * 10) / 10,
        supportTickets: openSupportTickets
      },
      growth: {
        rate: Math.round(growthRate * 10) / 10
      }
    };

    return NextResponse.json({
      success: true,
      data: dashboardStats
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    
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