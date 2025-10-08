import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../../app/api/live-sessions/[sessionId]/route';
import { generateToken } from '../../lib/auth';

// Mock dependencies for API tests
jest.mock('../../lib/googleMeetService');
jest.mock('../../lib/database');
jest.mock('../../lib/auth');

describe('Live Session API Integration Tests', () => {
  // Test data
  const testMentorId = 'api-mentor-123';
  const testStudentId = 'api-student-123';
  const testCourseId = 'api-course-123';
  const testSessionId = 'api-session-123';
  let mentorToken: string;
  let studentToken: string;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock JWT tokens
    mentorToken = 'mock-mentor-token';
    studentToken = 'mock-student-token';
    
    // Mock auth verification
    const { verifyToken } = require('../../lib/auth');
    (verifyToken as jest.Mock).mockImplementation((token: string) => {
      if (token === mentorToken) {
        return Promise.resolve({
          userId: testMentorId,
          email: 'api-mentor@example.com',
          role: 'mentor',
        });
      } else if (token === studentToken) {
        return Promise.resolve({
          userId: testStudentId,
          email: 'api-student@example.com',
          role: 'student',
        });
      } else {
        throw new Error('Invalid or expired access token');
      }
    });
    
    // Mock Google Meet Service
    const { createGoogleMeetService } = require('../../lib/googleMeetService');
    const mockGoogleMeetService = {
      createMeeting: jest.fn().mockResolvedValue({
        meetLink: 'https://meet.google.com/api-test',
        eventId: 'api-event-123',
        calendarEventId: 'api-event-123',
      }),
      updateMeeting: jest.fn().mockResolvedValue(undefined),
      cancelMeeting: jest.fn().mockResolvedValue(undefined),
    };
    
    (createGoogleMeetService as jest.Mock).mockReturnValue(mockGoogleMeetService);
    
    // Mock LiveSessionService
    jest.doMock('../../lib/liveSessionService', () => ({
      LiveSessionService: jest.fn().mockImplementation(() => ({
        getSessionById: jest.fn().mockResolvedValue({
          id: testSessionId,
          title: 'API Test Session',
          googleMeetLink: 'https://meet.google.com/api-test',
          courseId: testCourseId,
          mentorId: testMentorId,
        }),
        updateLiveSession: jest.fn().mockResolvedValue({
          id: testSessionId,
          title: 'Updated API Test Session',
          description: 'Updated description',
          maxParticipants: 75,
          chatEnabled: false,
        }),
      })),
    }));
  });

  describe('GET /api/live-sessions/[sessionId]', () => {
    beforeAll(async () => {
      // Create a test session
      const { data: session } = await supabase
        .from('live_sessions')
        .insert({
          id: 'api-session-get-test',
          course_id: testCourseId,
          mentor_id: testMentorId,
          title: 'API GET Test Session',
          description: 'Testing GET endpoint',
          scheduled_start_time: new Date('2024-12-20T10:00:00Z').toISOString(),
          scheduled_end_time: new Date('2024-12-20T11:00:00Z').toISOString(),
          google_meet_link: 'https://meet.google.com/api-get-test',
          google_event_id: 'api-get-event-123',
          max_participants: 50,
          status: 'scheduled',
        })
        .select()
        .single();

      testSessionId = session.id;
    });

    it('should return session details for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/live-sessions/api-session-get-test', {
        headers: {
          'authorization': `Bearer ${mentorToken}`,
        },
      });

      const response = await GET(request, { params: { sessionId: 'api-session-get-test' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.id).toBe('api-session-get-test');
      expect(data.data.title).toBe('API GET Test Session');
      expect(data.data.googleMeetLink).toBe('https://meet.google.com/api-get-test');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/live-sessions/api-session-get-test');

      const response = await GET(request, { params: { sessionId: 'api-session-get-test' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 404 for non-existent session', async () => {
      const request = new NextRequest('http://localhost:3000/api/live-sessions/non-existent', {
        headers: {
          'authorization': `Bearer ${mentorToken}`,
        },
      });

      const response = await GET(request, { params: { sessionId: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Session not found');
    });

    it('should allow students to view session details', async () => {
      const request = new NextRequest('http://localhost:3000/api/live-sessions/api-session-get-test', {
        headers: {
          'authorization': `Bearer ${studentToken}`,
        },
      });

      const response = await GET(request, { params: { sessionId: 'api-session-get-test' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('api-session-get-test');
    });
  });

  describe('PUT /api/live-sessions/[sessionId]', () => {
    beforeAll(async () => {
      // Create a test session for updates
      const { data: session } = await supabase
        .from('live_sessions')
        .insert({
          id: 'api-session-put-test',
          course_id: testCourseId,
          mentor_id: testMentorId,
          title: 'API PUT Test Session',
          description: 'Testing PUT endpoint',
          scheduled_start_time: new Date('2024-12-21T10:00:00Z').toISOString(),
          scheduled_end_time: new Date('2024-12-21T11:00:00Z').toISOString(),
          google_meet_link: 'https://meet.google.com/api-put-test',
          google_event_id: 'api-put-event-123',
          max_participants: 50,
          status: 'scheduled',
        })
        .select()
        .single();
    });

    it('should update session details for mentor', async () => {
      const updateData = {
        title: 'Updated API Test Session',
        description: 'Updated description',
        maxParticipants: 75,
        chatEnabled: false,
      };

      const request = new NextRequest('http://localhost:3000/api/live-sessions/api-session-put-test', {
        method: 'PUT',
        headers: {
          'authorization': `Bearer ${mentorToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request, { params: { sessionId: 'api-session-put-test' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('Updated API Test Session');
      expect(data.data.description).toBe('Updated description');
      expect(data.data.maxParticipants).toBe(75);
      expect(data.data.chatEnabled).toBe(false);
    });

    it('should update session times and trigger Google Meet update', async () => {
      const updateData = {
        scheduledStartTime: '2024-12-21T14:00:00Z',
        scheduledEndTime: '2024-12-21T15:30:00Z',
      };

      const request = new NextRequest('http://localhost:3000/api/live-sessions/api-session-put-test', {
        method: 'PUT',
        headers: {
          'authorization': `Bearer ${mentorToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request, { params: { sessionId: 'api-session-put-test' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Verify Google Meet service was called
      const { createGoogleMeetService } = require('../../lib/googleMeetService');
      const mockService = (createGoogleMeetService as jest.Mock).mock.results[0].value;
      expect(mockService.updateMeeting).toHaveBeenCalled();
    });

    it('should return 403 for non-mentor users', async () => {
      const updateData = {
        title: 'Unauthorized Update',
      };

      const request = new NextRequest('http://localhost:3000/api/live-sessions/api-session-put-test', {
        method: 'PUT',
        headers: {
          'authorization': `Bearer ${studentToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request, { params: { sessionId: 'api-session-put-test' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only mentors can update live sessions');
    });

    it('should validate time constraints', async () => {
      const invalidUpdateData = {
        scheduledStartTime: '2024-12-21T15:00:00Z',
        scheduledEndTime: '2024-12-21T14:00:00Z', // End before start
      };

      const request = new NextRequest('http://localhost:3000/api/live-sessions/api-session-put-test', {
        method: 'PUT',
        headers: {
          'authorization': `Bearer ${mentorToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(invalidUpdateData),
      });

      const response = await PUT(request, { params: { sessionId: 'api-session-put-test' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('End time must be after start time');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const updateData = {
        title: 'Unauthenticated Update',
      };

      const request = new NextRequest('http://localhost:3000/api/live-sessions/api-session-put-test', {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request, { params: { sessionId: 'api-session-put-test' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });
  });

  describe('DELETE /api/live-sessions/[sessionId]', () => {
    beforeAll(async () => {
      // Create a test session for deletion
      await supabase
        .from('live_sessions')
        .insert({
          id: 'api-session-delete-test',
          course_id: testCourseId,
          mentor_id: testMentorId,
          title: 'API DELETE Test Session',
          description: 'Testing DELETE endpoint',
          scheduled_start_time: new Date('2024-12-22T10:00:00Z').toISOString(),
          scheduled_end_time: new Date('2024-12-22T11:00:00Z').toISOString(),
          google_meet_link: 'https://meet.google.com/api-delete-test',
          google_event_id: 'api-delete-event-123',
          max_participants: 50,
          status: 'scheduled',
        });
    });

    it('should cancel session for mentor', async () => {
      const request = new NextRequest('http://localhost:3000/api/live-sessions/api-session-delete-test', {
        method: 'DELETE',
        headers: {
          'authorization': `Bearer ${mentorToken}`,
        },
      });

      const response = await DELETE(request, { params: { sessionId: 'api-session-delete-test' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Session cancelled successfully');

      // Verify session status is updated to cancelled
      const { data: session } = await supabase
        .from('live_sessions')
        .select('status')
        .eq('id', 'api-session-delete-test')
        .single();

      expect(session.status).toBe('cancelled');
    });

    it('should return 403 for non-mentor users', async () => {
      // Create another session for this test
      await supabase
        .from('live_sessions')
        .insert({
          id: 'api-session-delete-test-2',
          course_id: testCourseId,
          mentor_id: testMentorId,
          title: 'API DELETE Test Session 2',
          description: 'Testing DELETE endpoint unauthorized',
          scheduled_start_time: new Date('2024-12-23T10:00:00Z').toISOString(),
          scheduled_end_time: new Date('2024-12-23T11:00:00Z').toISOString(),
          google_meet_link: 'https://meet.google.com/api-delete-test-2',
          google_event_id: 'api-delete-event-456',
          max_participants: 50,
          status: 'scheduled',
        });

      const request = new NextRequest('http://localhost:3000/api/live-sessions/api-session-delete-test-2', {
        method: 'DELETE',
        headers: {
          'authorization': `Bearer ${studentToken}`,
        },
      });

      const response = await DELETE(request, { params: { sessionId: 'api-session-delete-test-2' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only mentors can delete live sessions');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/live-sessions/api-session-delete-test', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { sessionId: 'api-session-delete-test' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON in PUT requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/live-sessions/api-session-put-test', {
        method: 'PUT',
        headers: {
          'authorization': `Bearer ${mentorToken}`,
          'content-type': 'application/json',
        },
        body: 'invalid json{',
      });

      const response = await PUT(request, { params: { sessionId: 'api-session-put-test' } });

      expect(response.status).toBe(500);
    });

    it('should handle invalid JWT tokens', async () => {
      const request = new NextRequest('http://localhost:3000/api/live-sessions/api-session-get-test', {
        headers: {
          'authorization': 'Bearer invalid.jwt.token',
        },
      });

      const response = await GET(request, { params: { sessionId: 'api-session-get-test' } });

      expect(response.status).toBe(401);
    });

    it('should handle Google Meet API failures during updates', async () => {
      // Mock Google Meet service to fail
      const { createGoogleMeetService } = require('../../lib/googleMeetService');
      const mockGoogleMeetService = {
        updateMeeting: jest.fn().mockRejectedValue(new Error('Google API Error')),
      };
      (createGoogleMeetService as jest.Mock).mockReturnValue(mockGoogleMeetService);

      const updateData = {
        scheduledStartTime: '2024-12-21T16:00:00Z',
        scheduledEndTime: '2024-12-21T17:00:00Z',
      };

      const request = new NextRequest('http://localhost:3000/api/live-sessions/api-session-put-test', {
        method: 'PUT',
        headers: {
          'authorization': `Bearer ${mentorToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request, { params: { sessionId: 'api-session-put-test' } });

      expect(response.status).toBe(500);
    });

    it('should handle database connection errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/live-sessions/non-existent-session', {
        headers: {
          'authorization': `Bearer ${mentorToken}`,
        },
      });

      const response = await GET(request, { params: { sessionId: 'non-existent-session' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Session not found');
    });
  });

  // Helper functions for API test setup and cleanup
  async function setupAPITestData() {
    // Create test mentor
    const { error: mentorError } = await supabase
      .from('users')
      .upsert({
        id: testMentorId,
        email: 'api-mentor@example.com',
        password_hash: 'hashed_password',
        role: 'mentor',
        first_name: 'API',
        last_name: 'Mentor',
        email_verified: true,
      });

    if (mentorError) {
      console.error('Error creating API test mentor:', mentorError);
    }

    // Create test student
    const { error: studentError } = await supabase
      .from('users')
      .upsert({
        id: testStudentId,
        email: 'api-student@example.com',
        password_hash: 'hashed_password',
        role: 'student',
        first_name: 'API',
        last_name: 'Student',
        email_verified: true,
      });

    if (studentError) {
      console.error('Error creating API test student:', studentError);
    }

    // Create test course
    const { error: courseError } = await supabase
      .from('courses')
      .upsert({
        id: testCourseId,
        mentor_id: testMentorId,
        title: 'API Test Course',
        description: 'Course for API integration testing',
        category: 'Technology',
        type: 'live',
        pricing_type: 'one_time',
        price: 99.99,
        currency: 'USD',
        status: 'published',
      });

    if (courseError) {
      console.error('Error creating API test course:', courseError);
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
      console.error('Error creating API test enrollment:', enrollmentError);
    }
  }

  async function cleanupAPITestData() {
    // Clean up in reverse order of dependencies
    await supabase.from('live_sessions').delete().ilike('id', 'api-session-%');
    await supabase.from('enrollments').delete().eq('course_id', testCourseId);
    await supabase.from('courses').delete().eq('id', testCourseId);
    await supabase.from('users').delete().eq('id', testMentorId);
    await supabase.from('users').delete().eq('id', testStudentId);
  }
});