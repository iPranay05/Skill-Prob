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

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  messageType: 'text' | 'question' | 'answer' | 'system';
  isPrivate: boolean;
  createdAt: string;
  user?: {
    name: string;
    role: string;
  };
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

interface Poll {
  id: string;
  question: string;
  options: { id: string; text: string; votes?: number }[];
  pollType: 'single_choice' | 'multiple_choice' | 'text' | 'rating';
  isAnonymous: boolean;
  isActive: boolean;
  endsAt?: string;
}

export default function LiveSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [hasJoined, setHasJoined] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'qa' | 'polls'>('chat');
  
  // Q&A state
  const [qaItems, setQaItems] = useState<QAItem[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // Polls state
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollResponses, setPollResponses] = useState<Record<string, any>>({});
  
  // Socket connection
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSession();
    fetchUserProfile();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [sessionId]);

  useEffect(() => {
    if (session && userId && hasJoined) {
      initializeSocket();
      fetchChatMessages();
    }
  }, [session, userId, hasJoined]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserRole(data.data.role);
        setUserId(data.data.id);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

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

  const fetchChatMessages = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/live-sessions/${sessionId}/chat`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
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
      console.log('Connected to socket server');
      socket.emit('join-session', { sessionId });
    });

    socket.on('session-joined', () => {
      console.log('Joined session successfully');
    });

    socket.on('new-message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('new-qa', (qa: QAItem) => {
      setQaItems(prev => [...prev, qa]);
    });

    socket.on('qa-answered', (qa: QAItem) => {
      setQaItems(prev => prev.map(item => item.id === qa.id ? qa : item));
    });

    socket.on('new-poll', (poll: Poll) => {
      setPolls(prev => [...prev, poll]);
    });

    socket.on('session-status-updated', (data: { status: string }) => {
      if (session) {
        setSession(prev => prev ? { ...prev, status: data.status as any } : null);
      }
    });

    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message);
      setError(error.message);
    });
  };

  const joinSession = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/live-sessions/${sessionId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setHasJoined(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to join session');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      setError('Failed to join session');
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('send-message', {
      sessionId,
      message: newMessage.trim(),
      messageType: 'text'
    });

    setNewMessage('');
  };

  const sendQuestion = () => {
    if (!newQuestion.trim() || !socketRef.current) return;

    socketRef.current.emit('create-qa', {
      sessionId,
      question: newQuestion.trim(),
      isAnonymous
    });

    setNewQuestion('');
    setIsAnonymous(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const canJoinSession = () => {
    if (!session) return false;
    const now = new Date();
    const start = new Date(session.scheduledStartTime);
    const end = new Date(session.scheduledEndTime);
    return now >= start && now <= end && (session.status === 'live' || session.status === 'scheduled');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <p className="mt-6 text-xl font-semibold text-gray-700">Loading session...</p>
            <p className="mt-2 text-gray-500">Preparing your interactive experience</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">❌</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Session Not Found</h3>
            <p className="text-red-600 mb-6">{error || 'The session you\'re looking for doesn\'t exist'}</p>
            <button
              onClick={() => router.push('/live-sessions')}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
            >
              ← Back to Sessions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => router.push('/live-sessions')}
              className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
            >
              <span>←</span>
              <span>Back to Sessions</span>
            </button>
          </div>
          
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-4xl font-bold text-white">{session.title}</h1>
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                      session.status === 'live' ? 'bg-green-100 text-green-800 animate-pulse' :
                      session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status === 'live' ? '🔴 LIVE NOW' : `📅 ${session.status.toUpperCase()}`}
                    </span>
                  </div>
                  <p className="text-xl text-indigo-100 mb-4">{session.description}</p>
                  <div className="flex items-center space-x-6 text-indigo-100">
                    <div className="flex items-center space-x-2">
                      <span>📅</span>
                      <span className="font-medium">{new Date(session.scheduledStartTime).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>⏱️</span>
                      <span className="font-medium">{new Date(session.scheduledEndTime).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="hidden lg:flex flex-col items-end space-y-3">
                  {session.googleMeetLink && (
                    <a
                      href={session.googleMeetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30 shadow-lg hover:shadow-xl"
                    >
                      📹 Join Google Meet
                    </a>
                  )}
                  
                  {!hasJoined && canJoinSession() && userRole === 'student' && (
                    <button
                      onClick={joinSession}
                      className="bg-green-500/90 hover:bg-green-600 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      🚀 Join Session
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute top-4 right-20 w-16 h-16 bg-yellow-400 rounded-full opacity-20 animate-bounce"></div>
            <div className="absolute bottom-4 left-20 w-12 h-12 bg-pink-400 rounded-full opacity-20 animate-pulse"></div>
          </div>
        </div>

        {/* Main Content */}
        {hasJoined || userRole === 'mentor' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Session Info */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">ℹ️</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">Session Info</h3>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-700">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        session.status === 'live' ? 'bg-green-100 text-green-800 animate-pulse' :
                        session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status === 'live' ? '🔴 LIVE' : session.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-700">Max Participants:</span>
                      <span className="text-gray-900 font-bold">{session.maxParticipants}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-gray-50 to-green-50 rounded-xl p-4">
                    <span className="font-semibold text-gray-700 block mb-3">Interactive Features:</span>
                    <div className="space-y-2">
                      {session.chatEnabled && (
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-sm">💬</span>
                          </span>
                          <span className="text-sm text-gray-700 font-medium">Live Chat enabled</span>
                        </div>
                      )}
                      {session.qaEnabled && (
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm">❓</span>
                          </span>
                          <span className="text-sm text-gray-700 font-medium">Q&A enabled</span>
                        </div>
                      )}
                      {session.pollingEnabled && (
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-yellow-600 text-sm">📊</span>
                          </span>
                          <span className="text-sm text-gray-700 font-medium">Live Polls enabled</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Tabs */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600">
                  <nav className="flex space-x-1 px-6">
                    {session.chatEnabled && (
                      <button
                        onClick={() => setActiveTab('chat')}
                        className={`py-4 px-6 font-semibold text-sm rounded-t-xl transition-all duration-200 ${
                          activeTab === 'chat'
                            ? 'bg-white text-indigo-600 shadow-lg'
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        💬 Chat
                      </button>
                    )}
                    {session.qaEnabled && (
                      <button
                        onClick={() => setActiveTab('qa')}
                        className={`py-4 px-6 font-semibold text-sm rounded-t-xl transition-all duration-200 ${
                          activeTab === 'qa'
                            ? 'bg-white text-indigo-600 shadow-lg'
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        ❓ Q&A
                      </button>
                    )}
                    {session.pollingEnabled && (
                      <button
                        onClick={() => setActiveTab('polls')}
                        className={`py-4 px-6 font-semibold text-sm rounded-t-xl transition-all duration-200 ${
                          activeTab === 'polls'
                            ? 'bg-white text-indigo-600 shadow-lg'
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        📊 Polls
                      </button>
                    )}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* Chat Tab */}
                  {activeTab === 'chat' && session.chatEnabled && (
                    <div className="h-96 flex flex-col">
                      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                        {messages.map((message) => (
                          <div key={message.id} className="flex space-x-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm text-gray-900">
                                  {message.user?.name || 'User'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatTime(message.createdAt)}
                                </span>
                                {message.messageType === 'question' && (
                                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                                    Question
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 mt-1">{message.message}</p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                      
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type your message..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!newMessage.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Q&A Tab */}
                  {activeTab === 'qa' && session.qaEnabled && (
                    <div className="space-y-4">
                      {userRole === 'student' && (
                        <div className="border-b border-gray-200 pb-4">
                          <textarea
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            placeholder="Ask a question..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                          <div className="mt-2 flex items-center justify-between">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">Ask anonymously</span>
                            </label>
                            <button
                              onClick={sendQuestion}
                              disabled={!newQuestion.trim()}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Ask Question
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        {qaItems.map((qa) => (
                          <div key={qa.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{qa.question}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {qa.isAnonymous ? 'Anonymous' : 'Student'} • {formatTime(qa.createdAt)}
                                </p>
                                {qa.answer && (
                                  <div className="mt-3 bg-blue-50 rounded-lg p-3">
                                    <p className="text-sm text-gray-700">{qa.answer}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Answered by mentor • {qa.answeredAt && formatTime(qa.answeredAt)}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                qa.status === 'answered' ? 'bg-green-100 text-green-800' :
                                qa.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {qa.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Polls Tab */}
                  {activeTab === 'polls' && session.pollingEnabled && (
                    <div className="space-y-4">
                      {polls.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No polls available yet.</p>
                      ) : (
                        polls.map((poll) => (
                          <div key={poll.id} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3">{poll.question}</h4>
                            <div className="space-y-2">
                              {poll.options.map((option) => (
                                <div key={option.id} className="flex items-center">
                                  <input
                                    type={poll.pollType === 'single_choice' ? 'radio' : 'checkbox'}
                                    name={`poll-${poll.id}`}
                                    value={option.id}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                  />
                                  <label className="ml-2 text-sm text-gray-700">
                                    {option.text}
                                  </label>
                                </div>
                              ))}
                            </div>
                            <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                              Submit Response
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              {canJoinSession() 
                ? 'Click "Join Session" to participate in the live session'
                : 'This session is not currently available for joining'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}