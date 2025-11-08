'use client';

import { useState, useEffect } from 'react';
import { RealTimeAnalytics } from './RealTimeAnalytics';
import { RealTimeNotifications } from './RealTimeNotifications';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  studentsCount: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  revenue: number;
}

interface LiveSession {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  scheduledAt: Date;
  duration: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  attendees: number;
  maxAttendees: number;
}

interface MentorDashboardProps {
  mentorId: string;
  mentorProfile: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

export function MentorDashboard({ mentorId, mentorProfile }: MentorDashboardProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'sessions' | 'analytics'>('overview');

  useEffect(() => {
    fetchMentorData();
  }, []);

  const fetchMentorData = async () => {
    try {
      const [coursesRes, sessionsRes] = await Promise.all([
        fetch(`/api/mentor/${mentorId}/courses`),
        fetch(`/api/mentor/${mentorId}/sessions`)
      ]);

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.courses || []);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setLiveSessions(sessionsData.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching mentor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    // Navigate to course creation page
    window.location.href = '/mentor/courses/create';
  };

  const handleScheduleSession = () => {
    // Navigate to session scheduling page
    window.location.href = '/live-sessions/create';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
      case 'live':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const CourseCard = ({ course }: { course: Course }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(course.status)}`}>
          {course.status}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{course.studentsCount}</div>
          <div className="text-xs text-gray-500">Students</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">₹{course.price.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Price</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-secondary">₹{course.revenue.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Revenue</div>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button className="flex-1 px-3 py-2 text-sm bg-info text-white rounded-lg hover:bg-blue-700 transition-colors">
          Edit Course
        </button>
        <button className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          View Details
        </button>
      </div>
    </div>
  );

  const SessionCard = ({ session }: { session: LiveSession }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{session.title}</h3>
          <p className="text-sm text-gray-600">{session.courseName}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(session.status)}`}>
          {session.status}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <span className="mr-2">📅</span>
          {new Date(session.scheduledAt).toLocaleDateString()}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <span className="mr-2">⏰</span>
          {new Date(session.scheduledAt).toLocaleTimeString()} ({session.duration} min)
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <span className="mr-2">👥</span>
          {session.attendees}/{session.maxAttendees} attendees
        </div>
      </div>
      
      <div className="flex space-x-2">
        {session.status === 'scheduled' && (
          <button className="flex-1 px-3 py-2 text-sm bg-secondary text-white rounded-lg hover:bg-green-700 transition-colors">
            Start Session
          </button>
        )}
        {session.status === 'live' && (
          <button className="flex-1 px-3 py-2 text-sm bg-error text-white rounded-lg hover:bg-red-700 transition-colors">
            End Session
          </button>
        )}
        <button className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          Manage
        </button>
      </div>
    </div>
  );

  const OverviewTab = () => {
    const totalStudents = courses.reduce((sum, course) => sum + course.studentsCount, 0);
    const totalRevenue = courses.reduce((sum, course) => sum + course.revenue, 0);
    const activeCourses = courses.filter(course => course.status === 'published').length;
    const upcomingSessions = liveSessions.filter(session => session.status === 'scheduled').length;

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-info text-xl">👥</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900">{activeCourses}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-secondary text-xl">📚</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-primary text-xl">💰</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingSessions}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-accent text-xl">🎥</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={handleCreateCourse}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl">➕</span>
              <div className="text-left">
                <div className="font-medium text-gray-900">Create Course</div>
                <div className="text-sm text-gray-600">Add a new course</div>
              </div>
            </button>
            
            <button
              onClick={handleScheduleSession}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl">📅</span>
              <div className="text-left">
                <div className="font-medium text-gray-900">Schedule Session</div>
                <div className="text-sm text-gray-600">Plan a live class</div>
              </div>
            </button>
            
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl">📊</span>
              <div className="text-left">
                <div className="font-medium text-gray-900">View Analytics</div>
                <div className="text-sm text-gray-600">Check performance</div>
              </div>
            </button>
            
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl">💬</span>
              <div className="text-left">
                <div className="font-medium text-gray-900">Messages</div>
                <div className="text-sm text-gray-600">Student inquiries</div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Courses */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Courses</h3>
            <button
              onClick={() => setActiveTab('courses')}
              className="text-sm text-info hover:text-blue-800"
            >
              View All
            </button>
          </div>
          
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h4>
              <p className="text-gray-600 mb-4">Create your first course to start teaching</p>
              <button
                onClick={handleCreateCourse}
                className="px-4 py-2 bg-info text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.slice(0, 3).map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const CoursesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">My Courses</h2>
        <button
          onClick={handleCreateCourse}
          className="px-4 py-2 bg-info text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Course
        </button>
      </div>
      
      {courses.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📚</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-600 mb-4">Create your first course to start teaching</p>
          <button
            onClick={handleCreateCourse}
            className="px-4 py-2 bg-info text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );

  const SessionsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Live Sessions</h2>
        <button
          onClick={handleScheduleSession}
          className="px-4 py-2 bg-info text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Schedule Session
        </button>
      </div>
      
      {liveSessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎥</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions scheduled</h3>
          <p className="text-gray-600 mb-4">Schedule your first live session</p>
          <button
            onClick={handleScheduleSession}
            className="px-4 py-2 bg-info text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Schedule Session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveSessions.map(session => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Mentor Dashboard 👨‍🏫
              </h1>
              <p className="text-gray-600 mt-1">Welcome back, {mentorProfile.firstName}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <RealTimeNotifications />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'courses', label: 'Courses', icon: '📚' },
            { id: 'sessions', label: 'Live Sessions', icon: '🎥' },
            { id: 'analytics', label: 'Analytics', icon: '📈' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-info text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'courses' && <CoursesTab />}
            {activeTab === 'sessions' && <SessionsTab />}
            {activeTab === 'analytics' && (
              <RealTimeAnalytics userRole="mentor" />
            )}
          </>
        )}
      </div>
    </div>
  );
}
