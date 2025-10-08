'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

interface LiveSession {
    id: string;
    courseId: string;
    mentorId: string;
    title: string;
    description?: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    googleMeetLink?: string;
    status: 'scheduled' | 'live' | 'completed' | 'cancelled';
    maxParticipants: number;
    chatEnabled: boolean;
    qaEnabled: boolean;
    pollingEnabled: boolean;
}

interface AttendanceStats {
    totalRegistered: number;
    totalJoined: number;
    currentlyOnline: number;
    attendanceRate: number;
}

interface QAItem {
    id: string;
    studentId: string;
    question: string;
    answer?: string;
    answeredBy?: string;
    answeredAt?: string;
    isAnonymous: boolean;
    upvotes: number;
    status: 'pending' | 'answered' | 'dismissed';
    createdAt: string;
}

export default function ManageSessionPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;

    const [session, setSession] = useState<LiveSession | null>(null);
    const [attendance, setAttendance] = useState<AttendanceStats | null>(null);
    const [qaItems, setQaItems] = useState<QAItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'overview' | 'qa' | 'polls' | 'attendance'>('overview');

    // Poll creation state
    const [showCreatePoll, setShowCreatePoll] = useState(false);
    const [pollData, setPollData] = useState({
        question: '',
        options: ['', ''],
        pollType: 'single_choice' as 'single_choice' | 'multiple_choice',
        isAnonymous: true,
    });

    // Socket connection
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        fetchSession();
        fetchAttendance();
        initializeSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [sessionId]);

    const fetchSession = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`/api/live-sessions/${sessionId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setSession(data.data);
            } else {
                setError('Session not found');
            }
        } catch (error) {
            console.error('Error fetching session:', error);
            setError('Failed to load session');
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendance = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`/api/live-sessions/${sessionId}/attendance`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setAttendance(data.data.statistics);
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
    };

    const initializeSocket = () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        socketRef.current = io({
            auth: { token }
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            socket.emit('join-session', { sessionId });
        });

        socket.on('new-qa', (qa: QAItem) => {
            setQaItems(prev => [...prev, qa]);
        });

        socket.on('qa-answered', (qa: QAItem) => {
            setQaItems(prev => prev.map(item => item.id === qa.id ? qa : item));
        });

        socket.on('user-joined', () => {
            fetchAttendance(); // Refresh attendance when someone joins
        });

        socket.on('user-left', () => {
            fetchAttendance(); // Refresh attendance when someone leaves
        });
    };

    const updateSessionStatus = async (status: 'live' | 'completed' | 'cancelled') => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`/api/live-sessions/${sessionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });

            if (response.ok) {
                const data = await response.json();
                setSession(data.data);

                // Broadcast status update via socket
                if (socketRef.current) {
                    socketRef.current.emit('update-session-status', { sessionId, status });
                }
            } else {
                setError('Failed to update session status');
            }
        } catch (error) {
            console.error('Error updating session status:', error);
            setError('Failed to update session status');
        }
    };

    const answerQuestion = async (qaId: string, answer: string) => {
        if (!socketRef.current) return;

        socketRef.current.emit('answer-qa', {
            qaId,
            answer,
            sessionId,
        });
    };

    const createPoll = async () => {
        if (!socketRef.current || !pollData.question.trim()) return;

        const validOptions = pollData.options.filter(opt => opt.trim());
        if (validOptions.length < 2) {
            setError('Poll must have at least 2 options');
            return;
        }

        socketRef.current.emit('create-poll', {
            sessionId,
            question: pollData.question.trim(),
            options: validOptions.map(text => ({ text })),
            pollType: pollData.pollType,
            isAnonymous: pollData.isAnonymous,
        });

        // Reset form
        setPollData({
            question: '',
            options: ['', ''],
            pollType: 'single_choice',
            isAnonymous: true,
        });
        setShowCreatePoll(false);
    };

    const addPollOption = () => {
        setPollData(prev => ({
            ...prev,
            options: [...prev.options, '']
        }));
    };

    const updatePollOption = (index: number, value: string) => {
        setPollData(prev => ({
            ...prev,
            options: prev.options.map((opt, i) => i === index ? value : opt)
        }));
    };

    const removePollOption = (index: number) => {
        if (pollData.options.length > 2) {
            setPollData(prev => ({
                ...prev,
                options: prev.options.filter((_, i) => i !== index)
            }));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading session...</p>
                </div>
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Session not found'}</p>
                    <button
                        onClick={() => router.push('/live-sessions')}
                        className="text-blue-600 hover:text-blue-500"
                    >
                        ← Back to Sessions
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/live-sessions')}
                        className="text-blue-600 hover:text-blue-500 mb-4"
                    >
                        ← Back to Sessions
                    </button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Manage: {session.title}</h1>
                            <p className="mt-2 text-gray-600">{session.description}</p>
                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                                <span>📅 {new Date(session.scheduledStartTime).toLocaleString()}</span>
                                <span>⏱️ {new Date(session.scheduledEndTime).toLocaleString()}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${session.status === 'live' ? 'bg-green-100 text-green-800' :
                                    session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                    {session.status}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {session.status === 'scheduled' && (
                                <button
                                    onClick={() => updateSessionStatus('live')}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Start Session
                                </button>
                            )}

                            {session.status === 'live' && (
                                <button
                                    onClick={() => updateSessionStatus('completed')}
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    End Session
                                </button>
                            )}

                            {session.googleMeetLink && (
                                <a
                                    href={session.googleMeetLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Join Google Meet
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                {attendance && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-semibold">👥</span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Registered</p>
                                    <p className="text-2xl font-semibold text-gray-900">{attendance.totalRegistered}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 font-semibold">✓</span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Joined</p>
                                    <p className="text-2xl font-semibold text-gray-900">{attendance.totalJoined}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <span className="text-yellow-600 font-semibold">🔴</span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Online Now</p>
                                    <p className="text-2xl font-semibold text-gray-900">{attendance.currentlyOnline}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                        <span className="text-purple-600 font-semibold">%</span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
                                    <p className="text-2xl font-semibold text-gray-900">{attendance.attendanceRate.toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="bg-white rounded-lg shadow">
                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Overview
                            </button>
                            {session.qaEnabled && (
                                <button
                                    onClick={() => setActiveTab('qa')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'qa'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Q&A ({qaItems.filter(q => q.status === 'pending').length})
                                </button>
                            )}
                            {session.pollingEnabled && (
                                <button
                                    onClick={() => setActiveTab('polls')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'polls'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Polls
                                </button>
                            )}
                            <button
                                onClick={() => setActiveTab('attendance')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'attendance'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Attendance
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Session Controls</h3>
                                    <div className="flex space-x-4">
                                        {session.status === 'scheduled' && (
                                            <button
                                                onClick={() => updateSessionStatus('live')}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                            >
                                                Start Session
                                            </button>
                                        )}
                                        {session.status === 'live' && (
                                            <button
                                                onClick={() => updateSessionStatus('completed')}
                                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                                            >
                                                End Session
                                            </button>
                                        )}
                                        <button
                                            onClick={() => updateSessionStatus('cancelled')}
                                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                                        >
                                            Cancel Session
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Session Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium">Status:</span>
                                            <span className="ml-2">{session.status}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Max Participants:</span>
                                            <span className="ml-2">{session.maxParticipants}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Chat:</span>
                                            <span className="ml-2">{session.chatEnabled ? 'Enabled' : 'Disabled'}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Q&A:</span>
                                            <span className="ml-2">{session.qaEnabled ? 'Enabled' : 'Disabled'}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Polls:</span>
                                            <span className="ml-2">{session.pollingEnabled ? 'Enabled' : 'Disabled'}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Google Meet:</span>
                                            {session.googleMeetLink ? (
                                                <a
                                                    href={session.googleMeetLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="ml-2 text-blue-600 hover:text-blue-500"
                                                >
                                                    Join Meeting
                                                </a>
                                            ) : (
                                                <span className="ml-2">Not available</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Q&A Tab */}
                        {activeTab === 'qa' && session.qaEnabled && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium text-gray-900">Questions & Answers</h3>
                                    <span className="text-sm text-gray-500">
                                        {qaItems.filter(q => q.status === 'pending').length} pending questions
                                    </span>
                                </div>

                                {qaItems.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No questions yet.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {qaItems.map((qa) => (
                                            <div key={qa.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">{qa.question}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {qa.isAnonymous ? 'Anonymous' : 'Student'} • {new Date(qa.createdAt).toLocaleString()}
                                                        </p>

                                                        {qa.answer ? (
                                                            <div className="mt-3 bg-blue-50 rounded-lg p-3">
                                                                <p className="text-sm text-gray-700">{qa.answer}</p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    Your answer • {qa.answeredAt && new Date(qa.answeredAt).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-3">
                                                                <textarea
                                                                    placeholder="Type your answer..."
                                                                    rows={2}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                                            e.preventDefault();
                                                                            const answer = (e.target as HTMLTextAreaElement).value.trim();
                                                                            if (answer) {
                                                                                answerQuestion(qa.id, answer);
                                                                                (e.target as HTMLTextAreaElement).value = '';
                                                                            }
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${qa.status === 'answered' ? 'bg-green-100 text-green-800' :
                                                        qa.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {qa.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Polls Tab */}
                        {activeTab === 'polls' && session.pollingEnabled && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium text-gray-900">Polls</h3>
                                    <button
                                        onClick={() => setShowCreatePoll(true)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                    >
                                        Create Poll
                                    </button>
                                </div>

                                {/* Create Poll Modal */}
                                {showCreatePoll && (
                                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <h4 className="font-medium text-gray-900 mb-3">Create New Poll</h4>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Question
                                                </label>
                                                <input
                                                    type="text"
                                                    value={pollData.question}
                                                    onChange={(e) => setPollData(prev => ({ ...prev, question: e.target.value }))}
                                                    placeholder="Enter your poll question..."
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Options
                                                </label>
                                                {pollData.options.map((option, index) => (
                                                    <div key={index} className="flex items-center space-x-2 mb-2">
                                                        <input
                                                            type="text"
                                                            value={option}
                                                            onChange={(e) => updatePollOption(index, e.target.value)}
                                                            placeholder={`Option ${index + 1}`}
                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        />
                                                        {pollData.options.length > 2 && (
                                                            <button
                                                                onClick={() => removePollOption(index)}
                                                                className="text-red-600 hover:text-red-500"
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={addPollOption}
                                                    className="text-blue-600 hover:text-blue-500 text-sm"
                                                >
                                                    + Add Option
                                                </button>
                                            </div>

                                            <div className="flex items-center space-x-4">
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="pollType"
                                                        value="single_choice"
                                                        checked={pollData.pollType === 'single_choice'}
                                                        onChange={(e) => setPollData(prev => ({ ...prev, pollType: e.target.value as any }))}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Single Choice</span>
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="pollType"
                                                        value="multiple_choice"
                                                        checked={pollData.pollType === 'multiple_choice'}
                                                        onChange={(e) => setPollData(prev => ({ ...prev, pollType: e.target.value as any }))}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Multiple Choice</span>
                                                </label>
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={pollData.isAnonymous}
                                                    onChange={(e) => setPollData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">Anonymous responses</span>
                                            </div>

                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => setShowCreatePoll(false)}
                                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={createPoll}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                                >
                                                    Create Poll
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <p className="text-gray-500 text-center py-8">No polls created yet.</p>
                            </div>
                        )}

                        {/* Attendance Tab */}
                        {activeTab === 'attendance' && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Details</h3>
                                <p className="text-gray-500 text-center py-8">Detailed attendance data will be displayed here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}