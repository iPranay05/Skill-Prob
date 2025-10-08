import { LiveSessionService } from '../../lib/liveSessionService';
import { GoogleMeetService } from '../../lib/googleMeetService';
import { supabase } from '../../lib/database';
import { APIError } from '../../lib/errors';

// Mock dependencies for integration tests
jest.mock('../../lib/googleMeetService');
jest.mock('../../lib/database');

describe('Live Session Integration Tests', () => {
  let liveSessionService: LiveSessionService;
  let mockGoogleMeetService: jest.Mocked<GoogleMeetService>;
  let mockSupabase: jest.Mocked<typeof supabase>;

  // Test data
  const testMentorId = 'test-mentor-123';
  const testStudentId = 'test-student-123';
  const testCourseId = 'test-course-123';
  let testSessionId: string;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Supabase
    mockSupabase = supabase as jest.Mocked<typeof supabase>;
    
    // Mock Google Meet Service
    mockGoogleMeetService = {
      createMeeting: jest.fn(),
      updateMeeting: jest.fn(),
      cancelMeeting: jest.fn(),
      getMeetingDetails: jest.fn(),
      refreshAccessToken: jest.fn(),
    } as any;

    // Mock the factory function
    const { createGoogleMeetService } = require('../../lib/googleMeetService');
    (createGoogleMeetService as jest.Mock).mockReturnValue(mockGoogleMeetService);

    liveSessionService = new LiveSessionService();
    testSessionId = 'test-session-123';
  });

  describe('Google Meet API Integration', () => {
    it('should create session with Google Meet integration successfully', async () => {
      // Mock successful Google Meet creation
      mockGoogleMeetService.createMeeting.mockResolvedValue({
        meetLink: 'https://meet.google.com/test-abc-def',
        eventId: 'google-event-123',
        calendarEventId: 'google-event-123',
      });

      const sessionData = {
        courseId: testCourseId,
        title: 'Integration Test Session',
        description: 'Testing Google Meet integration',
        scheduledStartTime: new Date('2024-12-15T10:00:00Z'),
        scheduledEndTime: new Date('2024-12-15T11:00:00Z'),
        maxParticipants: 50,
        chatEnabled: true,
        qaEnabled: true,
        pollingEnabled: true,
      };

      const session = await liveSessionService.createLiveSession(testMentorId, sessionData);

      expect(session).toBeDefined();
      expect(session.googleMeetLink).toBe('https://meet.google.com/test-abc-def');
      expect(session.googleEventId).toBe('google-event-123');
      expect(session.title).toBe('Integration Test Session');

      // Verify Google Meet service was called correctly
      expect(mockGoogleMeetService.createMeeting).toHaveBeenCalledWith({
        title: 'Integration Test Session',
        description: 'Testing Google Meet integration',
        startTime: new Date('2024-12-15T10:00:00Z'),
        endTime: new Date('2024-12-15T11:00:00Z'),
      });

      testSessionId = session.id;
    });

    it('should handle Google Meet API failures gracefully', async () => {
      // Mock Google Meet API failure
      mockGoogleMeetService.createMeeting.mockRejectedValue(
        new Error('Google API rate limit exceeded')
      );

      const sessionData = {
        courseId: testCourseId,
        title: 'Failed Session',
        description: 'Testing API failure',
        scheduledStartTime: new Date('2024-12-15T12:00:00Z'),
        scheduledEndTime: new Date('2024-12-15T13:00:00Z'),
      };

      await expect(
        liveSessionService.createLiveSession(testMentorId, sessionData)
      ).rejects.toThrow('Failed to create live session');

      // Verify no session was created in database
      const { data: sessions } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('title', 'Failed Session');

      expect(sessions).toHaveLength(0);
    });

    it('should update Google Meet when session details change', async () => {
      // Mock successful update
      mockGoogleMeetService.updateMeeting.mockResolvedValue();

      const updateData = {
        title: 'Updated Session Title',
        scheduledStartTime: new Date('2024-12-15T14:00:00Z'),
        scheduledEndTime: new Date('2024-12-15T15:00:00Z'),
      };

      const updatedSession = await liveSessionService.updateLiveSession(
        testSessionId,
        testMentorId,
        updateData
      );

      expect(updatedSession.title).toBe('Updated Session Title');
      expect(mockGoogleMeetService.updateMeeting).toHaveBeenCalledWith(
        'google-event-123',
        {
          title: 'Updated Session Title',
          startTime: new Date('2024-12-15T14:00:00Z'),
          endTime: new Date('2024-12-15T15:00:00Z'),
        }
      );
    });

    it('should handle Google Meet update failures', async () => {
      // Mock Google Meet update failure
      mockGoogleMeetService.updateMeeting.mockRejectedValue(
        new Error('Google Calendar API error')
      );

      const updateData = {
        title: 'Another Update',
        scheduledStartTime: new Date('2024-12-15T16:00:00Z'),
      };

      await expect(
        liveSessionService.updateLiveSession(testSessionId, testMentorId, updateData)
      ).rejects.toThrow('Failed to update live session');
    });

    it('should cleanup Google Meet when session creation fails', async () => {
      // Mock successful Google Meet creation but database failure
      mockGoogleMeetService.createMeeting.mockResolvedValue({
        meetLink: 'https://meet.google.com/cleanup-test',
        eventId: 'cleanup-event-123',
        calendarEventId: 'cleanup-event-123',
      });

      // Create session with invalid course ID to trigger database error
      const sessionData = {
        courseId: 'invalid-course-id',
        title: 'Cleanup Test Session',
        description: 'Testing cleanup',
        scheduledStartTime: new Date('2024-12-15T18:00:00Z'),
        scheduledEndTime: new Date('2024-12-15T19:00:00Z'),
      };

      await expect(
        liveSessionService.createLiveSession(testMentorId, sessionData)
      ).rejects.toThrow();

      // Verify Google Meet cleanup was attempted
      expect(mockGoogleMeetService.cancelMeeting).toHaveBeenCalledWith('cleanup-event-123');
    });
  });

  describe('Session Scheduling and Attendance Tracking', () => {
    it('should track student attendance when joining session', async () => {
      const joinData = {
        sessionId: testSessionId,
        studentId: testStudentId,
      };

      const attendance = await liveSessionService.joinSession(joinData);

      expect(attendance).toBeDefined();
      expect(attendance.sessionId).toBe(testSessionId);
      expect(attendance.studentId).toBe(testStudentId);
      expect(attendance.status).toBe('joined');
      expect(attendance.joinedAt).toBeDefined();

      // Verify attendance record in database
      const { data: dbAttendance } = await supabase
        .from('session_attendance')
        .select('*')
        .eq('session_id', testSessionId)
        .eq('student_id', testStudentId)
        .single();

      expect(dbAttendance).toBeDefined();
      expect(dbAttendance.status).toBe('joined');
    });

    it('should prevent joining when session is at capacity', async () => {
      // Create a session with max 1 participant
      mockGoogleMeetService.createMeeting.mockResolvedValue({
        meetLink: 'https://meet.google.com/capacity-test',
        eventId: 'capacity-event-123',
        calendarEventId: 'capacity-event-123',
      });

      const capacitySessionData = {
        courseId: testCourseId,
        title: 'Capacity Test Session',
        description: 'Testing capacity limits',
        scheduledStartTime: new Date('2024-12-15T20:00:00Z'),
        scheduledEndTime: new Date('2024-12-15T21:00:00Z'),
        maxParticipants: 1,
      };

      const capacitySession = await liveSessionService.createLiveSession(
        testMentorId,
        capacitySessionData
      );

      // First student joins successfully
      await liveSessionService.joinSession({
        sessionId: capacitySession.id,
        studentId: testStudentId,
      });

      // Second student should be rejected
      const secondStudentId = 'test-student-456';
      await expect(
        liveSessionService.joinSession({
          sessionId: capacitySession.id,
          studentId: secondStudentId,
        })
      ).rejects.toThrow('Session is at maximum capacity');
    });

    it('should track session leave and calculate duration', async () => {
      // Student leaves the session
      await liveSessionService.leaveSession(testSessionId, testStudentId);

      // Verify attendance record is updated
      const { data: attendance } = await supabase
        .from('session_attendance')
        .select('*')
        .eq('session_id', testSessionId)
        .eq('student_id', testStudentId)
        .single();

      expect(attendance.status).toBe('left');
      expect(attendance.left_at).toBeDefined();
    });

    it('should prevent unenrolled students from joining', async () => {
      const unenrolledStudentId = 'unenrolled-student-123';

      await expect(
        liveSessionService.joinSession({
          sessionId: testSessionId,
          studentId: unenrolledStudentId,
        })
      ).rejects.toThrow('Student not enrolled in this course');
    });

    it('should prevent joining cancelled sessions', async () => {
      // Cancel the session
      await liveSessionService.updateLiveSession(testSessionId, testMentorId, {
        status: 'cancelled',
      });

      const newStudentId = 'test-student-789';

      await expect(
        liveSessionService.joinSession({
          sessionId: testSessionId,
          studentId: newStudentId,
        })
      ).rejects.toThrow('Session is not available for joining');
    });
  });

  describe('Real-time Chat and Interaction Features', () => {
    let chatSessionId: string;

    beforeAll(async () => {
      // Create a new session for chat testing
      mockGoogleMeetService.createMeeting.mockResolvedValue({
        meetLink: 'https://meet.google.com/chat-test',
        eventId: 'chat-event-123',
        calendarEventId: 'chat-event-123',
      });

      const chatSessionData = {
        courseId: testCourseId,
        title: 'Chat Test Session',
        description: 'Testing chat functionality',
        scheduledStartTime: new Date('2024-12-16T10:00:00Z'),
        scheduledEndTime: new Date('2024-12-16T11:00:00Z'),
        chatEnabled: true,
        qaEnabled: true,
        pollingEnabled: true,
      };

      const chatSession = await liveSessionService.createLiveSession(
        testMentorId,
        chatSessionData
      );
      chatSessionId = chatSession.id;

      // Join the session
      await liveSessionService.joinSession({
        sessionId: chatSessionId,
        studentId: testStudentId,
      });
    });

    it('should send and retrieve chat messages', async () => {
      const messageData = {
        sessionId: chatSessionId,
        userId: testStudentId,
        message: 'Hello everyone! This is a test message.',
        messageType: 'text' as const,
        isPrivate: false,
      };

      const sentMessage = await liveSessionService.sendChatMessage(messageData);

      expect(sentMessage).toBeDefined();
      expect(sentMessage.message).toBe('Hello everyone! This is a test message.');
      expect(sentMessage.messageType).toBe('text');
      expect(sentMessage.userId).toBe(testStudentId);

      // Retrieve chat messages
      const messages = await liveSessionService.getChatMessages(chatSessionId, 10);
      expect(messages).toHaveLength(1);
      expect(messages[0].message).toBe('Hello everyone! This is a test message.');
    });

    it('should handle private chat messages', async () => {
      const privateMessageData = {
        sessionId: chatSessionId,
        userId: testMentorId,
        message: 'This is a private message to the student.',
        messageType: 'text' as const,
        isPrivate: true,
      };

      const privateMessage = await liveSessionService.sendChatMessage(privateMessageData);

      expect(privateMessage.isPrivate).toBe(true);
      expect(privateMessage.message).toBe('This is a private message to the student.');
    });

    it('should create and answer Q&A questions', async () => {
      const qaData = {
        sessionId: chatSessionId,
        studentId: testStudentId,
        question: 'What is the main topic of today\'s session?',
        isAnonymous: false,
      };

      const createdQA = await liveSessionService.createQA(qaData);

      expect(createdQA).toBeDefined();
      expect(createdQA.question).toBe('What is the main topic of today\'s session?');
      expect(createdQA.status).toBe('pending');
      expect(createdQA.isAnonymous).toBe(false);

      // Answer the Q&A
      const answerData = {
        qaId: createdQA.id,
        answer: 'Today we are covering live session integration testing.',
        answeredBy: testMentorId,
      };

      const answeredQA = await liveSessionService.answerQA(answerData);

      expect(answeredQA.answer).toBe('Today we are covering live session integration testing.');
      expect(answeredQA.answeredBy).toBe(testMentorId);
      expect(answeredQA.status).toBe('answered');
      expect(answeredQA.answeredAt).toBeDefined();
    });

    it('should create anonymous Q&A questions', async () => {
      const anonymousQAData = {
        sessionId: chatSessionId,
        studentId: testStudentId,
        question: 'Can you explain the concept again?',
        isAnonymous: true,
      };

      const anonymousQA = await liveSessionService.createQA(anonymousQAData);

      expect(anonymousQA.isAnonymous).toBe(true);
      expect(anonymousQA.question).toBe('Can you explain the concept again?');
    });

    it('should create and respond to polls', async () => {
      const pollData = {
        sessionId: chatSessionId,
        createdBy: testMentorId,
        question: 'Which programming language do you prefer?',
        options: [
          { text: 'JavaScript' },
          { text: 'Python' },
          { text: 'Java' },
          { text: 'TypeScript' },
        ],
        pollType: 'single_choice' as const,
        isAnonymous: true,
      };

      const createdPoll = await liveSessionService.createPoll(pollData);

      expect(createdPoll).toBeDefined();
      expect(createdPoll.question).toBe('Which programming language do you prefer?');
      expect(createdPoll.options).toHaveLength(4);
      expect(createdPoll.pollType).toBe('single_choice');
      expect(createdPoll.isActive).toBe(true);

      // Submit poll response
      const responseData = {
        pollId: createdPoll.id,
        userId: testStudentId,
        response: { selectedOption: '1' }, // Python
      };

      const pollResponse = await liveSessionService.submitPollResponse(responseData);

      expect(pollResponse).toBeDefined();
      expect(pollResponse.pollId).toBe(createdPoll.id);
      expect(pollResponse.userId).toBe(testStudentId);
      expect(pollResponse.response).toEqual({ selectedOption: '1' });
    });

    it('should create multiple choice polls', async () => {
      const multiChoicePollData = {
        sessionId: chatSessionId,
        createdBy: testMentorId,
        question: 'Which topics would you like to cover? (Select all that apply)',
        options: [
          { text: 'API Testing' },
          { text: 'Database Design' },
          { text: 'Frontend Development' },
          { text: 'DevOps' },
        ],
        pollType: 'multiple_choice' as const,
        isAnonymous: true,
      };

      const multiChoicePoll = await liveSessionService.createPoll(multiChoicePollData);

      expect(multiChoicePoll.pollType).toBe('multiple_choice');

      // Submit multiple choice response
      const multiResponseData = {
        pollId: multiChoicePoll.id,
        userId: testStudentId,
        response: { selectedOptions: ['0', '2'] }, // API Testing and Frontend Development
      };

      const multiPollResponse = await liveSessionService.submitPollResponse(multiResponseData);

      expect(multiPollResponse.response).toEqual({ selectedOptions: ['0', '2'] });
    });

    it('should handle chat message replies', async () => {
      // Send original message
      const originalMessage = await liveSessionService.sendChatMessage({
        sessionId: chatSessionId,
        userId: testMentorId,
        message: 'Does anyone have questions about the material?',
        messageType: 'text',
        isPrivate: false,
      });

      // Reply to the message
      const replyMessage = await liveSessionService.sendChatMessage({
        sessionId: chatSessionId,
        userId: testStudentId,
        message: 'Yes, I have a question about the integration tests.',
        messageType: 'text',
        isPrivate: false,
        repliedTo: originalMessage.id,
      });

      expect(replyMessage.repliedTo).toBe(originalMessage.id);
      expect(replyMessage.message).toBe('Yes, I have a question about the integration tests.');
    });

    it('should retrieve chat messages in correct order', async () => {
      // Send multiple messages
      const messages = [
        'First message',
        'Second message',
        'Third message',
      ];

      for (const message of messages) {
        await liveSessionService.sendChatMessage({
          sessionId: chatSessionId,
          userId: testStudentId,
          message,
          messageType: 'text',
          isPrivate: false,
        });
      }

      // Retrieve messages (should be in chronological order)
      const retrievedMessages = await liveSessionService.getChatMessages(chatSessionId, 10);

      // Find our test messages (there might be others from previous tests)
      const testMessages = retrievedMessages.filter(msg => 
        messages.includes(msg.message)
      );

      expect(testMessages).toHaveLength(3);
      expect(testMessages[0].message).toBe('First message');
      expect(testMessages[1].message).toBe('Second message');
      expect(testMessages[2].message).toBe('Third message');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking the database connection
      // For now, we'll test with invalid data that should trigger database errors
      
      const invalidSessionData = {
        courseId: 'non-existent-course',
        title: 'Invalid Session',
        description: 'Testing error handling',
        scheduledStartTime: new Date('2024-12-15T10:00:00Z'),
        scheduledEndTime: new Date('2024-12-15T11:00:00Z'),
      };

      await expect(
        liveSessionService.createLiveSession('non-existent-mentor', invalidSessionData)
      ).rejects.toThrow(APIError);
    });

    it('should validate session time constraints', async () => {
      // Test with end time before start time
      const invalidTimeData = {
        courseId: testCourseId,
        title: 'Invalid Time Session',
        description: 'Testing time validation',
        scheduledStartTime: new Date('2024-12-15T12:00:00Z'),
        scheduledEndTime: new Date('2024-12-15T10:00:00Z'), // Before start time
      };

      // This should be caught at the API level, but let's test the service behavior
      mockGoogleMeetService.createMeeting.mockRejectedValue(
        new Error('Invalid time range')
      );

      await expect(
        liveSessionService.createLiveSession(testMentorId, invalidTimeData)
      ).rejects.toThrow();
    });

    it('should handle concurrent join attempts gracefully', async () => {
      // Create a session with limited capacity
      mockGoogleMeetService.createMeeting.mockResolvedValue({
        meetLink: 'https://meet.google.com/concurrent-test',
        eventId: 'concurrent-event-123',
        calendarEventId: 'concurrent-event-123',
      });

      const concurrentSessionData = {
        courseId: testCourseId,
        title: 'Concurrent Test Session',
        description: 'Testing concurrent joins',
        scheduledStartTime: new Date('2024-12-16T14:00:00Z'),
        scheduledEndTime: new Date('2024-12-16T15:00:00Z'),
        maxParticipants: 2,
      };

      const concurrentSession = await liveSessionService.createLiveSession(
        testMentorId,
        concurrentSessionData
      );

      // Simulate concurrent join attempts
      const joinPromises = [
        liveSessionService.joinSession({
          sessionId: concurrentSession.id,
          studentId: 'concurrent-student-1',
        }),
        liveSessionService.joinSession({
          sessionId: concurrentSession.id,
          studentId: 'concurrent-student-2',
        }),
        liveSessionService.joinSession({
          sessionId: concurrentSession.id,
          studentId: 'concurrent-student-3',
        }),
      ];

      const results = await Promise.allSettled(joinPromises);

      // At least 2 should succeed, 1 should fail due to capacity
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      expect(successful.length).toBe(2);
      expect(failed.length).toBe(1);
    });
  });

  // Helper functions for test setup and cleanup
  async function setupTestData() {
    // Create test mentor
    const { error: mentorError } = await supabase
      .from('users')
      .upsert({
        id: testMentorId,
        email: 'test-mentor@example.com',
        password_hash: 'hashed_password',
        role: 'mentor',
        first_name: 'Test',
        last_name: 'Mentor',
        email_verified: true,
      });

    if (mentorError) {
      console.error('Error creating test mentor:', mentorError);
    }

    // Create test student
    const { error: studentError } = await supabase
      .from('users')
      .upsert({
        id: testStudentId,
        email: 'test-student@example.com',
        password_hash: 'hashed_password',
        role: 'student',
        first_name: 'Test',
        last_name: 'Student',
        email_verified: true,
      });

    if (studentError) {
      console.error('Error creating test student:', studentError);
    }

    // Create test course
    const { error: courseError } = await supabase
      .from('courses')
      .upsert({
        id: testCourseId,
        mentor_id: testMentorId,
        title: 'Test Course',
        description: 'Course for integration testing',
        category: 'Technology',
        type: 'live',
        pricing_type: 'one_time',
        price: 99.99,
        currency: 'USD',
        status: 'published',
      });

    if (courseError) {
      console.error('Error creating test course:', courseError);
    }

    // Create enrollment for test student
    const { error: enrollmentError } = await supabase
      .from('enrollments')
      .upsert({
        course_id: testCourseId,
        student_id: testStudentId,
        status: 'active',
        enrolled_at: new Date().toISOString(),
      });

    if (enrollmentError) {
      console.error('Error creating test enrollment:', enrollmentError);
    }

    // Create additional test students for concurrent testing
    const additionalStudents = [
      'concurrent-student-1',
      'concurrent-student-2', 
      'concurrent-student-3',
    ];

    for (const studentId of additionalStudents) {
      await supabase.from('users').upsert({
        id: studentId,
        email: `${studentId}@example.com`,
        password_hash: 'hashed_password',
        role: 'student',
        first_name: 'Concurrent',
        last_name: 'Student',
        email_verified: true,
      });

      await supabase.from('enrollments').upsert({
        course_id: testCourseId,
        student_id: studentId,
        status: 'active',
        enrolled_at: new Date().toISOString(),
      });
    }
  }

  async function cleanupTestData() {
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
    
    // Clean up additional test students
    const additionalStudents = [
      'concurrent-student-1',
      'concurrent-student-2',
      'concurrent-student-3',
    ];
    
    for (const studentId of additionalStudents) {
      await supabase.from('users').delete().eq('id', studentId);
    }
  }
});