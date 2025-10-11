import { renderHook, act } from '@testing-library/react';
import { useSocket, useSocketEvent, useLiveSession, useNotifications, useWalletUpdates } from '../../hooks/useSocket';
import { getSocketClient } from '../../lib/socketClient';

// Mock the socket client
jest.mock('../../lib/socketClient', () => ({
  getSocketClient: jest.fn(),
}));

const mockGetSocketClient = getSocketClient as jest.MockedFunction<typeof getSocketClient>;

describe('useSocket', () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    isConnected: jest.fn(),
    joinSession: jest.fn(),
    leaveSession: jest.fn(),
    sendMessage: jest.fn(),
    createQA: jest.fn(),
    answerQA: jest.fn(),
    createPoll: jest.fn(),
    submitPollResponse: jest.fn(),
    updateSessionStatus: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSocketClient.mockReturnValue(mockSocket as any);
    mockSocket.isConnected.mockReturnValue(true);
  });

  it('initializes socket client and returns connection status', () => {
    const { result } = renderHook(() => useSocket());
    
    expect(mockGetSocketClient).toHaveBeenCalled();
    expect(result.current.socket).toBe(mockSocket);
    expect(result.current.isConnected).toBe(true);
  });

  it('updates connection status when socket connects/disconnects', () => {
    mockSocket.isConnected.mockReturnValue(false);
    
    const { result } = renderHook(() => useSocket());
    
    expect(result.current.isConnected).toBe(false);
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useSocket());
    
    unmount();
    
    expect(mockSocket.off).toHaveBeenCalled();
  });
});

describe('useSocketEvent', () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    isConnected: jest.fn().mockReturnValue(true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSocketClient.mockReturnValue(mockSocket as any);
  });

  it('registers event listener on mount', () => {
    const callback = jest.fn();
    
    renderHook(() => useSocketEvent('test-event', callback));
    
    expect(mockSocket.on).toHaveBeenCalledWith('test-event', expect.any(Function));
  });

  it('removes event listener on unmount', () => {
    const callback = jest.fn();
    
    const { unmount } = renderHook(() => useSocketEvent('test-event', callback));
    
    unmount();
    
    expect(mockSocket.off).toHaveBeenCalledWith('test-event', expect.any(Function));
  });

  it('re-registers listener when dependencies change', () => {
    const callback = jest.fn();
    let dep = 'initial';
    
    const { rerender } = renderHook(() => useSocketEvent('test-event', callback, [dep]));
    
    expect(mockSocket.on).toHaveBeenCalledTimes(1);
    
    dep = 'changed';
    rerender();
    
    expect(mockSocket.off).toHaveBeenCalled();
    expect(mockSocket.on).toHaveBeenCalledTimes(2);
  });
});

describe('useLiveSession', () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    isConnected: jest.fn().mockReturnValue(true),
    joinSession: jest.fn(),
    leaveSession: jest.fn(),
    sendMessage: jest.fn(),
    createQA: jest.fn(),
    answerQA: jest.fn(),
    createPoll: jest.fn(),
    submitPollResponse: jest.fn(),
    updateSessionStatus: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSocketClient.mockReturnValue(mockSocket as any);
  });

  it('joins session on mount and leaves on unmount', () => {
    const sessionId = 'session-123';
    
    const { unmount } = renderHook(() => useLiveSession(sessionId));
    
    expect(mockSocket.joinSession).toHaveBeenCalledWith(sessionId);
    
    unmount();
    
    expect(mockSocket.leaveSession).toHaveBeenCalledWith(sessionId);
  });

  it('does not join session when not connected', () => {
    mockSocket.isConnected.mockReturnValue(false);
    
    renderHook(() => useLiveSession('session-123'));
    
    expect(mockSocket.joinSession).not.toHaveBeenCalled();
  });

  it('provides session interaction methods', () => {
    const { result } = renderHook(() => useLiveSession('session-123'));
    
    // Test sendMessage
    act(() => {
      result.current.sendMessage('Hello', 'text');
    });
    expect(mockSocket.sendMessage).toHaveBeenCalledWith({
      sessionId: 'session-123',
      message: 'Hello',
      messageType: 'text',
    });

    // Test createQA
    act(() => {
      result.current.createQA('Question?', true);
    });
    expect(mockSocket.createQA).toHaveBeenCalledWith({
      sessionId: 'session-123',
      question: 'Question?',
      isAnonymous: true,
    });

    // Test answerQA
    act(() => {
      result.current.answerQA('qa-1', 'Answer');
    });
    expect(mockSocket.answerQA).toHaveBeenCalledWith({
      qaId: 'qa-1',
      answer: 'Answer',
      sessionId: 'session-123',
    });
  });

  it('updates state when receiving socket events', () => {
    let eventHandlers: { [key: string]: Function } = {};
    
    mockSocket.on.mockImplementation((event: string, handler: Function) => {
      eventHandlers[event] = handler;
    });

    const { result } = renderHook(() => useLiveSession('session-123'));
    
    // Simulate user joined event
    act(() => {
      eventHandlers['user-joined']({ userId: 'user-1', userRole: 'student' });
    });
    
    expect(result.current.participants).toContainEqual({ userId: 'user-1', userRole: 'student' });
    
    // Simulate new message event
    const message = { id: '1', content: 'Hello' };
    act(() => {
      eventHandlers['new-message'](message);
    });
    
    expect(result.current.messages).toContainEqual(message);
  });
});

