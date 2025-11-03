'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUser } from '@/lib/clientAuth';

interface Course {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    level: string;
    duration: string;
    thumbnail: string;
    status: 'draft' | 'published' | 'archived';
    enrollmentCount: number;
    rating: number;
    createdAt: string;
    updatedAt: string;
}

interface Enrollment {
    id: string;
    studentName: string;
    studentEmail: string;
    enrolledAt: string;
    progress: number;
    completed: boolean;
    lastAccessed: string;
}

export default function MentorCourseDetailPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.courseId as string;

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<Course | null>(null);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'analytics'>('overview');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkAuth();
        if (courseId) {
            fetchCourse();
            fetchEnrollments();
        }
    }, [courseId]);

    const checkAuth = async () => {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser || currentUser.role !== 'mentor') {
                router.push('/auth/login');
                return;
            }
            setUser(currentUser);
        } catch (error) {
            console.error('Auth check failed:', error);
            router.push('/auth/login');
        } finally {
            setLoading(false);
        }
    };

    const fetchCourse = async () => {
        try {
            const response = await fetch(`/api/mentor/courses/${courseId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setCourse(result.data);
                } else {
                    setError(result.error || 'Failed to fetch course');
                }
            } else {
                const errorResult = await response.json();
                setError(errorResult.error || `HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Failed to fetch course:', error);
            setError('Network error: Unable to fetch course');
        }
    };

    const fetchEnrollments = async () => {
        try {
            const response = await fetch(`/api/mentor/courses/${courseId}/enrollments`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setEnrollments(result.data || []);
                }
            } else {
                console.error('Failed to fetch enrollments');
            }
        } catch (error) {
            console.error('Failed to fetch enrollments:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800',
            published: 'bg-green-100 text-green-800',
            archived: 'bg-red-100 text-red-800'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return 'bg-green-500';
        if (progress >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#5e17eb]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Course</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <div className="space-x-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-[#5e17eb] text-white px-4 py-2 rounded-lg hover:bg-[#4a12c4] transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => router.push('/mentor/courses')}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Back to Courses
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">📚</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
                    <p className="text-gray-600 mb-4">The course you're looking for doesn't exist or you don't have access to it.</p>
                    <button
                        onClick={() => router.push('/mentor/courses')}
                        className="bg-[#5e17eb] text-white px-4 py-2 rounded-lg hover:bg-[#4a12c4] transition-colors"
                    >
                        Back to Courses
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                        <button
                            onClick={() => router.push('/mentor/courses')}
                            className="hover:text-[#5e17eb] transition-colors"
                        >
                            My Courses
                        </button>
                        <span>›</span>
                        <span className="text-gray-900">{course.title}</span>
                    </div>

                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
                            <p className="mt-2 text-gray-600">{course.description}</p>
                            <div className="flex items-center space-x-4 mt-4">
                                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(course.status)}`}>
                                    {course.status}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {course.enrollmentCount} students enrolled
                                </span>
                                <span className="text-sm text-gray-500">
                                    ⭐ {course.rating.toFixed(1)} rating
                                </span>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => router.push(`/mentor/courses/${courseId}/edit`)}
                                className="bg-[#5e17eb] text-white px-4 py-2 rounded-lg hover:bg-[#4a12c4] transition-colors"
                            >
                                Edit Course
                            </button>
                            <button
                                onClick={() => router.push(`/courses/${courseId}`)}
                                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                View as Student
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Enrollments</p>
                                <p className="text-2xl font-semibold text-gray-900">{course.enrollmentCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Completions</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {enrollments.filter(e => e.completed).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Avg Progress</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {Math.round(enrollments.reduce((acc, e) => acc + e.progress, 0) / enrollments.length || 0)}%
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Revenue</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    ₹{(course.price * course.enrollmentCount).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                                        ? 'border-[#5e17eb] text-[#5e17eb]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('students')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'students'
                                        ? 'border-[#5e17eb] text-[#5e17eb]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Students ({enrollments.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'analytics'
                                        ? 'border-[#5e17eb] text-[#5e17eb]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Analytics
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Course Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Category</h3>
                                <p className="text-gray-900">{course.category}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Level</h3>
                                <p className="text-gray-900">{course.level}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Duration</h3>
                                <p className="text-gray-900">{course.duration}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Price</h3>
                                <p className="text-gray-900">₹{course.price.toLocaleString()}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Created</h3>
                                <p className="text-gray-900">{new Date(course.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Last Updated</h3>
                                <p className="text-gray-900">{new Date(course.updatedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Enrolled Students</h2>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {enrollments.map((enrollment) => (
                                <div key={enrollment.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">{enrollment.studentName}</h3>
                                            <p className="text-sm text-gray-500">{enrollment.studentEmail}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Enrolled on {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="flex items-center space-x-8">
                                            <div className="text-center">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${getProgressColor(enrollment.progress)}`}
                                                            style={{ width: `${enrollment.progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">{enrollment.progress}%</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Progress</p>
                                            </div>

                                            <div className="text-center">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${enrollment.completed
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {enrollment.completed ? 'Completed' : 'In Progress'}
                                                </span>
                                                <p className="text-xs text-gray-500 mt-1">Status</p>
                                            </div>

                                            <div className="text-center">
                                                <p className="text-sm text-gray-900">
                                                    {new Date(enrollment.lastAccessed).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-gray-500">Last Accessed</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {enrollments.length === 0 && (
                            <div className="p-12 text-center">
                                <div className="text-gray-400 text-6xl mb-4">👥</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No students enrolled</h3>
                                <p className="text-gray-500">Students will appear here once they enroll in this course.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Course Analytics</h2>
                        <div className="text-center text-gray-500">
                            <div className="text-6xl mb-4">📊</div>
                            <p>Detailed analytics coming soon...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}