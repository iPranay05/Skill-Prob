import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { LiveSessionService } from '../../lib/liveSessionService';
import { supabase } from '../../lib/database';

// Mock Google Meet Service for real-time tests
jest.mock('../../lib/googleMeetService');

describe('Live Session Real-time Integration Tests', () => {
  let server: any;
  let io: SocketIOServer;
  let clientSocket: ClientSocket;
  let mentorSocket: ClientSocket;
  let port: number;
  
  // Test data
  const testMentorId = 'realtime-mentor-123';
  const testStudentId = 'realtime-student-123';
  const testCourseId = 'realtime-course-123';
  let testSessionId: string;
  let liveSessionService: LiveSessionService;

  beforeAll(async () => {
    await setupRealtimeTestData();
    
    // Setup Socket.IO server for testing
    server = createServer();
    io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Setup Socket.IO event handlers (simulating real server behavior)
    setupSocketHandlers();

    // Start server
    await new Promise<void>((resolve) => {
      server.listen(() => {
        port = (server.address() as AddressInfo).port;
        resolve();
      });
    });

    // Mock Google Meet Service
    const { createGoogleMeetService } = require('../../lib/googleMeetService');
    const mockGoogleMeetService = {
      createMeeting: jest.fn().mockResolvedValue({
        meetLink: 'https://meet.google.com/realtime-test',
        eventId: 'realtime-event-123',
        calendarEventId: 'realtime-event-123',
      }),
      updateMeeting: jest.fn().mockResolvedValue(undefined),
      cancelMeeting: jest.fn().mockResolvedValue(undefined),
    };
    (createGoogleMeetService as jest.Mock).mockReturnValue(mockGoogleMeetService);

    liveSessionService = new LiveSessionService();

    // Create test session
    const sessionData = {
      courseId: testCourseId,
      title: 'Real-time Test Session',
      description: 'Testing real-time features',
      scheduledStartTime: new Date('2024-12-25T10:00:00Z'),
      scheduledEndTime: new Date('2024-12-25T11:00:00Z'),
      chatEnabled: true,
      qaEnabled: true,
      pollingEnabled: true,
    };

    const session = await liveSessionService.createLiveSession(testMentorId, sessionData);
    testSessionId = session.id;
  });

  afterAll(async () => {
    // Cleanup
    if (clientSocket) clientSocket.disconnect();
    if (mentorSocket) mentorSocket.disconnect();
    if (server) server.close();
    await cleanupRealtimeTestData();
  });

  beforeEach(async () => {
    // Connect client sockets before each test
    clientSocket = Client(`http://localhost:${port}`);
    mentorSocket = Client(`http://localhost:${port}`);

    // Wait for connections
    await Promise.all([
      new Promise<void>((resolve) => clientSocket.on('connect', resolve)),
      new Promise<void>((resolve) => mentorSocket.on('connect', resolve)),
    ]);

    // Join session rooms
    clientSocket.emit('join-session', { 
      sessionId: testSessionId, 
      userId: testStudentId,
      role: 'student'
    });
    
    mentorSocket.emit('join-session', { 
      sessionId: testSessionId, 
      userId: testMentorId,
      role: 'mentor'
    });
  });

  afterEach(() => {
    if (clientSocket) clientSocket.disconnect();
    if (mentorSocket) mentorSocket.disconnect();
  });

  describe('Real-time Chat Features', () => {
    it('should broadcast chat messages to all session participants', async () => {
      const testMessage = 'Hello everyone! This is a real-time test message.';
      
      // Setup message listener on mentor socket
      const mentorMessagePromise = new Promise<any>((resolve) => {
        mentorSocket.on('new-chat-message', resolve);
      });

      // Send message from student
      clientSocket.emit('send-chat-message', {
        sessionId: testSessionId,
        userId: testStudentId,
        message: testMessage,
        messageType: 'text',
        isPrivate: false,
      });

      // Wait for message to be received by mentor
      const receivedMessage = await mentorMessagePromise;

      expect(receivedMessage).toBeDefined();
      expect(receivedMessage.message).toBe(testMessage);
      expect(receivedMessage.userId).toBe(testStudentId);
      expect(receivedMessage.messageType).toBe('text');
    });

    it('should handle private messages correctly', async () => {
      const privateMessage = 'This is a private message to the mentor.';
      
      // Setup private message listener on mentor socket
      const mentorPrivateMessagePromise = new Promise<any>((resolve) => {
        mentorSocket.on('private-chat-message', resolve);
      });

      // Send private message from student to mentor
      clientSocket.emit('send-private-message', {
        sessionId: testSessionId,
        fromUserId: testStudentId,
        toUserId: testMentorId,
        message: privateMessage,
        messageType: 'text',
      });

      // Wait for private message to be received by mentor
      const receivedPrivateMessage = await mentorPrivateMessagePromise;

      expect(receivedPrivateMessage).toBeDefined();
      expect(receivedPrivateMessage.message).toBe(privateMessage);
      expect(receivedPrivateMessage.fromUserId).toBe(testStudentId);
      expect(receivedPrivateMessage.isPrivate).toBe(true);
    });

    it('should handle message replies in real-time', async () => {
      // First, send an original message
      const originalMessage = 'Does anyone have questions?';
      
      let originalMessageId: string;
      
      // Listen for the original message
      const originalMessagePromise = new Promise<any>((resolve) => {
        mentorSocket.on('new-chat-message', (msg) => {
          if (msg.message === originalMessage) {
            originalMessageId = msg.id;
            resolve(msg);
          }
        });
      });

      // Send original message from mentor
      mentorSocket.emit('send-chat-message', {
        sessionId: testSessionId,
        userId: testMentorId,
        message: originalMessage,
        messageType: 'text',
        isPrivate: false,
      });

      await originalMessagePromise;

      // Now send a reply
      const replyMessage = 'Yes, I have a question about the integration tests.';
      
      const replyMessagePromise = new Promise<any>((resolve) => {
        mentorSocket.on('new-chat-message', (msg) => {
          if (msg.message === replyMessage) {
            resolve(msg);
          }
        });
      });

      // Send reply from student
      clientSocket.emit('send-chat-message', {
        sessionId: testSessionId,
        userId: testStudentId,
        message: replyMessage,
        messageType: 'text',
        isPrivate: false,
        repliedTo: originalMessageId,
      });

      const receivedReply = await replyMessagePromise;

      expect(receivedReply).toBeDefined();
      expect(receivedReply.message).toBe(replyMessage);
      expect(receivedReply.repliedTo).toBe(originalMessageId);
    });

    it('should handle typing indicators', async () => {
      // Setup typing indicator listener
      const typingPromise = new Promise<any>((resolve) => {
        mentorSocket.on('user-typing', resolve);
      });

      // Send typing indicator from student
      clientSocket.emit('typing-start', {
        sessionId: testSessionId,
        userId: testStudentId,
      });

      const typingIndicator = await typingPromise;

      expect(typingIndicator).toBeDefined();
      expect(typingIndicator.userId).toBe(testStudentId);
      expect(typingIndicator.sessionId).toBe(testSessionId);

      // Test typing stop
      const typingStopPromise = new Promise<any>((resolve) => {
        mentorSocket.on('user-stopped-typing', resolve);
      });

      clientSocket.emit('typing-stop', {
        sessionId: testSessionId,
        userId: testStudentId,
      });

      const typingStopIndicator = await typingStopPromise;

      expect(typingStopIndicator).toBeDefined();
      expect(typingStopIndicator.userId).toBe(testStudentId);
    });
  });

  describe('Real-time Q&A Features', () => {
    it('should broadcast new Q&A questions to mentors', async () => {
      const question = 'What is the difference between unit and integration tests?';
      
      // Setup Q&A listener on mentor socket
      const qaPromise = new Promise<any>((resolve) => {
        mentorSocket.on('new-qa-question', resolve);
      });

      // Send Q&A question from student
      clientSocket.emit('submit-qa-question', {
        sessionId: testSessionId,
        studentId: testStudentId,
        question: question,
        isAnonymous: false,
      });

      const receivedQA = await qaPromise;

      expect(receivedQA).toBeDefined();
      expect(receivedQA.question).toBe(question);
      expect(receivedQA.studentId).toBe(testStudentId);
      expect(receivedQA.isAnonymous).toBe(false);
    });

    it('should broadcast Q&A answers to all participants', async () => {
      // First create a Q&A question
      const qaData = await liveSessionService.createQA({
        sessionId: testSessionId,
        studentId: testStudentId,
        question: 'Can you explain the testing pyramid?',
        isAnonymous: false,
      });

      const answer = 'The testing pyramid shows that you should have more unit tests at the base, fewer integration tests in the middle, and even fewer end-to-end tests at the top.';
      
      // Setup answer listener on student socket
      const answerPromise = new Promise<any>((resolve) => {
        clientSocket.on('qa-answered', resolve);
      });

      // Send answer from mentor
      mentorSocket.emit('answer-qa-question', {
        qaId: qaData.id,
        answer: answer,
        answeredBy: testMentorId,
      });

      const receivedAnswer = await answerPromise;

      expect(receivedAnswer).toBeDefined();
      expect(receivedAnswer.answer).toBe(answer);
      expect(receivedAnswer.answeredBy).toBe(testMentorId);
      expect(receivedAnswer.qaId).toBe(qaData.id);
    });

    it('should handle anonymous Q&A questions', async () => {
      const anonymousQuestion = 'I\'m confused about mocking. Can you explain?';
      
      // Setup anonymous Q&A listener
      const anonymousQAPromise = new Promise<any>((resolve) => {
        mentorSocket.on('new-qa-question', resolve);
      });

      // Send anonymous Q&A question
      clientSocket.emit('submit-qa-question', {
        sessionId: testSessionId,
        studentId: testStudentId,
        question: anonymousQuestion,
        isAnonymous: true,
      });

      const receivedAnonymousQA = await anonymousQAPromise;

      expect(receivedAnonymousQA).toBeDefined();
      expect(receivedAnonymousQA.question).toBe(anonymousQuestion);
      expect(receivedAnonymousQA.isAnonymous).toBe(true);
      // Student ID should not be exposed for anonymous questions
      expect(receivedAnonymousQA.studentId).toBeUndefined();
    });
  });

  describe('Real-time Polling Features', () => {
    it('should broadcast new polls to all participants', async () => {
      const pollQuestion = 'Which testing framework do you prefer?';
      const pollOptions = [
        { text: 'Jest' },
        { text: 'Mocha' },
        { text: 'Jasmine' },
        { text: 'Vitest' },
      ];
      
      // Setup poll listener on student socket
      const pollPromise = new Promise<any>((resolve) => {
        clientSocket.on('new-poll', resolve);
      });

      // Create poll from mentor
      mentorSocket.emit('create-poll', {
        sessionId: testSessionId,
        createdBy: testMentorId,
        question: pollQuestion,
        options: pollOptions,
        pollType: 'single_choice',
        isAnonymous: true,
      });

      const receivedPoll = await pollPromise;

      expect(receivedPoll).toBeDefined();
      expect(receivedPoll.question).toBe(pollQuestion);
      expect(receivedPoll.options).toHaveLength(4);
      expect(receivedPoll.pollType).toBe('single_choice');
    });

    it('should broadcast poll responses in real-time', async () => {
      // First create a poll
      const pollData = await liveSessionService.createPoll({
        sessionId: testSessionId,
        createdBy: testMentorId,
        question: 'How confident are you with testing?',
        options: [
          { text: 'Very confident' },
          { text: 'Somewhat confident' },
          { text: 'Not confident' },
        ],
        pollType: 'single_choice',
        isAnonymous: true,
      });

      // Setup poll response listener on mentor socket
      const responsePromise = new Promise<any>((resolve) => {
        mentorSocket.on('poll-response-update', resolve);
      });

      // Submit poll response from student
      clientSocket.emit('submit-poll-response', {
        pollId: pollData.id,
        userId: testStudentId,
        response: { selectedOption: '1' }, // Somewhat confident
      });

      const responseUpdate = await responsePromise;

      expect(responseUpdate).toBeDefined();
      expect(responseUpdate.pollId).toBe(pollData.id);
      expect(responseUpdate.totalResponses).toBeGreaterThan(0);
    });

    it('should handle poll closing in real-time', async () => {
      // Create a poll
      const pollData = await liveSessionService.createPoll({
        sessionId: testSessionId,
        createdBy: testMentorId,
        question: 'Should we take a break?',
        options: [
          { text: 'Yes' },
          { text: 'No' },
        ],
        pollType: 'single_choice',
        isAnonymous: true,
      });

      // Setup poll closed listener
      const pollClosedPromise = new Promise<any>((resolve) => {
        clientSocket.on('poll-closed', resolve);
      });

      // Close poll from mentor
      mentorSocket.emit('close-poll', {
        pollId: pollData.id,
        sessionId: testSessionId,
      });

      const pollClosedEvent = await pollClosedPromise;

      expect(pollClosedEvent).toBeDefined();
      expect(pollClosedEvent.pollId).toBe(pollData.id);
    });
  });

  describe('Session Attendance Real-time Updates', () => {
    it('should broadcast when users join the session', async () => {
      const newStudentId = 'realtime-new-student-456';
      
      // Setup user joined listener
      const userJoinedPromise = new Promise<any>((resolve) => {
        mentorSocket.on('user-joined-session', resolve);
      });

      // Simulate new user joining
      const newClientSocket = Client(`http://localhost:${port}`);
      
      await new Promise<void>((resolve) => {
        newClientSocket.on('connect', resolve);
      });

      newClientSocket.emit('join-session', {
        sessionId: testSessionId,
        userId: newStudentId,
        role: 'student',
      });

      const userJoinedEvent = await userJoinedPromise;

      expect(userJoinedEvent).toBeDefined();
      expect(userJoinedEvent.userId).toBe(newStudentId);
      expect(userJoinedEvent.sessionId).toBe(testSessionId);

      newClientSocket.disconnect();
    });

    it('should broadcast when users leave the session', async () => {
      // Setup user left listener
      const userLeftPromise = new Promise<any>((resolve) => {
        mentorSocket.on('user-left-session', resolve);
      });

      // Simulate user leaving by disconnecting
      clientSocket.emit('leave-session', {
        sessionId: testSessionId,
        userId: testStudentId,
      });

      const userLeftEvent = await userLeftPromise;

      expect(userLeftEvent).toBeDefined();
      expect(userLeftEvent.userId).toBe(testStudentId);
      expect(userLeftEvent.sessionId).toBe(testSessionId);
    });

    it('should provide real-time attendance count updates', async () => {
      // Setup attendance update listener
      const attendanceUpdatePromise = new Promise<any>((resolve) => {
        mentorSocket.on('attendance-update', resolve);
      });

      // Trigger attendance update
      mentorSocket.emit('request-attendance-update', {
        sessionId: testSessionId,
      });

      const attendanceUpdate = await attendanceUpdatePromise;

      expect(attendanceUpdate).toBeDefined();
      expect(attendanceUpdate.sessionId).toBe(testSessionId);
      expect(attendanceUpdate.currentAttendees).toBeGreaterThanOrEqual(0);
    });
  });

  // Setup Socket.IO event handlers (simulating real server behavior)
  function setupSocketHandlers() {
    io.on('connection', (socket) => {
      // Join session room
      socket.on('join-session', (data) => {
        socket.join(`session-${data.sessionId}`);
        socket.to(`session-${data.sessionId}`).emit('user-joined-session', {
          userId: data.userId,
          sessionId: data.sessionId,
          role: data.role,
        });
      });

      // Leave session room
      socket.on('leave-session', (data) => {
        socket.leave(`session-${data.sessionId}`);
        socket.to(`session-${data.sessionId}`).emit('user-left-session', {
          userId: data.userId,
          sessionId: data.sessionId,
        });
      });

      // Chat message handling
      socket.on('send-chat-message', async (data) => {
        try {
          const message = await liveSessionService.sendChatMessage(data);
          io.to(`session-${data.sessionId}`).emit('new-chat-message', message);
        } catch (error) {
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Private message handling
      socket.on('send-private-message', (data) => {
        const privateMessage = {
          ...data,
          isPrivate: true,
          id: `private-${Date.now()}`,
          createdAt: new Date(),
        };
        
        // Send to specific user
        io.sockets.sockets.forEach((clientSocket) => {
          // In a real implementation, you'd track user-socket mapping
          if (clientSocket.id !== socket.id) {
            clientSocket.emit('private-chat-message', privateMessage);
          }
        });
      });

      // Typing indicators
      socket.on('typing-start', (data) => {
        socket.to(`session-${data.sessionId}`).emit('user-typing', data);
      });

      socket.on('typing-stop', (data) => {
        socket.to(`session-${data.sessionId}`).emit('user-stopped-typing', data);
      });

      // Q&A handling
      socket.on('submit-qa-question', async (data) => {
        try {
          const qa = await liveSessionService.createQA(data);
          const qaEvent = data.isAnonymous 
            ? { ...qa, studentId: undefined }
            : qa;
          io.to(`session-${data.sessionId}`).emit('new-qa-question', qaEvent);
        } catch (error) {
          socket.emit('error', { message: 'Failed to submit question' });
        }
      });

      socket.on('answer-qa-question', async (data) => {
        try {
          const answeredQA = await liveSessionService.answerQA(data);
          io.to(`session-${answeredQA.sessionId}`).emit('qa-answered', answeredQA);
        } catch (error) {
          socket.emit('error', { message: 'Failed to answer question' });
        }
      });

      // Poll handling
      socket.on('create-poll', async (data) => {
        try {
          const poll = await liveSessionService.createPoll(data);
          io.to(`session-${data.sessionId}`).emit('new-poll', poll);
        } catch (error) {
          socket.emit('error', { message: 'Failed to create poll' });
        }
      });

      socket.on('submit-poll-response', async (data) => {
        try {
          await liveSessionService.submitPollResponse(data);
          // Emit response update (in real implementation, you'd calculate totals)
          io.to(`session-${testSessionId}`).emit('poll-response-update', {
            pollId: data.pollId,
            totalResponses: 1,
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to submit response' });
        }
      });

      socket.on('close-poll', (data) => {
        io.to(`session-${data.sessionId}`).emit('poll-closed', {
          pollId: data.pollId,
        });
      });

      // Attendance updates
      socket.on('request-attendance-update', (data) => {
        // In real implementation, you'd query actual attendance
        socket.emit('attendance-update', {
          sessionId: data.sessionId,
          currentAttendees: 2, // Mock count
        });
      });
    });
  }

  // Helper functions for real-time test setup and cleanup
  async function setupRealtimeTestData() {
    // Create test mentor
    await supabase.from('users').upsert({
      id: testMentorId,
      email: 'realtime-mentor@example.com',
      password_hash: 'hashed_password',
      role: 'mentor',
      first_name: 'Realtime',
      last_name: 'Mentor',
      email_verified: true,
    });

    // Create test student
    await supabase.from('users').upsert({
      id: testStudentId,
      email: 'realtime-student@example.com',
      password_hash: 'hashed_password',
      role: 'student',
      first_name: 'Realtime',
      last_name: 'Student',
      email_verified: true,
    });

    // Create test course
    await supabase.from('courses').upsert({
      id: testCourseId,
      mentor_id: testMentorId,
      title: 'Realtime Test Course',
      description: 'Course for real-time integration testing',
      category: 'Technology',
      type: 'live',
      pricing_type: 'one_time',
      price: 99.99,
      currency: 'USD',
      status: 'published',
    });

    // Create enrollment
    await supabase.from('enrollments').upsert({
      course_id: testCourseId,
      student_id: testStudentId,
      status: 'active',
      enrolled_at: new Date().toISOString(),
    });
  }

  async function cleanupRealtimeTestData() {
    // Clean up in reverse order of dependencies
    await supabase.from('poll_responses').delete().neq('id', '');
    await supabase.from('session_polls').delete().neq('id', '');
    await supabase.from('session_qa').delete().neq('id', '');
    await supabase.from('session_chat').delete().neq('id', '');
    await supabase.from('session_attendance').delete().neq('id', '');
    await supabase.from('live_sessions').delete().neq('id', '');
    await supabase.from('enrollments').delete().eq('course_id', testCourseId);
    await supabase.from('courses').delete().eq('id', testCourseId);
    await supabase.from('users').delete().eq('id', testMentorId);
    await supabase.from('users').delete().eq('id', testStudentId);
  }
});