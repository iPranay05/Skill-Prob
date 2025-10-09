import { NotificationService } from '@/lib/notifications';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('ioredis');
jest.mock('nodemailer');
jest.mock('twilio');

// Mock implementations
const mockSupabaseClient = {
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn(),
        eq: jest.fn().mockReturnValue({
          single: jest.fn()
        })
      }),
      or: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          range: jest.fn()
        })
      }),
      lte: jest.fn().mockReturnValue({
        lt: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn()
            })
          })
        })
      }),
      count: jest.fn()
    }),
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn()
      })
    }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn()
      })
    }),
    upsert: jest.fn()
  })
};

const mockRedis = {
  lpush: jest.fn(),
  brpop: jest.fn()
};

// Mock the createClient function
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    lpush: jest.fn(),
    brpop: jest.fn()
  }));
});

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MOCK_NOTIFICATIONS = 'true';
    
    // Setup the createClient mock to return our mock client
    const { createClient } = require('@supabase/supabase-js');
    createClient.mockReturnValue(mockSupabaseClient);
  });

  describe('Template Rendering', () => {
    it('should render template with variables correctly', () => {
      const template = 'Hello {{name}}, your order {{orderId}} is ready!';
      const variables = { name: 'John', orderId: '12345' };

      const result = NotificationService.renderTemplate(template, variables);

      expect(result).toBe('Hello John, your order 12345 is ready!');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Hello {{name}}, your order {{orderId}} is ready!';
      const variables = { name: 'John' };

      const result = NotificationService.renderTemplate(template, variables);

      expect(result).toBe('Hello John, your order {{orderId}} is ready!');
    });

    it('should handle empty variables object', () => {
      const template = 'Hello {{name}}!';
      const variables = {};

      const result = NotificationService.renderTemplate(template, variables);

      expect(result).toBe('Hello {{name}}!');
    });

    it('should handle multiple occurrences of same variable', () => {
      const template = 'Hi {{name}}, {{name}} is your username';
      const variables = { name: 'Alice' };

      const result = NotificationService.renderTemplate(template, variables);

      expect(result).toBe('Hi Alice, Alice is your username');
    });
  });

  describe('Template Management', () => {
    describe('getTemplate', () => {
      it('should fetch template successfully', async () => {
        const mockTemplate = {
          id: '123',
          name: 'test_template',
          body_template: 'Hello {{name}}',
          channels: ['email'],
          variables: ['name'],
          is_active: true
        };

        // Mock the chain properly
        const selectMock = mockSupabaseClient.from().select();
        const eqMock = selectMock.eq();
        const eq2Mock = eqMock.eq();
        eq2Mock.single.mockResolvedValue({
          data: mockTemplate,
          error: null
        });

        const result = await NotificationService.getTemplate('test_template');

        expect(result).toEqual(mockTemplate);
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('notification_templates');
      });

      it('should return null when template not found', async () => {
        const selectMock = mockSupabaseClient.from().select();
        const eqMock = selectMock.eq();
        const eq2Mock = eqMock.eq();
        eq2Mock.single.mockResolvedValue({
          data: null,
          error: { message: 'Not found' }
        });

        const result = await NotificationService.getTemplate('nonexistent');

        expect(result).toBeNull();
      });

      it('should handle database errors gracefully', async () => {
        const selectMock = mockSupabaseClient.from().select();
        const eqMock = selectMock.eq();
        const eq2Mock = eqMock.eq();
        eq2Mock.single.mockRejectedValue(new Error('Database connection failed'));

        const result = await NotificationService.getTemplate('test_template');

        expect(result).toBeNull();
      });
    });

    describe('createTemplate', () => {
      it('should create template successfully', async () => {
        const templateData = {
          name: 'new_template',
          body_template: 'Hello {{name}}',
          channels: ['email'] as const,
          variables: ['name'],
          is_active: true
        };

        const insertMock = mockSupabaseClient.from().insert();
        const selectMock = insertMock.select();
        selectMock.single.mockResolvedValue({
          data: { id: '456' },
          error: null
        });

        const result = await NotificationService.createTemplate(templateData);

        expect(result).toBe('456');
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('notification_templates');
      });

      it('should return null on creation failure', async () => {
        const templateData = {
          name: 'new_template',
          body_template: 'Hello {{name}}',
          channels: ['email'] as const,
          variables: ['name'],
          is_active: true
        };

        const insertMock = mockSupabaseClient.from().insert();
        const selectMock = insertMock.select();
        selectMock.single.mockResolvedValue({
          data: null,
          error: { message: 'Creation failed' }
        });

        const result = await NotificationService.createTemplate(templateData);

        expect(result).toBeNull();
      });
    });
  });

  describe('User Preferences', () => {
    describe('getUserPreferences', () => {
      it('should return user preferences when they exist', async () => {
        const mockPreferences = {
          user_id: 'user123',
          email_enabled: true,
          sms_enabled: false,
          preferences: {
            course_updates: { email: true, sms: false }
          }
        };

        const selectMock = mockSupabaseClient.from().select();
        const eqMock = selectMock.eq();
        eqMock.single.mockResolvedValue({
          data: mockPreferences,
          error: null
        });

        const result = await NotificationService.getUserPreferences('user123');

        expect(result).toEqual(mockPreferences);
      });

      it('should return default preferences when none exist', async () => {
        const selectMock = mockSupabaseClient.from().select();
        const eqMock = selectMock.eq();
        eqMock.single.mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' } // Not found error
        });

        const result = await NotificationService.getUserPreferences('user123');

        expect(result).toMatchObject({
          user_id: 'user123',
          email_enabled: true,
          sms_enabled: true,
          push_enabled: true,
          in_app_enabled: true
        });
      });
    });

    describe('updateUserPreferences', () => {
      it('should update preferences successfully', async () => {
        const preferences = {
          email_enabled: false,
          sms_enabled: true
        };

        const fromMock = mockSupabaseClient.from();
        fromMock.upsert.mockResolvedValue({
          error: null
        });

        const result = await NotificationService.updateUserPreferences('user123', preferences);

        expect(result).toBe(true);
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_notification_preferences');
      });

      it('should return false on update failure', async () => {
        const preferences = {
          email_enabled: false
        };

        const fromMock = mockSupabaseClient.from();
        fromMock.upsert.mockResolvedValue({
          error: { message: 'Update failed' }
        });

        const result = await NotificationService.updateUserPreferences('user123', preferences);

        expect(result).toBe(false);
      });
    });
  });

  describe('In-App Notifications', () => {
    describe('getInAppNotifications', () => {
      it('should fetch notifications successfully', async () => {
        const mockNotifications = [
          {
            id: '1',
            user_id: 'user123',
            title: 'Test Notification',
            message: 'Test message',
            is_read: false,
            created_at: '2023-01-01T00:00:00Z'
          }
        ];

        const selectMock = mockSupabaseClient.from().select();
        const eqMock = selectMock.eq();
        const orMock = eqMock.or();
        const orderMock = orMock.order();
        orderMock.range.mockResolvedValue({
          data: mockNotifications,
          error: null
        });

        const result = await NotificationService.getInAppNotifications('user123');

        expect(result).toEqual(mockNotifications);
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('in_app_notifications');
      });

      it('should return empty array on error', async () => {
        const selectMock = mockSupabaseClient.from().select();
        const eqMock = selectMock.eq();
        const orMock = eqMock.or();
        const orderMock = orMock.order();
        orderMock.range.mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        });

        const result = await NotificationService.getInAppNotifications('user123');

        expect(result).toEqual([]);
      });
    });

    describe('markNotificationAsRead', () => {
      it('should mark notification as read successfully', async () => {
        const updateMock = mockSupabaseClient.from().update();
        const eqMock = updateMock.eq();
        eqMock.eq.mockResolvedValue({
          error: null
        });

        const result = await NotificationService.markNotificationAsRead('notif123', 'user123');

        expect(result).toBe(true);
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('in_app_notifications');
      });

      it('should return false on update failure', async () => {
        const updateMock = mockSupabaseClient.from().update();
        const eqMock = updateMock.eq();
        eqMock.eq.mockResolvedValue({
          error: { message: 'Update failed' }
        });

        const result = await NotificationService.markNotificationAsRead('notif123', 'user123');

        expect(result).toBe(false);
      });
    });

    describe('getUnreadCount', () => {
      it('should return correct unread count', async () => {
        const selectMock = mockSupabaseClient.from().select();
        const eqMock = selectMock.eq();
        const eq2Mock = eqMock.eq();
        eq2Mock.or.mockResolvedValue({
          count: 5,
          error: null
        });

        const result = await NotificationService.getUnreadCount('user123');

        expect(result).toBe(5);
      });

      it('should return 0 on error', async () => {
        const selectMock = mockSupabaseClient.from().select();
        const eqMock = selectMock.eq();
        const eq2Mock = eqMock.eq();
        eq2Mock.or.mockResolvedValue({
          count: null,
          error: { message: 'Count failed' }
        });

        const result = await NotificationService.getUnreadCount('user123');

        expect(result).toBe(0);
      });
    });
  });

  describe('Direct Send Methods', () => {
    describe('sendEmail', () => {
      it('should return true in mock mode', async () => {
        const result = await NotificationService.sendEmail(
          'test@example.com',
          'Test Subject',
          '<p>Test HTML</p>'
        );

        expect(result).toBe(true);
      });
    });

    describe('sendSMS', () => {
      it('should return true in mock mode', async () => {
        const result = await NotificationService.sendSMS('+1234567890', 'Test message');

        expect(result).toBe(true);
      });
    });
  });

  describe('Backward Compatibility Methods', () => {
    describe('sendOTPEmail', () => {
      it('should queue OTP email notification', async () => {
        const mockUser = { id: 'user123' };

        const selectMock = mockSupabaseClient.from().select();
        const eqMock = selectMock.eq();
        eqMock.single.mockResolvedValue({
          data: mockUser,
          error: null
        });

        jest.spyOn(NotificationService, 'queueNotification').mockResolvedValue(true);

        const result = await NotificationService.sendOTPEmail('test@example.com', '123456', 'John');

        expect(result).toBe(true);
        expect(NotificationService.queueNotification).toHaveBeenCalledWith({
          templateName: 'otp_verification',
          recipientId: 'user123',
          channels: ['email'],
          variables: {
            firstName: 'John',
            type: 'Email',
            otp: '123456',
            expiryMinutes: 10
          }
        });
      });

      it('should return false when user not found', async () => {
        const selectMock = mockSupabaseClient.from().select();
        const eqMock = selectMock.eq();
        eqMock.single.mockResolvedValue({
          data: null,
          error: { message: 'User not found' }
        });

        const result = await NotificationService.sendOTPEmail('test@example.com', '123456', 'John');

        expect(result).toBe(false);
      });
    });

    describe('sendWelcomeEmail', () => {
      it('should queue welcome email notification', async () => {
        const mockUser = { id: 'user123' };

        const selectMock = mockSupabaseClient.from().select();
        const eqMock = selectMock.eq();
        eqMock.single.mockResolvedValue({
          data: mockUser,
          error: null
        });

        jest.spyOn(NotificationService, 'queueNotification').mockResolvedValue(true);

        const result = await NotificationService.sendWelcomeEmail('test@example.com', 'John');

        expect(result).toBe(true);
        expect(NotificationService.queueNotification).toHaveBeenCalledWith({
          templateName: 'welcome_email',
          recipientId: 'user123',
          channels: ['email'],
          variables: { firstName: 'John' }
        });
      });
    });
  });
});