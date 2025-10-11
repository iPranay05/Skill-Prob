/**
 * Integration Test: Live Session Creation and Student Participation
 * Tests the complete live session workflow from creation to participation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import request from 'supertest';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  mentorEmail: 'mentor.livesession@example.com',
  studentEmail: 'student.livesession@example.com',
  testPassword: 'TestPassword123!',
  testPhone: '+1234567890'
};

describe('Live Session Creation and Student Participation', () => {
  let app: any;
  let server: any;
  let supabase: any;
  let mentorUserId: string;
  let studentUserId: string;
  let mentorAccessToken: string;
  let studentAccessToken: string;
  let courseId: string;
  let sessionId: string;

  beforeAll(async () => {
    // Initialize Next.js app for testing
    const nextApp = next({ dev: false, dir: './skill-probe-lms' });
    const handle = nextApp.getRequestHandler();
    await nextApp.prepare();

    server = createServer((req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });

    // Initialize Supabase client
    supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);

    // Clean up any existing test data
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Reset test state before each test
    await cleanupTestData();
  });

  const cleanupTestData = async () => {
    try {
      // Delete test users and related data
      await supabase
        .from('users')
        .delete()
        .in('email', [TEST_CONFIG.mentorEmail, TEST_CONFIG.studentEmail]);
      
      // Delete test courses and sessions
      if (courseId) {
        await supabase
          .from('courses')
          .delete()
          .eq('id', courseId);
      }
      
      if (sessionId) {
        await supabase
          .from('live_sessions')
          .delete()
          .eq('id', sessionId);
      }
    } catch (error) {
      console.log('Cleanup error (expected in fresh test):', error);
    }
  };

  const createAndVerifyUser = async (email: string, role: string = 'student') => {
    // Register user
    const registrationResponse = await request(server)
      .post('/api/auth/register')
      .send({
        email,
        password: TEST_CONFIG.testPassword,
        firstName: 'Test',
        lastName: 'User',
        phone: TEST_CONFIG.testPhone,
        role
      })
      .expect(201);

    const userId = registrationResponse.body.data.user.id;

    // Get and verify OTP
    const { data: otpData } = await supabase
      .from('otp_verifications')
      .select('otp')
      .eq('email', email)
      .eq('type', 'email')
      .single();

    await request(server)
      .post('/api/auth/verify-otp')
      .send({
        email,
        otp: otpData.otp,
        type: 'email'
      })
      .expect(200);

    // Login user
    const loginResponse = await request(server)
      .post('/api/auth/login')
      .send({
        email,
        password: TEST_CONFIG.testPassword
      })
      .expect(200);

    return {
      userId,
      accessToken: loginResponse.body.data.tokens.accessToken
    };
  };

  const createCourse = async () => {
    const courseData = {
      title: 'Live Session Test Course',
      description: 'A course for testing live sessions',
      category: 'Programming',
      type: 'live',
      pricing: {
        amount: 2999,
        currency: 'INR',
        subscriptionType: 'one-time'
      },
      enrollment: {
        maxStudents: 50
      }
    };

    const response = await request(server)
      .post('/api/courses')
      .set('Authorization', `Bearer ${mentorAccessToken}`)
      .send(courseData)
      .expect(201);

    courseId = response.body.data.course.id;

    // Publish the course
    await request(server)
      .put(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${mentorAccessToken}`)
      .send({ status: 'published' })
      .expect(200);

    return courseId;
  };

  describe('1. Live Session Creation', () => {
    beforeEach(async () => {
      // Setup mentor user
      const { userId, accessToken } = await createAndVerifyUser(TEST_CONFIG.mentorEmail, 'mentor');
      mentorUserId = userId;
      mentorAccessToken = accessToken;

      // Create course
      await createCourse();
    });

    it('should create a live session successfully', async () => {
      const sessionData = {
        courseId: courseId,
        title: 'Introduction to JavaScript',
        description: 'Learn the basics of JavaScript programming',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        duration: 60,
        maxAttendees: 30
      };

      const response = await request(server)
        .post('/api/live-sessions')
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send(sessionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.session.title).toBe(sessionData.title);
      expect(response.body.data.session.mentorId).toBe(mentorUserId);
      expect(response.body.data.session.courseId).toBe(courseId);
      expect(response.body.data.session.status).toBe('scheduled');

      sessionId = response.body.data.session.id;
    });

    it('should prevent creating session for non-owned course', async () => {
      // Create another mentor
      const { accessToken: otherMentorToken } = await createAndVerifyUser(
        'other.mentor@example.com',
        'mentor'
      );

      const sessionData = {
        courseId: courseId, // Course owned by first mentor
        title: 'Unauthorized Session',
        description: 'This should fail',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 60,
        maxAttendees: 30
      };

      const response = await request(server)
        .post('/api/live-sessions')
        .set('Authorization', `Bearer ${otherMentorToken}`)
        .send(sessionData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED_COURSE_ACCESS');
    });

    it('should validate session scheduling constraints', async () => {
      const sessionData = {
        courseId: courseId,
        title: 'Past Session',
        description: 'This should fail due to past date',
        scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        duration: 60,
        maxAttendees: 30
      };

      const response = await request(server)
        .post('/api/live-sessions')
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send(sessionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_SCHEDULE_TIME');
    });

    it('should generate Google Meet link for session', async () => {
      const sessionData = {
        courseId: courseId,
        title: 'Google Meet Test Session',
        description: 'Testing Google Meet integration',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 60,
        maxAttendees: 30
      };

      const response = await request(server)
        .post('/api/live-sessions')
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send(sessionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.session.meetingUrl).toBeTruthy();
      expect(response.body.data.session.meetingUrl).toMatch(/meet\.google\.com/);

      sessionId = response.body.data.session.id;
    });
  });

  describe('2. Student Enrollment and Session Access', () => {
    beforeEach(async () => {
      // Setup mentor and course
      const { userId: mUserId, accessToken: mToken } = await createAndVerifyUser(
        TEST_CONFIG.mentorEmail,
        'mentor'
      );
      mentorUserId = mUserId;
      mentorAccessToken = mToken;
      await createCourse();

      // Setup student
      const { userId: sUserId, accessToken: sToken } = await createAndVerifyUser(
        TEST_CONFIG.studentEmail,
        'student'
      );
      studentUserId = sUserId;
      studentAccessToken = sToken;

      // Create live session
      const sessionResponse = await request(server)
        .post('/api/live-sessions')
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send({
          courseId: courseId,
          title: 'Test Session for Enrollment',
          description: 'Testing student access',
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          duration: 60,
          maxAttendees: 30
        })
        .expect(201);

      sessionId = sessionResponse.body.data.session.id;
    });

    it('should allow enrolled student to join session', async () => {
      // Enroll student in course
      await request(server)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send({
          paymentMethod: 'test',
          paymentDetails: { test_payment_id: 'test_payment_123' }
        })
        .expect(201);

      // Student joins session
      const response = await request(server)
        .post(`/api/live-sessions/${sessionId}/join`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.meetingUrl).toBeTruthy();
      expect(response.body.data.sessionDetails.title).toBe('Test Session for Enrollment');
    });

    it('should prevent non-enrolled student from joining session', async () => {
      // Student tries to join without enrollment
      const response = await request(server)
        .post(`/api/live-sessions/${sessionId}/join`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_ENROLLED');
    });

    it('should track session attendance', async () => {
      // Enroll student
      await request(server)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send({
          paymentMethod: 'test',
          paymentDetails: { test_payment_id: 'test_payment_123' }
        })
        .expect(201);

      // Student joins session
      await request(server)
        .post(`/api/live-sessions/${sessionId}/join`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .expect(200);

      // Check attendance record
      const { data: attendanceData } = await supabase
        .from('session_attendance')
        .select('*')
        .eq('session_id', sessionId)
        .eq('student_id', studentUserId)
        .single();

      expect(attendanceData).toBeTruthy();
      expect(attendanceData.joined_at).toBeTruthy();
    });

    it('should enforce session capacity limits', async () => {
      // Create session with capacity of 1
      const limitedSessionResponse = await request(server)
        .post('/api/live-sessions')
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send({
          courseId: courseId,
          title: 'Limited Capacity Session',
          description: 'Testing capacity limits',
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          duration: 60,
          maxAttendees: 1
        })
        .expect(201);

      const limitedSessionId = limitedSessionResponse.body.data.session.id;

      // Enroll first student
      await request(server)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send({
          paymentMethod: 'test',
          paymentDetails: { test_payment_id: 'test_payment_123' }
        })
        .expect(201);

      // First student joins
      await request(server)
        .post(`/api/live-sessions/${limitedSessionId}/join`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .expect(200);

      // Create second student
      const { accessToken: student2Token } = await createAndVerifyUser(
        'student2.livesession@example.com',
        'student'
      );

      // Enroll second student
      await request(server)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send({
          paymentMethod: 'test',
          paymentDetails: { test_payment_id: 'test_payment_456' }
        })
        .expect(201);

      // Second student tries to join (should fail due to capacity)
      const response = await request(server)
        .post(`/api/live-sessions/${limitedSessionId}/join`)
        .set('Authorization', `Bearer ${student2Token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SESSION_FULL');
    });
  });

  describe('3. Session Management and Controls', () => {
    beforeEach(async () => {
      // Setup mentor, student, course, and session
      const { userId: mUserId, accessToken: mToken } = await createAndVerifyUser(
        TEST_CONFIG.mentorEmail,
        'mentor'
      );
      mentorUserId = mUserId;
      mentorAccessToken = mToken;
      await createCourse();

      const { userId: sUserId, accessToken: sToken } = await createAndVerifyUser(
        TEST_CONFIG.studentEmail,
        'student'
      );
      studentUserId = sUserId;
      studentAccessToken = sToken;

      const sessionResponse = await request(server)
        .post('/api/live-sessions')
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send({
          courseId: courseId,
          title: 'Session Management Test',
          description: 'Testing session controls',
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          duration: 60,
          maxAttendees: 30
        })
        .expect(201);

      sessionId = sessionResponse.body.data.session.id;
    });

    it('should allow mentor to start session', async () => {
      const response = await request(server)
        .put(`/api/live-sessions/${sessionId}`)
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send({ status: 'live' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.session.status).toBe('live');
      expect(response.body.data.session.startedAt).toBeTruthy();
    });

    it('should allow mentor to end session', async () => {
      // Start session first
      await request(server)
        .put(`/api/live-sessions/${sessionId}`)
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send({ status: 'live' })
        .expect(200);

      // End session
      const response = await request(server)
        .put(`/api/live-sessions/${sessionId}`)
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send({ status: 'completed' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.session.status).toBe('completed');
      expect(response.body.data.session.endedAt).toBeTruthy();
    });

    it('should allow mentor to cancel session', async () => {
      const response = await request(server)
        .put(`/api/live-sessions/${sessionId}`)
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send({ 
          status: 'cancelled',
          cancellationReason: 'Technical issues'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.session.status).toBe('cancelled');
    });

    it('should get session attendance report', async () => {
      // Enroll and join student
      await request(server)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send({
          paymentMethod: 'test',
          paymentDetails: { test_payment_id: 'test_payment_123' }
        })
        .expect(201);

      await request(server)
        .post(`/api/live-sessions/${sessionId}/join`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .expect(200);

      // Get attendance report
      const response = await request(server)
        .get(`/api/live-sessions/${sessionId}/attendance`)
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.attendance).toBeInstanceOf(Array);
      expect(response.body.data.attendance.length).toBe(1);
      expect(response.body.data.attendance[0].studentId).toBe(studentUserId);
    });

    it('should prevent students from managing session', async () => {
      // Enroll student
      await request(server)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send({
          paymentMethod: 'test',
          paymentDetails: { test_payment_id: 'test_payment_123' }
        })
        .expect(201);

      // Student tries to start session
      const response = await request(server)
        .put(`/api/live-sessions/${sessionId}`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send({ status: 'live' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('4. Session Recording and Resources', () => {
    beforeEach(async () => {
      // Setup mentor, course, and session
      const { userId: mUserId, accessToken: mToken } = await createAndVerifyUser(
        TEST_CONFIG.mentorEmail,
        'mentor'
      );
      mentorUserId = mUserId;
      mentorAccessToken = mToken;
      await createCourse();

      const sessionResponse = await request(server)
        .post('/api/live-sessions')
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send({
          courseId: courseId,
          title: 'Recording Test Session',
          description: 'Testing recording features',
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          duration: 60,
          maxAttendees: 30
        })
        .expect(201);

      sessionId = sessionResponse.body.data.session.id;
    });

    it('should save session recording after completion', async () => {
      // Start and complete session
      await request(server)
        .put(`/api/live-sessions/${sessionId}`)
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send({ status: 'live' })
        .expect(200);

      const response = await request(server)
        .put(`/api/live-sessions/${sessionId}`)
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send({ 
          status: 'completed',
          recordingUrl: 'https://example.com/recording.mp4'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.session.recordingUrl).toBeTruthy();
    });

    it('should allow adding session resources', async () => {
      const resourceData = {
        name: 'Session Slides',
        url: 'https://example.com/slides.pdf',
        type: 'pdf'
      };

      const response = await request(server)
        .post(`/api/live-sessions/${sessionId}/resources`)
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send(resourceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.resource.name).toBe(resourceData.name);
    });
  });

  describe('5. Complete Live Session Workflow Integration', () => {
    it('should complete full live session journey: creation → enrollment → participation → completion', async () => {
      // Step 1: Setup mentor and create course
      const { userId: mUserId, accessToken: mToken } = await createAndVerifyUser(
        TEST_CONFIG.mentorEmail,
        'mentor'
      );
      mentorUserId = mUserId;
      mentorAccessToken = mToken;
      await createCourse();

      // Step 2: Create live session
      const sessionResponse = await request(server)
        .post('/api/live-sessions')
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send({
          courseId: courseId,
          title: 'Complete Workflow Session',
          description: 'End-to-end live session test',
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          duration: 60,
          maxAttendees: 30
        })
        .expect(201);

      sessionId = sessionResponse.body.data.session.id;
      expect(sessionResponse.body.data.session.meetingUrl).toBeTruthy();

      // Step 3: Setup student and enroll in course
      const { userId: sUserId, accessToken: sToken } = await createAndVerifyUser(
        TEST_CONFIG.studentEmail,
        'student'
      );
      studentUserId = sUserId;
      studentAccessToken = sToken;

      await request(server)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send({
          paymentMethod: 'test',
          paymentDetails: { test_payment_id: 'complete_workflow_123' }
        })
        .expect(201);

      // Step 4: Mentor starts session
      await request(server)
        .put(`/api/live-sessions/${sessionId}`)
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send({ status: 'live' })
        .expect(200);

      // Step 5: Student joins session
      const joinResponse = await request(server)
        .post(`/api/live-sessions/${sessionId}/join`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .expect(200);

      expect(joinResponse.body.success).toBe(true);
      expect(joinResponse.body.data.meetingUrl).toBeTruthy();

      // Step 6: Verify attendance tracking
      const { data: attendanceData } = await supabase
        .from('session_attendance')
        .select('*')
        .eq('session_id', sessionId)
        .eq('student_id', studentUserId)
        .single();

      expect(attendanceData).toBeTruthy();

      // Step 7: Mentor ends session with recording
      await request(server)
        .put(`/api/live-sessions/${sessionId}`)
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send({ 
          status: 'completed',
          recordingUrl: 'https://example.com/complete-workflow-recording.mp4'
        })
        .expect(200);

      // Step 8: Add session resources
      await request(server)
        .post(`/api/live-sessions/${sessionId}/resources`)
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send({
          name: 'Complete Workflow Slides',
          url: 'https://example.com/slides.pdf',
          type: 'pdf'
        })
        .expect(201);

      // Step 9: Get final attendance report
      const attendanceResponse = await request(server)
        .get(`/api/live-sessions/${sessionId}/attendance`)
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .expect(200);

      expect(attendanceResponse.body.success).toBe(true);
      expect(attendanceResponse.body.data.attendance.length).toBe(1);

      console.log('✅ Complete live session workflow test passed');
    });
  });
});