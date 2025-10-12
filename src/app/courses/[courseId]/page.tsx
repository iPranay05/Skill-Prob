'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Course } from '@/models/Course';
import { getCurrentUser } from '@/lib/clientAuth';

interface CourseDetailPageProps {
  // Props can be added here if needed in the future
}

export default function CourseDetailPage({}: CourseDetailPageProps) {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [enrolling, setEnrolling] = useState(false);

  const courseId = params.courseId as string;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        // Fetch course details
        const response = await fetch(`/api/courses/${courseId}`);
        if (!response.ok) {
          throw new Error('Course not found');
        }
        
        const data = await response.json();
        setCourse(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const handleEnroll = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setEnrolling(true);
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          courseId: courseId,
          paymentMethod: 'stripe' // Default to Stripe
        })
      });

      if (!response.ok) {
        throw new Error('Enrollment failed');
      }

      const data = await response.json();
      
      // Redirect to payment if needed
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        // Direct enrollment success
        router.push('/student/courses');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || user.role !== 'mentor') return;

    try {
      // Get presigned URL
      const response = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          courseId: courseId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, fileUrl } = await response.json();

      // Upload file to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('File upload failed');
      }

      alert('File uploaded successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'File upload failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/courses')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Course not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <p className="text-gray-600 mb-4">{course.description}</p>
              
              <div className="flex flex-wrap gap-4 mb-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {course.category}
                </span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  {course.level}
                </span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                  {course.duration} hours
                </span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="text-2xl font-bold text-green-600">
                  ${course.price}
                </div>
                {course.originalPrice && course.originalPrice > course.price && (
                  <div className="text-lg text-gray-500 line-through">
                    ${course.originalPrice}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                {user?.role === 'student' && (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                )}
                
                {user?.role === 'mentor' && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => router.push(`/mentor/courses/${courseId}/content`)}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                    >
                      Manage Content
                    </button>
                    <div>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mp3"
                      />
                      <label
                        htmlFor="file-upload"
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 cursor-pointer inline-block"
                      >
                        Upload Content
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:w-96">
              <div className="bg-gray-100 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Course Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Instructor:</span>
                    <span className="font-medium">{course.mentorName || 'TBD'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Students:</span>
                    <span className="font-medium">{course.enrolledCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Language:</span>
                    <span className="font-medium">English</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">
                      {new Date(course.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Course Content</h2>
          
          {course.content && course.content.length > 0 ? (
            <div className="space-y-4">
              {course.content.map((item: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                  {item.fileUrl && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                    >
                      View Content →
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No content available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}