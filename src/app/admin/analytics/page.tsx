'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/clientAuth';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalCourses: number;
    totalRevenue: number;
    totalEnrollments: number;
    growthRate: number;
  };
  userMetrics: {
    newUsersThisMonth: number;
    activeUsers: number;
    userRetentionRate: number;
    usersByRole: {
      students: number;
      mentors: number;
      ambassadors: number;
    };
  };
  courseMetrics: {
    publishedCourses: number;
    averageRating: number;
    completionRate: number;
    topCategories: Array<{
      category: string;
      count: number;
      revenue: number;
    }>;
  };
  revenueMetrics: {
    monthlyRevenue: number[];
    revenueBySource: {
      courses: number;
      subscriptions: number;
      commissions: number;
    };
    averageOrderValue: number;
  };
  ambassadorMetrics: {
    totalAmbassadors: number;
    activeAmbassadors: number;
    totalReferrals: number;
    conversionRate: number;
    topPerformers: Array<{
      name: string;
      referrals: number;
      earnings: number;
    }>;
  };
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

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
        await fetchAnalytics();
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setAnalytics(result.data);
      } else {
        // Mock data if API doesn't exist yet
        setAnalytics({
          overview: {
            totalUsers: 1250,
            totalCourses: 85,
            totalRevenue: 125000,
            totalEnrollments: 3420,
            growthRate: 15.2
          },
          userMetrics: {
            newUsersThisMonth: 120,
            activeUsers: 890,
            userRetentionRate: 78.5,
            usersByRole: {
              students: 980,
              mentors: 45,
              ambassadors: 25
            }
          },
          courseMetrics: {
            publishedCourses: 72,
            averageRating: 4.6,
            completionRate: 68.3,
            topCategories: [
              { category: 'Programming', count: 25, revenue: 45000 },
              { category: 'Data Science', count: 18, revenue: 32000 },
              { category: 'Marketing', count: 15, revenue: 28000 },
              { category: 'Design', count: 14, revenue: 20000 }
            ]
          },
          revenueMetrics: {
            monthlyRevenue: [8500, 12000, 15500, 18200, 22000, 18500],
            revenueBySource: {
              courses: 85000,
              subscriptions: 25000,
              commissions: 15000
            },
            averageOrderValue: 2850
          },
          ambassadorMetrics: {
            totalAmbassadors: 25,
            activeAmbassadors: 18,
            totalReferrals: 340,
            conversionRate: 24.5,
            topPerformers: [
              { name: 'John Smith', referrals: 45, earnings: 12500 },
              { name: 'Jane Doe', referrals: 38, earnings: 9800 },
              { name: 'Mike Johnson', referrals: 32, earnings: 8200 }
            ]
          }
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="mt-2 text-gray-600">Comprehensive insights into your platform's performance</p>
            </div>
            
            {/* Time Range Selector */}
            <div className="flex space-x-2">
              {[
                { key: '7d', label: '7 Days' },
                { key: '30d', label: '30 Days' },
                { key: '90d', label: '90 Days' },
                { key: '1y', label: '1 Year' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTimeRange(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    timeRange === key
                      ? 'bg-info text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading analytics data...</p>
          </div>
        ) : analytics ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.overview.totalUsers.toLocaleString()}</p>
                    <p className="text-sm text-secondary">+{analytics.overview.growthRate}% growth</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Courses</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.overview.totalCourses}</p>
                    <p className="text-sm text-gray-600">{analytics.courseMetrics.publishedCourses} published</p>
                  </div>
                </div>
              </div>

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
                    <p className="text-2xl font-semibold text-gray-900">₹{analytics.overview.totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">AOV: ₹{analytics.revenueMetrics.averageOrderValue}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Enrollments</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.overview.totalEnrollments.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{analytics.courseMetrics.completionRate}% completion</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* User Metrics */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Analytics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">New Users This Month</span>
                    <span className="font-semibold text-secondary">+{analytics.userMetrics.newUsersThisMonth}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Users</span>
                    <span className="font-semibold">{analytics.userMetrics.activeUsers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">User Retention Rate</span>
                    <span className="font-semibold">{analytics.userMetrics.userRetentionRate}%</span>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-3">Users by Role</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Students</span>
                        <span className="font-semibold">{analytics.userMetrics.usersByRole.students}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mentors</span>
                        <span className="font-semibold">{analytics.userMetrics.usersByRole.mentors}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ambassadors</span>
                        <span className="font-semibold">{analytics.userMetrics.usersByRole.ambassadors}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Analytics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Course Sales</span>
                    <span className="font-semibold">₹{analytics.revenueMetrics.revenueBySource.courses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subscriptions</span>
                    <span className="font-semibold">₹{analytics.revenueMetrics.revenueBySource.subscriptions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Commissions</span>
                    <span className="font-semibold">₹{analytics.revenueMetrics.revenueBySource.commissions.toLocaleString()}</span>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-3">Monthly Revenue Trend</h4>
                    <div className="flex items-end space-x-2 h-20">
                      {analytics.revenueMetrics.monthlyRevenue.map((revenue, index) => (
                        <div
                          key={index}
                          className="bg-info rounded-t"
                          style={{
                            height: `${(revenue / Math.max(...analytics.revenueMetrics.monthlyRevenue)) * 100}%`,
                            width: '16.66%'
                          }}
                          title={`Month ${index + 1}: ₹${revenue.toLocaleString()}`}
                        ></div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>6 months ago</span>
                      <span>Current</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Course Performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Published Courses</span>
                    <span className="font-semibold">{analytics.courseMetrics.publishedCourses}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Rating</span>
                    <span className="font-semibold">⭐ {analytics.courseMetrics.averageRating}/5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-semibold">{analytics.courseMetrics.completionRate}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Categories</h3>
                <div className="space-y-3">
                  {analytics.courseMetrics.topCategories.map((category, index) => (
                    <div key={category.category} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-gray-900">{category.category}</span>
                        <span className="text-sm text-gray-500 ml-2">({category.count} courses)</span>
                      </div>
                      <span className="font-semibold">₹{category.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ambassador Analytics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ambassador Program Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-900">{analytics.ambassadorMetrics.totalAmbassadors}</p>
                  <p className="text-sm text-gray-600">Total Ambassadors</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-secondary">{analytics.ambassadorMetrics.activeAmbassadors}</p>
                  <p className="text-sm text-gray-600">Active Ambassadors</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-info">{analytics.ambassadorMetrics.totalReferrals}</p>
                  <p className="text-sm text-gray-600">Total Referrals</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-primary">{analytics.ambassadorMetrics.conversionRate}%</p>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Top Performing Ambassadors</h4>
                <div className="space-y-3">
                  {analytics.ambassadorMetrics.topPerformers.map((performer, index) => (
                    <div key={performer.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-info text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-900">{performer.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{performer.earnings.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{performer.referrals} referrals</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Failed to load analytics data</p>
            <button
              onClick={fetchAnalytics}
              className="mt-4 bg-info text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
