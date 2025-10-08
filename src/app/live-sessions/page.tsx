'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LiveSession {
  id: string;
  courseId: string;
  mentorId: string;
  title: string;
  description?: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  googleMeetLink?: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  maxParticipants: number;
  chatEnabled: boolean;
  qaEnabled: boolean;
  pollingEnabled: boolean;
}

interface Course {
  id: string;
  title: string;
  mentor_name: string;
}

export default function LiveSessionsPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    fetchUserProfile();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchSessions(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserRole(data.data.role);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Courses API response:', data); // Debug log
        // The API returns { success: true, data: { courses: [...], total: ..., page: ... } }
        const coursesList = data.data?.courses || [];
        console.log('Courses list:', coursesList); // Debug log
        setCourses(coursesList);
        if (coursesList.length > 0) {
          setSelectedCourse(coursesList[0].id);
        }
      } else {
        const errorData = await response.json();
        console.error('Courses API error:', errorData);
        setError('Failed to load courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses');
    }
  };

  const fetchSessions = async (courseId: string) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/live-sessions?courseId=${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Sessions API response:', data); // Debug log
        setSessions(data.data || []);
      } else {
        const errorData = await response.json();
        console.error('Sessions API error:', errorData);
        setError(errorData.error || 'Failed to load sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isSessionLive = (session: LiveSession) => {
    const now = new Date();
    const start = new Date(session.scheduledStartTime);
    const end = new Date(session.scheduledEndTime);
    return now >= start && now <= end && session.status === 'live';
  };

  const canJoinSession = (session: LiveSession) => {
    const now = new Date();
    const start = new Date(session.scheduledStartTime);
    const end = new Date(session.scheduledEndTime);
    return (now >= start && now <= end) && (session.status === 'live' || session.status === 'scheduled');
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-gray-200 rounded-full animate-spin mx-auto" style={{ borderTopColor: '#5e17eb' }}></div>
            </div>
            <p className="mt-6 text-xl font-semibold text-black">Loading live sessions...</p>
            <p className="mt-2 text-gray-600">Preparing your interactive learning experience</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl mb-8 p-8" style={{ backgroundColor: '#5e17eb' }}>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Live Sessions
                </h1>
                <p className="text-xl text-white mb-4" style={{ opacity: 0.9 }}>
                  {userRole === 'mentor' ? 'Manage and host your interactive live sessions' : 'Join live sessions and learn with mentors in real-time'}
                </p>
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 px-4 py-2 rounded-xl">
                    <span className="text-white font-semibold">Interactive Learning</span>
                  </div>
                  <div className="bg-white/20 px-4 py-2 rounded-xl">
                    <span className="text-white font-semibold">Real-time Chat</span>
                  </div>
                </div>
              </div>
              {userRole === 'mentor' && (
                <div className="hidden lg:block">
                  <Link
                    href="/live-sessions/create"
                    className="bg-white text-black px-6 py-3 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                    style={{ color: '#5e17eb' }}
                  >
                    Create Session
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Course Selection */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#5e17eb' }}>
                <span className="text-white text-lg">📚</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-black">Select Course</h2>
                <p className="text-sm text-gray-600">Choose a course to view its live sessions</p>
              </div>
            </div>
            <select
              id="course-select"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-black font-medium"
              style={{ '--tw-ring-color': '#5e17eb' } as React.CSSProperties}
            >
              <option value="">Select a course to get started</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} {userRole === 'student' && `- ${course.mentor_name}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-400 p-6 rounded-r-2xl shadow-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">❌</span>
              </div>
              <div className="ml-3">
                <p className="text-red-800 font-semibold">Oops! Something went wrong</p>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        {selectedCourse && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4" style={{ backgroundColor: '#5e17eb' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">🎥</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Sessions for {courses.find(c => c.id === selectedCourse)?.title}
                  </h2>
                </div>
                {userRole === 'mentor' && (
                  <Link
                    href="/live-sessions/create"
                    className="bg-white text-black px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                    style={{ color: '#5e17eb' }}
                  >
                    Create Session
                  </Link>
                )}
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">📺</span>
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">No live sessions scheduled</h3>
                <p className="text-gray-600 mb-6">
                  {userRole === 'mentor'
                    ? 'Create your first live session to start engaging with students'
                    : 'No live sessions are currently scheduled for this course'}
                </p>
                {userRole === 'mentor' && (
                  <Link
                    href="/live-sessions/create"
                    className="text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                    style={{ backgroundColor: '#5e17eb' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4c14c7'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5e17eb'}
                  >
                    Create Your First Session
                  </Link>
                )}
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {sessions.map((session, index) => (
                  <div key={session.id} className="group bg-gradient-to-r from-gray-50 to-indigo-50 rounded-2xl p-6 hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 border border-gray-100 hover:border-indigo-200 hover:shadow-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 flex-wrap">
                              <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {session.title}
                              </h3>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(session.status)}`}>
                                {session.status}
                              </span>
                              {isSessionLive(session) && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 animate-pulse border border-red-200">
                                  🔴 LIVE NOW
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {session.description && (
                          <p className="text-gray-600 mb-3 ml-13">{session.description}</p>
                        )}

                        <div className="ml-13 space-y-2">
                          <div className="flex items-center space-x-6 text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-indigo-500">📅</span>
                              <span className="text-gray-700 font-medium">Start: {formatDateTime(session.scheduledStartTime)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-orange-500">⏱️</span>
                              <span className="text-gray-700 font-medium">End: {formatDateTime(session.scheduledEndTime)}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6 text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-purple-500">👥</span>
                              <span className="text-gray-700 font-medium">Max {session.maxParticipants} participants</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 text-sm">
                            {session.chatEnabled && (
                              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-green-100 text-green-700 border border-green-200">
                                💬 Chat
                              </span>
                            )}
                            {session.qaEnabled && (
                              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-blue-100 text-blue-700 border border-blue-200">
                                ❓ Q&A
                              </span>
                            )}
                            {session.pollingEnabled && (
                              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-yellow-100 text-yellow-700 border border-yellow-200">
                                📊 Polls
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-2 ml-4">
                        {userRole === 'student' && canJoinSession(session) && (
                          <Link
                            href={`/live-sessions/${session.id}`}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                          >
                            🚀 Join Session
                          </Link>
                        )}

                        {userRole === 'mentor' && (
                          <div className="flex flex-col space-y-2">
                            <Link
                              href={`/live-sessions/${session.id}/manage`}
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-center"
                            >
                              ⚙️ Manage
                            </Link>
                            {session.googleMeetLink && (
                              <a
                                href={session.googleMeetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-center"
                              >
                                📹 Google Meet
                              </a>
                            )}
                          </div>
                        )}

                        <Link
                          href={`/live-sessions/${session.id}`}
                          className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}