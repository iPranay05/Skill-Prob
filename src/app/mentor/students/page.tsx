'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/clientAuth';

interface Student {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    enrolledCourses: number;
    completedCourses: number;
    totalProgress: number;
    lastActive: string;
    joinedDate: string;
    status: 'active' | 'inactive';
}

export default function MentorStudentsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<Student[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkAuth();
        fetchStudents();
    }, []);

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

    const fetchStudents = async () => {
        try {
            setStudentsLoading(true);
            setError(null);

            const response = await fetch('/api/mentor/students', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setStudents(result.data || []);
                } else {
                    console.error('API returned error:', result.error);
                    setError(result.error || 'Failed to fetch students');
                    setStudents([]);
                }
            } else {
                const errorResult = await response.json();
                const errorMessage = errorResult.error || `HTTP ${response.status}: ${response.statusText}`;
                console.error('Failed to fetch students:', errorMessage);
                setError(errorMessage);
                setStudents([]);
            }
        } catch (error) {
            console.error('Failed to fetch students:', error);
            setError('Network error: Unable to fetch students');
            setStudents([]);
        } finally {
            setStudentsLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getStatusBadge = (status: string) => {
        return status === 'active'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800';
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return 'bg-secondary-light';
        if (progress >= 50) return 'bg-yellow-500';
        return 'bg-error';
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || student.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
                    <p className="mt-2 text-gray-600">Manage and track your students' progress</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-info rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Students</p>
                                <p className="text-2xl font-semibold text-gray-900">{students.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-secondary-light rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Active Students</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {students.filter(s => s.status === 'active').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Avg Progress</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {Math.round(students.reduce((acc, s) => acc + s.totalProgress, 0) / students.length || 0)}%
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Completions</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {students.reduce((acc, s) => acc + s.completedCourses, 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search students by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as any)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                >
                                    <option value="all">All Students</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error loading students</h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                                <button
                                    onClick={fetchStudents}
                                    className="mt-2 text-sm text-red-800 underline hover:text-red-900"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Students List */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-medium text-gray-900">
                                Students ({studentsLoading ? '...' : filteredStudents.length})
                            </h2>
                            {studentsLoading && (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                            )}
                        </div>
                    </div>

                    {studentsLoading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-gray-500">Loading students...</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredStudents.map((student) => (
                                <div key={student.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-sm font-semibold">
                                                {getInitials(student.name)}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">{student.name}</h3>
                                                <p className="text-sm text-gray-500">{student.email}</p>
                                                <div className="flex items-center space-x-4 mt-1">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(student.status)}`}>
                                                        {student.status}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        Joined {new Date(student.joinedDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-8">
                                            <div className="text-center">
                                                <p className="text-2xl font-semibold text-gray-900">{student.enrolledCourses}</p>
                                                <p className="text-xs text-gray-500">Enrolled</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-semibold text-gray-900">{student.completedCourses}</p>
                                                <p className="text-xs text-gray-500">Completed</p>
                                            </div>
                                            <div className="text-center">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${getProgressColor(student.totalProgress)}`}
                                                            style={{ width: `${student.totalProgress}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">{student.totalProgress}%</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Progress</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-gray-900">
                                                    {new Date(student.lastActive).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-gray-500">Last Active</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!studentsLoading && filteredStudents.length === 0 && !error && (
                        <div className="p-12 text-center">
                            <div className="text-gray-400 text-6xl mb-4">👥</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                            <p className="text-gray-500">
                                {searchTerm || filterStatus !== 'all'
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'Students will appear here once they enroll in your courses.'
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}