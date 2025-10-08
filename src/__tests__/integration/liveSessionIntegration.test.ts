import { LiveSessionService } from '../../lib/liveSessionService';
import { supabase } from '../../lib/database';
import { APIError } from '../../lib/errors';

// Mock dependencies
jest.mock('../../lib/database');
jest.mock('../../lib/googleMeetService');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Live Session Integration Tests', () => {
  let liveSessionService: LiveSessionService;
  let mockGoogleMeetService: any;

  const testMentorId = 'test-mentor-123';
  const testStudentId = 'test-student-123';
  const testCourseId = 'test-course-123';
  const testSessionId = 'test-session-123';

  beforeEach(() => {
    jest.clearAllMocks();

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

  describe('Google Meet API Integration and Error Handling', () => {
    it('should create session with Google Meet integration successfully', async () => {
      // Mock course verification
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
      } as any);

      // Mock Google Meet creation
      mockGoogleMeetService.createMeeting.mockResolvedValue({
        meetLink: 'https://meet.google.com/test-abc-def',
        eventId: 'google-event-123',
        calendarEventId: 'google-event-123',
      });

      // Mock session insertion
      const mockSessionResponse = {
        id: testSessionId,
        course_id: testCourseId,
        mentor_id: testMentorId,
        title: 'Integration Test Session',
        description: 'Testing Google Meet integration',
        scheduled_start_time: '2024-12-15T10:00:00Z',
        scheduled_end_time: '2024-12-15T11:00:00Z',
        google_meet_link: 'https://meet.google.com/test-abc-def',
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
      } as any);

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
    });

    it('should handle Google Meet API failures gracefully', async () => {
      // Mock course verification success
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
      } as any);

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
    });

    it('should cleanup Google Meet when session creation fails', async () => {
      // Mock course verification success
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
      } as any);

      // Mock Google Meet creation success
      mockGoogleMeetService.createMeeting.mockResolvedValue({
        meetLink: 'https://meet.google.com/cleanup-test',
        eventId: 'cleanup-event-123',
        calendarEventId: 'cleanup-event-123',
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

      const sessionData = {
        courseId: testCourseId,
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

    it('should update Google Meet when session details change', async () => {
      // Mock session fetch
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
      } as any);

      // Mock successful update
      mockGoogleMeetService.updateMeeting.mockResolvedValue();

      // Mock database update
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: testSessionId,
                  course_id: testCourseId,
                  mentor_id: testMentorId,
                  title: 'Updated Session Title',
                  scheduled_start_time: '2024-12-15T14:00:00Z',
                  scheduled_end_time: '2024-12-15T15:00:00Z',
                  google_event_id: 'google-event-123',
                  status: 'scheduled',
                  created_at: '2024-12-15T09:00:00Z',
                  updated_at: '2024-12-15T09:00:00Z',
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

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
      // Mock session fetch
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: testSessionId,
                  google_event_id: 'google-event-123',
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

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
  });

  describe('Session Scheduling and Attendance Tracking', () => {
    it('should track student attendance when joining session', async () => {
      // Mock session fetch
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
      } as any);

      const joinData = {
        sessionId: testSessionId,
        studentId: testStudentId,
      };

      const result = await liveSessionService.joinSession(joinData);

      expect(result).toBeDefined();
      expect(result.sessionId).toBe(testSessionId);
      expect(result.studentId).toBe(testStudentId);
      expect(result.status).toBe('joined');
      expect(result.joinedAt).toBeDefined();
    });

    it('should prevent joining when session is at capacity', async () => {
      // Mock session fetch
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

      const joinData = {
        sessionId: testSessionId,
        studentId: testStudentId,
      };

      await expect(liveSessionService.joinSession(joinData)).rejects.toThrow(
        'Session is at maximum capacity'
      );
    });

    it('should prevent unenrolled students from joining', async () => {
      // Mock session fetch
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

      const joinData = {
        sessionId: testSessionId,
        studentId: 'unenrolled-student-123',
      };

      await expect(liveSessionService.joinSession(joinData)).rejects.toThrow(
        'Student not enrolled in this course'
      );
    });
  });

  describe('Real-time Chat and Interaction Features', () => {
    it('should send and retrieve chat messages', async () => {
      const messageData = {
        sessionId: testSessionId,
        userId: testStudentId,
        message: 'Hello everyone! This is a test message.',
        messageType: 'text' as const,
        isPrivate: false,
      };

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

      // Mock message insertion
      mockSupabase.from.mockReturnValueOnce({
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
        sessionId: testSessionId,
        userId: testStudentId,
        message: 'Hello everyone! This is a test message.',
        messageType: 'text',
        isPrivate: false,
        repliedTo: null,
        createdAt: new Date('2024-12-01T10:15:00Z'),
      });

      // Mock message retrieval
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
      } as any);

      const messages = await liveSessionService.getChatMessages(testSessionId, 10);
      expect(messages).toHaveLength(1);
      expect(messages[0].message).toBe('Hello everyone! This is a test message.');
    });

    it('should create and answer Q&A questions', async () => {
      const qaData = {
        sessionId: testSessionId,
        studentId: testStudentId,
        question: 'What is the main topic of today\'s session?',
        isAnonymous: false,
      };

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

      // Mock Q&A creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockQAResponse,
              error: null,
            }),
          }),
        }),
      } as any);

      const createdQA = await liveSessionService.createQA(qaData);

      expect(createdQA).toBeDefined();
      expect(createdQA.question).toBe('What is the main topic of today\'s session?');
      expect(createdQA.status).toBe('pending');
      expect(createdQA.isAnonymous).toBe(false);

      // Mock Q&A answer
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
      } as any);

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

    it('should create and respond to polls', async () => {
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

      // Mock poll creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPollResponse,
              error: null,
            }),
          }),
        }),
      } as any);

      const createdPoll = await liveSessionService.createPoll(pollData);

      expect(createdPoll).toBeDefined();
      expect(createdPoll.question).toBe('Which programming language do you prefer?');
      expect(createdPoll.options).toHaveLength(4);
      expect(createdPoll.pollType).toBe('single_choice');
      expect(createdPoll.isActive).toBe(true);

      // Mock poll response submission
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
      } as any);

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
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
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
      } as any);

      const sessionData = {
        courseId: 'non-existent-course',
        title: 'Invalid Session',
        description: 'Testing error handling',
        scheduledStartTime: new Date('2024-12-15T10:00:00Z'),
        scheduledEndTime: new Date('2024-12-15T11:00:00Z'),
      };

      await expect(
        liveSessionService.createLiveSession('non-existent-mentor', sessionData)
      ).rejects.toThrow(APIError);
    });

    it('should validate session access permissions', async () => {
      // Mock session fetch with wrong mentor
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
      } as any);

      const updateData = {
        title: 'Unauthorized Update',
      };

      await expect(
        liveSessionService.updateLiveSession(testSessionId, 'wrong-mentor-id', updateData)
      ).rejects.toThrow('Session not found or access denied');
    });

    it('should handle concurrent operations gracefully', async () => {
      // This test simulates concurrent access scenarios
      const promises = [];

      for (let i = 0; i < 3; i++) {
        // Mock different responses for concurrent requests
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: testSessionId,
                  courseId: testCourseId,
                  status: 'scheduled',
                  maxParticipants: 2,
                },
                error: null,
              }),
            }),
          }),
        } as any);

        mockSupabase.from.mockReturnValue({
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

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                count: i < 2 ? i : 2, // First 2 succeed, 3rd fails
              }),
            }),
          }),
        } as any);

        if (i < 2) {
          mockSupabase.from.mockReturnValue({
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: `attendance-${i}`,
                    session_id: testSessionId,
                    student_id: `student-${i}`,
                    status: 'joined',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          } as any);

          promises.push(
            liveSessionService.joinSession({
              sessionId: testSessionId,
              studentId: `student-${i}`,
            })
          );
        } else {
          promises.push(
            liveSessionService.joinSession({
              sessionId: testSessionId,
              studentId: `student-${i}`,
            }).catch(error => error)
          );
        }
      }

      const results = await Promise.all(promises);

      // First 2 should succeed, 3rd should fail
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
      expect(results[2]).toBeInstanceOf(APIError);
    });
  });
});