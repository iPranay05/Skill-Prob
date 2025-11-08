'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MentorStats {
  totalCourses: number;
  totalStudents: number;
  activeSessions: number;
  upcomingSessions: number;
  completedSessions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
}

interface RecentActivity {
  id: string;
  type: 'session_completed' | 'new_enrollment' | 'question_asked' | 'course_created';
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

interface UpcomingSession {
  id: string;
  title: string;
  courseTitle: string;
  scheduledStartTime: string;
  participantCount: number;
  maxParticipants: number;
}

export default function MentorDashboardPage() {
  const [stats, setStats] = useState<MentorStats>({
    totalCourses: 0,
    totalStudents: 0,
    activeSessions: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    averageRating: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [mentorName, setMentorName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentorData();
  }, []);

  const fetchMentorData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // Fetch mentor profile
      const profileResponse = await fetch('/api/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setMentorName(profileData.data.profile?.firstName || profileData.data.email.split('@')[0]);
      }

      // Fetch mentor stats
      const statsResponse = await fetch('/api/mentor/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Fetch upcoming sessions
      const sessionsResponse = await fetch('/api/live-sessions?status=scheduled&limit=5', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setUpcomingSessions(sessionsData.data || []);
      }

      // Fetch recent activity
      const activityResponse = await fetch('/api/mentor/activity?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData.data || []);
      }
    } catch (error) {
      console.error('Error fetching mentor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-violet-600 rounded-full animate-spin mx-auto" style={{ className="border-t-primary" }}></div>
            <p className="mt-4 text-black">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header - Professional & Clean */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-black mb-2">
                  Instructor Dashboard
                </h1>
                <p className="text-gray-600 text-base leading-relaxed">
                  Welcome back, {mentorName}. Here's your teaching overview and performance metrics.
                </p>
              </div>
              <div className="flex items-center gap-12">
                <div className="text-center">
                  <div className="text-2xl font-bold text-black mb-1">{stats.averageRating}</div>
                  <div className="text-sm font-medium text-gray-600 mb-2">Instructor Rating</div>
                  <div className="flex items-center justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-4 h-4 ${i < Math.floor(stats.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <div className="h-12 w-px bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-black mb-1">{stats.totalStudents}</div>
                  <div className="text-sm font-medium text-gray-600">Total Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1" style={{ color: '#5e17eb' }}>{formatCurrency(stats.monthlyRevenue)}</div>
                  <div className="text-sm font-medium text-gray-600">Monthly Revenue</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Consistent & Professional */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f3f0ff' }}>
                <svg className="w-6 h-6" style={{ color: '#5e17eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-white px-2 py-1 rounded-md" style={{ className="bg-primary" }}>+2</span>
            </div>
            <div className="text-3xl font-bold text-black mb-1">{stats.totalCourses}</div>
            <div className="text-sm font-medium text-gray-600">Total Courses</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f3f0ff' }}>
                <svg className="w-6 h-6" style={{ color: '#5e17eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-white px-2 py-1 rounded-md" style={{ className="bg-primary" }}>+15</span>
            </div>
            <div className="text-3xl font-bold text-black mb-1">{stats.totalStudents}</div>
            <div className="text-sm font-medium text-gray-600">Total Students</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f3f0ff' }}>
                <svg className="w-6 h-6" style={{ color: '#5e17eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-white px-2 py-1 rounded-md" style={{ className="bg-primary" }}>Live</span>
            </div>
            <div className="text-3xl font-bold text-black mb-1">{stats.activeSessions}</div>
            <div className="text-sm font-medium text-gray-600">Active Sessions</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f3f0ff' }}>
                <svg className="w-6 h-6" style={{ color: '#5e17eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-white px-2 py-1 rounded-md" style={{ className="bg-primary" }}>+12%</span>
            </div>
            <div className="text-2xl font-bold text-black mb-1">{formatCurrency(stats.monthlyRevenue)}</div>
            <div className="text-sm font-medium text-gray-600">Monthly Revenue</div>
          </div>
        </div>

        {/* Course Management Section */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-black mb-1">Course Management</h2>
                  <p className="text-sm text-gray-600">Create and manage your courses</p>
                </div>
                <Link
                  href="/mentor/courses/create"
                  className="text-white px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-md"
                  style={{ className="bg-primary" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4c14c7'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5e17eb'}
                >
                  Create Course
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/mentor/courses"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4" style={{ backgroundColor: '#f3f0ff' }}>
                    <svg className="w-5 h-5" style={{ color: '#5e17eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">My Courses</h3>
                    <p className="text-sm text-gray-600">View and manage all courses</p>
                  </div>
                </Link>

                <Link
                  href="/mentor/courses/create"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors duration-200"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 bg-green-100">
                    <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Create Course</h3>
                    <p className="text-sm text-gray-600">Add a new course with videos</p>
                  </div>
                </Link>

                <Link
                  href="/mentor/analytics"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors duration-200"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 bg-purple-100">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Analytics</h3>
                    <p className="text-sm text-gray-600">Track course performance</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Sessions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-black mb-1">Upcoming Sessions</h2>
                    <p className="text-sm text-gray-600">Manage and track your live sessions</p>
                  </div>
                  <Link
                    href="/live-sessions/create"
                    className="text-white px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-md"
                    style={{ className="bg-primary" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4c14c7'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5e17eb'}
                  >
                    Create Session
                  </Link>
                </div>
              </div>

              {upcomingSessions.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-black mb-2">No upcoming sessions</h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    Schedule your first live session to start engaging with students
                  </p>
                  <Link
                    href="/live-sessions/create"
                    className="text-white px-6 py-3 font-semibold rounded-lg transition-all duration-200 hover:shadow-md inline-block"
                    style={{ className="bg-primary" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4c14c7'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5e17eb'}
                  >
                    Create Session
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f3f0ff' }}>
                              <svg className="w-5 h-5" style={{ color: '#5e17eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-black mb-1">{session.title}</h3>
                              <p className="text-gray-600 text-sm mb-2">{session.courseTitle}</p>
                              <div className="flex items-center gap-6 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {formatDateTime(session.scheduledStartTime)}
                                </span>
                                <span className="font-medium" style={{ color: '#5e17eb' }}>
                                  {getTimeUntilSession(session.scheduledStartTime)}
                                </span>
                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium">
                                  {session.participantCount}/{session.maxParticipants} enrolled
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/live-sessions/${session.id}/manage`}
                          className="text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-150"
                          style={{ color: '#5e17eb' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f0ff'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          Manage
                        </Link>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-black mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/live-sessions/create"
                  className="flex items-center p-3 rounded-lg transition-all duration-150 group"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f0ff'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: '#f3f0ff' }}>
                    <svg className="w-5 h-5" style={{ color: '#5e17eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-semibold text-black">Create Session</p>
                    <p className="text-xs text-gray-600">Schedule a live class</p>
                  </div>
                </Link>

                <Link
                  href="/courses"
                  className="flex items-center p-3 rounded-lg transition-all duration-150 group"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f0ff'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: '#f3f0ff' }}>
                    <svg className="w-5 h-5" style={{ color: '#5e17eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-semibold text-black">Manage Courses</p>
                    <p className="text-xs text-gray-600">Edit course content</p>
                  </div>
                </Link>

                <Link
                  href="/live-sessions"
                  className="flex items-center p-3 rounded-lg transition-all duration-150 group"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f0ff'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: '#f3f0ff' }}>
                    <svg className="w-5 h-5" style={{ color: '#5e17eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-semibold text-black">View Analytics</p>
                    <p className="text-xs text-gray-600">Track performance</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-black mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2`} style={{ className="bg-primary" }}></div>
                    <div className="flex-1">
                      <p className="text-sm text-black leading-relaxed">{activity.description}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(activity.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}