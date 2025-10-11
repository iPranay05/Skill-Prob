/**
 * Integration Test: Complete User Registration and Course Enrollment Flow
 * Tests the entire user journey from registration to course enrollment
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import request from 'supertest';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  testEmail: 'integration.test@example.com',
  testPhone: '+1234567890',
  testPassword: 'TestPassword123!',
  mentorEmail: 'mentor.test@example.com',
  referralCode: 'TEST123'
};

describe('User Registration and Course Enrollment Flow', () => {
  let app: any;
  let server: any;
  let supabase: any;
  let testUserId: string;
  let mentorUserId: string;
  let courseId: string;
  let accessToken: string;
  let mentorAccessToken: string;

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
        .in('email', [TEST_CONFIG.testEmail, TEST_CONFIG.mentorEmail]);
      
      // Delete test courses
      if (courseId) {
        await supabase
          .from('courses')
          .delete()
          .eq('id', courseId);
      }
    } catch (error) {
      console.log('Cleanup error (expected in fresh test):', error);
    }
  };

  describe('1. User Registration Flow', () => {
    it('should register a new student user successfully', async () => {
      const registrationData = {
        email: TEST_CONFIG.testEmail,
        password: TEST_CONFIG.testPassword,
        firstName: 'Test',
        lastName: 'Student',
        phone: TEST_CONFIG.testPhone,
        role: 'student',
        referralCode: TEST_CONFIG.referralCode
      };

      const response = await request(server)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(TEST_CONFIG.testEmail);
      expect(response.body.data.user.role).toBe('student');
      expect(response.body.data.user.emailVerified).toBe(false);

      testUserId = response.body.data.user.id;
    });

    it('should handle duplicate email registration', async () => {
      // First registration
      await request(server)
        .post('/api/auth/register')
        .send({
          email: TEST_CONFIG.testEmail,
          password: TEST_CONFIG.testPassword,
          firstName: 'Test',
          lastName: 'Student',
          phone: TEST_CONFIG.testPhone,
          role: 'student'
        })
        .expect(201);

      // Duplicate registration
      const response = await request(server)
        .post('/api/auth/register')
        .send({
          email: TEST_CONFIG.testEmail,
          password: 'DifferentPassword123!',
          firstName: 'Another',
          lastName: 'User',
          phone: '+9876543210',
          role: 'student'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should verify email OTP successfully', async () => {
      // Register user first
      await request(server)
        .post('/api/auth/register')
        .send({
          email: TEST_CONFIG.testEmail,
          password: TEST_CONFIG.testPassword,
          firstName: 'Test',
          lastName: 'Student',
          phone: TEST_CONFIG.testPhone,
          role: 'student'
        })
        .expect(201);

      // Get OTP from database (in real scenario, this would be sent via email)
      const { data: otpData } = await supabase
        .from('otp_verifications')
        .select('otp')
        .eq('email', TEST_CONFIG.testEmail)
        .eq('type', 'email')
        .single();

      expect(otpData).toBeTruthy();

      // Verify OTP
      const response = await request(server)
        .post('/api/auth/verify-otp')
        .send({
          email: TEST_CONFIG.testEmail,
          otp: otpData.otp,
          type: 'email'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.verified).toBe(true);
    });

    it('should login user after email verification', async () => {
      // Register and verify user
      await request(server)
        .post('/api/auth/register')
        .send({
          email: TEST_CONFIG.testEmail,
          password: TEST_CONFIG.testPassword,
          firstName: 'Test',
          lastName: 'Student',
          phone: TEST_CONFIG.testPhone,
          role: 'student'
        })
        .expect(201);

      // Get and verify OTP
      const { data: otpData } = await supabase
        .from('otp_verifications')
        .select('otp')
        .eq('email', TEST_CONFIG.testEmail)
        .eq('type', 'email')
        .single();

      await request(server)
        .post('/api/auth/verify-otp')
        .send({
          email: TEST_CONFIG.testEmail,
          otp: otpData.otp,
          type: 'email'
        })
        .expect(200);

      // Login
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: TEST_CONFIG.testEmail,
          password: TEST_CONFIG.testPassword
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(TEST_CONFIG.testEmail);
      expect(response.body.data.tokens.accessToken).toBeTruthy();
      expect(response.body.data.tokens.refreshToken).toBeTruthy();

      accessToken = response.body.data.tokens.accessToken;
      testUserId = response.body.data.user.id;
    });
  });

  describe('2. Course Creation and Management Flow', () => {
    beforeEach(async () => {
      // Create and login mentor user
      await request(server)
        .post('/api/auth/register')
        .send({
          email: TEST_CONFIG.mentorEmail,
          password: TEST_CONFIG.testPassword,
          firstName: 'Test',
          lastName: 'Mentor',
          phone: '+1234567891',
          role: 'mentor'
        })
        .expect(201);

      // Verify mentor email
      const { data: otpData } = await supabase
        .from('otp_verifications')
        .select('otp')
        .eq('email', TEST_CONFIG.mentorEmail)
        .eq('type', 'email')
        .single();

      await request(server)
        .post('/api/auth/verify-otp')
        .send({
          email: TEST_CONFIG.mentorEmail,
          otp: otpData.otp,
          type: 'email'
        })
        .expect(200);

      // Login mentor
      const mentorLoginResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email: TEST_CONFIG.mentorEmail,
          password: TEST_CONFIG.testPassword
        })
        .expect(200);

      mentorAccessToken = mentorLoginResponse.body.data.tokens.accessToken;
      mentorUserId = mentorLoginResponse.body.data.user.id;
    });

    it('should create a new course successfully', async () => {
      const courseData = {
        title: 'Integration Test Course',
        description: 'A course created for integration testing',
        category: 'Programming',
        type: 'live',
        pricing: {
          amount: 2999,
          currency: 'INR',
          subscriptionType: 'one-time'
        },
        content: {
          syllabus: ['Introduction', 'Advanced Topics'],
          prerequisites: ['Basic programming knowledge'],
          learningOutcomes: ['Build applications']
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

      expect(response.body.success).toBe(true);
      expect(response.body.data.course.title).toBe(courseData.title);
      expect(response.body.data.course.mentorId).toBe(mentorUserId);
      expect(response.body.data.course.status).toBe('draft');

      courseId = response.body.data.course.id;
    });

    it('should publish course successfully', async () => {
      // Create course first
      const courseData = {
        title: 'Integration Test Course',
        description: 'A course created for integration testing',
        category: 'Programming',
        type: 'live',
        pricing: {
          amount: 2999,
          currency: 'INR',
          subscriptionType: 'one-time'
        }
      };

      const createResponse = await request(server)
        .post('/api/courses')
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send(courseData)
        .expect(201);

      courseId = createResponse.body.data.course.id;

      // Publish course
      const response = await request(server)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send({ status: 'published' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.course.status).toBe('published');
    });
  });

  describe('3. Course Enrollment Flow', () => {
    beforeEach(async () => {
      // Setup student user
      await request(server)
        .post('/api/auth/register')
        .send({
          email: TEST_CONFIG.testEmail,
          password: TEST_CONFIG.testPassword,
          firstName: 'Test',
          lastName: 'Student',
          phone: TEST_CONFIG.testPhone,
          role: 'student'
        })
        .expect(201);

      const { data: otpData } = await supabase
        .from('otp_verifications')
        .select('otp')
        .eq('email', TEST_CONFIG.testEmail)
        .eq('type', 'email')
        .single();

      await request(server)
        .post('/api/auth/verify-otp')
        .send({
          email: TEST_CONFIG.testEmail,
          otp: otpData.otp,
          type: 'email'
        })
        .expect(200);

      const loginResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email: TEST_CONFIG.testEmail,
          password: TEST_CONFIG.testPassword
        })
        .expect(200);

      accessToken = loginResponse.body.data.tokens.accessToken;
      testUserId = loginResponse.body.data.user.id;

      // Setup mentor and course
      await request(server)
        .post('/api/auth/register')
        .send({
          email: TEST_CONFIG.mentorEmail,
          password: TEST_CONFIG.testPassword,
          firstName: 'Test',
          lastName: 'Mentor',
          phone: '+1234567891',
          role: 'mentor'
        })
        .expect(201);

      const { data: mentorOtpData } = await supabase
        .from('otp_verifications')
        .select('otp')
        .eq('email', TEST_CONFIG.mentorEmail)
        .eq('type', 'email')
        .single();

      await request(server)
        .post('/api/auth/verify-otp')
        .send({
          email: TEST_CONFIG.mentorEmail,
          otp: mentorOtpData.otp,
          type: 'email'
        })
        .expect(200);

      const mentorLoginResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email: TEST_CONFIG.mentorEmail,
          password: TEST_CONFIG.testPassword
        })
        .expect(200);

      mentorAccessToken = mentorLoginResponse.body.data.tokens.accessToken;

      // Create and publish course
      const courseResponse = await request(server)
        .post('/api/courses')
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send({
          title: 'Integration Test Course',
          description: 'A course for testing enrollment',
          category: 'Programming',
          type: 'live',
          pricing: {
            amount: 2999,
            currency: 'INR',
            subscriptionType: 'one-time'
          }
        })
        .expect(201);

      courseId = courseResponse.body.data.course.id;

      await request(server)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${mentorAccessToken}`)
        .send({ status: 'published' })
        .expect(200);
    });

    it('should browse and filter courses successfully', async () => {
      const response = await request(server)
        .get('/api/courses')
        .query({
          category: 'Programming',
          type: 'live',
          page: 1,
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.courses).toBeInstanceOf(Array);
      expect(response.body.data.courses.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toBeTruthy();
    });

    it('should enroll in course successfully', async () => {
      const enrollmentData = {
        paymentMethod: 'test',
        paymentDetails: {
          test_payment_id: 'test_payment_123'
        }
      };

      const response = await request(server)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(enrollmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.enrollment.studentId).toBe(testUserId);
      expect(response.body.data.enrollment.courseId).toBe(courseId);
      expect(response.body.data.enrollment.status).toBe('active');
    });

    it('should prevent duplicate enrollment', async () => {
      // First enrollment
      await request(server)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          paymentMethod: 'test',
          paymentDetails: { test_payment_id: 'test_payment_123' }
        })
        .expect(201);

      // Duplicate enrollment attempt
      const response = await request(server)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          paymentMethod: 'test',
          paymentDetails: { test_payment_id: 'test_payment_456' }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ALREADY_ENROLLED');
    });

    it('should track enrollment progress', async () => {
      // Enroll in course
      await request(server)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          paymentMethod: 'test',
          paymentDetails: { test_payment_id: 'test_payment_123' }
        })
        .expect(201);

      // Get enrollment progress
      const response = await request(server)
        .get(`/api/courses/${courseId}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.progress).toBeDefined();
      expect(response.body.data.enrollment).toBeTruthy();
    });
  });

  describe('4. Complete User Journey Integration', () => {
    it('should complete full user journey: registration → verification → login → course discovery → enrollment', async () => {
      // Step 1: Register student
      const registrationResponse = await request(server)
        .post('/api/auth/register')
        .send({
          email: TEST_CONFIG.testEmail,
          password: TEST_CONFIG.testPassword,
          firstName: 'Journey',
          lastName: 'Test',
          phone: TEST_CONFIG.testPhone,
          role: 'student'
        })
        .expect(201);

      expect(registrationResponse.body.success).toBe(true);
      const userId = registrationResponse.body.data.user.id;

      // Step 2: Verify email
      const { data: otpData } = await supabase
        .from('otp_verifications')
        .select('otp')
        .eq('email', TEST_CONFIG.testEmail)
        .eq('type', 'email')
        .single();

      await request(server)
        .post('/api/auth/verify-otp')
        .send({
          email: TEST_CONFIG.testEmail,
          otp: otpData.otp,
          type: 'email'
        })
        .expect(200);

      // Step 3: Login
      const loginResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email: TEST_CONFIG.testEmail,
          password: TEST_CONFIG.testPassword
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      const userAccessToken = loginResponse.body.data.tokens.accessToken;

      // Step 4: Create mentor and course (setup)
      await request(server)
        .post('/api/auth/register')
        .send({
          email: TEST_CONFIG.mentorEmail,
          password: TEST_CONFIG.testPassword,
          firstName: 'Journey',
          lastName: 'Mentor',
          phone: '+1234567891',
          role: 'mentor'
        })
        .expect(201);

      const { data: mentorOtpData } = await supabase
        .from('otp_verifications')
        .select('otp')
        .eq('email', TEST_CONFIG.mentorEmail)
        .eq('type', 'email')
        .single();

      await request(server)
        .post('/api/auth/verify-otp')
        .send({
          email: TEST_CONFIG.mentorEmail,
          otp: mentorOtpData.otp,
          type: 'email'
        })
        .expect(200);

      const mentorLoginResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email: TEST_CONFIG.mentorEmail,
          password: TEST_CONFIG.testPassword
        })
        .expect(200);

      const mentorToken = mentorLoginResponse.body.data.tokens.accessToken;

      const courseResponse = await request(server)
        .post('/api/courses')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          title: 'Complete Journey Test Course',
          description: 'End-to-end test course',
          category: 'Programming',
          type: 'live',
          pricing: {
            amount: 1999,
            currency: 'INR',
            subscriptionType: 'one-time'
          }
        })
        .expect(201);

      const testCourseId = courseResponse.body.data.course.id;

      await request(server)
        .put(`/api/courses/${testCourseId}`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({ status: 'published' })
        .expect(200);

      // Step 5: Discover courses
      const coursesResponse = await request(server)
        .get('/api/courses')
        .query({ category: 'Programming' })
        .expect(200);

      expect(coursesResponse.body.success).toBe(true);
      expect(coursesResponse.body.data.courses.length).toBeGreaterThan(0);

      // Step 6: Enroll in course
      const enrollmentResponse = await request(server)
        .post(`/api/courses/${testCourseId}/enroll`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({
          paymentMethod: 'test',
          paymentDetails: { test_payment_id: 'journey_test_123' }
        })
        .expect(201);

      expect(enrollmentResponse.body.success).toBe(true);
      expect(enrollmentResponse.body.data.enrollment.studentId).toBe(userId);

      // Step 7: Verify enrollment in user profile
      const profileResponse = await request(server)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.user.id).toBe(userId);

      // Complete journey successful
      console.log('✅ Complete user journey test passed');
    });
  });
});