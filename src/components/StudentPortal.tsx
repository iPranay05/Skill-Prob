'use client';

import { useState, useEffect } from 'react';
import { RealTimeWallet } from './RealTimeWallet';
import { RealTimeNotifications } from './RealTimeNotifications';

interface Course {
    id: string;
    title: string;
    description: string;
    instructor: string;
    price: number;
    rating: number;
    studentsCount: number;
    duration: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    category: string;
    thumbnail: string;
    isEnrolled: boolean;
}

interface StudentPortalProps {
    userId: string;
    userProfile: {
        firstName: string;
        lastName: string;
        email: string;
        avatar?: string;
    };
}

export function StudentPortal({ userId, userProfile }: StudentPortalProps) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedLevel, setSelectedLevel] = useState('all');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'discover' | 'enrolled' | 'progress'>('discover');

    const categories = ['all', 'Programming', 'Design', 'Business', 'Marketing', 'Data Science'];
    const levels = ['all', 'Beginner', 'Intermediate', 'Advanced'];

    useEffect(() => {
        fetchCourses();
        fetchEnrolledCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await fetch('/api/courses');
            if (response.ok) {
                const data = await response.json();
                setCourses(data.courses || []);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEnrolledCourses = async () => {
        try {
            const response = await fetch(`/api/students/${userId}/enrollments`);
            if (response.ok) {
                const data = await response.json();
                setEnrolledCourses(data.enrollments || []);
            }
        } catch (error) {
            console.error('Error fetching enrolled courses:', error);
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
        const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;

        return matchesSearch && matchesCategory && matchesLevel;
    });

    const handleEnroll = async (courseId: string) => {
        try {
            const response = await fetch(`/api/courses/${courseId}/enroll`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ studentId: userId }),
            });

            if (response.ok) {
                // Refresh courses and enrollments
                fetchCourses();
                fetchEnrolledCourses();
            }
        } catch (error) {
            console.error('Error enrolling in course:', error);
        }
    };

    const CourseCard = ({ course }: { course: Course }) => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-video bg-gray-200 relative">
                {course.thumbnail ? (
                    <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-4xl">📚</span>
                    </div>
                )}
                <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${course.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                        course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                        {course.level}
                    </span>
                </div>
            </div>

            <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {course.category}
                    </span>
                    <div className="flex items-center space-x-1">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-sm text-gray-600">{course.rating}</span>
                    </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>👨‍🏫 {course.instructor}</span>
                    <span>⏱️ {course.duration}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-lg font-bold text-gray-900">₹{course.price.toLocaleString()}</span>
                        <div className="text-xs text-gray-500">{course.studentsCount} students</div>
                    </div>

                    {course.isEnrolled ? (
                        <button className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                            Enrolled ✓
                        </button>
                    ) : (
                        <button
                            onClick={() => handleEnroll(course.id)}
                            className="px-4 py-2 bg-info text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            Enroll Now
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    const DiscoverTab = () => (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-400">🔍</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {category === 'all' ? 'All Categories' : category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                            <select
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {levels.map(level => (
                                    <option key={level} value={level}>
                                        {level === 'all' ? 'All Levels' : level}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                            <div className="aspect-video bg-gray-200"></div>
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-full"></div>
                                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📚</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                    <p className="text-gray-600">Try adjusting your search criteria</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map(course => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            )}
        </div>
    );

    const EnrolledTab = () => (
        <div className="space-y-6">
            {enrolledCourses.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🎓</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No enrolled courses</h3>
                    <p className="text-gray-600 mb-4">Start learning by enrolling in a course</p>
                    <button
                        onClick={() => setActiveTab('discover')}
                        className="px-4 py-2 bg-info text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Browse Courses
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrolledCourses.map(course => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Welcome back, {userProfile.firstName}! 👋
                            </h1>
                            <p className="text-gray-600 mt-1">Continue your learning journey</p>
                        </div>

                        <div className="flex items-center space-x-4">
                            <RealTimeWallet compact={true} />
                            <RealTimeNotifications />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Navigation Tabs */}
                <div className="flex space-x-1 mb-8">
                    {[
                        { id: 'discover', label: 'Discover Courses', icon: '🔍' },
                        { id: 'enrolled', label: 'My Courses', icon: '📚' },
                        { id: 'progress', label: 'Progress', icon: '📊' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id
                                ? 'bg-info text-white'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'discover' && <DiscoverTab />}
                {activeTab === 'enrolled' && <EnrolledTab />}
                {activeTab === 'progress' && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🚧</span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Progress Tracking</h3>
                        <p className="text-gray-600">Coming soon! Track your learning progress here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}