'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/clientAuth';

interface Course {
  id: string;
  title: string;
  description: string;
  mentorId: string;
  mentorName: string;
  category: string;
  type: 'live' | 'recorded' | 'hybrid';
  pricing: {
    amount: number;
    currency: string;
    subscriptionType: string;
  };
  enrollment: {
    maxStudents?: number;
    currentEnrollment: number;
  };
  status: 'draft' | 'published' | 'archived' | 'pending_review';
  ratings: {
    average: number;
    count: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);

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
        await fetchCourses();
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router, filter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/courses?filter=${filter}&search=${searchTerm}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setCourses(result.data);
      } else {
        // Mock data if API doesn't exist yet
        setCourses([
          {
            id: '1',
            title: 'Complete Web Development Bootcamp',
            description: 'Learn full-stack web development from scratch',
            mentorId: 'mentor1',
            mentorName: 'John Smith',
            category: 'Programming',
            type: 'live',
            pricing: { amount: 4999, currency: 'INR', subscriptionType: 'one-time' },
            enrollment: { maxStudents: 50, currentEnrollment: 35 },
            status: 'published',
            ratings: { average: 4.8, count: 124 },
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-12-01T14:20:00Z'
          },
          {
            id: '2',
            title: 'Data Science with Python',
            description: 'Master data science concepts and Python programming',
            mentorId: 'mentor2',
            mentorName: 'Jane Doe',
            category: 'Data Science',
            type: 'recorded',
            pricing: { amount: 3999, currency: 'INR', subscriptionType: 'one-time' },
            enrollment: { currentEnrollment: 89 },
            status: 'published',
            ratings: { average: 4.6, count: 67 },
            createdAt: '2024-02-20T09:15:00Z',
            updatedAt: '2024-11-28T16:45:00Z'
          },
          {
            id: '3',
            title: 'Digital Marketing Masterclass',
            description: 'Complete guide to digital marketing strategies',
            mentorId: 'mentor3',
            mentorName: 'Mike Johnson',
            category: 'Marketing',
            type: 'hybrid',
            pricing: { amount: 2999, currency: 'INR', subscriptionType: 'monthly' },
            enrollment: { maxStudents: 100, currentEnrollment: 23 },
            status: 'pending_review',
            ratings: { average: 0, count: 0 },
            createdAt: '2024-12-10T11:30:00Z',
            updatedAt: '2024-12-15T08:20:00Z'
          },
          {
            id: '4',
            title: 'Mobile App Development',
            description: 'Build iOS and Android apps with React Native',
            mentorId: 'mentor4',
            mentorName: 'Sarah Wilson',
            category: 'Programming',
            type: 'live',
            pricing: { amount: 5999, currency: 'INR', subscriptionType: 'one-time' },
            enrollment: { maxStudents: 30, currentEnrollment: 12 },
            status: 'draft',
            ratings: { average: 0, count: 0 },
            createdAt: '2024-12-05T15:45:00Z',
            updatedAt: '2024-12-18T10:30:00Z'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseAction = async (courseId: string, action: 'approve' | 'reject' | 'archive' | 'publish') => {
    if (!confirm(`Are you sure you want to ${action} this course?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        alert(`Course ${action}d successfully!`);
        fetchCourses();
      } else {
        alert(`Failed to ${action} course`);
      }
    } catch (error) {
      alert(`Error ${action}ing course`);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesFilter = filter === 'all' || course.status === filter || course.category.toLowerCase() === filter;
    const matchesSearch = searchTerm === '' || 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.mentorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
          <p className="mt-2 text-gray-600">Review and manage all courses on your platform</p>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex space-x-2 overflow-x-auto">
            {[
              { key: 'all', label: 'All Courses' },
              { key: 'published', label: 'Published' },
              { key: 'pending_review', label: 'Pending Review' },
              { key: 'draft', label: 'Draft' },
              { key: 'archived', label: 'Archived' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  filter === key
                    ? 'bg-info text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Courses Grid */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Courses ({filteredCourses.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No courses found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredCourses.map((course) => (
                <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      course.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : course.status === 'pending_review'
                        ? 'bg-yellow-100 text-yellow-800'
                        : course.status === 'draft'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {course.status.replace('_', ' ')}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      course.type === 'live'
                        ? 'bg-blue-100 text-blue-800'
                        : course.type === 'recorded'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {course.type}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex justify-between">
                      <span>Mentor:</span>
                      <span className="font-medium">{course.mentorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Category:</span>
                      <span className="font-medium">{course.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-medium">₹{course.pricing.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Enrolled:</span>
                      <span className="font-medium">
                        {course.enrollment.currentEnrollment}
                        {course.enrollment.maxStudents && `/${course.enrollment.maxStudents}`}
                      </span>
                    </div>
                    {course.ratings.count > 0 && (
                      <div className="flex justify-between">
                        <span>Rating:</span>
                        <span className="font-medium">
                          ⭐ {course.ratings.average}/5 ({course.ratings.count})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCourse(course);
                          setShowCourseModal(true);
                        }}
                        className="flex-1 bg-info text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                      >
                        View Details
                      </button>
                      
                      {course.status === 'pending_review' && (
                        <>
                          <button
                            onClick={() => handleCourseAction(course.id, 'approve')}
                            className="bg-secondary text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleCourseAction(course.id, 'reject')}
                            className="bg-error text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      
                      {course.status === 'published' && (
                        <button
                          onClick={() => handleCourseAction(course.id, 'archive')}
                          className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Course Details Modal */}
        {showCourseModal && selectedCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Course Details - {selectedCourse.title}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCourseModal(false);
                      setSelectedCourse(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Course Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Course Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Title:</span>
                      <p className="text-gray-900">{selectedCourse.title}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Category:</span>
                      <p className="text-gray-900">{selectedCourse.category}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <p className="text-gray-900 capitalize">{selectedCourse.type}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <p className="text-gray-900 capitalize">{selectedCourse.status.replace('_', ' ')}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">Description:</span>
                      <p className="text-gray-900">{selectedCourse.description}</p>
                    </div>
                  </div>
                </div>

                {/* Mentor Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Mentor Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Mentor Name:</span>
                      <p className="text-gray-900">{selectedCourse.mentorName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Mentor ID:</span>
                      <p className="text-gray-900 font-mono text-xs">{selectedCourse.mentorId}</p>
                    </div>
                  </div>
                </div>

                {/* Pricing & Enrollment */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Pricing & Enrollment</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Price:</span>
                      <p className="text-gray-900">₹{selectedCourse.pricing.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Subscription Type:</span>
                      <p className="text-gray-900 capitalize">{selectedCourse.pricing.subscriptionType.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Current Enrollment:</span>
                      <p className="text-gray-900">{selectedCourse.enrollment.currentEnrollment}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Max Students:</span>
                      <p className="text-gray-900">{selectedCourse.enrollment.maxStudents || 'Unlimited'}</p>
                    </div>
                  </div>
                </div>

                {/* Ratings */}
                {selectedCourse.ratings.count > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Ratings & Reviews</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Average Rating:</span>
                        <p className="text-gray-900">⭐ {selectedCourse.ratings.average}/5</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Total Reviews:</span>
                        <p className="text-gray-900">{selectedCourse.ratings.count}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Timeline</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Created:</span>
                      <p className="text-gray-900">{new Date(selectedCourse.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Updated:</span>
                      <p className="text-gray-900">{new Date(selectedCourse.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Actions</h3>
                  <div className="flex space-x-3">
                    {selectedCourse.status === 'pending_review' && (
                      <>
                        <button
                          onClick={() => {
                            handleCourseAction(selectedCourse.id, 'approve');
                            setShowCourseModal(false);
                          }}
                          className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                          Approve Course
                        </button>
                        <button
                          onClick={() => {
                            handleCourseAction(selectedCourse.id, 'reject');
                            setShowCourseModal(false);
                          }}
                          className="bg-error text-white px-4 py-2 rounded-lg hover:bg-red-700"
                        >
                          Reject Course
                        </button>
                      </>
                    )}
                    
                    {selectedCourse.status === 'published' && (
                      <button
                        onClick={() => {
                          handleCourseAction(selectedCourse.id, 'archive');
                          setShowCourseModal(false);
                        }}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                      >
                        Archive Course
                      </button>
                    )}
                    
                    <button
                      onClick={() => setShowCourseModal(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}