'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/clientAuth';

interface CourseContent {
  id: string;
  title: string;
  description: string;
  content: {
    syllabus: string[];
    prerequisites: string[];
    learningOutcomes: string[];
  };
  media: {
    thumbnail?: string;
    trailer?: string;
  };
  enrollment: {
    enrolledAt: string;
    progress: number;
    status: string;
  };
}

export default function LearnCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<CourseContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [currentLesson, setCurrentLesson] = useState(0);

  useEffect(() => {
    const fetchCourseContent = async () => {
      try {
        // Get current user
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (!currentUser || currentUser.role !== 'student') {
          router.push('/auth/login');
          return;
        }

        // Fetch enrolled course content
        const response = await fetch(`/api/courses/${courseId}/student-content`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('You are not enrolled in this course');
          }
          throw new Error('Failed to load course content');
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
      fetchCourseContent();
    }
  }, [courseId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push(`/courses/${courseId}`)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Course
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push(`/courses/${courseId}`)}
                className="text-gray-600 hover:text-gray-900 mr-4"
              >
                ← Back to Course
              </button>
              <h1 className="text-xl font-semibold text-gray-900">{course.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Progress: {course.enrollment.progress}%
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${course.enrollment.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Course Content */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Content</h2>
              <div className="space-y-2">
                {course.content.syllabus.map((lesson, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentLesson(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentLesson === index
                        ? 'bg-blue-100 text-blue-900 border-l-4 border-blue-600'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{lesson}</div>
                      </div>
                      {currentLesson === index && (
                        <div className="text-blue-600">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Lesson {currentLesson + 1}: {course.content.syllabus[currentLesson]}
                </h2>
                <p className="text-gray-600">
                  Learn about {course.content.syllabus[currentLesson].toLowerCase()}
                </p>
              </div>

              {/* Video Player Area */}
              <div className="mb-8">
                {course.media?.trailer || courseId === 'ebaf51cc-8670-478c-b635-06d041e3eb6d' ? (
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      controls
                      className="w-full h-full"
                      poster={course.media?.thumbnail || 'https://wgpbedflbhbjcbdt.supabase.co/storage/v1/object/public/courses/thumbnails/17615666909-j20wjfwp3.jpg'}
                    >
                      <source 
                        src={course.media?.trailer || 'https://wgpbedflbhbjcbdt.supabase.co/storage/v1/object/public/courses/trailers/17615674708-5rcbc4tmx.mp4'} 
                        type="video/mp4" 
                      />
                      <source 
                        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" 
                        type="video/mp4" 
                      />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-gray-400 text-6xl mb-4">📹</div>
                      <p className="text-gray-600">Video content coming soon</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Lesson Content */}
              <div className="prose max-w-none">
                <h3>About this lesson</h3>
                <p>
                  In this lesson, you'll learn about {course.content.syllabus[currentLesson].toLowerCase()}. 
                  This is an important topic that will help you understand the fundamentals of the course material.
                </p>
                
                <h4>Key Learning Points:</h4>
                <ul>
                  {course.content.learningOutcomes.map((outcome, index) => (
                    <li key={index}>{outcome}</li>
                  ))}
                </ul>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <button
                  onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))}
                  disabled={currentLesson === 0}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous Lesson
                </button>
                
                <div className="text-sm text-gray-600">
                  {currentLesson + 1} of {course.content.syllabus.length} lessons
                </div>
                
                <button
                  onClick={() => setCurrentLesson(Math.min(course.content.syllabus.length - 1, currentLesson + 1))}
                  disabled={currentLesson === course.content.syllabus.length - 1}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Lesson →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
