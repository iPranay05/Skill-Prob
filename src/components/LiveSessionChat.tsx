'use client';

import { useState, useRef, useEffect } from 'react';
import { useLiveSession } from '../hooks/useSocket';

interface LiveSessionChatProps {
  sessionId: string;
  userRole: 'student' | 'mentor';
  userId: string;
  userName: string;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  message: string;
  messageType: 'text' | 'question' | 'answer';
  timestamp: Date;
  isPrivate?: boolean;
  repliedTo?: string;
}

interface QA {
  id: string;
  studentId: string;
  studentName: string;
  question: string;
  answer?: string;
  answeredBy?: string;
  answeredAt?: Date;
  isAnonymous: boolean;
  timestamp: Date;
}

export function LiveSessionChat({ sessionId, userRole, userId, userName }: LiveSessionChatProps) {
  const {
    messages,
    qas,
    participants,
    sendMessage,
    createQA,
    answerQA,
    isConnected
  } = useLiveSession(sessionId);

  const [newMessage, setNewMessage] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'qa'>('chat');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected) return;

    sendMessage(newMessage, 'text');
    setNewMessage('');
    setReplyingTo(null);
  };

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !isConnected) return;

    createQA(newQuestion, isAnonymous);
    setNewQuestion('');
    setIsAnonymous(false);
  };

  const handleAnswerQuestion = (qaId: string, answer: string) => {
    if (!answer.trim() || !isConnected) return;
    answerQA(qaId, answer);
  };

  const getMessageTypeColor = (messageType: string) => {
    switch (messageType) {
      case 'question':
        return 'bg-blue-50 border-l-4 border-l-blue-500';
      case 'answer':
        return 'bg-green-50 border-l-4 border-l-green-500';
      default:
        return 'bg-white';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'mentor':
        return 'text-primary';
      case 'student':
        return 'text-info';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  activeTab === 'chat'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Chat ({messages.length})
              </button>
              <button
                onClick={() => setActiveTab('qa')}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  activeTab === 'qa'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Q&A ({qas.length})
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-secondary-light' : 'bg-error'}`}></div>
            <span className="text-sm text-gray-600">
              {participants.length} participants
            </span>
          </div>
        </div>
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${getMessageTypeColor(message.messageType)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-sm font-medium ${getRoleColor(message.userRole)}`}>
                          {message.userName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.messageType !== 'text' && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {message.messageType}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900">{message.message}</p>
                    </div>
                    
                    {userRole === 'mentor' && message.messageType === 'question' && (
                      <button
                        onClick={() => {
                          const answer = prompt('Your answer:');
                          if (answer) {
                            sendMessage(`@${message.userName} ${answer}`, 'answer');
                          }
                        }}
                        className="text-xs text-info hover:text-blue-800 ml-2"
                      >
                        Answer
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200">
            {replyingTo && (
              <div className="mb-2 p-2 bg-gray-50 rounded text-sm">
                <span className="text-gray-600">Replying to: </span>
                <span className="font-medium">{replyingTo}</span>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                ref={chatInputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isConnected ? "Type your message..." : "Connecting..."}
                disabled={!isConnected}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
              <button
                type="button"
                onClick={() => {
                  setNewMessage(newMessage + ' [QUESTION]');
                  chatInputRef.current?.focus();
                }}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
                disabled={!isConnected}
              >
                Ask
              </button>
              <button
                type="submit"
                disabled={!newMessage.trim() || !isConnected}
                className="px-4 py-2 bg-info text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        </>
      )}

      {/* Q&A Tab */}
      {activeTab === 'qa' && (
        <>
          {/* Questions */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {qas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">❓</span>
                </div>
                <p>No questions yet.</p>
              </div>
            ) : (
              qas.map((qa) => (
                <div key={qa.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="mb-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-info">
                        {qa.isAnonymous ? 'Anonymous' : qa.studentName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(qa.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">{qa.question}</p>
                  </div>

                  {qa.answer ? (
                    <div className="bg-green-50 rounded-md p-3 border-l-4 border-l-green-500">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-green-700">Answer</span>
                        {qa.answeredAt && (
                          <span className="text-xs text-gray-500">
                            {formatTime(qa.answeredAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900">{qa.answer}</p>
                    </div>
                  ) : userRole === 'mentor' ? (
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          const answer = prompt('Your answer:');
                          if (answer) {
                            handleAnswerQuestion(qa.id, answer);
                          }
                        }}
                        className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-md hover:bg-green-200"
                      >
                        Answer Question
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 italic">
                      Waiting for answer...
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Question Input (Students only) */}
          {userRole === 'student' && (
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleAskQuestion} className="space-y-3">
                <textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder={isConnected ? "Ask your question..." : "Connecting..."}
                  disabled={!isConnected}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 resize-none"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded border-gray-300 text-info focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Ask anonymously</span>
                  </label>
                  <button
                    type="submit"
                    disabled={!newQuestion.trim() || !isConnected}
                    className="px-4 py-2 bg-info text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Ask Question
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}