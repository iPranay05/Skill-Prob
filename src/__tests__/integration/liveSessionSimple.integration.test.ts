import { LiveSessionService } from '../../lib/liveSessionService';
import { APIError } from '../../lib/errors';

// Mock all external dependencies
jest.mock('../../lib/database');
jest.mock('../../lib/googleMeetService');

describe('Live Session Integration Tests - Google Meet API Integration and Error Handling', () => {
  let liveSessionService: LiveSessionService;
  let mockGoogleMeetService: any;
  let mockSupabase: any;

  const testMentorId = 'test-mentor-123';
  const testStudentId = 'test-student-123';
  const testCourseId = 'test-course-123';
  const testSessionId = 'test-session-123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Supabase
    mockSupabase = {
      from: jest.fn(),
    };
    
    const { supabase } = require('../../lib/database');
    Object.assign(supabase, mockSupabase);

    // Mock Google Meet Service
    mockGoogleMeetService = {
      createMeeting: jest.fn(),
      updateMeeting: jest.fn(),
      cancelMeeting: jest.fn(),
      getMeetingDetails: jest.fn(),
      refreshAccessToken: jest.fn(),
    };

    const { createGoogleMeetService } = require('../../lib/googleMeetService');
    (createGoogleMeetService as jest.Mock).mockReturnValue(mockGoogleMeetService);

    liveSessionService = new LiveSessionService();
  });

  describe('Google Meet API Integration', () => {
    it('should successfully integrate with Google Meet API when creating a session', async () => {
      // Arrange: Mock successful course verification
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: testCourseId, mentor_id: testMentorId },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock successful Google Meet creation
      mockGoogleMeetService.createMeeting.mockResolvedValue({
        meetLink: 'https://meet.google.com/integration-test',
        eventId: 'google-event-123',
        calendarEventId: 'google-event-123',
      });

      // Mock successful database insertion
      const mockSessionResponse = {
        id: testSessionId,
        course_id: testCourseId,
        mentor_id: testMentorId,
        title: 'Integration Test Session',
        description: 'Testing Google Meet integration',
        scheduled_start_time: '2024-12-15T10:00:00Z',
        scheduled_end_time: '2024-12-15T11:00:00Z',
        google_meet_link: 'https://meet.google.com/integration-test',
        google_event_id: 'google-event-123',
        max_participants: 50,
        status: 'scheduled',
        chat_enabled: true,
        qa_enabled: true,
        polling_enabled: true,
        created_at: '2024-12-15T09:00:00Z',
        updated_at: '2024-12-15T09:00:00Z',
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSessionResponse,
              error: null,
            }),
          }),
        }),
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

      // Act: Create the session
      const result = await liveSessionService.createLiveSession(testMentorId, sessionData);

      // Assert: Verify integration worked correctly
      expect(result).toBeDefined();
      expect(result.googleMeetLink).toBe('https://meet.google.com/integration-test');
      expect(result.googleEventId).toBe('google-event-123');
      expect(result.title).toBe('Integration Test Session');

      // Verify Google Meet API was called with correct parameters
      expect(mockGoogleMeetService.createMeeting).toHaveBeenCalledWith({
        title: 'Integration Test Session',
        description: 'Testing Google Meet integration',
        startTime: new Date('2024-12-15T10:00:00Z'),
        endTime: new Date('2024-12-15T11:00:00Z'),
      });

      // Verify database was called to insert the session
      expect(mockSupabase.from).toHaveBeenCalledWith('live_sessions');
    });

    it('should handle Google Meet API failures and not create database records', async () => {
      // Arrange: Mock successful course verification
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: testCourseId, mentor_id: testMentorId },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock Google Meet API failure
      mockGoogleMeetService.createMeeting.mockRejectedValue(
        new Error('Google API rate limit exceeded')
      );

      const sessionData = {
        courseId: testCourseId,
        title: 'Failed Session',
        description: 'Testing API failure handling',
        scheduledStartTime: new Date('2024-12-15T12:00:00Z'),
        scheduledEndTime: new Date('2024-12-15T13:00:00Z'),
      };

      // Act & Assert: Expect the operation to fail
      await expect(
        liveSessionService.createLiveSession(testMentorId, sessionData)
      ).rejects.toThrow('Failed to create live session');

      // Verify Google Meet API was attempted
      expect(mockGoogleMeetService.createMeeting).toHaveBeenCalled();
    });

    it('should cleanup Google Meet resources when database operations fail', async () => {
      // Arrange: Mock successful course verification
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: testCourseId, mentor_id: testMentorId },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock successful Google Meet creation
      mockGoogleMeetService.createMeeting.mockResolvedValue({
        meetLink: 'https://meet.google.com/cleanup-test',
        eventId: 'cleanup-event-123',
        calendarEventId: 'cleanup-event-123',
      });

      // Mock database insertion failure
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database constraint violation' },
            }),
          }),
        }),
      });

      const sessionData = {
        courseId: testCourseId,
        title: 'Cleanup Test Session',
        description: 'Testing cleanup behavior',
        scheduledStartTime: new Date('2024-12-15T18:00:00Z'),
        scheduledEndTime: new Date('2024-12-15T19:00:00Z'),
      };

      // Act & Assert: Expect the operation to fail
      await expect(
        liveSessionService.createLiveSession(testMentorId, sessionData)
      ).rejects.toThrow('Failed to create live session');

      // Verify Google Meet cleanup was attempted
      expect(mockGoogleMeetService.cancelMeeting).toHaveBeenCalledWith('cleanup-event-123');
    });

    it('should update Google Meet when session details change', async () => {
      // Arrange: Mock session fetch
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: testSessionId,
                  course_id: testCourseId,
                  mentor_id: testMentorId,
                  google_event_id: 'google-event-123',
                  status: 'scheduled',
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock successful Google Meet update
      mockGoogleMeetService.updateMeeting.mockResolvedValue();

      // Mock successful database update
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: testSessionId,
                  title: 'Updated Session Title',
                  scheduled_start_time: '2024-12-15T14:00:00Z',
                  scheduled_end_time: '2024-12-15T15:00:00Z',
                  created_at: '2024-12-15T09:00:00Z',
                  updated_at: '2024-12-15T09:00:00Z',
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const updateData = {
        title: 'Updated Session Title',
        scheduledStartTime: new Date('2024-12-15T14:00:00Z'),
        scheduledEndTime: new Date('2024-12-15T15:00:00Z'),
      };

      // Act: Update the session
      const result = await liveSessionService.updateLiveSession(
        testSessionId,
        testMentorId,
        updateData
      );

      // Assert: Verify integration worked correctly
      expect(result.title).toBe('Updated Session Title');
      
      // Verify Google Meet API was called with correct parameters
      expect(mockGoogleMeetService.updateMeeting).toHaveBeenCalledWith(
        'google-event-123',
        {
          title: 'Updated Session Title',
          startTime: new Date('2024-12-15T14:00:00Z'),
          endTime: new Date('2024-12-15T15:00:00Z'),
        }
      );
    });
  });

  describe('Session Scheduling and Attendance Tracking', () => {
    it('should track student attendance when joining a session', async () => {
      // Arrange: Mock session fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: testSessionId,
                courseId: testCourseId,
                status: 'scheduled',
                maxParticipants: 100,
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock enrollment verification
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'enrollment-123' },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      // Mock attendance count check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              count: 25, // Current attendees
            }),
          }),
        }),
      });

      // Mock attendance record creation
      const mockAttendanceResponse = {
        id: 'attendance-123',
        session_id: testSessionId,
        student_id: testStudentId,
        joined_at: '2024-12-01T10:05:00Z',
        status: 'joined',
        duration_minutes: 0,
        created_at: '2024-12-01T10:05:00Z',
        updated_at: '2024-12-01T10:05:00Z',
      };

      mockSupabase.from.mockReturnValueOnce({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockAttendanceResponse,
              error: null,
            }),
          }),
        }),
      });

      const joinData = {
        sessionId: testSessionId,
        studentId: testStudentId,
      };

      // Act: Student joins the session
      const result = await liveSessionService.joinSession(joinData);

      // Assert: Verify attendance tracking worked
      expect(result).toBeDefined();
      expect(result.sessionId).toBe(testSessionId);
      expect(result.studentId).toBe(testStudentId);
      expect(result.status).toBe('joined');
      expect(result.joinedAt).toBeDefined();

      // Verify all necessary checks were performed
      expect(mockSupabase.from).toHaveBeenCalledWith('live_sessions');
      expect(mockSupabase.from).toHaveBeenCalledWith('enrollments');
      expect(mockSupabase.from).toHaveBeenCalledWith('session_attendance');
    });

    it('should prevent joining when session is at maximum capacity', async () => {
      // Arrange: Mock session at capacity
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: testSessionId,
                courseId: testCourseId,
                status: 'scheduled',
                maxParticipants: 50,
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock enrollment verification
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'enrollment-123' },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      // Mock attendance count at capacity
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              count: 50, // At maximum capacity
            }),
          }),
        }),
      });

      const joinData = {
        sessionId: testSessionId,
        studentId: testStudentId,
      };

      // Act & Assert: Expect capacity error
      await expect(liveSessionService.joinSession(joinData)).rejects.toThrow(
        'Session is at maximum capacity'
      );

      // Verify capacity check was performed
      expect(mockSupabase.from).toHaveBeenCalledWith('session_attendance');
    });

    it('should prevent unenrolled students from joining sessions', async () => {
      // Arrange: Mock session fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: testSessionId,
                courseId: testCourseId,
                status: 'scheduled',
                maxParticipants: 100,
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock enrollment check failure
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' },
                }),
              }),
            }),
          }),
        }),
      });

      const joinData = {
        sessionId: testSessionId,
        studentId: 'unenrolled-student-123',
      };

      // Act & Assert: Expect enrollment error
      await expect(liveSessionService.joinSession(joinData)).rejects.toThrow(
        'Student not enrolled in this course'
      );

      // Verify enrollment check was performed
      expect(mockSupabase.from).toHaveBeenCalledWith('enrollments');
    });
  });

  describe('Real-time Chat and Interaction Features', () => {
    it('should handle chat message sending and retrieval', async () => {
      // Arrange: Mock message insertion
      const mockMessageResponse = {
        id: 'message-123',
        session_id: testSessionId,
        user_id: testStudentId,
        message: 'Hello everyone! This is a test message.',
        message_type: 'text',
        is_private: false,
        replied_to: null,
        created_at: '2024-12-01T10:15:00Z',
      };

      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockMessageResponse,
              error: null,
            }),
          }),
        }),
      });

      const messageData = {
        sessionId: testSessionId,
        userId: testStudentId,
        message: 'Hello everyone! This is a test message.',
        messageType: 'text' as const,
        isPrivate: false,
      };

      // Act: Send message
      const result = await liveSessionService.sendChatMessage(messageData);

      // Assert: Verify message was sent correctly
      expect(result).toEqual({
        id: 'message-123',
        sessionId: testSessionId,
        userId: testStudentId,
        message: 'Hello everyone! This is a test message.',
        messageType: 'text',
        isPrivate: false,
        repliedTo: null,
        createdAt: new Date('2024-12-01T10:15:00Z'),
      });

      // Verify database interaction
      expect(mockSupabase.from).toHaveBeenCalledWith('session_chat');

      // Test message retrieval
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [mockMessageResponse],
                error: null,
              }),
            }),
          }),
        }),
      });

      const messages = await liveSessionService.getChatMessages(testSessionId, 10);
      expect(messages).toHaveLength(1);
      expect(messages[0].message).toBe('Hello everyone! This is a test message.');
    });

    it('should handle Q&A question creation and answering', async () => {
      // Arrange: Mock Q&A creation
      const mockQAResponse = {
        id: 'qa-123',
        session_id: testSessionId,
        student_id: testStudentId,
        question: 'What is the main topic of today\'s session?',
        answer: null,
        answered_by: null,
        answered_at: null,
        is_anonymous: false,
        upvotes: 0,
        status: 'pending',
        created_at: '2024-12-01T10:20:00Z',
        updated_at: '2024-12-01T10:20:00Z',
      };

      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockQAResponse,
              error: null,
            }),
          }),
        }),
      });

      const qaData = {
        sessionId: testSessionId,
        studentId: testStudentId,
        question: 'What is the main topic of today\'s session?',
        isAnonymous: false,
      };

      // Act: Create Q&A
      const createdQA = await liveSessionService.createQA(qaData);

      // Assert: Verify Q&A creation
      expect(createdQA).toBeDefined();
      expect(createdQA.question).toBe('What is the main topic of today\'s session?');
      expect(createdQA.status).toBe('pending');
      expect(createdQA.isAnonymous).toBe(false);

      // Test Q&A answering
      const mockAnsweredQA = {
        ...mockQAResponse,
        answer: 'Today we are covering live session integration testing.',
        answered_by: testMentorId,
        answered_at: '2024-12-01T10:25:00Z',
        status: 'answered',
      };

      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockAnsweredQA,
                error: null,
              }),
            }),
          }),
        }),
      });

      const answerData = {
        qaId: createdQA.id,
        answer: 'Today we are covering live session integration testing.',
        answeredBy: testMentorId,
      };

      const answeredQA = await liveSessionService.answerQA(answerData);

      // Assert: Verify Q&A answering
      expect(answeredQA.answer).toBe('Today we are covering live session integration testing.');
      expect(answeredQA.answeredBy).toBe(testMentorId);
      expect(answeredQA.status).toBe('answered');
      expect(answeredQA.answeredAt).toBeDefined();
    });

    it('should handle poll creation and response submission', async () => {
      // Arrange: Mock poll creation
      const mockPollResponse = {
        id: 'poll-123',
        session_id: testSessionId,
        created_by: testMentorId,
        question: 'Which programming language do you prefer?',
        options: JSON.stringify([
          { id: '0', text: 'JavaScript' },
          { id: '1', text: 'Python' },
          { id: '2', text: 'Java' },
          { id: '3', text: 'TypeScript' },
        ]),
        poll_type: 'single_choice',
        is_anonymous: true,
        is_active: true,
        ends_at: null,
        created_at: '2024-12-01T10:25:00Z',
      };

      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPollResponse,
              error: null,
            }),
          }),
        }),
      });

      const pollData = {
        sessionId: testSessionId,
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

      // Act: Create poll
      const createdPoll = await liveSessionService.createPoll(pollData);

      // Assert: Verify poll creation
      expect(createdPoll).toBeDefined();
      expect(createdPoll.question).toBe('Which programming language do you prefer?');
      expect(createdPoll.options).toHaveLength(4);
      expect(createdPoll.pollType).toBe('single_choice');
      expect(createdPoll.isActive).toBe(true);

      // Test poll response submission
      const mockResponseData = {
        id: 'response-123',
        poll_id: createdPoll.id,
        user_id: testStudentId,
        response: JSON.stringify({ selectedOption: '1' }),
        created_at: '2024-12-01T10:30:00Z',
      };

      mockSupabase.from.mockReturnValueOnce({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockResponseData,
              error: null,
            }),
          }),
        }),
      });

      const responseData = {
        pollId: createdPoll.id,
        userId: testStudentId,
        response: { selectedOption: '1' }, // Python
      };

      const pollResponse = await liveSessionService.submitPollResponse(responseData);

      // Assert: Verify poll response
      expect(pollResponse).toBeDefined();
      expect(pollResponse.pollId).toBe(createdPoll.id);
      expect(pollResponse.userId).toBe(testStudentId);
      expect(pollResponse.response).toEqual({ selectedOption: '1' });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      // Arrange: Mock database error
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' },
              }),
            }),
          }),
        }),
      });

      const sessionData = {
        courseId: 'non-existent-course',
        title: 'Invalid Session',
        description: 'Testing error handling',
        scheduledStartTime: new Date('2024-12-15T10:00:00Z'),
        scheduledEndTime: new Date('2024-12-15T11:00:00Z'),
      };

      // Act & Assert: Expect database error to be handled
      await expect(
        liveSessionService.createLiveSession('non-existent-mentor', sessionData)
      ).rejects.toThrow(APIError);
    });

    it('should validate session access permissions', async () => {
      // Arrange: Mock session fetch with access denied
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      });

      const updateData = {
        title: 'Unauthorized Update',
      };

      // Act & Assert: Expect access control to work
      await expect(
        liveSessionService.updateLiveSession(testSessionId, 'wrong-mentor-id', updateData)
      ).rejects.toThrow('Session not found or access denied');
    });

    it('should handle API rate limiting and retry scenarios', async () => {
      // Arrange: Mock course verification success
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: testCourseId, mentor_id: testMentorId },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock Google Meet API rate limiting
      mockGoogleMeetService.createMeeting
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockResolvedValueOnce({
          meetLink: 'https://meet.google.com/retry-success',
          eventId: 'retry-event-123',
          calendarEventId: 'retry-event-123',
        });

      const sessionData = {
        courseId: testCourseId,
        title: 'Rate Limit Test Session',
        description: 'Testing rate limit handling',
        scheduledStartTime: new Date('2024-12-15T16:00:00Z'),
        scheduledEndTime: new Date('2024-12-15T17:00:00Z'),
      };

      // Act & Assert: First attempt should fail due to rate limiting
      await expect(
        liveSessionService.createLiveSession(testMentorId, sessionData)
      ).rejects.toThrow('Failed to create live session');

      // Verify the Google Meet API was called
      expect(mockGoogleMeetService.createMeeting).toHaveBeenCalledTimes(1);
    });
  });
});