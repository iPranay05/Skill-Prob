import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { SocketServer } from '../../lib/socketServer';
import { LiveSessionService } from '../../lib/liveSessionService';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('socket.io');
jest.mock('../../lib/liveSessionService');
jest.mock('jsonwebtoken');

const mockSocketIO = SocketIOServer as jest.MockedClass<typeof SocketIOServer>;
const mockLiveSessionService = LiveSessionService as jest.MockedClass<typeof LiveSessionService>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('SocketServer', () => {
  let socketServer: SocketServer;
  let mockHttpServer: HTTPServer;
  let mockIo: any;
  let mockSocket: any;
  let mockLiveSessionServiceInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock HTTP server
    mockHttpServer = {} as HTTPServer;

    // Mock Socket.IO instance
    mockIo = {
      use: jest.fn(),
      on: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    // Mock Socket instance
    mockSocket = {
      id: 'socket-123',
      userId: 'user-123',
      userRole: 'student',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      broadcast: {
        emit: jest.fn(),
      },
      on: jest.fn(),
      handshake: {
        auth: {
          token: 'valid-token',
        },
      },
    };

    // Mock LiveSessionService instance
    mockLiveSessionServiceInstance = {
      getSessionById: jest.fn(),
      joinSession: jest.fn(),
      leaveSession: jest.fn(),
      sendChatMessage: jest.fn(),
      createQA: jest.fn(),
      answerQA: jest.fn(),
      createPoll: jest.fn(),
      submitPollResponse: jest.fn(),
      updateLiveSession: jest.fn(),
    };

    mockLiveSessionService.mockImplementation(() => mockLiveSessionServiceInstance);
    mockSocketIO.mockImplementation(() => mockIo);

    // Mock JWT verification
    mockJwt.verify.mockReturnValue({
      userId: 'user-123',
      role: 'student',
    });

    socketServer = new SocketServer(mockHttpServer);
  });

  describe('Authentication Middleware', () => {
    it('should authenticate valid token', () => {
      expect(mockIo.use).toHaveBeenCalledWith(expect.any(Function));

      // Get the middleware function
      const middlewareCall = mockIo.use.mock.calls[0][0];
      const next = jest.fn();

      middlewareCall(mockSocket, next);

      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(mockSocket.userId).toBe('user-123');
      expect(mockSocket.userRole).toBe('student');
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject missing token', () => {
      const socketWithoutToken = {
        ...mockSocket,
        handshake: { auth: {} },
      };

      const middlewareCall = mockIo.use.mock.calls[0][0];
      const next = jest.fn();

      middlewareCall(socketWithoutToken, next);

      expect(next).toHaveBeenCalledWith(new Error('Authentication token required'));
    });

    it('should reject invalid token', () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const middlewareCall = mockIo.use.mock.calls[0][0];
      const next = jest.fn();

      middlewareCall(mockSocket, next);

      expect(next).toHaveBeenCalledWith(new Error('Invalid authentication token'));
    });
  });

  describe('Connection Handling', () => {
    beforeEach(() => {
      // Simulate connection event setup
      const connectionHandler = mockIo.on.mock.calls.find(call => call[0] === 'connection')[1];
      connectionHandler(mockSocket);
    });

    it('should handle join-session event', async () => {
      const mockSession = {
        id: 'session-123',
        title: 'Test Session',
        status: 'scheduled',
      };

      mockLiveSessionServiceInstance.getSessionById.mockResolvedValue(mockSession);
      mockLiveSessionServiceInstance.joinSession.mockResolvedValue({
        id: 'attendance-123',
        sessionId: 'session-123',
        studentId: 'user-123',
        status: 'joined',
      });

      // Find and call the join-session handler
      const joinSessionHandler = mockSocket.on.mock.calls.find(call => call[0] === 'join-session')[1];
      await joinSessionHandler({ sessionId: 'session-123' });

      expect(mockLiveSessionServiceInstance.getSessionById).toHaveBeenCalledWith('session-123');
      expect(mockSocket.join).toHaveBeenCalledWith('session-session-123');
      expect(mockLiveSessionServiceInstance.joinSession).toHaveBeenCalledWith({
        sessionId: 'session-123',
        studentId: 'user-123',
      });
      expect(mockSocket.emit).toHaveBeenCalledWith('session-joined', { sessionId: 'session-123' });
    });

    it('should handle session not found error', async () => {
      mockLiveSessionServiceInstance.getSessionById.mockResolvedValue(null);

      const joinSessionHandler = mockSocket.on.mock.calls.find(call => call[0] === 'join-session')[1];
      await joinSessionHandler({ sessionId: 'invalid-session' });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Session not found' });
    });

    it('should handle send-message event', async () => {
      const mockChatMessage = {
        id: 'message-123',
        sessionId: 'session-123',
        userId: 'user-123',
        message: 'Hello everyone!',
        messageType: 'text',
        createdAt: new Date(),
      };

      mockLiveSessionServiceInstance.sendChatMessage.mockResolvedValue(mockChatMessage);

      const sendMessageHandler = mockSocket.on.mock.calls.find(call => call[0] === 'send-message')[1];
      await sendMessageHandler({
        sessionId: 'session-123',
        message: 'Hello everyone!',
        messageType: 'text',
      });

      expect(mockLiveSessionServiceInstance.sendChatMessage).toHaveBeenCalledWith({
        sessionId: 'session-123',
        userId: 'user-123',
        message: 'Hello everyone!',
        messageType: 'text',
        isPrivate: undefined,
        repliedTo: undefined,
      });

      expect(mockIo.to).toHaveBeenCalledWith('session-session-123');
      expect(mockIo.emit).toHaveBeenCalledWith('new-message', mockChatMessage);
    });

    it('should handle create-qa event for students', async () => {
      const mockQA = {
        id: 'qa-123',
        sessionId: 'session-123',
        studentId: 'user-123',
        question: 'What is the main topic?',
        status: 'pending',
      };

      mockLiveSessionServiceInstance.createQA.mockResolvedValue(mockQA);

      const createQAHandler = mockSocket.on.mock.calls.find(call => call[0] === 'create-qa')[1];
      await createQAHandler({
        sessionId: 'session-123',
        question: 'What is the main topic?',
        isAnonymous: false,
      });

      expect(mockLiveSessionServiceInstance.createQA).toHaveBeenCalledWith({
        sessionId: 'session-123',
        studentId: 'user-123',
        question: 'What is the main topic?',
        isAnonymous: false,
      });

      expect(mockIo.to).toHaveBeenCalledWith('session-session-123');
      expect(mockIo.emit).toHaveBeenCalledWith('new-qa', mockQA);
    });

    it('should reject Q&A creation for non-students', async () => {
      mockSocket.userRole = 'mentor';

      const createQAHandler = mockSocket.on.mock.calls.find(call => call[0] === 'create-qa')[1];
      await createQAHandler({
        sessionId: 'session-123',
        question: 'What is the main topic?',
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Only students can ask questions',
      });
      expect(mockLiveSessionServiceInstance.createQA).not.toHaveBeenCalled();
    });

    it('should handle answer-qa event for mentors', async () => {
      mockSocket.userRole = 'mentor';

      const mockAnsweredQA = {
        id: 'qa-123',
        sessionId: 'session-123',
        question: 'What is the main topic?',
        answer: 'The main topic is live sessions',
        answeredBy: 'user-123',
        status: 'answered',
      };

      mockLiveSessionServiceInstance.answerQA.mockResolvedValue(mockAnsweredQA);

      const answerQAHandler = mockSocket.on.mock.calls.find(call => call[0] === 'answer-qa')[1];
      await answerQAHandler({
        qaId: 'qa-123',
        answer: 'The main topic is live sessions',
        sessionId: 'session-123',
      });

      expect(mockLiveSessionServiceInstance.answerQA).toHaveBeenCalledWith({
        qaId: 'qa-123',
        answer: 'The main topic is live sessions',
        answeredBy: 'user-123',
      });

      expect(mockIo.to).toHaveBeenCalledWith('session-session-123');
      expect(mockIo.emit).toHaveBeenCalledWith('qa-answered', mockAnsweredQA);
    });

    it('should reject Q&A answering for non-mentors', async () => {
      mockSocket.userRole = 'student';

      const answerQAHandler = mockSocket.on.mock.calls.find(call => call[0] === 'answer-qa')[1];
      await answerQAHandler({
        qaId: 'qa-123',
        answer: 'Some answer',
        sessionId: 'session-123',
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Only mentors can answer questions',
      });
      expect(mockLiveSessionServiceInstance.answerQA).not.toHaveBeenCalled();
    });

    it('should handle create-poll event for mentors', async () => {
      mockSocket.userRole = 'mentor';

      const mockPoll = {
        id: 'poll-123',
        sessionId: 'session-123',
        createdBy: 'user-123',
        question: 'What is your favorite language?',
        options: [
          { id: '0', text: 'JavaScript' },
          { id: '1', text: 'Python' },
        ],
        pollType: 'single_choice',
      };

      mockLiveSessionServiceInstance.createPoll.mockResolvedValue(mockPoll);

      const createPollHandler = mockSocket.on.mock.calls.find(call => call[0] === 'create-poll')[1];
      await createPollHandler({
        sessionId: 'session-123',
        question: 'What is your favorite language?',
        options: [{ text: 'JavaScript' }, { text: 'Python' }],
        pollType: 'single_choice',
        isAnonymous: true,
      });

      expect(mockLiveSessionServiceInstance.createPoll).toHaveBeenCalledWith({
        sessionId: 'session-123',
        createdBy: 'user-123',
        question: 'What is your favorite language?',
        options: [{ text: 'JavaScript' }, { text: 'Python' }],
        pollType: 'single_choice',
        isAnonymous: true,
        endsAt: undefined,
      });

      expect(mockIo.to).toHaveBeenCalledWith('session-session-123');
      expect(mockIo.emit).toHaveBeenCalledWith('new-poll', mockPoll);
    });

    it('should handle submit-poll-response event', async () => {
      const mockPollResponse = {
        id: 'response-123',
        pollId: 'poll-123',
        userId: 'user-123',
        response: { selectedOption: '0' },
      };

      mockLiveSessionServiceInstance.submitPollResponse.mockResolvedValue(mockPollResponse);

      const submitPollResponseHandler = mockSocket.on.mock.calls.find(call => call[0] === 'submit-poll-response')[1];
      await submitPollResponseHandler({
        pollId: 'poll-123',
        response: { selectedOption: '0' },
        sessionId: 'session-123',
      });

      expect(mockLiveSessionServiceInstance.submitPollResponse).toHaveBeenCalledWith({
        pollId: 'poll-123',
        userId: 'user-123',
        response: { selectedOption: '0' },
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('poll-response-success', { pollId: 'poll-123' });
    });

    it('should handle update-session-status event for mentors', async () => {
      mockSocket.userRole = 'mentor';

      mockLiveSessionServiceInstance.updateLiveSession.mockResolvedValue({});

      const updateSessionStatusHandler = mockSocket.on.mock.calls.find(call => call[0] === 'update-session-status')[1];
      await updateSessionStatusHandler({
        sessionId: 'session-123',
        status: 'live',
      });

      expect(mockLiveSessionServiceInstance.updateLiveSession).toHaveBeenCalledWith(
        'session-123',
        'user-123',
        { status: 'live' }
      );

      expect(mockIo.to).toHaveBeenCalledWith('session-session-123');
      expect(mockIo.emit).toHaveBeenCalledWith('session-status-updated', {
        sessionId: 'session-123',
        status: 'live',
      });
    });

    it('should handle leave-session event', async () => {
      mockLiveSessionServiceInstance.leaveSession.mockResolvedValue(undefined);

      const leaveSessionHandler = mockSocket.on.mock.calls.find(call => call[0] === 'leave-session')[1];
      await leaveSessionHandler({ sessionId: 'session-123' });

      expect(mockSocket.leave).toHaveBeenCalledWith('session-session-123');
      expect(mockLiveSessionServiceInstance.leaveSession).toHaveBeenCalledWith('session-123', 'user-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('session-left', { sessionId: 'session-123' });
    });

    it('should handle errors gracefully', async () => {
      mockLiveSessionServiceInstance.getSessionById.mockRejectedValue(new Error('Database error'));

      const joinSessionHandler = mockSocket.on.mock.calls.find(call => call[0] === 'join-session')[1];
      await joinSessionHandler({ sessionId: 'session-123' });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Failed to join session' });
    });
  });
});