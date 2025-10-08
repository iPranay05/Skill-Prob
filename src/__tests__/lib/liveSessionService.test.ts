import { LiveSessionService } from '../../lib/liveSessionService';
import { supabase } from '../../lib/database';
import { createGoogleMeetService } from '../../lib/googleMeetService';
import { APIError } from '../../lib/errors';

// Mock dependencies
jest.mock('../../lib/database');
jest.mock('../../lib/googleMeetService');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockCreateGoogleMeetService = createGoogleMeetService as jest.MockedFunction<typeof createGoogleMeetService>;

describe('LiveSessionService', () => {
  let liveSessionService: LiveSessionService;
  let mockGoogleMeetService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Google Meet Service
    mockGoogleMeetService = {
      createMeeting: jest.fn(),
      updateMeeting: jest.fn(),
      cancelMeeting: jest.fn(),
      getMeetingDetails: jest.fn(),
    };

    mockCreateGoogleMeetService.mockReturnValue(mockGoogleMeetService);

    liveSessionService = new LiveSessionService();
  });

  describe('createLiveSession', () => {
    const mockSessionData = {
      courseId: 'course-123',
      title: 'Test Session',
      description: 'Test Description',
      scheduledStartTime: new Date('2024-12-01T10:00:00Z'),
      scheduledEndTime: new Date('2024-12-01T11:00:00Z'),
      maxParticipants: 50,
      chatEnabled: true,
      qaEnabled: true,
      pollingEnabled: true,
    };

    it('should create a live session successfully', async () => {
      // Mock course verification
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'course-123', mentor_id: 'mentor-123' },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      // Mock Google Meet creation
      mockGoogleMeetService.createMeeting.mockResolvedValue({
        meetLink: 'https://meet.google.com/abc-defg-hij',
        eventId: 'event-123',
        calendarEventId: 'event-123',
      });

      // Mock session insertion
      const mockSessionResponse = {
        id: 'session-123',
        course_id: 'course-123',
        mentor_id: 'mentor-123',
        title: 'Test Session',
        description: 'Test Description',
        scheduled_start_time: '2024-12-01T10:00:00Z',
        scheduled_end_time: '2024-12-01T11:00:00Z',
        google_meet_link: 'https://meet.google.com/abc-defg-hij',
        google_event_id: 'event-123',
        max_participants: 50,
        status: 'scheduled',
        chat_enabled: true,
        qa_enabled: true,
        polling_enabled: true,
        created_at: '2024-12-01T09:00:00Z',
        updated_at: '2024-12-01T09:00:00Z',
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
      } as any);

      const result = await liveSessionService.createLiveSession('mentor-123', mockSessionData);

      expect(result).toEqual({
        id: 'session-123',
        courseId: 'course-123',
        mentorId: 'mentor-123',
        title: 'Test Session',
        description: 'Test Description',
        scheduledStartTime: new Date('2024-12-01T10:00:00Z'),
        scheduledEndTime: new Date('2024-12-01T11:00:00Z'),
        actualStartTime: undefined,
        actualEndTime: undefined,
        googleMeetLink: 'https://meet.google.com/abc-defg-hij',
        googleEventId: 'event-123',
        maxParticipants: 50,
        status: 'scheduled',
        recordingUrl: undefined,
        chatEnabled: true,
        qaEnabled: true,
        pollingEnabled: true,
        createdAt: new Date('2024-12-01T09:00:00Z'),
        updatedAt: new Date('2024-12-01T09:00:00Z'),
      });

      expect(mockGoogleMeetService.createMeeting).toHaveBeenCalledWith({
        title: 'Test Session',
        description: 'Test Description',
        startTime: new Date('2024-12-01T10:00:00Z'),
        endTime: new Date('2024-12-01T11:00:00Z'),
      });
    });

    it('should throw error if course not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Course not found' },
              }),
            }),
          }),
        }),
      } as any);

      await expect(
        liveSessionService.createLiveSession('mentor-123', mockSessionData)
      ).rejects.toThrow(APIError);
    });

    it('should cleanup Google Meet if database insert fails', async () => {
      // Mock course verification success
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'course-123', mentor_id: 'mentor-123' },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      // Mock Google Meet creation success
      mockGoogleMeetService.createMeeting.mockResolvedValue({
        meetLink: 'https://meet.google.com/abc-defg-hij',
        eventId: 'event-123',
        calendarEventId: 'event-123',
      });

      // Mock database insert failure
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      } as any);

      await expect(
        liveSessionService.createLiveSession('mentor-123', mockSessionData)
      ).rejects.toThrow(APIError);

      expect(mockGoogleMeetService.cancelMeeting).toHaveBeenCalledWith('event-123');
    });
  });

  describe('joinSession', () => {
    it('should allow student to join session successfully', async () => {
      const joinData = {
        sessionId: 'session-123',
        studentId: 'student-123',
      };

      // Mock session fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'session-123',
                course_id: 'course-123',
                status: 'scheduled',
                max_participants: 100,
              },
              error: null,
            }),
          }),
        }),
      } as any);

      // Mock enrollment check
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
      } as any);

      // Mock attendance count check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              count: 50, // Current attendees
            }),
          }),
        }),
      } as any);

      // Mock attendance upsert
      const mockAttendanceResponse = {
        id: 'attendance-123',
        session_id: 'session-123',
        student_id: 'student-123',
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
      } as any);

      const result = await liveSessionService.joinSession(joinData);

      expect(result).toEqual({
        id: 'attendance-123',
        sessionId: 'session-123',
        studentId: 'student-123',
        joinedAt: new Date('2024-12-01T10:05:00Z'),
        leftAt: undefined,
        durationMinutes: 0,
        status: 'joined',
        createdAt: new Date('2024-12-01T10:05:00Z'),
        updatedAt: new Date('2024-12-01T10:05:00Z'),
      });
    });

    it('should throw error if session is at capacity', async () => {
      const joinData = {
        sessionId: 'session-123',
        studentId: 'student-123',
      };

      // Mock session fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'session-123',
                course_id: 'course-123',
                status: 'scheduled',
                max_participants: 50,
              },
              error: null,
            }),
          }),
        }),
      } as any);

      // Mock enrollment check
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
      } as any);

      // Mock attendance count check - at capacity
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              count: 50, // At max capacity
            }),
          }),
        }),
      } as any);

      await expect(liveSessionService.joinSession(joinData)).rejects.toThrow(
        'Session is at maximum capacity'
      );
    });

    it('should throw error if student not enrolled', async () => {
      const joinData = {
        sessionId: 'session-123',
        studentId: 'student-123',
      };

      // Mock session fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'session-123',
                course_id: 'course-123',
                status: 'scheduled',
                max_participants: 100,
              },
              error: null,
            }),
          }),
        }),
      } as any);

      // Mock enrollment check - not enrolled
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
      } as any);

      await expect(liveSessionService.joinSession(joinData)).rejects.toThrow(
        'Student not enrolled in this course'
      );
    });
  });

  describe('sendChatMessage', () => {
    it('should send chat message successfully', async () => {
      const messageData = {
        sessionId: 'session-123',
        userId: 'user-123',
        message: 'Hello everyone!',
        messageType: 'text' as const,
        isPrivate: false,
      };

      const mockMessageResponse = {
        id: 'message-123',
        session_id: 'session-123',
        user_id: 'user-123',
        message: 'Hello everyone!',
        message_type: 'text',
        is_private: false,
        replied_to: null,
        created_at: '2024-12-01T10:15:00Z',
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockMessageResponse,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await liveSessionService.sendChatMessage(messageData);

      expect(result).toEqual({
        id: 'message-123',
        sessionId: 'session-123',
        userId: 'user-123',
        message: 'Hello everyone!',
        messageType: 'text',
        isPrivate: false,
        repliedTo: null,
        createdAt: new Date('2024-12-01T10:15:00Z'),
      });
    });
  });

  describe('createQA', () => {
    it('should create Q&A question successfully', async () => {
      const qaData = {
        sessionId: 'session-123',
        studentId: 'student-123',
        question: 'What is the main topic?',
        isAnonymous: false,
      };

      const mockQAResponse = {
        id: 'qa-123',
        session_id: 'session-123',
        student_id: 'student-123',
        question: 'What is the main topic?',
        answer: null,
        answered_by: null,
        answered_at: null,
        is_anonymous: false,
        upvotes: 0,
        status: 'pending',
        created_at: '2024-12-01T10:20:00Z',
        updated_at: '2024-12-01T10:20:00Z',
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockQAResponse,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await liveSessionService.createQA(qaData);

      expect(result).toEqual({
        id: 'qa-123',
        sessionId: 'session-123',
        studentId: 'student-123',
        question: 'What is the main topic?',
        answer: null,
        answeredBy: null,
        answeredAt: undefined,
        isAnonymous: false,
        upvotes: 0,
        status: 'pending',
        createdAt: new Date('2024-12-01T10:20:00Z'),
        updatedAt: new Date('2024-12-01T10:20:00Z'),
      });
    });
  });

  describe('createPoll', () => {
    it('should create poll successfully', async () => {
      const pollData = {
        sessionId: 'session-123',
        createdBy: 'mentor-123',
        question: 'What is your favorite programming language?',
        options: [
          { text: 'JavaScript' },
          { text: 'Python' },
          { text: 'Java' },
        ],
        pollType: 'single_choice' as const,
        isAnonymous: true,
      };

      const mockPollResponse = {
        id: 'poll-123',
        session_id: 'session-123',
        created_by: 'mentor-123',
        question: 'What is your favorite programming language?',
        options: JSON.stringify([
          { id: '0', text: 'JavaScript' },
          { id: '1', text: 'Python' },
          { id: '2', text: 'Java' },
        ]),
        poll_type: 'single_choice',
        is_anonymous: true,
        is_active: true,
        ends_at: null,
        created_at: '2024-12-01T10:25:00Z',
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPollResponse,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await liveSessionService.createPoll(pollData);

      expect(result).toEqual({
        id: 'poll-123',
        sessionId: 'session-123',
        createdBy: 'mentor-123',
        question: 'What is your favorite programming language?',
        options: [
          { id: '0', text: 'JavaScript' },
          { id: '1', text: 'Python' },
          { id: '2', text: 'Java' },
        ],
        pollType: 'single_choice',
        isAnonymous: true,
        isActive: true,
        endsAt: undefined,
        createdAt: new Date('2024-12-01T10:25:00Z'),
      });
    });
  });
});
