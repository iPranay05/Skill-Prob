import { SocketClient, getSocketClient, initializeSocketClient } from '../../lib/socketClient';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(),
}));

const mockIo = io as jest.MockedFunction<typeof io>;

// Mock localStorage and sessionStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

// Mock window object for Node environment
Object.defineProperty(global, 'window', {
  value: {
    localStorage: mockLocalStorage,
    sessionStorage: mockSessionStorage,
    location: {
      origin: 'http://localhost:3000',
    },
  },
  writable: true,
});

describe('SocketClient', () => {
  const mockSocket = {
    connected: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    auth: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockIo.mockReturnValue(mockSocket as any);
    mockLocalStorage.getItem.mockReturnValue('test-token');
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  it('initializes with token from localStorage', () => {
    new SocketClient();
    
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('authToken');
    expect(mockIo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        auth: { token: 'test-token' },
        autoConnect: false,
      })
    );
  });

  it('falls back to sessionStorage if localStorage is empty', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    mockSessionStorage.getItem.mockReturnValue('session-token');
    
    new SocketClient();
    
    expect(mockSessionStorage.getItem).toHaveBeenCalledWith('authToken');
    expect(mockIo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        auth: { token: 'session-token' },
      })
    );
  });

  it('handles missing token gracefully', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    mockSessionStorage.getItem.mockReturnValue(null);
    
    const client = new SocketClient();
    
    expect(client).toBeDefined();
    // Should not call io when no token is available
    expect(mockIo).not.toHaveBeenCalled();
  });

  it('connects and disconnects socket', () => {
    const client = new SocketClient();
    
    client.connect();
    expect(mockSocket.connect).toHaveBeenCalled();
    
    mockSocket.connected = true;
    client.disconnect();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('updates token and reconnects', () => {
    const client = new SocketClient();
    
    client.updateToken('new-token');
    
    expect(mockSocket.auth).toEqual({ token: 'new-token' });
  });

  it('emits session events correctly', () => {
    const client = new SocketClient();
    
    client.joinSession('session-123');
    expect(mockSocket.emit).toHaveBeenCalledWith('join-session', { sessionId: 'session-123' });
    
    client.leaveSession('session-123');
    expect(mockSocket.emit).toHaveBeenCalledWith('leave-session', { sessionId: 'session-123' });
  });

  it('sends messages with correct parameters', () => {
    const client = new SocketClient();
    
    const messageData = {
      sessionId: 'session-123',
      message: 'Hello world',
      messageType: 'text' as const,
    };
    
    client.sendMessage(messageData);
    expect(mockSocket.emit).toHaveBeenCalledWith('send-message', messageData);
  });

  it('creates Q&A questions', () => {
    const client = new SocketClient();
    
    const qaData = {
      sessionId: 'session-123',
      question: 'What is React?',
      isAnonymous: true,
    };
    
    client.createQA(qaData);
    expect(mockSocket.emit).toHaveBeenCalledWith('create-qa', qaData);
  });

  it('answers Q&A questions', () => {
    const client = new SocketClient();
    
    const answerData = {
      qaId: 'qa-123',
      answer: 'React is a library',
      sessionId: 'session-123',
    };
    
    client.answerQA(answerData);
    expect(mockSocket.emit).toHaveBeenCalledWith('answer-qa', answerData);
  });

  it('creates polls with correct data', () => {
    const client = new SocketClient();
    
    const pollData = {
      sessionId: 'session-123',
      question: 'What is your favorite color?',
      options: [{ text: 'Red' }, { text: 'Blue' }],
      pollType: 'single_choice' as const,
      isAnonymous: false,
    };
    
    client.createPoll(pollData);
    expect(mockSocket.emit).toHaveBeenCalledWith('create-poll', pollData);
  });

  it('submits poll responses', () => {
    const client = new SocketClient();
    
    const responseData = {
      pollId: 'poll-123',
      response: 'Red',
      sessionId: 'session-123',
    };
    
    client.submitPollResponse(responseData);
    expect(mockSocket.emit).toHaveBeenCalledWith('submit-poll-response', responseData);
  });

  it('updates session status', () => {
    const client = new SocketClient();
    
    const statusData = {
      sessionId: 'session-123',
      status: 'completed' as const,
    };
    
    client.updateSessionStatus(statusData);
    expect(mockSocket.emit).toHaveBeenCalledWith('update-session-status', statusData);
  });

  it('manages event listeners correctly', () => {
    const client = new SocketClient();
    const callback = jest.fn();
    
    client.on('new-message', callback);
    client.on('new-message', callback); // Add same callback twice
    
    // Simulate event
    const eventData = { message: 'test' };
    // We need to access the private emit method for testing
    (client as any).emit('new-message', eventData);
    
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith(eventData);
    
    // Remove one instance
    client.off('new-message', callback);
    (client as any).emit('new-message', eventData);
    
    expect(callback).toHaveBeenCalledTimes(3); // Only one more call
  });

  it('returns correct connection status', () => {
    const client = new SocketClient();
    
    mockSocket.connected = false;
    expect(client.isConnected()).toBe(false);
    
    mockSocket.connected = true;
    expect(client.isConnected()).toBe(true);
  });

  it('handles socket events and forwards them to listeners', () => {
    let socketEventHandlers: { [key: string]: Function } = {};
    
    mockSocket.on.mockImplementation((event: string, handler: Function) => {
      socketEventHandlers[event] = handler;
    });

    const client = new SocketClient();
    const messageCallback = jest.fn();
    
    client.on('new-message', messageCallback);
    
    // Simulate socket receiving a message
    const messageData = { id: '1', content: 'Hello' };
    socketEventHandlers['new-message'](messageData);
    
    expect(messageCallback).toHaveBeenCalledWith(messageData);
  });
});

describe('Global socket client functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the global socket client instance
    (global as any).socketClient = null;
  });

  it('getSocketClient returns singleton instance', () => {
    const client1 = getSocketClient();
    const client2 = getSocketClient();
    
    expect(client1).toBe(client2);
  });

  it('initializeSocketClient updates token and connects', () => {
    const mockConnect = jest.fn();
    const mockUpdateToken = jest.fn();
    
    // Mock the SocketClient constructor to return our mock
    jest.spyOn(global, 'SocketClient' as any).mockImplementation(() => ({
      connect: mockConnect,
      updateToken: mockUpdateToken,
    }));

    const client = initializeSocketClient('test-token');
    
    expect(mockUpdateToken).toHaveBeenCalledWith('test-token');
    expect(mockConnect).toHaveBeenCalled();
  });

  it('initializeSocketClient works without token', () => {
    const mockConnect = jest.fn();
    const mockUpdateToken = jest.fn();
    
    jest.spyOn(global, 'SocketClient' as any).mockImplementation(() => ({
      connect: mockConnect,
      updateToken: mockUpdateToken,
    }));

    const client = initializeSocketClient();
    
    expect(mockUpdateToken).not.toHaveBeenCalled();
    expect(mockConnect).toHaveBeenCalled();
  });
});