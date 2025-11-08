'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
  totalCourses: number;
  activeSessions: number;
  upcomingSessions: number;
  completedSessions: number;
}

interface UpcomingSession {
  id: string;
  title: string;
  courseTitle: string;
  scheduledStartTime: string;
  status: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    activeSessions: 0,
    upcomingSessions: 0,
    completedSessions: 0,
  });
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // Fetch user profile
      const profileResponse = await fetch('/api/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const role = profileData.data.role;
        setUserRole(role);
        setUserName(profileData.data.profile?.firstName || profileData.data.email.split('@')[0]);
        
        // Redirect ambassadors to their specific dashboard
        if (role === 'ambassador') {
          window.location.href = '/ambassador/dashboard';
          return;
        }
      }

      // For now, set some mock data
      // In a real implementation, you would fetch actual dashboard statistics
      setStats({
        totalCourses: 5,
        activeSessions: 2,
        upcomingSessions: 3,
        completedSessions: 12,
      });

      setUpcomingSessions([
        {
          id: '1',
          title: 'Introduction to React Hooks',
          courseTitle: 'Advanced React Development',
          scheduledStartTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          status: 'scheduled',
        },
        {
          id: '2',
          title: 'Database Design Principles',
          courseTitle: 'Full Stack Development',
          scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
          status: 'scheduled',
        },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeUntilSession = (dateString: string) => {
    const now = new Date();
    const sessionTime = new Date(dateString);
    const diffMs = sessionTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `in ${diffHours}h ${diffMinutes}m`;
    } else if (diffMinutes > 0) {
      return `in ${diffMinutes}m`;
    } else {
      return 'starting soon';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto"></div>
            </div>
            <p className="mt-6 text-xl font-semibold text-black">Loading your dashboard...</p>
            <p className="mt-2 text-gray-600">Preparing your learning journey</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl mb-8 p-8 bg-primary">
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  {getGreeting()}, {userName}!
                </h1>
                <p className="text-xl text-white mb-4" style={{ opacity: 0.9 }}>
                  Ready to continue your learning adventure?
                </p>
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 px-4 py-2 rounded-xl">
                    <span className="text-white font-semibold capitalize">{userRole}</span>
                  </div>
                  <div className="bg-white/20 px-4 py-2 rounded-xl">
                    <span className="text-white font-semibold">{stats.completedSessions} Sessions Completed</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-6xl">🚀</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 opacity-10 bg-primary"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-primary">
                  <span className="text-white text-xl">📚</span>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-black">{stats.totalCourses}</p>
                  <p className="text-sm font-semibold" style={{ color: '#5e17eb' }}>+2 this month</p>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-black mb-1">Total Courses</h3>
              <p className="text-gray-600 text-sm">Enrolled courses</p>
            </div>
          </div>

          <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:border-green-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full -mr-10 -mt-10 opacity-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">🎥</span>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{stats.activeSessions}</p>
                  <div className="flex items-center justify-end">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1"></div>
                    <p className="text-sm text-secondary font-semibold">Live now</p>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Active Sessions</h3>
              <p className="text-gray-500 text-sm">Currently running</p>
            </div>
          </div>

          <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:border-yellow-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full -mr-10 -mt-10 opacity-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">⏰</span>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{stats.upcomingSessions}</p>
                  <p className="text-sm text-accent font-semibold">Next in 2h</p>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Upcoming Sessions</h3>
              <p className="text-gray-500 text-sm">Scheduled sessions</p>
            </div>
          </div>

          <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:border-purple-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full -mr-10 -mt-10 opacity-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">✅</span>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{stats.completedSessions}</p>
                  <p className="text-sm text-primary font-semibold">85% completion</p>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Completed Sessions</h3>
              <p className="text-gray-500 text-sm">Finished sessions</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Sessions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">📅</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">Upcoming Live Sessions</h2>
                  </div>
                  <Link
                    href="/live-sessions"
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors backdrop-blur-sm"
                  >
                    View all →
                  </Link>
                </div>
              </div>

              {upcomingSessions.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">📺</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No upcoming sessions</h3>
                  <p className="text-gray-500 mb-6">Join live sessions to interact with mentors and peers in real-time</p>
                  <Link
                    href="/live-sessions"
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                  >
                    Browse Sessions
                  </Link>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {upcomingSessions.map((session, index) => (
                    <div key={session.id} className="group bg-gradient-to-r from-gray-50 to-indigo-50 rounded-2xl p-6 hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 border border-gray-100 hover:border-indigo-200 hover:shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                              <span className="text-white font-bold">{index + 1}</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{session.title}</h3>
                              <p className="text-sm text-gray-600 font-medium">{session.courseTitle}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6 text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-indigo-500">📅</span>
                              <span className="text-gray-700 font-medium">{formatDateTime(session.scheduledStartTime)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-accent-light">⏰</span>
                              <span className="text-accent font-semibold">
                                {getTimeUntilSession(session.scheduledStartTime)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                            ✅ {session.status}
                          </span>
                          <Link
                            href={`/live-sessions/${session.id}`}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                          >
                            Join →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-teal-600 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">⚡</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">Quick Actions</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <Link
                  href="/live-sessions"
                  className="group flex items-center p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 border border-blue-100 hover:border-blue-200 hover:shadow-lg"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-white text-xl">🎥</span>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-lg font-bold text-gray-900 group-hover:text-info transition-colors">Join Live Session</p>
                    <p className="text-sm text-gray-600">Access your live classes</p>
                  </div>
                  <span className="text-info group-hover:translate-x-1 transition-transform">→</span>
                </Link>

                <Link
                  href="/courses"
                  className="group flex items-center p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 border border-green-100 hover:border-green-200 hover:shadow-lg"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-white text-xl">📚</span>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-lg font-bold text-gray-900 group-hover:text-secondary transition-colors">Browse Courses</p>
                    <p className="text-sm text-gray-600">Explore available courses</p>
                  </div>
                  <span className="text-secondary-light group-hover:translate-x-1 transition-transform">→</span>
                </Link>

                {userRole === 'mentor' && (
                  <Link
                    href="/live-sessions/create"
                    className="group flex items-center p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 border border-purple-100 hover:border-purple-200 hover:shadow-lg"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span className="text-white text-xl">➕</span>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">Create Session</p>
                      <p className="text-sm text-gray-600">Schedule a new live session</p>
                    </div>
                    <span className="text-primary-light group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                )}

                {userRole === 'student' && (
                  <Link
                    href="/ambassador/apply"
                    className="group flex items-center p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 transition-all duration-300 border border-amber-100 hover:border-amber-200 hover:shadow-lg"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span className="text-white text-xl">🤝</span>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors">Become Ambassador</p>
                      <p className="text-sm text-gray-600">Earn by referring friends</p>
                    </div>
                    <span className="text-amber-500 group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">📊</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-4 p-3 rounded-xl bg-green-50 border border-green-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm">✅</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Completed "Advanced React Patterns" session</p>
                      <p className="text-xs text-gray-500 mt-1">🕐 2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm">📚</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Joined "Database Design" course</p>
                      <p className="text-xs text-gray-500 mt-1">🕐 1 day ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 p-3 rounded-xl bg-yellow-50 border border-yellow-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm">📝</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Submitted assignment for "Full Stack Development"</p>
                      <p className="text-xs text-gray-500 mt-1">🕐 3 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


