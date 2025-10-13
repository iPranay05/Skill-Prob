'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Chapter {
  id?: string;
  title: string;
  description: string;
  order_index: number;
  duration_minutes: number;
  is_free: boolean;
  content: Content[];
}

interface Content {
  id?: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'quiz' | 'assignment';
  order_index: number;
  content_data: {
    video_url?: string;
    document_url?: string;
    quiz_data?: any;
    assignment_data?: any;
  };
  is_free: boolean;
  duration_minutes: number;
}

interface Course {
  id: string;
  title: string;
  chapters: Chapter[];
}

export default function CourseContent({ params }: { params: Promise<{ courseId: string }> }) {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChapter, setActiveChapter] = useState<number>(0);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params;
      setCourseId(resolvedParams.courseId);
    };
    
    initializeParams();
  }, [params]);

  useEffect(() => {
    if (courseId) {
      fetchCourseContent();
    }
  }, [courseId]);

  const fetchCourseContent = async () => {
    if (!courseId) return;
    
    try {
      const response = await fetch(`/api/courses/${courseId}/content`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch course content');
      }

      const result = await response.json();
      setCourse(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addChapter = () => {
    if (!course) return;

    const newChapter: Chapter = {
      title: `Chapter ${course.chapters.length + 1}`,
      description: '',
      order_index: course.chapters.length,
      duration_minutes: 0,
      is_free: false,
      content: []
    };

    setCourse({
      ...course,
      chapters: [...course.chapters, newChapter]
    });
  };

  const updateChapter = (chapterIndex: number, updates: Partial<Chapter>) => {
    if (!course) return;

    const updatedChapters = course.chapters.map((chapter, index) =>
      index === chapterIndex ? { ...chapter, ...updates } : chapter
    );

    setCourse({
      ...course,
      chapters: updatedChapters
    });
  };

  const addContent = (chapterIndex: number, type: Content['type']) => {
    if (!course) return;

    const chapter = course.chapters[chapterIndex];
    const newContent: Content = {
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} ${chapter.content.length + 1}`,
      description: '',
      type,
      order_index: chapter.content.length,
      content_data: {},
      is_free: false,
      duration_minutes: 0
    };

    const updatedChapters = course.chapters.map((ch, index) =>
      index === chapterIndex
        ? { ...ch, content: [...ch.content, newContent] }
        : ch
    );

    setCourse({
      ...course,
      chapters: updatedChapters
    });
  };

  const updateContent = (chapterIndex: number, contentIndex: number, updates: Partial<Content>) => {
    if (!course) return;

    const updatedChapters = course.chapters.map((chapter, chIndex) =>
      chIndex === chapterIndex
        ? {
            ...chapter,
            content: chapter.content.map((content, cIndex) =>
              cIndex === contentIndex ? { ...content, ...updates } : content
            )
          }
        : chapter
    );

    setCourse({
      ...course,
      chapters: updatedChapters
    });
  };

  const handleVideoUpload = async (file: File, chapterIndex: number, contentIndex: number) => {
    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'video');

      const response = await fetch('/api/upload/course-content', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Video upload failed');
      }

      const result = await response.json();
      
      updateContent(chapterIndex, contentIndex, {
        content_data: {
          ...course!.chapters[chapterIndex].content[contentIndex].content_data,
          video_url: result.data.url
        }
      });

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Video upload failed');
    } finally {
      setUploadingVideo(false);
    }
  };

  const saveContent = async () => {
    if (!course || !courseId) return;

    try {
      const response = await fetch(`/api/courses/${courseId}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ chapters: course.chapters })
      });

      if (!response.ok) {
        throw new Error('Failed to save content');
      }

      alert('Content saved successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save content');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchCourseContent}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Course not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Content</h1>
            <p className="text-gray-600 mt-2">{course.title}</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={addChapter}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Add Chapter
            </button>
            <button
              onClick={saveContent}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Save Content
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Chapters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Chapters</h3>
              <div className="space-y-2">
                {course.chapters.map((chapter, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveChapter(index)}
                    className={`w-full text-left p-3 rounded-lg ${
                      activeChapter === index
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{chapter.title}</div>
                    <div className="text-sm text-gray-500">
                      {chapter.content.length} items • {chapter.duration_minutes}min
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chapter Content */}
          <div className="lg:col-span-3">
            {course.chapters[activeChapter] && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chapter Title
                      </label>
                      <input
                        type="text"
                        value={course.chapters[activeChapter].title}
                        onChange={(e) => updateChapter(activeChapter, { title: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={course.chapters[activeChapter].duration_minutes}
                        onChange={(e) => updateChapter(activeChapter, { duration_minutes: parseInt(e.target.value) || 0 })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chapter Description
                    </label>
                    <textarea
                      value={course.chapters[activeChapter].description}
                      onChange={(e) => updateChapter(activeChapter, { description: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_free"
                      checked={course.chapters[activeChapter].is_free}
                      onChange={(e) => updateChapter(activeChapter, { is_free: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_free" className="ml-2 block text-sm text-gray-900">
                      Free preview chapter
                    </label>
                  </div>
                </div>

                {/* Chapter Content */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Chapter Content</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => addContent(activeChapter, 'video')}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Add Video
                      </button>
                      <button
                        onClick={() => addContent(activeChapter, 'document')}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Add Document
                      </button>
                      <button
                        onClick={() => addContent(activeChapter, 'quiz')}
                        className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                      >
                        Add Quiz
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {course.chapters[activeChapter].content.map((content, contentIndex) => (
                      <div key={contentIndex} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Content Title
                            </label>
                            <input
                              type="text"
                              value={content.title}
                              onChange={(e) => updateContent(activeChapter, contentIndex, { title: e.target.value })}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Type
                            </label>
                            <select
                              value={content.type}
                              onChange={(e) => updateContent(activeChapter, contentIndex, { type: e.target.value as Content['type'] })}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="video">Video</option>
                              <option value="document">Document</option>
                              <option value="quiz">Quiz</option>
                              <option value="assignment">Assignment</option>
                            </select>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            value={content.description}
                            onChange={(e) => updateContent(activeChapter, contentIndex, { description: e.target.value })}
                            rows={2}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Video Upload */}
                        {content.type === 'video' && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Video File
                            </label>
                            {content.content_data.video_url ? (
                              <div className="flex items-center space-x-4">
                                <video
                                  src={content.content_data.video_url}
                                  controls
                                  className="w-48 h-32 rounded-lg"
                                />
                                <button
                                  onClick={() => updateContent(activeChapter, contentIndex, {
                                    content_data: { ...content.content_data, video_url: undefined }
                                  })}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove Video
                                </button>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                <div className="text-center">
                                  <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  <div className="mt-2">
                                    <label htmlFor={`video-upload-${activeChapter}-${contentIndex}`} className="cursor-pointer">
                                      <span className="text-sm font-medium text-gray-900">
                                        {uploadingVideo ? 'Uploading...' : 'Upload video'}
                                      </span>
                                      <input
                                        id={`video-upload-${activeChapter}-${contentIndex}`}
                                        type="file"
                                        className="sr-only"
                                        accept="video/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleVideoUpload(file, activeChapter, contentIndex);
                                        }}
                                        disabled={uploadingVideo}
                                      />
                                    </label>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duration (min)
                              </label>
                              <input
                                type="number"
                                value={content.duration_minutes}
                                onChange={(e) => updateContent(activeChapter, contentIndex, { duration_minutes: parseInt(e.target.value) || 0 })}
                                className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`content-free-${activeChapter}-${contentIndex}`}
                                checked={content.is_free}
                                onChange={(e) => updateContent(activeChapter, contentIndex, { is_free: e.target.checked })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`content-free-${activeChapter}-${contentIndex}`} className="ml-2 block text-sm text-gray-900">
                                Free
                              </label>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const updatedChapters = course.chapters.map((ch, chIndex) =>
                                chIndex === activeChapter
                                  ? {
                                      ...ch,
                                      content: ch.content.filter((_, cIndex) => cIndex !== contentIndex)
                                    }
                                  : ch
                              );
                              setCourse({ ...course, chapters: updatedChapters });
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}