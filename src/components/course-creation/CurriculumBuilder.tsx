'use client';

import { useState } from 'react';

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'article' | 'quiz' | 'assignment' | 'resource' | 'live_session';
  duration_minutes?: number;
  video_url?: string;
  video_file?: File;
  article_content?: string;
  quiz_data?: any;
  resources?: Array<{
    title: string;
    url: string;
    file?: File;
    type: 'pdf' | 'zip' | 'ppt' | 'doc' | 'link' | 'other';
  }>;
  is_preview: boolean;
  is_free: boolean;
  order: number;
}

export interface Section {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

interface CurriculumBuilderProps {
  sections: Section[];
  courseType: 'single_video' | 'multi_lesson' | 'mixed_content';
  onSectionsChange: (sections: Section[]) => void;
  onCourseTypeChange: (type: 'single_video' | 'multi_lesson' | 'mixed_content') => void;
}

export default function CurriculumBuilder({
  sections,
  courseType,
  onSectionsChange,
  onCourseTypeChange
}: CurriculumBuilderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});

  const addSection = () => {
    const newSection: Section = {
      id: Date.now().toString(),
      title: `Section ${sections.length + 1}`,
      description: '',
      order: sections.length + 1,
      lessons: []
    };
    onSectionsChange([...sections, newSection]);
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    );
    onSectionsChange(updatedSections);
  };

  const deleteSection = (sectionId: string) => {
    const updatedSections = sections.filter(section => section.id !== sectionId);
    onSectionsChange(updatedSections);
  };

  const addLesson = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const newLesson: Lesson = {
      id: Date.now().toString(),
      title: `Lesson ${section.lessons.length + 1}`,
      type: 'video',
      duration_minutes: 0,
      is_preview: false,
      is_free: false,
      order: section.lessons.length + 1
    };

    updateSection(sectionId, {
      lessons: [...section.lessons, newLesson]
    });
  };

  const updateLesson = (sectionId: string, lessonId: string, updates: Partial<Lesson>) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const updatedLessons = section.lessons.map(lesson =>
      lesson.id === lessonId ? { ...lesson, ...updates } : lesson
    );

    updateSection(sectionId, { lessons: updatedLessons });
  };

  const deleteLesson = (sectionId: string, lessonId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const updatedLessons = section.lessons.filter(lesson => lesson.id !== lessonId);
    updateSection(sectionId, { lessons: updatedLessons });
  };

  const handleVideoUpload = async (sectionId: string, lessonId: string, file: File) => {
    const uploadKey = `${sectionId}-${lessonId}`;
    setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }));

    try {
      // TODO: Implement video upload to Supabase
      console.log('Uploading video:', file.name);
      
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update lesson with video URL
      updateLesson(sectionId, lessonId, {
        video_file: file,
        video_url: URL.createObjectURL(file), // Temporary local URL
        duration_minutes: Math.floor(Math.random() * 60) + 10 // Mock duration
      });

    } catch (error) {
      console.error('Video upload failed:', error);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Course Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Course Structure Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              courseType === 'single_video'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onCourseTypeChange('single_video')}
          >
            <h3 className="font-medium text-gray-900">Single Video Course</h3>
            <p className="text-sm text-gray-600 mt-1">
              One long video (6+ hours). Perfect for masterclasses.
            </p>
          </div>

          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              courseType === 'multi_lesson'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onCourseTypeChange('multi_lesson')}
          >
            <h3 className="font-medium text-gray-900">Multi-Lesson Course</h3>
            <p className="text-sm text-gray-600 mt-1">
              Multiple lessons (Lesson 1, 2, 3...). Easy to follow structure.
            </p>
          </div>

          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              courseType === 'mixed_content'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onCourseTypeChange('mixed_content')}
          >
            <h3 className="font-medium text-gray-900">Mixed Content</h3>
            <p className="text-sm text-gray-600 mt-1">
              Videos + PDFs + Quizzes + Assignments. Complete learning experience.
            </p>
          </div>
        </div>
      </div>

      {/* Curriculum Builder */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Course Curriculum</h3>
          <button
            type="button"
            onClick={addSection}
            className="bg-info text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Add Section
          </button>
        </div>

        {sections.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No sections yet. Add your first section to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sections.map((section, sectionIndex) => (
              <div key={section.id} className="border border-gray-200 rounded-lg p-6">
                {/* Section Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      className="text-lg font-medium border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                      placeholder="Section title"
                    />
                    <textarea
                      value={section.description}
                      onChange={(e) => updateSection(section.id, { description: e.target.value })}
                      className="w-full text-sm text-gray-600 border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                      placeholder="Section description (optional)"
                      rows={2}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteSection(section.id)}
                    className="text-error hover:text-red-800 ml-4"
                  >
                    Delete Section
                  </button>
                </div>

                {/* Lessons */}
                <div className="space-y-3">
                  {section.lessons.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center space-x-4">
                            <input
                              type="text"
                              value={lesson.title}
                              onChange={(e) => updateLesson(section.id, lesson.id, { title: e.target.value })}
                              className="flex-1 font-medium border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Lesson title"
                            />
                            <select
                              value={lesson.type}
                              onChange={(e) => updateLesson(section.id, lesson.id, { type: e.target.value as any })}
                              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="video">Video</option>
                              <option value="article">Article</option>
                              <option value="quiz">Quiz</option>
                              <option value="assignment">Assignment</option>
                              <option value="resource">Resource</option>
                              <option value="live_session">Live Session</option>
                            </select>
                          </div>

                          {/* Video Upload */}
                          {lesson.type === 'video' && (
                            <div>
                              {lesson.video_url ? (
                                <div className="flex items-center space-x-4">
                                  <video
                                    src={lesson.video_url}
                                    controls
                                    className="w-32 h-20 object-cover rounded"
                                  />
                                  <div>
                                    <p className="text-sm font-medium">Video uploaded</p>
                                    <p className="text-xs text-gray-600">Duration: {lesson.duration_minutes} minutes</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => updateLesson(section.id, lesson.id, { video_url: undefined, video_file: undefined })}
                                    className="text-error hover:text-red-800 text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                  <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleVideoUpload(section.id, lesson.id, file);
                                    }}
                                    className="hidden"
                                    id={`video-${lesson.id}`}
                                  />
                                  <label
                                    htmlFor={`video-${lesson.id}`}
                                    className="cursor-pointer flex flex-col items-center"
                                  >
                                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm text-gray-600">
                                      {uploadingFiles[`${section.id}-${lesson.id}`] ? 'Uploading...' : 'Upload video'}
                                    </span>
                                  </label>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Lesson Settings */}
                          <div className="flex items-center space-x-4 text-sm">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={lesson.is_preview}
                                onChange={(e) => updateLesson(section.id, lesson.id, { is_preview: e.target.checked })}
                                className="mr-2"
                              />
                              Preview Lesson
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={lesson.is_free}
                                onChange={(e) => updateLesson(section.id, lesson.id, { is_free: e.target.checked })}
                                className="mr-2"
                              />
                              Free Lesson
                            </label>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteLesson(section.id, lesson.id)}
                          className="text-error hover:text-red-800 ml-4"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addLesson(section.id)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
                  >
                    + Add Lesson
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
