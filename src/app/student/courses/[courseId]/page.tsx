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
  chapters?: Chapter[];
  progress?: {
    completion_percentage: number;
    completed_chapters: string[];
  };
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  order_index: number;
  duration_minutes: number;
  is_free: boolean;
  content?: Content[];
}

interface Content {
  id: string;
  title: string;
  type: 'video' | 'document' | 'quiz' | 'assignment';
  order_index: number;
  duration_minutes: number;
  is_free: boolean;
  completed?: boolean;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  max_attempts: number;
  passing_score: number;
  is_required: boolean;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date?: string;
  max_points: number;
  is_required: boolean;
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: {
    profile: any;
  };
  replies_count: number;
  views_count: number;
  created_at: string;
}

export default function StudentCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState('content');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [courseId, setCourseId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params;
      setCourseId(resolvedParams.courseId);
    };
    
    initializeParams();
  }, [params]);

  useEffect(() => {
    if (!courseId) return;
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Fetch course details
      const courseResponse = await fetch(`/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (courseResponse.ok) {
        const courseData = await courseResponse.json();
        setCourse(courseData.data?.course);
        if (courseData.data?.course?.chapters?.length > 0) {
          setSelectedChapter(courseData.data.course.chapters[0].id);
        }
      }

      // Fetch quizzes
      const quizzesResponse = await fetch(`/api/courses/${courseId}/quizzes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (quizzesResponse.ok) {
        const quizzesData = await quizzesResponse.json();
        setQuizzes(quizzesData.data?.quizzes || []);
      }

      // Fetch assignments
      const assignmentsResponse = await fetch(`/api/courses/${courseId}/assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        setAssignments(assignmentsData.data?.assignments || []);
      }

      // Fetch forum posts
      const forumResponse = await fetch(`/api/courses/${courseId}/forum`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (forumResponse.ok) {
        const forumData = await forumResponse.json();
        setForumPosts(forumData.data?.posts || []);
      }

    } catch (error) {
      console.error('Error fetching course data:', error);
      setError('Failed to load course data');
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥';
      case 'document': return '📄';
      case 'quiz': return '❓';
      case 'assignment': return '📝';
      default: return '📄';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-gray-200 rounded-full animate-spin mx-auto" style={{ borderTopColor: '#5e17eb' }}></div>
            </div>
            <p className="mt-6 text-xl font-semibold text-black">Loading course...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Course not found</h2>
          <p className="text-gray-600 mb-4">The course you're looking for doesn't exist or you don't have access to it.</p>
          <Link
            href="/student/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Dashboard
          </Link>
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
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <Link href="/student/dashboard" className="hover:text-indigo-600">Dashboard</Link>
                <span>›</span>
                <span>Course</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm text-gray-600">
                  {course.type === 'live' ? '🎥 Live Course' : '📹 Self-paced'}
                </span>
                <span className="text-sm text-gray-600">
                  Progress: {course.progress?.completion_percentage || 0}%
                </span>
              </div>
            </div>
            <div className="flex space-x-4">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">
                🔖 Bookmark
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">
                📝 Notes
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Course Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">Course Content</h3>
              
              {course.chapters && course.chapters.length > 0 ? (
                <div className="space-y-2">
                  {course.chapters.map((chapter, index) => (
                    <div key={chapter.id}>
                      <button
                        onClick={() => setSelectedChapter(chapter.id)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedChapter === chapter.id
                            ? 'bg-indigo-50 border border-indigo-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {index + 1}. {chapter.title}
                            </p>
                            <p className="text-xs text-gray-600">
                              {formatDuration(chapter.duration_minutes)}
                            </p>
                          </div>
                          <div className="text-green-500">
                            {course.progress?.completed_chapters?.includes(chapter.id) ? '✓' : '○'}
                          </div>
                        </div>
                      </button>
                      
                      {/* Chapter Content */}
                      {selectedChapter === chapter.id && chapter.content && (
                        <div className="ml-4 mt-2 space-y-1">
                          {chapter.content.map((content) => (
                            <div
                              key={content.id}
                              className="flex items-center justify-between p-2 text-sm hover:bg-gray-50 rounded"
                            >
                              <div className="flex items-center space-x-2">
                                <span>{getContentIcon(content.type)}</span>
                                <span className="text-gray-700">{content.title}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">
                                  {formatDuration(content.duration_minutes)}
                                </span>
                                {content.completed && (
                                  <span className="text-green-500 text-xs">✓</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No content available</p>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg shadow-sm border mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'content', label: 'Content', icon: '📚' },
                    { id: 'quizzes', label: 'Quizzes', icon: '❓' },
                    { id: 'assignments', label: 'Assignments', icon: '📝' },
                    { id: 'forum', label: 'Discussion', icon: '💬' },
                    { id: 'resources', label: 'Resources', icon: '📎' }
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
                {/* Content Tab */}
                {activeTab === 'content' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Content</h3>
                    {course.chapters && course.chapters.length > 0 ? (
                      <div className="space-y-6">
                        {course.chapters.map((chapter, index) => (
                          <div key={chapter.id} className="border rounded-lg p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900">
                                  Chapter {index + 1}: {chapter.title}
                                </h4>
                                <p className="text-gray-600 mt-1">{chapter.description}</p>
                                <p className="text-sm text-gray-500 mt-2">
                                  Duration: {formatDuration(chapter.duration_minutes)}
                                </p>
                              </div>
                              <div className="text-2xl">
                                {course.progress?.completed_chapters?.includes(chapter.id) ? '✅' : '⏳'}
                              </div>
                            </div>

                            {chapter.content && chapter.content.length > 0 && (
                              <div className="space-y-3">
                                {chapter.content.map((content) => (
                                  <div
                                    key={content.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <span className="text-2xl">{getContentIcon(content.type)}</span>
                                      <div>
                                        <h5 className="font-medium text-gray-900">{content.title}</h5>
                                        <p className="text-sm text-gray-600">
                                          {content.type} • {formatDuration(content.duration_minutes)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      {content.completed && (
                                        <span className="text-green-500">✓ Completed</span>
                                      )}
                                      <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
                                        {content.completed ? 'Review' : 'Start'}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No content available</h3>
                        <p className="text-gray-600">Content will be added by the mentor soon</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Quizzes Tab */}
                {activeTab === 'quizzes' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Quizzes</h3>
                    {quizzes.length > 0 ? (
                      <div className="space-y-4">
                        {quizzes.map((quiz) => (
                          <div key={quiz.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900">{quiz.title}</h4>
                                  {quiz.is_required && (
                                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                      Required
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 mb-4">{quiz.description}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span>🎯 Passing Score: {quiz.passing_score}%</span>
                                  <span>🔄 Max Attempts: {quiz.max_attempts}</span>
                                </div>
                              </div>
                              <div className="flex flex-col space-y-2">
                                <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
                                  Start Quiz
                                </button>
                                <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50">
                                  View Results
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">❓</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No quizzes available</h3>
                        <p className="text-gray-600">Quizzes will be added by the mentor</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Assignments Tab */}
                {activeTab === 'assignments' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Assignments</h3>
                    {assignments.length > 0 ? (
                      <div className="space-y-4">
                        {assignments.map((assignment) => (
                          <div key={assignment.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900">{assignment.title}</h4>
                                  {assignment.is_required && (
                                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                      Required
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 mb-4">{assignment.description}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span>📊 Max Points: {assignment.max_points}</span>
                                  {assignment.due_date && (
                                    <span>📅 Due: {formatDate(assignment.due_date)}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col space-y-2">
                                <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
                                  Submit
                                </button>
                                <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50">
                                  View Submission
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No assignments available</h3>
                        <p className="text-gray-600">Assignments will be added by the mentor</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Forum Tab */}
                {activeTab === 'forum' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Course Discussion</h3>
                      <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
                        New Post
                      </button>
                    </div>
                    
                    {forumPosts.length > 0 ? (
                      <div className="space-y-4">
                        {forumPosts.map((post) => (
                          <div key={post.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h4>
                                <p className="text-gray-600 mb-4 line-clamp-2">{post.content}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span>👤 {post.author.profile?.firstName || 'Anonymous'}</span>
                                  <span>💬 {post.replies_count} replies</span>
                                  <span>👁️ {post.views_count} views</span>
                                  <span>📅 {formatDate(post.created_at)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">💬</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No discussions yet</h3>
                        <p className="text-gray-600 mb-4">Start the conversation by creating the first post</p>
                        <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
                          Create First Post
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Resources Tab */}
                {activeTab === 'resources' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Resources</h3>
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📎</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources available</h3>
                      <p className="text-gray-600">Downloadable resources will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}