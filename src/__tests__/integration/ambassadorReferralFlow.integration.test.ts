/**
 * Integration Test: Ambassador Referral and Payout Processing Workflow
 * Tests the complete ambassador system from application to payout
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
  ambassadorEmail: 'ambassador.test@example.com',
  studentEmail: 'referred.student@example.com',
  adminEmail: 'admin.test@example.com',
  testPassword: 'TestPassword123!',
  testPhone: '+1234567890'
};

describe('Ambassador Referral and Payout Processing Workflow', () => {
  let app: any;
  let server: any;
  let supabase: any;
  let ambassadorUserId: string;
  let studentUserId: string;
  let adminUserId: string;
  let ambassadorAccessToken: string;
  let studentAccessToken: string;
  let adminAccessToken: string;
  let referralCode: string;
  let ambassadorId: string;

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
          TEST_CONFIG.ambassadorEmail,
          TEST_CONFIG.studentEmail,
          TEST_CONFIG.adminEmail
        ]);
      
      // Delete test ambassadors
      if (ambassadorId) {
        await supabase
          .from('ambassadors')
          .delete()
          .eq('id', ambassadorId);
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

  describe('1. Ambassador Application Process', () => {
    it('should allow user to apply for ambassador status', async () => {
      // Create and verify user
      const { userId, accessToken } = await createAndVerifyUser(TEST_CONFIG.ambassadorEmail);
      ambassadorUserId = userId;
      ambassadorAccessToken = accessToken;

      const applicationData = {
        motivation: 'I want to help students learn and grow in their careers',
        socialMedia: {
          platform: 'instagram',
          handle: '@testambassador',
          followers: 2500
        },
        experience: 'I have been mentoring students for 2 years and have a strong network in tech'
      };

      const response = await request(server)
        .post('/api/ambassadors/apply')
        .set('Authorization', `Bearer ${ambassadorAccessToken}`)
        .send(applicationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.application.userId).toBe(ambassadorUserId);
      expect(response.body.data.application.status).toBe('pending');
      expect(response.body.data.application.motivation).toBe(applicationData.motivation);

      ambassadorId = response.body.data.application.id;
    });

    it('should prevent duplicate ambassador applications', async () => {
      // Create user and apply once
      const { userId, accessToken } = await createAndVerifyUser(TEST_CONFIG.ambassadorEmail);
      ambassadorUserId = userId;
      ambassadorAccessToken = accessToken;

      const applicationData = {
        motivation: 'First application',
        socialMedia: {
          platform: 'instagram',
          handle: '@testambassador',
          followers: 2500
        },
        experience: 'Experience description'
      };

      await request(server)
        .post('/api/ambassadors/apply')
        .set('Authorization', `Bearer ${ambassadorAccessToken}`)
        .send(applicationData)
        .expect(201);

      // Try to apply again
      const duplicateResponse = await request(server)
        .post('/api/ambassadors/apply')
        .set('Authorization', `Bearer ${ambassadorAccessToken}`)
        .send({
          ...applicationData,
          motivation: 'Second application'
        })
        .expect(400);

      expect(duplicateResponse.body.success).toBe(false);
      expect(duplicateResponse.body.error.code).toBe('APPLICATION_EXISTS');
    });
  });

  describe('2. Admin Approval Process', () => {
    beforeEach(async () => {
      // Setup ambassador application
      const { userId, accessToken } = await createAndVerifyUser(TEST_CONFIG.ambassadorEmail);
      ambassadorUserId = userId;
      ambassadorAccessToken = accessToken;

      const applicationResponse = await request(server)
        .post('/api/ambassadors/apply')
        .set('Authorization', `Bearer ${ambassadorAccessToken}`)
        .send({
          motivation: 'Test motivation',
          socialMedia: {
            platform: 'instagram',
            handle: '@testambassador',
            followers: 2500
          },
          experience: 'Test experience'
        })
        .expect(201);

      ambassadorId = applicationResponse.body.data.application.id;

      // Setup admin user
      const { userId: adminId, accessToken: adminToken } = await createAndVerifyUser(
        TEST_CONFIG.adminEmail,
        'admin'
      );
      adminUserId = adminId;
      adminAccessToken = adminToken;
    });

    it('should allow admin to approve ambassador application', async () => {
      const approvalData = {
        status: 'approved',
        notes: 'Great application with strong social media presence'
      };

      const response = await request(server)
        .put(`/api/admin/ambassadors/${ambassadorId}/approve`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(approvalData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ambassador.status).toBe('approved');
      expect(response.body.data.ambassador.referralCode).toBeTruthy();

      referralCode = response.body.data.ambassador.referralCode;
    });

    it('should allow admin to reject ambassador application', async () => {
      const rejectionData = {
        status: 'rejected',
        notes: 'Insufficient social media following'
      };

      const response = await request(server)
        .put(`/api/admin/ambassadors/${ambassadorId}/approve`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(rejectionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ambassador.status).toBe('rejected');
    });

    it('should generate unique referral code upon approval', async () => {
      await request(server)
        .put(`/api/admin/ambassadors/${ambassadorId}/approve`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          status: 'approved',
          notes: 'Approved for testing'
        })
        .expect(200);

      // Get ambassador dashboard to verify referral code
      const dashboardResponse = await request(server)
        .get('/api/ambassadors/dashboard')
        .set('Authorization', `Bearer ${ambassadorAccessToken}`)
        .expect(200);

      expect(dashboardResponse.body.success).toBe(true);
      expect(dashboardResponse.body.data.referralCode).toBeTruthy();
      expect(dashboardResponse.body.data.referralCode).toMatch(/^[A-Z0-9]{6,8}$/);

      referralCode = dashboardResponse.body.data.referralCode;
    });
  });

  describe('3. Referral Tracking System', () => {
    beforeEach(async () => {
      // Setup approved ambassador
      const { userId, accessToken } = await createAndVerifyUser(TEST_CONFIG.ambassadorEmail);
      ambassadorUserId = userId;
      ambassadorAccessToken = accessToken;

      const applicationResponse = await request(server)
        .post('/api/ambassadors/apply')
        .set('Authorization', `Bearer ${ambassadorAccessToken}`)
        .send({
          motivation: 'Test motivation',
          socialMedia: {
            platform: 'instagram',
            handle: '@testambassador',
            followers: 2500
          },
          experience: 'Test experience'
        })
        .expect(201);

      ambassadorId = applicationResponse.body.data.application.id;

      // Setup admin and approve ambassador
      const { userId: adminId, accessToken: adminToken } = await createAndVerifyUser(
        TEST_CONFIG.adminEmail,
        'admin'
      );
      adminUserId = adminId;
      adminAccessToken = adminToken;

      const approvalResponse = await request(server)
        .put(`/api/admin/ambassadors/${ambassadorId}/approve`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          status: 'approved',
          notes: 'Approved for testing'
        })
        .expect(200);

      referralCode = approvalResponse.body.data.ambassador.referralCode;
    });

    it('should track referral when student registers with referral code', async () => {
      // Register student with referral code
      const registrationResponse = await request(server)
        .post('/api/auth/register')
        .send({
          email: TEST_CONFIG.studentEmail,
          password: TEST_CONFIG.testPassword,
          firstName: 'Referred',
          lastName: 'Student',
          phone: '+1234567891',
          role: 'student',
          referralCode: referralCode
        })
        .expect(201);

      studentUserId = registrationResponse.body.data.user.id;

      // Verify referral was tracked
      const { data: referralData } = await supabase
        .from('referrals')
        .select('*')
        .eq('student_id', studentUserId)
        .eq('referral_code', referralCode)
        .single();

      expect(referralData).toBeTruthy();
      expect(referralData.ambassador_id).toBe(ambassadorId);
      expect(referralData.status).toBe('pending');
    });

    it('should update ambassador stats after successful referral', async () => {
      // Register student with referral code
      await request(server)
        .post('/api/auth/register')
        .send({
          email: TEST_CONFIG.studentEmail,
          password: TEST_CONFIG.testPassword,
          firstName: 'Referred',
          lastName: 'Student',
          phone: '+1234567891',
          role: 'student',
          referralCode: referralCode
        })
        .expect(201);

      // Check ambassador dashboard stats
      const dashboardResponse = await request(server)
        .get('/api/ambassadors/dashboard')
        .set('Authorization', `Bearer ${ambassadorAccessToken}`)
        .expect(200);

      expect(dashboardResponse.body.success).toBe(true);
      expect(dashboardResponse.body.data.stats.totalReferrals).toBe(1);
      expect(dashboardResponse.body.data.recentReferrals).toHaveLength(1);
    });

    it('should credit points when referred student makes first purchase', async () => {
      // Register and verify student with referral code
      const registrationResponse = await request(server)
        .post('/api/auth/register')
        .send({
          email: TEST_CONFIG.studentEmail,
          password: TEST_CONFIG.testPassword,
          firstName: 'Referred',
          lastName: 'Student',
          phone: '+1234567891',
          role: 'student',
          referralCode: referralCode
        })
        .expect(201);

      studentUserId = registrationResponse.body.data.user.id;

      // Verify student email
      const { data: otpData } = await supabase
        .from('otp_verifications')
        .select('otp')
        .eq('email', TEST_CONFIG.studentEmail)
        .eq('type', 'email')
        .single();

      await request(server)
        .post('/api/auth/verify-otp')
        .send({
          email: TEST_CONFIG.studentEmail,
          otp: otpData.otp,
          type: 'email'
        })
        .expect(200);

      // Login student
      const loginResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email: TEST_CONFIG.studentEmail,
          password: TEST_CONFIG.testPassword
        })
        .expect(200);

      studentAccessToken = loginResponse.body.data.tokens.accessToken;

      // Simulate course purchase (this would trigger point credit)
      // In a real scenario, this would be done through the payment webhook
      await supabase
        .from('referrals')
        .update({
          status: 'converted',
          conversion_events: [{
            type: 'first_purchase',
            date: new Date().toISOString(),
            value: 2999,
            points_earned: 300
          }]
        })
        .eq('student_id', studentUserId);

      // Check ambassador wallet balance
      const walletResponse = await request(server)
        .get('/api/wallet/balance')
        .set('Authorization', `Bearer ${ambassadorAccessToken}`)
        .expect(200);

      expect(walletResponse.body.success).toBe(true);
      expect(walletResponse.body.data.balance.points).toBeGreaterThan(0);
    });
  });

  describe('4. Payout Processing Workflow', () => {
    beforeEach(async () => {
      // Setup approved ambassador with points
      const { userId, accessToken } = await createAndVerifyUser(TEST_CONFIG.ambassadorEmail);
      ambassadorUserId = userId;
      ambassadorAccessToken = accessToken;

      const applicationResponse = await request(server)
        .post('/api/ambassadors/apply')
        .set('Authorization', `Bearer ${ambassadorAccessToken}`)
        .send({
          motivation: 'Test motivation',
          socialMedia: {
            platform: 'instagram',
            handle: '@testambassador',
            followers: 2500
          },
          experience: 'Test experience'
        })
        .expect(201);

      ambassadorId = applicationResponse.body.data.application.id;

      // Setup admin and approve ambassador
      const { userId: adminId, accessToken: adminToken } = await createAndVerifyUser(
        TEST_CONFIG.adminEmail,
        'admin'
      );
      adminUserId = adminId;
      adminAccessToken = adminToken;

      await request(server)
        .put(`/api/admin/ambassadors/${ambassadorId}/approve`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          status: 'approved',
          notes: 'Approved for testing'
        })
        .expect(200);

      // Add points to ambassador wallet
      await supabase
        .from('wallets')
        .insert({
          user_id: ambassadorUserId,
          user_type: 'ambassador',
          balance: {
            points: 5000,
            credits: 0,
            currency: 'INR'
          }
        });
    });

    it('should allow ambassador to request payout', async () => {
      const payoutData = {
        amount: 3000,
        paymentDetails: {
          bankAccount: '1234567890',
          ifscCode: 'HDFC0001234',
          panNumber: 'ABCDE1234F',
          accountHolderName: 'Test Ambassador'
        }
      };

      const response = await request(server)
        .post('/api/ambassadors/payout')
        .set('Authorization', `Bearer ${ambassadorAccessToken}`)
        .send(payoutData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payoutRequest.amount).toBe(payoutData.amount);
      expect(response.body.data.payoutRequest.status).toBe('pending');
    });

    it('should prevent payout request below minimum threshold', async () => {
      const payoutData = {
        amount: 500, // Below minimum threshold
        paymentDetails: {
          bankAccount: '1234567890',
          ifscCode: 'HDFC0001234',
          panNumber: 'ABCDE1234F'
        }
      };

      const response = await request(server)
        .post('/api/ambassadors/payout')
        .set('Authorization', `Bearer ${ambassadorAccessToken}`)
        .send(payoutData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AMOUNT_BELOW_THRESHOLD');
    });

    it('should prevent payout request exceeding available balance', async () => {
      const payoutData = {
        amount: 10000, // Exceeds available balance
        paymentDetails: {
          bankAccount: '1234567890',
          ifscCode: 'HDFC0001234',
          panNumber: 'ABCDE1234F'
        }
      };

      const response = await request(server)
        .post('/api/ambassadors/payout')
        .set('Authorization', `Bearer ${ambassadorAccessToken}`)
        .send(payoutData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_BALANCE');
    });

    it('should allow admin to approve payout request', async () => {
      // Create payout request
      const payoutResponse = await request(server)
        .post('/api/ambassadors/payout')
        .set('Authorization', `Bearer ${ambassadorAccessToken}`)
        .send({
          amount: 3000,
          paymentDetails: {
            bankAccount: '1234567890',
            ifscCode: 'HDFC0001234',
            panNumber: 'ABCDE1234F'
          }
        })
        .expect(201);

      const payoutId = payoutResponse.body.data.payoutRequest.id;

      // Admin approves payout
      const approvalResponse = await request(server)
        .put(`/api/admin/payouts/${payoutId}/process`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          status: 'approved',
          notes: 'KYC verified, processing payment'
        })
        .expect(200);

      expect(approvalResponse.body.success).toBe(true);
      expect(approvalResponse.body.data.payout.status).toBe('approved');
    });

    it('should update wallet balance after payout processing', async () => {
      // Create and approve payout request
      const payoutResponse = await request(server)
        .post('/api/ambassadors/payout')
        .set('Authorization', `Bearer ${ambassadorAccessToken}`)
        .send({
          amount: 3000,
          paymentDetails: {
            bankAccount: '1234567890',
            ifscCode: 'HDFC0001234',
            panNumber: 'ABCDE1234F'
          }
        })
        .expect(201);

      const payoutId = payoutResponse.body.data.payoutRequest.id;

      await request(server)
        .put(`/api/admin/payouts/${payoutId}/process`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          status: 'processed',
          transactionId: 'TXN123456789'
        })
        .expect(200);

      // Check updated wallet balance
      const walletResponse = await request(server)
        .get('/api/wallet/balance')
        .set('Authorization', `Bearer ${ambassadorAccessToken}`)
        .expect(200);

      expect(walletResponse.body.success).toBe(true);
      expect(walletResponse.body.data.balance.points).toBe(2000); // 5000 - 3000
    });
  });

  describe('5. Complete Ambassador Workflow Integration', () => {
    it('should complete full ambassador journey: application → approval → referral → earning → payout', async () => {
      // Step 1: User applies for ambassador status
      const { userId, accessToken } = await createAndVerifyUser(TEST_CONFIG.ambassadorEmail);
      ambassadorUserId = userId;
      ambassadorAccessToken = accessToken;

      const applicationResponse = await request(server)
        .post('/api/ambassadors/apply')
        .set('Authorization', `Bearer ${ambassadorAccessToken}`)
        .send({
          motivation: 'Complete workflow test',
          socialMedia: {
            platform: 'instagram',
            handle: '@completetest',
            followers: 3000
          },
          experience: 'Full workflow testing experience'
        })
        .expect(201);

      ambassadorId = applicationResponse.body.data.application.id;

      // Step 2: Admin approves application
      const { userId: adminId, accessToken: adminToken } = await createAndVerifyUser(
        TEST_CONFIG.adminEmail,
        'admin'
      );
      adminUserId = adminId;
      adminAccessToken = adminToken;

      const approvalResponse = await request(server)
        .put(`/api/admin/ambassadors/${ambassadorId}/approve`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          status: 'approved',
          notes: 'Complete workflow test approval'
        })
        .expect(200);

      referralCode = approvalResponse.body.data.ambassador.referralCode;

      // Step 3: Student registers with referral code
      await request(server)
        .post('/api/auth/register')
        .send({
          email: TEST_CONFIG.studentEmail,
          password: TEST_CONFIG.testPassword,
          firstName: 'Complete',
          lastName: 'Test',
          phone: '+1234567891',
          role: 'student',
          referralCode: referralCode
        })
        .expect(201);

      // Step 4: Simulate conversion and point earning
      await supabase
        .from('wallets')
        .insert({
          user_id: ambassadorUserId,
          user_type: 'ambassador',
          balance: {
            points: 2500,
            credits: 0,
            currency: 'INR'
          }
        });

      // Step 5: Ambassador requests payout
      const payoutResponse = await request(server)
        .post('/api/ambassadors/payout')
        .set('Authorization', `Bearer ${ambassadorAccessToken}`)
        .send({
          amount: 2000,
          paymentDetails: {
            bankAccount: '1234567890',
            ifscCode: 'HDFC0001234',
            panNumber: 'ABCDE1234F'
          }
        })
        .expect(201);

      const payoutId = payoutResponse.body.data.payoutRequest.id;

      // Step 6: Admin processes payout
      await request(server)
        .put(`/api/admin/payouts/${payoutId}/process`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          status: 'processed',
          transactionId: 'COMPLETE_TEST_TXN'
        })
        .expect(200);

      // Step 7: Verify final state
      const finalDashboardResponse = await request(server)
        .get('/api/ambassadors/dashboard')
        .set('Authorization', `Bearer ${ambassadorAccessToken}`)
        .expect(200);

      expect(finalDashboardResponse.body.success).toBe(true);
      expect(finalDashboardResponse.body.data.stats.totalReferrals).toBe(1);

      const finalWalletResponse = await request(server)
        .get('/api/wallet/balance')
        .set('Authorization', `Bearer ${ambassadorAccessToken}`)
        .expect(200);

      expect(finalWalletResponse.body.success).toBe(true);
      expect(finalWalletResponse.body.data.balance.points).toBe(500); // 2500 - 2000

      console.log('✅ Complete ambassador workflow test passed');
    });
  });
});