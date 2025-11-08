'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  description: string;
  mentor_id: string;
  type: string;
  status: string;
  pricing: {
    amount: number;
    currency: string;
  };
  media: {
    thumbnail: string;
  };
  enrollment: {
    currentEnrollment: number;
  };
  ratings: {
    average: number;
    count: number;
  };
  progress?: {
    completion_percentage: number;
    last_accessed_at: string;
  };
}

interface Certificate {
  id: string;
  course_id: string;
  certificate_number: string;
  issued_at: string;
  completion_percentage: number;
  final_score?: number;
  skills_verified?: string[];
}

interface Bookmark {
  id: string;
  course_id: string;
  title: string;
  notes?: string;
  created_at: string;
}

export default function StudentDashboard() {
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Fetch enrolled courses
      const coursesResponse = await fetch('/api/student/enrolled-courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setEnrolledCourses(coursesData.data?.courses || []);
      }

      // Fetch certificates
      const certificatesResponse = await fetch('/api/student/certificates', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (certificatesResponse.ok) {
        const certificatesData = await certificatesResponse.json();
        setCertificates(certificatesData.data?.certificates || []);
      }

      // Fetch bookmarks
      const bookmarksResponse = await fetch('/api/student/bookmarks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (bookmarksResponse.ok) {
        const bookmarksData = await bookmarksResponse.json();
        setBookmarks(bookmarksData.data?.bookmarks || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-secondary-light';
    if (percentage >= 60) return 'bg-info';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-error';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto"></div>
            </div>
            <p className="mt-6 text-xl font-semibold text-black">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
              <p className="text-gray-600">Welcome back! Continue your learning journey.</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/courses"
                className="px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl bg-primary"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'courses', label: 'My Courses', icon: '📚' },
                { id: 'certificates', label: 'Certificates', icon: '🏆' },
                { id: 'bookmarks', label: 'Bookmarks', icon: '🔖' },
                { id: 'progress', label: 'Progress', icon: '📈' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100">Enrolled Courses</p>
                        <p className="text-3xl font-bold">{enrolledCourses.length}</p>
                      </div>
                      <div className="text-4xl opacity-80">📚</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100">Certificates</p>
                        <p className="text-3xl font-bold">{certificates.length}</p>
                      </div>
                      <div className="text-4xl opacity-80">🏆</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100">Bookmarks</p>
                        <p className="text-3xl font-bold">{bookmarks.length}</p>
                      </div>
                      <div className="text-4xl opacity-80">🔖</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100">Avg Progress</p>
                        <p className="text-3xl font-bold">
                          {enrolledCourses.length > 0
                            ? Math.round(
                                enrolledCourses.reduce((acc, course) => 
                                  acc + (course.progress?.completion_percentage || 0), 0
                                ) / enrolledCourses.length
                              )
                            : 0}%
                        </p>
                      </div>
                      <div className="text-4xl opacity-80">📈</div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Continue Learning</h3>
                  {enrolledCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {enrolledCourses.slice(0, 4).map((course) => (
                        <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start space-x-4">
                            <img
                              src={course.media.thumbnail}
                              alt={course.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{course.title}</h4>
                              <p className="text-sm text-gray-600 mb-2">
                                Last accessed: {course.progress?.last_accessed_at 
                                  ? formatDate(course.progress.last_accessed_at)
                                  : 'Never'
                                }
                              </p>
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${getProgressColor(course.progress?.completion_percentage || 0)}`}
                                    style={{ width: `${course.progress?.completion_percentage || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-600">
                                  {course.progress?.completion_percentage || 0}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4">
                            <Link
                              href={`/student/courses/${course.id}`}
                              className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                            >
                              Continue Learning →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">📚</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
                      <p className="text-gray-600 mb-4">Start your learning journey by enrolling in a course</p>
                      <Link
                        href="/courses"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Browse Courses
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* My Courses Tab */}
            {activeTab === 'courses' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">My Enrolled Courses</h3>
                {enrolledCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrolledCourses.map((course) => (
                      <div key={course.id} className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        <img
                          src={course.media.thumbnail}
                          alt={course.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-6">
                          <h4 className="font-semibold text-gray-900 mb-2">{course.title}</h4>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                          
                          <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Progress</span>
                              <span>{course.progress?.completion_percentage || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getProgressColor(course.progress?.completion_percentage || 0)}`}
                                style={{ width: `${course.progress?.completion_percentage || 0}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                              {course.type === 'live' ? '🎥 Live' : '📹 Recorded'}
                            </span>
                            <Link
                              href={`/student/courses/${course.id}`}
                              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
                            >
                              Continue
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No enrolled courses</h3>
                    <p className="text-gray-600">Start learning by enrolling in your first course</p>
                  </div>
                )}
              </div>
            )}

            {/* Certificates Tab */}
            {activeTab === 'certificates' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">My Certificates</h3>
                {certificates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {certificates.map((certificate) => (
                      <div key={certificate.id} className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="text-3xl">🏆</div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Course Certificate</h4>
                              <p className="text-sm text-gray-600">#{certificate.certificate_number}</p>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(certificate.issued_at)}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Completion:</span>
                            <span className="font-medium">{certificate.completion_percentage}%</span>
                          </div>
                          {certificate.final_score && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Final Score:</span>
                              <span className="font-medium">{certificate.final_score}%</span>
                            </div>
                          )}
                        </div>

                        {certificate.skills_verified && certificate.skills_verified.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">Skills Verified:</p>
                            <div className="flex flex-wrap gap-2">
                              {certificate.skills_verified.map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-3">
                          <button className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
                            Download PDF
                          </button>
                          <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50">
                            Share
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏆</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No certificates yet</h3>
                    <p className="text-gray-600">Complete courses to earn certificates</p>
                  </div>
                )}
              </div>
            )}

            {/* Bookmarks Tab */}
            {activeTab === 'bookmarks' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">My Bookmarks</h3>
                {bookmarks.length > 0 ? (
                  <div className="space-y-4">
                    {bookmarks.map((bookmark) => (
                      <div key={bookmark.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="text-2xl">🔖</div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{bookmark.title}</h4>
                              {bookmark.notes && (
                                <p className="text-sm text-gray-600 mt-1">{bookmark.notes}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                Saved on {formatDate(bookmark.created_at)}
                              </p>
                            </div>
                          </div>
                          <button className="text-gray-400 hover:text-error">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔖</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookmarks yet</h3>
                    <p className="text-gray-600">Bookmark important content while learning</p>
                  </div>
                )}
              </div>
            )}

            {/* Progress Tab */}
            {activeTab === 'progress' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Progress</h3>
                {enrolledCourses.length > 0 ? (
                  <div className="space-y-6">
                    {enrolledCourses.map((course) => (
                      <div key={course.id} className="bg-white border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">{course.title}</h4>
                            <p className="text-sm text-gray-600">
                              Last accessed: {course.progress?.last_accessed_at 
                                ? formatDate(course.progress.last_accessed_at)
                                : 'Never'
                              }
                            </p>
                          </div>
                          <span className="text-2xl font-bold text-indigo-600">
                            {course.progress?.completion_percentage || 0}%
                          </span>
                        </div>
                        
                        <div className="mb-4">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full ${getProgressColor(course.progress?.completion_percentage || 0)}`}
                              style={{ width: `${course.progress?.completion_percentage || 0}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex space-x-4 text-sm text-gray-600">
                            <span>📚 {course.type === 'live' ? 'Live Course' : 'Self-paced'}</span>
                            <span>👥 {course.enrollment.currentEnrollment} students</span>
                          </div>
                          <Link
                            href={`/student/courses/${course.id}`}
                            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                          >
                            Continue Learning →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📈</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No progress to show</h3>
                    <p className="text-gray-600">Enroll in courses to track your progress</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


