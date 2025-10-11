import { EmailService, emailService } from '../../lib/emailService';
import emailjs from '@emailjs/browser';

// Mock EmailJS
jest.mock('@emailjs/browser', () => ({
    init: jest.fn(),
    send: jest.fn(),
}));

const mockEmailjs = emailjs as jest.Mocked<typeof emailjs>;

describe('EmailService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => { });
        jest.spyOn(console, 'log').mockImplementation(() => { });

        // Set up environment variables
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID = 'test-service-id';
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID = 'test-template-id';
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY = 'test-public-key';
        process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should initialize EmailJS with public key', () => {
            new EmailService();
            expect(mockEmailjs.init).toHaveBeenCalledWith('test-public-key');
        });

        it('should not initialize EmailJS without public key', () => {
            delete process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
            new EmailService();
            expect(mockEmailjs.init).not.toHaveBeenCalled();
        });
    });

    describe('sendOTPEmail', () => {
        it('should send OTP email successfully', async () => {
            mockEmailjs.send.mockResolvedValue({ status: 200, text: 'OK' });

            // Create a new service instance with proper config
            const service = new EmailService();
            const result = await service.sendOTPEmail({
                to_email: 'test@example.com',
                to_name: 'John Doe',
                otp_code: '123456',
                expires_in: '10 minutes',
            });

            expect(result).toBe(true);
            expect(mockEmailjs.send).toHaveBeenCalledWith(
                'test-service-id',
                'otp_verification',
                {
                    to_email: 'test@example.com',
                    to_name: 'John Doe',
                    otp_code: '123456',
                    expires_in: '10 minutes',
                    subject: 'Verify Your Email - Skill Probe LMS',
                }
            );
        });

        it('should return false when EmailJS is not configured', async () => {
            delete process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
            const service = new EmailService();

            const result = await service.sendOTPEmail({
                to_email: 'test@example.com',
                to_name: 'John Doe',
                otp_code: '123456',
                expires_in: '10 minutes',
            });

            expect(result).toBe(false);
            expect(mockEmailjs.send).not.toHaveBeenCalled();
        });

        it('should return false when email sending fails', async () => {
            mockEmailjs.send.mockResolvedValue({ status: 400, text: 'Bad Request' });

            const result = await emailService.sendOTPEmail({
                to_email: 'test@example.com',
                to_name: 'John Doe',
                otp_code: '123456',
                expires_in: '10 minutes',
            });

            expect(result).toBe(false);
        });

        it('should handle email sending errors', async () => {
            mockEmailjs.send.mockRejectedValue(new Error('Network error'));

            const result = await emailService.sendOTPEmail({
                to_email: 'test@example.com',
                to_name: 'John Doe',
                otp_code: '123456',
                expires_in: '10 minutes',
            });

            expect(result).toBe(false);
        });
    });

    describe('sendWelcomeEmail', () => {
        it('should send welcome email successfully', async () => {
            mockEmailjs.send.mockResolvedValue({ status: 200, text: 'OK' });

            const service = new EmailService();
            const result = await service.sendWelcomeEmail({
                to_email: 'test@example.com',
                to_name: 'John Doe',
                login_url: 'http://localhost:3000/auth/login',
            });

            expect(result).toBe(true);
            expect(mockEmailjs.send).toHaveBeenCalledWith(
                'test-service-id',
                'welcome_email',
                {
                    to_email: 'test@example.com',
                    to_name: 'John Doe',
                    login_url: 'http://localhost:3000/auth/login',
                    subject: 'Welcome to Skill Probe LMS!',
                }
            );
        });
    });

    describe('sendNotificationEmail', () => {
        it('should send notification email successfully', async () => {
            mockEmailjs.send.mockResolvedValue({ status: 200, text: 'OK' });

            const service = new EmailService();
            const result = await service.sendNotificationEmail({
                to_email: 'test@example.com',
                to_name: 'John Doe',
                subject: 'Test Notification',
                message: 'This is a test notification',
                action_url: 'http://localhost:3000/action',
                action_text: 'Take Action',
            });

            expect(result).toBe(true);
            expect(mockEmailjs.send).toHaveBeenCalledWith(
                'test-service-id',
                'notification_email',
                {
                    to_email: 'test@example.com',
                    to_name: 'John Doe',
                    subject: 'Test Notification',
                    message: 'This is a test notification',
                    action_url: 'http://localhost:3000/action',
                    action_text: 'Take Action',
                }
            );
        });

        it('should send notification email without action', async () => {
            mockEmailjs.send.mockResolvedValue({ status: 200, text: 'OK' });

            const service = new EmailService();
            const result = await service.sendNotificationEmail({
                to_email: 'test@example.com',
                to_name: 'John Doe',
                subject: 'Test Notification',
                message: 'This is a test notification',
            });

            expect(result).toBe(true);
            expect(mockEmailjs.send).toHaveBeenCalledWith(
                'test-service-id',
                'notification_email',
                {
                    to_email: 'test@example.com',
                    to_name: 'John Doe',
                    subject: 'Test Notification',
                    message: 'This is a test notification',
                    action_url: '',
                    action_text: '',
                }
            );
        });
    });

    describe('sendPasswordResetEmail', () => {
        it('should send password reset email successfully', async () => {
            mockEmailjs.send.mockResolvedValue({ status: 200, text: 'OK' });

            const service = new EmailService();
            const result = await service.sendPasswordResetEmail(
                'test@example.com',
                'John Doe',
                'reset-token-123'
            );

            expect(result).toBe(true);
            expect(mockEmailjs.send).toHaveBeenCalledWith(
                'test-service-id',
                'password_reset',
                {
                    to_email: 'test@example.com',
                    to_name: 'John Doe',
                    reset_url: 'http://localhost:3000/auth/reset-password?token=reset-token-123',
                    subject: 'Reset Your Password - Skill Probe LMS',
                }
            );
        });
    });

    describe('sendEnrollmentConfirmationEmail', () => {
        it('should send enrollment confirmation email successfully', async () => {
            mockEmailjs.send.mockResolvedValue({ status: 200, text: 'OK' });

            const service = new EmailService();
            const result = await service.sendEnrollmentConfirmationEmail(
                'test@example.com',
                'John Doe',
                'React Fundamentals',
                'http://localhost:3000/courses/react-fundamentals'
            );

            expect(result).toBe(true);
            expect(mockEmailjs.send).toHaveBeenCalledWith(
                'test-service-id',
                'enrollment_confirmation',
                {
                    to_email: 'test@example.com',
                    to_name: 'John Doe',
                    course_name: 'React Fundamentals',
                    course_url: 'http://localhost:3000/courses/react-fundamentals',
                    subject: 'Enrollment Confirmed: React Fundamentals',
                }
            );
        });
    });

    describe('sendSessionReminderEmail', () => {
        it('should send session reminder email successfully', async () => {
            mockEmailjs.send.mockResolvedValue({ status: 200, text: 'OK' });

            const service = new EmailService();
            const sessionDate = new Date('2024-01-15T10:00:00Z');
            const result = await service.sendSessionReminderEmail(
                'test@example.com',
                'John Doe',
                'React Hooks Deep Dive',
                sessionDate,
                'http://localhost:3000/sessions/join/123'
            );

            expect(result).toBe(true);
            expect(mockEmailjs.send).toHaveBeenCalledWith(
                'test-service-id',
                'session_reminder',
                {
                    to_email: 'test@example.com',
                    to_name: 'John Doe',
                    session_title: 'React Hooks Deep Dive',
                    session_date: sessionDate.toLocaleDateString(),
                    session_time: sessionDate.toLocaleTimeString(),
                    join_url: 'http://localhost:3000/sessions/join/123',
                    subject: 'Reminder: React Hooks Deep Dive starts soon',
                }
            );
        });
    });

    describe('testConfiguration', () => {
        it('should return true for successful configuration test', async () => {
            mockEmailjs.send.mockResolvedValue({ status: 200, text: 'OK' });

            const service = new EmailService();
            const result = await service.testConfiguration();

            expect(result).toBe(true);
            expect(mockEmailjs.send).toHaveBeenCalledWith(
                'test-service-id',
                'test_template',
                {
                    to_email: 'test@example.com',
                    to_name: 'Test User',
                    subject: 'EmailJS Configuration Test',
                    message: 'This is a test email to verify EmailJS configuration.',
                }
            );
        });

        it('should return false when configuration is missing', async () => {
            delete process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
            const service = new EmailService();

            const result = await service.testConfiguration();

            expect(result).toBe(false);
            expect(mockEmailjs.send).not.toHaveBeenCalled();
        });

        it('should return false when test email fails', async () => {
            mockEmailjs.send.mockRejectedValue(new Error('Configuration error'));

            const service = new EmailService();
            const result = await service.testConfiguration();

            expect(result).toBe(false);
        });
    });

    describe('isConfigured', () => {
        it('should return true when properly configured', () => {
            const service = new EmailService();
            // Access private method through type assertion
            const isConfigured = (service as any).isConfigured();
            expect(isConfigured).toBe(true);
        });

        it('should return false when missing configuration', () => {
            delete process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
            const service = new EmailService();
            const isConfigured = (service as any).isConfigured();
            expect(isConfigured).toBe(false);
        });
    });
});