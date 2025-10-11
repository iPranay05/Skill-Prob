/**
 * Integration Test: Internship Application and Employer Management Flow
 * Tests the complete internship/job system from posting to hiring
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
  employerEmail: 'employer.test@example.com',
  studentEmail: 'student.internship@example.com',
  student2Email: 'student2.internship@example.com',
  testPassword: 'TestPassword123!',
  testPhone: '+1234567890'
};

describe('Internship Application and Employer Management Flow', () => {
  let app: any;
  let server: any;
  let supabase: any;
  let employerUserId: string;
  let studentUserId: string;
  let student2UserId: string;
  let employerAccessToken: string;
  let studentAccessToken: string;
  let student2AccessToken: string;
  let jobId: string;
  let applicationId: string;

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
        .in('email', [
          TEST_CONFIG.employerEmail,
          TEST_CONFIG.studentEmail,
          TEST_CONFIG.student2Email
        ]);
      
      // Delete test jobs and applications
      if (jobId) {
        await supabase
          .from('jobs')
          .delete()
          .eq('id', jobId);
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

  describe('1. Job Posting by Employers', () => {
    beforeEach(async () => {
      // Setup employer user
      const { userId, accessToken } = await createAndVerifyUser(TEST_CONFIG.employerEmail, 'employer');
      employerUserId = userId;
      employerAccessToken = accessToken;
    });

    it('should allow employer to post a new job', async () => {
      const jobData = {
        title: 'Frontend Developer Intern',
        description: 'Join our team as a frontend developer intern and work on exciting projects',
        requirements: 'Knowledge of React, JavaScript, HTML, CSS',
        location: 'Bangalore, India',
        jobType: 'internship',
        stipend: {
          min: 15000,
          max: 25000,
          currency: 'INR'
        },
        duration: '3 months',
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        skills: ['React', 'JavaScript', 'HTML', 'CSS'],
        benefits: ['Certificate', 'Mentorship', 'Flexible hours']
      };

      const response = await request(server)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send(jobData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.job.title).toBe(jobData.title);
      expect(response.body.data.job.employerId).toBe(employerUserId);
      expect(response.body.data.job.status).toBe('active');

      jobId = response.body.data.job.id;
    });

    it('should validate required job fields', async () => {
      const incompleteJobData = {
        title: 'Incomplete Job',
        // Missing required fields
      };

      const response = await request(server)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send(incompleteJobData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should allow employer to update job posting', async () => {
      // Create job first
      const jobResponse = await request(server)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send({
          title: 'Original Job Title',
          description: 'Original description',
          requirements: 'Original requirements',
          location: 'Mumbai, India',
          jobType: 'internship',
          stipend: { min: 10000, max: 15000, currency: 'INR' },
          duration: '2 months',
          applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(201);

      jobId = jobResponse.body.data.job.id;

      // Update job
      const updateData = {
        title: 'Updated Job Title',
        stipend: { min: 15000, max: 20000, currency: 'INR' }
      };

      const response = await request(server)
        .put(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.job.title).toBe(updateData.title);
      expect(response.body.data.job.stipend.min).toBe(updateData.stipend.min);
    });

    it('should prevent non-owner from updating job', async () => {
      // Create job
      const jobResponse = await request(server)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send({
          title: 'Protected Job',
          description: 'This job should be protected',
          requirements: 'Test requirements',
          location: 'Delhi, India',
          jobType: 'internship',
          stipend: { min: 10000, max: 15000, currency: 'INR' },
          duration: '2 months',
          applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(201);

      jobId = jobResponse.body.data.job.id;

      // Create another employer
      const { accessToken: otherEmployerToken } = await createAndVerifyUser(
        'other.employer@example.com',
        'employer'
      );

      // Try to update job with different employer
      const response = await request(server)
        .put(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${otherEmployerToken}`)
        .send({ title: 'Hacked Title' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED_JOB_ACCESS');
    });
  });

  describe('2. Job Discovery and Filtering', () => {
    beforeEach(async () => {
      // Setup employer and create multiple jobs
      const { userId, accessToken } = await createAndVerifyUser(TEST_CONFIG.employerEmail, 'employer');
      employerUserId = userId;
      employerAccessToken = accessToken;

      // Create multiple jobs for testing
      const jobs = [
        {
          title: 'Frontend Developer Intern',
          description: 'React development internship',
          requirements: 'React, JavaScript',
          location: 'Bangalore, India',
          jobType: 'internship',
          stipend: { min: 15000, max: 25000, currency: 'INR' },
          duration: '3 months',
          applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          skills: ['React', 'JavaScript']
        },
        {
          title: 'Backend Developer Intern',
          description: 'Node.js development internship',
          requirements: 'Node.js, MongoDB',
          location: 'Mumbai, India',
          jobType: 'internship',
          stipend: { min: 20000, max: 30000, currency: 'INR' },
          duration: '4 months',
          applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          skills: ['Node.js', 'MongoDB']
        },
        {
          title: 'Full Stack Developer',
          description: 'Full-time developer position',
          requirements: 'React, Node.js, MongoDB',
          location: 'Pune, India',
          jobType: 'full-time',
          stipend: { min: 50000, max: 80000, currency: 'INR' },
          duration: 'Permanent',
          applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          skills: ['React', 'Node.js', 'MongoDB']
        }
      ];

      for (const job of jobs) {
        await request(server)
          .post('/api/jobs')
          .set('Authorization', `Bearer ${employerAccessToken}`)
          .send(job)
          .expect(201);
      }
    });

    it('should get all active jobs', async () => {
      const response = await request(server)
        .get('/api/jobs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobs).toBeInstanceOf(Array);
      expect(response.body.data.jobs.length).toBe(3);
      expect(response.body.data.pagination).toBeTruthy();
    });

    it('should filter jobs by location', async () => {
      const response = await request(server)
        .get('/api/jobs')
        .query({ location: 'Bangalore' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobs.length).toBe(1);
      expect(response.body.data.jobs[0].location).toContain('Bangalore');
    });

    it('should filter jobs by job type', async () => {
      const response = await request(server)
        .get('/api/jobs')
        .query({ jobType: 'internship' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobs.length).toBe(2);
      response.body.data.jobs.forEach((job: any) => {
        expect(job.jobType).toBe('internship');
      });
    });

    it('should filter jobs by stipend range', async () => {
      const response = await request(server)
        .get('/api/jobs')
        .query({ 
          stipendMin: 20000,
          stipendMax: 50000
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobs.length).toBeGreaterThan(0);
      response.body.data.jobs.forEach((job: any) => {
        expect(job.stipend.min).toBeGreaterThanOrEqual(20000);
        expect(job.stipend.max).toBeLessThanOrEqual(50000);
      });
    });

    it('should search jobs by title and description', async () => {
      const response = await request(server)
        .get('/api/jobs')
        .query({ search: 'Frontend React' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobs.length).toBeGreaterThan(0);
    });
  });

  describe('3. Student Job Applications', () => {
    beforeEach(async () => {
      // Setup employer and job
      const { userId, accessToken } = await createAndVerifyUser(TEST_CONFIG.employerEmail, 'employer');
      employerUserId = userId;
      employerAccessToken = accessToken;

      const jobResponse = await request(server)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send({
          title: 'Test Internship Position',
          description: 'Great opportunity for students',
          requirements: 'Basic programming knowledge',
          location: 'Remote',
          jobType: 'internship',
          stipend: { min: 15000, max: 20000, currency: 'INR' },
          duration: '3 months',
          applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(201);

      jobId = jobResponse.body.data.job.id;

      // Setup student
      const { userId: sUserId, accessToken: sToken } = await createAndVerifyUser(
        TEST_CONFIG.studentEmail,
        'student'
      );
      studentUserId = sUserId;
      studentAccessToken = sToken;
    });

    it('should allow student to apply for job', async () => {
      const applicationData = {
        coverLetter: 'I am very interested in this position and believe I would be a great fit.',
        resumeUrl: 'https://example.com/resume.pdf',
        expectedStipend: 18000,
        availableFrom: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Available in 1 week
      };

      const response = await request(server)
        .post(`/api/jobs/${jobId}/apply`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send(applicationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.application.jobId).toBe(jobId);
      expect(response.body.data.application.studentId).toBe(studentUserId);
      expect(response.body.data.application.status).toBe('applied');

      applicationId = response.body.data.application.id;
    });

    it('should prevent duplicate applications', async () => {
      // First application
      await request(server)
        .post(`/api/jobs/${jobId}/apply`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send({
          coverLetter: 'First application',
          resumeUrl: 'https://example.com/resume.pdf',
          expectedStipend: 18000
        })
        .expect(201);

      // Duplicate application
      const response = await request(server)
        .post(`/api/jobs/${jobId}/apply`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send({
          coverLetter: 'Second application',
          resumeUrl: 'https://example.com/resume2.pdf',
          expectedStipend: 19000
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ALREADY_APPLIED');
    });

    it('should prevent application after deadline', async () => {
      // Create job with past deadline
      const expiredJobResponse = await request(server)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send({
          title: 'Expired Job',
          description: 'This job has expired',
          requirements: 'Test requirements',
          location: 'Test Location',
          jobType: 'internship',
          stipend: { min: 10000, max: 15000, currency: 'INR' },
          duration: '2 months',
          applicationDeadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
        })
        .expect(201);

      const expiredJobId = expiredJobResponse.body.data.job.id;

      const response = await request(server)
        .post(`/api/jobs/${expiredJobId}/apply`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send({
          coverLetter: 'Late application',
          resumeUrl: 'https://example.com/resume.pdf',
          expectedStipend: 12000
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('APPLICATION_DEADLINE_PASSED');
    });

    it('should track student application history', async () => {
      // Apply to job
      await request(server)
        .post(`/api/jobs/${jobId}/apply`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send({
          coverLetter: 'Application for tracking test',
          resumeUrl: 'https://example.com/resume.pdf',
          expectedStipend: 18000
        })
        .expect(201);

      // Get student applications
      const response = await request(server)
        .get('/api/student/applications')
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.applications).toBeInstanceOf(Array);
      expect(response.body.data.applications.length).toBe(1);
      expect(response.body.data.applications[0].jobId).toBe(jobId);
    });
  });

  describe('4. Employer Application Management', () => {
    beforeEach(async () => {
      // Setup employer, job, and students
      const { userId, accessToken } = await createAndVerifyUser(TEST_CONFIG.employerEmail, 'employer');
      employerUserId = userId;
      employerAccessToken = accessToken;

      const jobResponse = await request(server)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send({
          title: 'Application Management Test Job',
          description: 'Testing application management features',
          requirements: 'Test requirements',
          location: 'Test Location',
          jobType: 'internship',
          stipend: { min: 15000, max: 20000, currency: 'INR' },
          duration: '3 months',
          applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(201);

      jobId = jobResponse.body.data.job.id;

      // Setup students
      const { userId: s1UserId, accessToken: s1Token } = await createAndVerifyUser(
        TEST_CONFIG.studentEmail,
        'student'
      );
      studentUserId = s1UserId;
      studentAccessToken = s1Token;

      const { userId: s2UserId, accessToken: s2Token } = await createAndVerifyUser(
        TEST_CONFIG.student2Email,
        'student'
      );
      student2UserId = s2UserId;
      student2AccessToken = s2Token;

      // Students apply for job
      await request(server)
        .post(`/api/jobs/${jobId}/apply`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send({
          coverLetter: 'First student application',
          resumeUrl: 'https://example.com/resume1.pdf',
          expectedStipend: 18000
        })
        .expect(201);

      const app2Response = await request(server)
        .post(`/api/jobs/${jobId}/apply`)
        .set('Authorization', `Bearer ${student2AccessToken}`)
        .send({
          coverLetter: 'Second student application',
          resumeUrl: 'https://example.com/resume2.pdf',
          expectedStipend: 19000
        })
        .expect(201);

      applicationId = app2Response.body.data.application.id;
    });

    it('should get all applications for employer job', async () => {
      const response = await request(server)
        .get(`/api/jobs/${jobId}/applications`)
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.applications).toBeInstanceOf(Array);
      expect(response.body.data.applications.length).toBe(2);
    });

    it('should filter applications by status', async () => {
      // Update one application status
      await request(server)
        .put(`/api/jobs/${jobId}/applications/${applicationId}`)
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send({ status: 'shortlisted' })
        .expect(200);

      // Filter by shortlisted status
      const response = await request(server)
        .get(`/api/jobs/${jobId}/applications`)
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .query({ status: 'shortlisted' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.applications.length).toBe(1);
      expect(response.body.data.applications[0].status).toBe('shortlisted');
    });

    it('should allow employer to update application status', async () => {
      const updateData = {
        status: 'shortlisted',
        notes: 'Good candidate, proceed to interview'
      };

      const response = await request(server)
        .put(`/api/jobs/${jobId}/applications/${applicationId}`)
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.application.status).toBe('shortlisted');
      expect(response.body.data.application.notes).toBe(updateData.notes);
    });

    it('should send notification when application status changes', async () => {
      // Update application status
      await request(server)
        .put(`/api/jobs/${jobId}/applications/${applicationId}`)
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send({ 
          status: 'interview_scheduled',
          notes: 'Interview scheduled for next week'
        })
        .expect(200);

      // Check if notification was created
      const { data: notificationData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', student2UserId)
        .eq('type', 'application_status_update')
        .single();

      expect(notificationData).toBeTruthy();
    });

    it('should allow bulk status updates', async () => {
      // Get all application IDs
      const applicationsResponse = await request(server)
        .get(`/api/jobs/${jobId}/applications`)
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .expect(200);

      const applicationIds = applicationsResponse.body.data.applications.map((app: any) => app.id);

      // Bulk update
      const response = await request(server)
        .put(`/api/jobs/${jobId}/applications/bulk`)
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send({
          applicationIds,
          status: 'reviewed',
          notes: 'Bulk review completed'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updatedCount).toBe(2);
    });

    it('should prevent unauthorized access to applications', async () => {
      // Create another employer
      const { accessToken: otherEmployerToken } = await createAndVerifyUser(
        'other.employer@example.com',
        'employer'
      );

      // Try to access applications
      const response = await request(server)
        .get(`/api/jobs/${jobId}/applications`)
        .set('Authorization', `Bearer ${otherEmployerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED_JOB_ACCESS');
    });
  });

  describe('5. Interview Scheduling and Communication', () => {
    beforeEach(async () => {
      // Setup employer, job, student, and application
      const { userId, accessToken } = await createAndVerifyUser(TEST_CONFIG.employerEmail, 'employer');
      employerUserId = userId;
      employerAccessToken = accessToken;

      const jobResponse = await request(server)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send({
          title: 'Interview Test Job',
          description: 'Testing interview features',
          requirements: 'Test requirements',
          location: 'Test Location',
          jobType: 'internship',
          stipend: { min: 15000, max: 20000, currency: 'INR' },
          duration: '3 months',
          applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(201);

      jobId = jobResponse.body.data.job.id;

      const { userId: sUserId, accessToken: sToken } = await createAndVerifyUser(
        TEST_CONFIG.studentEmail,
        'student'
      );
      studentUserId = sUserId;
      studentAccessToken = sToken;

      const applicationResponse = await request(server)
        .post(`/api/jobs/${jobId}/apply`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send({
          coverLetter: 'Interview test application',
          resumeUrl: 'https://example.com/resume.pdf',
          expectedStipend: 18000
        })
        .expect(201);

      applicationId = applicationResponse.body.data.application.id;
    });

    it('should schedule interview for application', async () => {
      const interviewData = {
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
        type: 'video_call',
        meetingUrl: 'https://meet.google.com/test-interview',
        notes: 'Technical interview round'
      };

      const response = await request(server)
        .post(`/api/jobs/${jobId}/applications/${applicationId}/interview`)
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send(interviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.interview.applicationId).toBe(applicationId);
      expect(response.body.data.interview.type).toBe(interviewData.type);
    });

    it('should send message to candidate', async () => {
      const messageData = {
        subject: 'Interview Invitation',
        message: 'We would like to invite you for an interview. Please confirm your availability.',
        type: 'interview_invitation'
      };

      const response = await request(server)
        .post(`/api/jobs/${jobId}/applications/${applicationId}/message`)
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message.subject).toBe(messageData.subject);
    });

    it('should allow candidate to respond to messages', async () => {
      // Employer sends message first
      await request(server)
        .post(`/api/jobs/${jobId}/applications/${applicationId}/message`)
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send({
          subject: 'Interview Invitation',
          message: 'Please confirm your availability',
          type: 'interview_invitation'
        })
        .expect(201);

      // Student responds
      const responseData = {
        message: 'Thank you for the invitation. I am available next week.',
        type: 'response'
      };

      const response = await request(server)
        .post(`/api/jobs/${jobId}/applications/${applicationId}/message`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send(responseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message.message).toBe(responseData.message);
    });
  });

  describe('6. Complete Internship Workflow Integration', () => {
    it('should complete full internship journey: job posting → application → review → interview → hiring', async () => {
      // Step 1: Setup employer and post job
      const { userId: eUserId, accessToken: eToken } = await createAndVerifyUser(
        TEST_CONFIG.employerEmail,
        'employer'
      );
      employerUserId = eUserId;
      employerAccessToken = eToken;

      const jobResponse = await request(server)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send({
          title: 'Complete Workflow Internship',
          description: 'End-to-end internship workflow test',
          requirements: 'Programming skills, good communication',
          location: 'Bangalore, India',
          jobType: 'internship',
          stipend: { min: 20000, max: 25000, currency: 'INR' },
          duration: '6 months',
          applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          skills: ['JavaScript', 'React', 'Node.js'],
          benefits: ['Certificate', 'Mentorship', 'Full-time opportunity']
        })
        .expect(201);

      jobId = jobResponse.body.data.job.id;
      expect(jobResponse.body.data.job.status).toBe('active');

      // Step 2: Setup student and apply for job
      const { userId: sUserId, accessToken: sToken } = await createAndVerifyUser(
        TEST_CONFIG.studentEmail,
        'student'
      );
      studentUserId = sUserId;
      studentAccessToken = sToken;

      const applicationResponse = await request(server)
        .post(`/api/jobs/${jobId}/apply`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send({
          coverLetter: 'I am very excited about this opportunity and believe my skills align well with the requirements.',
          resumeUrl: 'https://example.com/complete-workflow-resume.pdf',
          expectedStipend: 22000,
          availableFrom: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        })
        .expect(201);

      applicationId = applicationResponse.body.data.application.id;
      expect(applicationResponse.body.data.application.status).toBe('applied');

      // Step 3: Employer reviews and shortlists application
      await request(server)
        .put(`/api/jobs/${jobId}/applications/${applicationId}`)
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send({
          status: 'shortlisted',
          notes: 'Strong candidate with relevant skills'
        })
        .expect(200);

      // Step 4: Schedule interview
      const interviewResponse = await request(server)
        .post(`/api/jobs/${jobId}/applications/${applicationId}/interview`)
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send({
          scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'video_call',
          meetingUrl: 'https://meet.google.com/complete-workflow-interview',
          notes: 'Technical and HR interview'
        })
        .expect(201);

      expect(interviewResponse.body.success).toBe(true);

      // Step 5: Send interview invitation message
      await request(server)
        .post(`/api/jobs/${jobId}/applications/${applicationId}/message`)
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send({
          subject: 'Interview Scheduled - Complete Workflow Internship',
          message: 'Congratulations! We have scheduled your interview for next week. Please join the meeting at the specified time.',
          type: 'interview_invitation'
        })
        .expect(201);

      // Step 6: Student responds to interview invitation
      await request(server)
        .post(`/api/jobs/${jobId}/applications/${applicationId}/message`)
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .send({
          message: 'Thank you for the opportunity. I confirm my availability for the interview.',
          type: 'response'
        })
        .expect(201);

      // Step 7: Update application status after interview
      await request(server)
        .put(`/api/jobs/${jobId}/applications/${applicationId}`)
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send({
          status: 'interview_completed',
          notes: 'Great interview, candidate performed well'
        })
        .expect(200);

      // Step 8: Final hiring decision
      const hiringResponse = await request(server)
        .put(`/api/jobs/${jobId}/applications/${applicationId}`)
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .send({
          status: 'selected',
          notes: 'Congratulations! We are pleased to offer you the internship position.'
        })
        .expect(200);

      expect(hiringResponse.body.success).toBe(true);
      expect(hiringResponse.body.data.application.status).toBe('selected');

      // Step 9: Verify final state - check student applications
      const studentApplicationsResponse = await request(server)
        .get('/api/student/applications')
        .set('Authorization', `Bearer ${studentAccessToken}`)
        .expect(200);

      expect(studentApplicationsResponse.body.success).toBe(true);
      expect(studentApplicationsResponse.body.data.applications.length).toBe(1);
      expect(studentApplicationsResponse.body.data.applications[0].status).toBe('selected');

      // Step 10: Verify employer can see hired candidate
      const employerApplicationsResponse = await request(server)
        .get(`/api/jobs/${jobId}/applications`)
        .set('Authorization', `Bearer ${employerAccessToken}`)
        .query({ status: 'selected' })
        .expect(200);

      expect(employerApplicationsResponse.body.success).toBe(true);
      expect(employerApplicationsResponse.body.data.applications.length).toBe(1);

      console.log('✅ Complete internship workflow test passed');
    });
  });
});