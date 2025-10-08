'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
}

export default function CreateLiveSessionPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    scheduledStartTime: '',
    scheduledEndTime: '',
    maxParticipants: 100,
    chatEnabled: true,
    qaEnabled: true,
    pollingEnabled: true,
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // The API returns { success: true, data: { courses: [...], total: ..., page: ... } }
        setCourses(data.data?.courses || []);
      } else {
        console.error('Failed to fetch courses:', response.status);
        setError('Failed to load courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    if (!formData.courseId) {
      setError('Please select a course');
      return false;
    }
    if (!formData.title.trim()) {
      setError('Please enter a session title');
      return false;
    }
    if (!formData.scheduledStartTime) {
      setError('Please select a start time');
      return false;
    }
    if (!formData.scheduledEndTime) {
      setError('Please select an end time');
      return false;
    }

    const startTime = new Date(formData.scheduledStartTime);
    const endTime = new Date(formData.scheduledEndTime);
    const now = new Date();

    if (startTime <= now) {
      setError('Start time must be in the future');
      return false;
    }
    if (endTime <= startTime) {
      setError('End time must be after start time');
      return false;
    }
    if (formData.maxParticipants < 1 || formData.maxParticipants > 1000) {
      setError('Max participants must be between 1 and 1000');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/live-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Live session created successfully!');
        setTimeout(() => {
          router.push('/live-sessions');
        }, 2000);
      } else {
        setError(data.error || 'Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      setError('Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate datetime-local input value
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // Minimum 30 minutes from now
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link
              href="/live-sessions"
              className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
            >
              <span>←</span>
              <span>Back to Sessions</span>
            </Link>
          </div>
          
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative">
              <h1 className="text-4xl font-bold text-white mb-2">
                🎥 Create Live Session
              </h1>
              <p className="text-xl text-indigo-100">
                Schedule an interactive live session with Google Meet integration
              </p>
              <div className="flex items-center space-x-4 mt-4">
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <span className="text-white font-semibold">📹 Auto Google Meet</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <span className="text-white font-semibold">💬 Interactive Features</span>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute top-4 right-20 w-16 h-16 bg-yellow-400 rounded-full opacity-20 animate-bounce"></div>
            <div className="absolute bottom-4 left-20 w-12 h-12 bg-pink-400 rounded-full opacity-20 animate-pulse"></div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">📝</span>
              </div>
              <h2 className="text-xl font-bold text-white">Session Details</h2>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-8">
            {/* Course Selection */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">📚</span>
                </div>
                <div>
                  <label htmlFor="courseId" className="block text-lg font-bold text-gray-900">
                    Select Course *
                  </label>
                  <p className="text-sm text-gray-600">Choose which course this session belongs to</p>
                </div>
              </div>
              <select
                id="courseId"
                name="courseId"
                value={formData.courseId}
                onChange={handleInputChange}
                required
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900 font-medium"
              >
                <option value="">🎯 Select a course to get started</option>
                {Array.isArray(courses) && courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    📖 {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Session Title */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">✏️</span>
                </div>
                <div>
                  <label htmlFor="title" className="block text-lg font-bold text-gray-900">
                    Session Title *
                  </label>
                  <p className="text-sm text-gray-600">Give your session an engaging title</p>
                </div>
              </div>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="e.g., Introduction to React Hooks - Interactive Workshop"
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900 font-medium"
              />
            </div>

            {/* Description */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">📝</span>
                </div>
                <div>
                  <label htmlFor="description" className="block text-lg font-bold text-gray-900">
                    Description
                  </label>
                  <p className="text-sm text-gray-600">Describe what students will learn in this session</p>
                </div>
              </div>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Brief description of what will be covered in this session... Include key topics, learning objectives, and any prerequisites."
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 resize-none"
              />
            </div>

            {/* Date and Time */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">📅</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Schedule Session</h3>
                  <p className="text-sm text-gray-600">Set the date and time for your live session</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="scheduledStartTime" className="block text-sm font-semibold text-gray-700 mb-2">
                    🕐 Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduledStartTime"
                    name="scheduledStartTime"
                    value={formData.scheduledStartTime}
                    onChange={handleInputChange}
                    min={getMinDateTime()}
                    required
                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900 font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="scheduledEndTime" className="block text-sm font-semibold text-gray-700 mb-2">
                    🕐 End Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduledEndTime"
                    name="scheduledEndTime"
                    value={formData.scheduledEndTime}
                    onChange={handleInputChange}
                    min={formData.scheduledStartTime || getMinDateTime()}
                    required
                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Max Participants */}
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">👥</span>
                </div>
                <div>
                  <label htmlFor="maxParticipants" className="block text-lg font-bold text-gray-900">
                    Maximum Participants
                  </label>
                  <p className="text-sm text-gray-600">Set the capacity limit for your session</p>
                </div>
              </div>
              <input
                type="number"
                id="maxParticipants"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                min="1"
                max="1000"
                className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 font-medium"
              />
              <p className="text-xs text-gray-500 mt-2">💡 Recommended: 20-50 participants for optimal interaction</p>
            </div>

            {/* Features */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">⚡</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Interactive Features</h3>
                  <p className="text-sm text-gray-600">Enable features to make your session more engaging</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-indigo-300 transition-colors">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="chatEnabled"
                      name="chatEnabled"
                      checked={formData.chatEnabled}
                      onChange={handleInputChange}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                    />
                    <div className="flex-1">
                      <label htmlFor="chatEnabled" className="block text-sm font-semibold text-gray-900 mb-1">
                        💬 Live Chat
                      </label>
                      <p className="text-xs text-gray-600">Allow participants to send messages during the session</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-indigo-300 transition-colors">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="qaEnabled"
                      name="qaEnabled"
                      checked={formData.qaEnabled}
                      onChange={handleInputChange}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                    />
                    <div className="flex-1">
                      <label htmlFor="qaEnabled" className="block text-sm font-semibold text-gray-900 mb-1">
                        ❓ Q&A Session
                      </label>
                      <p className="text-xs text-gray-600">Allow students to ask questions that you can answer</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-indigo-300 transition-colors">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="pollingEnabled"
                      name="pollingEnabled"
                      checked={formData.pollingEnabled}
                      onChange={handleInputChange}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                    />
                    <div className="flex-1">
                      <label htmlFor="pollingEnabled" className="block text-sm font-semibold text-gray-900 mb-1">
                        📊 Live Polls
                      </label>
                      <p className="text-xs text-gray-600">Create interactive polls and surveys during the session</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-2xl shadow-lg">
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

            {success && (
              <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-r-2xl shadow-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-green-800 font-semibold">Success!</p>
                    <p className="text-green-600">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <Link
                href="/live-sessions"
                className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-semibold"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Session...</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-2">
                    <span>🚀</span>
                    <span>Create Session</span>
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">💡</span>
            </div>
            <h3 className="text-lg font-bold text-blue-900">What happens next?</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 text-lg">📹</span>
              <p className="text-sm text-blue-800">A Google Meet link will be automatically created for your session</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 text-lg">👥</span>
              <p className="text-sm text-blue-800">Students enrolled in the course will be able to see and join the session</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 text-lg">⚙️</span>
              <p className="text-sm text-blue-800">You'll be able to manage the session from the sessions dashboard</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 text-lg">📊</span>
              <p className="text-sm text-blue-800">All session activities (chat, Q&A, polls) will be recorded for later review</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}