import { io, Socket } from 'socket.io-client';

interface SocketClientEvents {
  // Session events
  'session-joined': (data: { sessionId: string }) => void;
  'session-left': (data: { sessionId: string }) => void;
  'user-joined': (data: { userId: string; userRole: string }) => void;
  'user-left': (data: { userId: string; userRole: string }) => void;
  'session-status-updated': (data: { sessionId: string; status: string }) => void;

  // Chat events
  'new-message': (message: any) => void;
  'new-qa': (qa: any) => void;
  'qa-answered': (qa: any) => void;

  // Poll events
  'new-poll': (poll: any) => void;
  'poll-response-submitted': (data: { pollId: string; responseCount: number }) => void;
  'poll-response-success': (data: { pollId: string }) => void;

  // Notification events
  'notification': (notification: any) => void;
  'wallet-update': (data: { balance: number; transaction: any }) => void;
  'application-status-change': (data: { applicationId: string; status: string }) => void;

  // Analytics events
  'analytics-update': (data: any) => void;

  // Error events
  'error': (error: { message: string }) => void;
}

export class SocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    // Get token from localStorage or session storage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }

    if (!this.token) {
      console.warn('No authentication token found for socket connection');
      return;
    }

    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
      auth: {
        token: this.token,
      },
      autoConnect: false,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });

    // Set up all event listeners
    const events: (keyof SocketClientEvents)[] = [
      'session-joined',
      'session-left',
      'user-joined',
      'user-left',
      'session-status-updated',
      'new-message',
      'new-qa',
      'qa-answered',
      'new-poll',
      'poll-response-submitted',
      'poll-response-success',
      'notification',
      'wallet-update',
      'application-status-change',
      'analytics-update',
    ];

    events.forEach(event => {
      this.socket!.on(event, (data: any) => {
        this.emit(event, data);
      });
    });
  }

  public connect() {
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    }
  }

  public disconnect() {
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
    }
  }

  public updateToken(token: string) {
    this.token = token;
    if (this.socket) {
      this.socket.auth = { token };
      if (this.socket.connected) {
        this.socket.disconnect();
        this.socket.connect();
      }
    }
  }

  // Session methods
  public joinSession(sessionId: string) {
    this.socket?.emit('join-session', { sessionId });
  }

  public leaveSession(sessionId: string) {
    this.socket?.emit('leave-session', { sessionId });
  }

  public sendMessage(data: {
    sessionId: string;
    message: string;
    messageType?: 'text' | 'question' | 'answer';
    isPrivate?: boolean;
    repliedTo?: string;
  }) {
    this.socket?.emit('send-message', data);
  }

  public createQA(data: {
    sessionId: string;
    question: string;
    isAnonymous?: boolean;
  }) {
    this.socket?.emit('create-qa', data);
  }

  public answerQA(data: {
    qaId: string;
    answer: string;
    sessionId: string;
  }) {
    this.socket?.emit('answer-qa', data);
  }

  public createPoll(data: {
    sessionId: string;
    question: string;
    options: { text: string }[];
    pollType: 'multiple_choice' | 'single_choice' | 'text' | 'rating';
    isAnonymous?: boolean;
    endsAt?: Date;
  }) {
    this.socket?.emit('create-poll', data);
  }

  public submitPollResponse(data: {
    pollId: string;
    response: any;
    sessionId: string;
  }) {
    this.socket?.emit('submit-poll-response', data);
  }

  public updateSessionStatus(data: {
    sessionId: string;
    status: 'live' | 'completed' | 'cancelled';
  }) {
    this.socket?.emit('update-session-status', data);
  }

  // Event listener management
  public on<K extends keyof SocketClientEvents>(
    event: K,
    callback: SocketClientEvents[K]
  ) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off<K extends keyof SocketClientEvents>(
    event: K,
    callback: SocketClientEvents[K]
  ) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit<K extends keyof SocketClientEvents>(
    event: K,
    data: Parameters<SocketClientEvents[K]>[0]
  ) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Global socket client instance
let socketClient: SocketClient | null = null;

export function getSocketClient(): SocketClient {
  if (!socketClient) {
    socketClient = new SocketClient();
  }
  return socketClient;
}

export function initializeSocketClient(token?: string): SocketClient {
  const client = getSocketClient();
  if (token) {
    client.updateToken(token);
  }
  client.connect();
  return client;
}