import { useEffect, useRef, useState } from 'react';
import { getSocketClient, SocketClient } from '../lib/socketClient';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<SocketClient | null>(null);

  useEffect(() => {
    socketRef.current = getSocketClient();
    
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socketRef.current.on('error', handleConnect);
    socketRef.current.on('error', handleDisconnect);

    // Check initial connection status
    setIsConnected(socketRef.current.isConnected());

    return () => {
      if (socketRef.current) {
        socketRef.current.off('error', handleConnect);
        socketRef.current.off('error', handleDisconnect);
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
  };
}

export function useSocketEvent<T = unknown>(
  event: string,
  callback: (data: T) => void,
  deps: unknown[] = []
) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const wrappedCallback = (data: T) => callback(data);
    socket.on(event, wrappedCallback);

    return () => {
      socket.off(event, wrappedCallback);
    };
  }, [socket, event, ...deps]);
}

export function useLiveSession(sessionId: string) {
  const { socket, isConnected } = useSocket();
  const [participants, setParticipants] = useState<Array<{ id: string; name: string; role: string }>>([]);
  const [messages, setMessages] = useState<Array<{ id: string; message: string; sender: string; timestamp: Date }>>([]);
  const [qas, setQAs] = useState<Array<{ id: string; question: string; answer?: string; timestamp: Date }>>([]);
  const [polls, setPolls] = useState<Array<{ id: string; question: string; options: string[]; votes: Record<string, number> }>>([]);
  const [sessionStatus, setSessionStatus] = useState<string>('scheduled');

  useEffect(() => {
    if (!socket || !isConnected || !sessionId) return;

    // Join session
    socket.joinSession(sessionId);

    // Event handlers
    const handleUserJoined = (data: { userId: string; userRole: string }) => {
      setParticipants(prev => [...prev.filter(p => p.userId !== data.userId), data]);
    };

    const handleUserLeft = (data: { userId: string }) => {
      setParticipants(prev => prev.filter(p => p.userId !== data.userId));
    };

    const handleNewMessage = (message: any) => {
      setMessages(prev => [...prev, message]);
    };

    const handleNewQA = (qa: any) => {
      setQAs(prev => [...prev, qa]);
    };

    const handleQAAnswered = (qa: any) => {
      setQAs(prev => prev.map(q => q.id === qa.id ? qa : q));
    };

    const handleNewPoll = (poll: any) => {
      setPolls(prev => [...prev, poll]);
    };

    const handleSessionStatusUpdate = (data: { sessionId: string; status: string }) => {
      if (data.sessionId === sessionId) {
        setSessionStatus(data.status);
      }
    };

    // Register event listeners
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('new-message', handleNewMessage);
    socket.on('new-qa', handleNewQA);
    socket.on('qa-answered', handleQAAnswered);
    socket.on('new-poll', handleNewPoll);
    socket.on('session-status-updated', handleSessionStatusUpdate);

    return () => {
      // Leave session and cleanup
      socket.leaveSession(sessionId);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('new-message', handleNewMessage);
      socket.off('new-qa', handleNewQA);
      socket.off('qa-answered', handleQAAnswered);
      socket.off('new-poll', handleNewPoll);
      socket.off('session-status-updated', handleSessionStatusUpdate);
    };
  }, [socket, isConnected, sessionId]);

  const sendMessage = (message: string, messageType?: 'text' | 'question' | 'answer') => {
    if (socket) {
      socket.sendMessage({ sessionId, message, messageType });
    }
  };

  const createQA = (question: string, isAnonymous?: boolean) => {
    if (socket) {
      socket.createQA({ sessionId, question, isAnonymous });
    }
  };

  const answerQA = (qaId: string, answer: string) => {
    if (socket) {
      socket.answerQA({ qaId, answer, sessionId });
    }
  };

  const createPoll = (data: {
    question: string;
    options: { text: string }[];
    pollType: 'multiple_choice' | 'single_choice' | 'text' | 'rating';
    isAnonymous?: boolean;
    endsAt?: Date;
  }) => {
    if (socket) {
      socket.createPoll({ sessionId, ...data });
    }
  };

  const submitPollResponse = (pollId: string, response: any) => {
    if (socket) {
      socket.submitPollResponse({ pollId, response, sessionId });
    }
  };

  const updateSessionStatus = (status: 'live' | 'completed' | 'cancelled') => {
    if (socket) {
      socket.updateSessionStatus({ sessionId, status });
    }
  };

  return {
    participants,
    messages,
    qas,
    polls,
    sessionStatus,
    sendMessage,
    createQA,
    answerQA,
    createPoll,
    submitPollResponse,
    updateSessionStatus,
    isConnected,
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useSocketEvent('notification', (notification: any) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  });

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}

export function useWalletUpdates() {
  const [balance, setBalance] = useState<number>(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useSocketEvent('wallet-update', (data: { balance: number; transaction: any }) => {
    setBalance(data.balance);
    if (data.transaction) {
      setRecentTransactions(prev => [data.transaction, ...prev.slice(0, 9)]);
    }
  });

  return {
    balance,
    recentTransactions,
  };
}

export function useAnalyticsUpdates() {
  const [analyticsData, setAnalyticsData] = useState<any>({});

  useSocketEvent('analytics-update', (data: any) => {
    setAnalyticsData(prev => ({ ...prev, ...data }));
  });

  return analyticsData;
}