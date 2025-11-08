'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Course, CourseStatus, CourseType } from '../../../models/Course';

export default function MentorCourses() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');

  useEffect(() => {
    fetchCourses();
  }, [filter]);

  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/mentor/courses?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch courses');
      }

      const result = await response.json();
      setCourses(result.data.courses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: CourseStatus) => {
    const statusClasses = {
      [CourseStatus.DRAFT]: 'bg-yellow-100 text-yellow-800',
      [CourseStatus.PUBLISHED]: 'bg-green-100 text-green-800',
      [CourseStatus.ARCHIVED]: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type: CourseType) => {
    const typeClasses = {
      [CourseType.LIVE]: 'bg-red-100 text-red-800',
      [CourseType.RECORDED]: 'bg-blue-100 text-blue-800',
      [CourseType.HYBRID]: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeClasses[type]}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const handlePublishCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to publish course');
      }

      // Refresh courses list
      fetchCourses();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to publish course');
    }
  };

  const handleArchiveCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to archive this course?')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${courseId}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to archive course');
      }

      // Refresh courses list
      fetchCourses();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to archive course');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-error mb-4">{error}</p>
          <button 
            onClick={fetchCourses}
            className="bg-info text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-600 mt-2">Manage your courses and track their performance</p>
          </div>
          <Link
            href="/mentor/courses/create"
            className="bg-info text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Create New Course
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex space-x-4">
            {['all', 'draft', 'published', 'archived'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === status
                    ? 'bg-info text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first course.</p>
            <div className="mt-6">
              <Link
                href="/mentor/courses/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-info hover:bg-blue-700"
              >
                Create Course
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Course Thumbnail */}
                <div className="h-48 bg-gray-200 relative">
                  {course.media?.thumbnail ? (
                    <img
                      src={course.media.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex space-x-2">
                    {getStatusBadge(course.status)}
                    {getTypeBadge(course.type)}
                  </div>
                </div>

                {/* Course Info */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {course.short_description || course.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Category:</span> {course.category}
                    </div>
                    <div className="text-lg font-bold text-info">
                      ₹{course.pricing.amount || 0}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div>
                      <span className="font-medium">Enrolled:</span> {course.enrollment?.currentEnrollment || 0}
                      {course.enrollment?.maxStudents && ` / ${course.enrollment.maxStudents}`}
                    </div>
                    <div>
                      <span className="font-medium">Rating:</span> {course.ratings?.average?.toFixed(1) || 'N/A'} ⭐
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Link
                      href={`/mentor/courses/${course.id}/edit`}
                      className="flex-1 bg-gray-100 text-gray-700 text-center py-2 px-3 rounded-md hover:bg-gray-200 text-sm font-medium"
                    >
                      Edit
                    </Link>
                    
                    {course.status === CourseStatus.DRAFT && (
                      <button
                        onClick={() => handlePublishCourse(course.id!)}
                        className="flex-1 bg-secondary text-white py-2 px-3 rounded-md hover:bg-green-700 text-sm font-medium"
                      >
                        Publish
                      </button>
                    )}
                    
                    {course.status === CourseStatus.PUBLISHED && (
                      <button
                        onClick={() => handleArchiveCourse(course.id!)}
                        className="flex-1 bg-error text-white py-2 px-3 rounded-md hover:bg-red-700 text-sm font-medium"
                      >
                        Archive
                      </button>
                    )}

                    <Link
                      href={`/mentor/courses/${course.id}/analytics`}
                      className="flex-1 bg-info text-white text-center py-2 px-3 rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                      Analytics
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