describe('useNotifications', () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    isConnected: jest.fn().mockReturnValue(true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSocketClient.mockReturnValue(mockSocket as any);
  });

  it('initializes with empty notifications', () => {
    const { result } = renderHook(() => useNotifications());
    
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('adds new notifications and updates unread count', () => {
    let eventHandler: Function;
    
    mockSocket.on.mockImplementation((event: string, handler: Function) => {
      if (event === 'notification') {
        eventHandler = handler;
      }
    });

    const { result } = renderHook(() => useNotifications());
    
    const notification = { id: '1', title: 'Test', message: 'Test message' };
    
    act(() => {
      eventHandler!(notification);
    });
    
    expect(result.current.notifications).toContainEqual(notification);
    expect(result.current.unreadCount).toBe(1);
  });

  it('marks notifications as read', () => {
    let eventHandler: Function;
    
    mockSocket.on.mockImplementation((event: string, handler: Function) => {
      if (event === 'notification') {
        eventHandler = handler;
      }
    });

    const { result } = renderHook(() => useNotifications());
    
    const notification = { id: '1', title: 'Test', message: 'Test message' };
    
    act(() => {
      eventHandler!(notification);
    });
    
    act(() => {
      result.current.markAsRead('1');
    });
    
    expect(result.current.notifications[0].read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it('marks all notifications as read', () => {
    let eventHandler: Function;
    
    mockSocket.on.mockImplementation((event: string, handler: Function) => {
      if (event === 'notification') {
        eventHandler = handler;
      }
    });

    const { result } = renderHook(() => useNotifications());
    
    // Add multiple notifications
    act(() => {
      eventHandler!({ id: '1', title: 'Test 1', message: 'Message 1' });
      eventHandler!({ id: '2', title: 'Test 2', message: 'Message 2' });
    });
    
    expect(result.current.unreadCount).toBe(2);
    
    act(() => {
      result.current.markAllAsRead();
    });
    
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every(n => n.read)).toBe(true);
  });
});

describe('useWalletUpdates', () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    isConnected: jest.fn().mockReturnValue(true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSocketClient.mockReturnValue(mockSocket as any);
  });

  it('initializes with zero balance and empty transactions', () => {
    const { result } = renderHook(() => useWalletUpdates());
    
    expect(result.current.balance).toBe(0);
    expect(result.current.recentTransactions).toEqual([]);
  });

  it('updates balance and transactions on wallet update events', () => {
    let eventHandler: Function;
    
    mockSocket.on.mockImplementation((event: string, handler: Function) => {
      if (event === 'wallet-update') {
        eventHandler = handler;
      }
    });

    const { result } = renderHook(() => useWalletUpdates());
    
    const walletUpdate = {
      balance: 1000,
      transaction: { id: '1', amount: 500, description: 'Test transaction' },
    };
    
    act(() => {
      eventHandler!(walletUpdate);
    });
    
    expect(result.current.balance).toBe(1000);
    expect(result.current.recentTransactions).toContainEqual(walletUpdate.transaction);
  });

  it('limits recent transactions to 10', () => {
    let eventHandler: Function;
    
    mockSocket.on.mockImplementation((event: string, handler: Function) => {
      if (event === 'wallet-update') {
        eventHandler = handler;
      }
    });

    const { result } = renderHook(() => useWalletUpdates());
    
    // Add 12 transactions
    for (let i = 1; i <= 12; i++) {
      act(() => {
        eventHandler!({
          balance: i * 100,
          transaction: { id: `${i}`, amount: 100, description: `Transaction ${i}` },
        });
      });
    }
    
    expect(result.current.recentTransactions).toHaveLength(10);
    expect(result.current.recentTransactions[0].id).toBe('12'); // Most recent first
    expect(result.current.recentTransactions[9].id).toBe('3'); // 10th most recent
  });
});