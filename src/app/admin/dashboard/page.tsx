'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/clientAuth';

interface DashboardStats {
  users: {
    total: number;
    students: number;
    mentors: number;
    ambassadors: number;
    newThisMonth: number;
  };
  courses: {
    total: number;
    published: number;
    draft: number;
    totalEnrollments: number;
  };
  revenue: {
    totalRevenue: number;
    monthlyRevenue: number;
    pendingPayouts: number;
    completedPayouts: number;
  };
  activity: {
    activeSessions: number;
    totalSessions: number;
    averageRating: number;
    supportTickets: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }

        if (!['admin', 'super_admin'].includes(currentUser.role)) {
          router.push('/');
          return;
        }

        setUser(currentUser);
        await fetchDashboardStats();
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      } else {
        const errorData = await response.json();
        console.error('Dashboard API error:', errorData);
        // Set empty stats to show error state
        setStats(null);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Overview of your platform's performance and metrics</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/admin/users')}
            className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 text-left"
          >
            <h3 className="font-semibold">Manage Users</h3>
            <p className="text-sm opacity-90">View and manage all users</p>
          </button>
          <button
            onClick={() => router.push('/admin/courses')}
            className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 text-left"
          >
            <h3 className="font-semibold">Manage Courses</h3>
            <p className="text-sm opacity-90">Review and approve courses</p>
          </button>
          <button
            onClick={() => router.push('/admin/kyc')}
            className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 text-left"
          >
            <h3 className="font-semibold">KYC Reviews</h3>
            <p className="text-sm opacity-90">Review KYC submissions</p>
          </button>
          <button
            onClick={() => router.push('/admin/analytics')}
            className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 text-left"
          >
            <h3 className="font-semibold">Analytics</h3>
            <p className="text-sm opacity-90">View detailed analytics</p>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading dashboard data...</p>
          </div>
        ) : stats ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Users Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.users.total.toLocaleString()}</p>
                    <p className="text-sm text-green-600">+{stats.users.newThisMonth} this month</p>
                  </div>
                </div>
              </div>

              {/* Courses Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Courses</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.courses.total}</p>
                    <p className="text-sm text-gray-600">{stats.courses.published} published</p>
                  </div>
                </div>
              </div>

              {/* Revenue Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-semibold text-gray-900">₹{stats.revenue.totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-green-600">₹{stats.revenue.monthlyRevenue.toLocaleString()} this month</p>
                  </div>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Sessions</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.activity.activeSessions}</p>
                    <p className="text-sm text-gray-600">{stats.activity.totalSessions} total sessions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* User Breakdown */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Students</span>
                    <span className="font-semibold">{stats.users.students.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Mentors</span>
                    <span className="font-semibold">{stats.users.mentors}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Ambassadors</span>
                    <span className="font-semibold">{stats.users.ambassadors}</span>
                  </div>
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-semibold">₹{stats.revenue.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Monthly Revenue</span>
                    <span className="font-semibold text-green-600">₹{stats.revenue.monthlyRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending Payouts</span>
                    <span className="font-semibold text-orange-600">₹{stats.revenue.pendingPayouts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Completed Payouts</span>
                    <span className="font-semibold">₹{stats.revenue.completedPayouts.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Course Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Course Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Published Courses</span>
                    <span className="font-semibold text-green-600">{stats.courses.published}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Draft Courses</span>
                    <span className="font-semibold text-orange-600">{stats.courses.draft}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Enrollments</span>
                    <span className="font-semibold">{stats.courses.totalEnrollments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Rating</span>
                    <span className="font-semibold">⭐ {stats.activity.averageRating}/5</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Live Sessions</span>
                    <span className="font-semibold text-green-600">{stats.activity.activeSessions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Support Tickets</span>
                    <span className="font-semibold text-orange-600">{stats.activity.supportTickets}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">System Status</span>
                    <span className="font-semibold text-green-600">🟢 Operational</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Failed to load dashboard data</p>
            <button
              onClick={fetchDashboardStats}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}