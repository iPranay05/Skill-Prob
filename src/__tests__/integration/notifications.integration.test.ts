import { NextRequest } from 'next/server';
import { GET as getNotifications, POST as postNotification } from '@/app/api/notifications/route';
import { PUT as markAsRead } from '@/app/api/notifications/[notificationId]/read/route';
import { GET as getPreferences, PUT as updatePreferences } from '@/app/api/notifications/preferences/route';
import { NotificationService } from '@/lib/notifications';
import { verifyToken } from '@/lib/auth';

// Mock dependencies
jest.mock('@/lib/notifications');
jest.mock('@/lib/auth');

const mockNotificationService = NotificationService as jest.Mocked<typeof NotificationService>;
const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

describe('Notification API Integration Tests', () => {
  const mockUser = {
    userId: 'user123',
    role: 'student',
    email: 'test@example.com'
  };

  const mockAdminUser = {
    userId: 'admin123',
    role: 'admin',
    email: 'admin@example.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/api/notifications', () => {
    describe('GET', () => {
      it('should return user notifications successfully', async () => {
        const mockNotifications = [
          {
            id: '1',
            user_id: 'user123',
            title: 'Test Notification',
            message: 'Test message',
            type: 'info',
            priority: 'normal' as const,
            is_read: false,
            created_at: '2023-01-01T00:00:00Z'
          }
        ];

        mockVerifyToken.mockReturnValue(mockUser);
        mockNotificationService.getInAppNotifications.mockResolvedValue(mockNotifications);
        mockNotificationService.getUnreadCount.mockResolvedValue(1);

        const request = new NextRequest('http://localhost/api/notifications', {
          headers: { authorization: 'Bearer valid-token' }
        });

        const response = await getNotifications(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.notifications).toEqual(mockNotifications);
        expect(data.data.unreadCount).toBe(1);
        expect(mockNotificationService.getInAppNotifications).toHaveBeenCalledWith('user123', 20, 0);
      });

      it('should handle pagination parameters', async () => {
        mockVerifyToken.mockReturnValue(mockUser);
        mockNotificationService.getInAppNotifications.mockResolvedValue([]);
        mockNotificationService.getUnreadCount.mockResolvedValue(0);

        const request = new NextRequest('http://localhost/api/notifications?limit=10&offset=20', {
          headers: { authorization: 'Bearer valid-token' }
        });

        const response = await getNotifications(request);

        expect(response.status).toBe(200);
        expect(mockNotificationService.getInAppNotifications).toHaveBeenCalledWith('user123', 10, 20);
      });

      it('should return 401 without authorization', async () => {
        const request = new NextRequest('http://localhost/api/notifications');

        const response = await getNotifications(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      it('should return 401 with invalid token', async () => {
        mockVerifyToken.mockReturnValue(null);

        const request = new NextRequest('http://localhost/api/notifications', {
          headers: { authorization: 'Bearer invalid-token' }
        });

        const response = await getNotifications(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Invalid token');
      });

      it('should handle service errors gracefully', async () => {
        mockVerifyToken.mockReturnValue(mockUser);
        mockNotificationService.getInAppNotifications.mockRejectedValue(new Error('Service error'));

        const request = new NextRequest('http://localhost/api/notifications', {
          headers: { authorization: 'Bearer valid-token' }
        });

        const response = await getNotifications(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Internal server error');
      });
    });

    describe('POST', () => {
      it('should queue notification successfully for admin', async () => {
        mockVerifyToken.mockReturnValue(mockAdminUser);
        mockNotificationService.queueNotification.mockResolvedValue(true);

        const notificationData = {
          templateName: 'test_template',
          recipientId: 'user123',
          variables: { name: 'John' }
        };

        const request = new NextRequest('http://localhost/api/notifications', {
          method: 'POST',
          headers: { 
            authorization: 'Bearer admin-token',
            'content-type': 'application/json'
          },
          body: JSON.stringify(notificationData)
        });

        const response = await postNotification(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Notification queued successfully');
        expect(mockNotificationService.queueNotification).toHaveBeenCalledWith(notificationData);
      });

      it('should return 403 for non-admin users', async () => {
        mockVerifyToken.mockReturnValue(mockUser);

        const request = new NextRequest('http://localhost/api/notifications', {
          method: 'POST',
          headers: { 
            authorization: 'Bearer user-token',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            templateName: 'test_template',
            recipientId: 'user123',
            variables: { name: 'John' }
          })
        });

        const response = await postNotification(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe('Forbidden');
      });

      it('should return 400 for missing required fields', async () => {
        mockVerifyToken.mockReturnValue(mockAdminUser);

        const request = new NextRequest('http://localhost/api/notifications', {
          method: 'POST',
          headers: { 
            authorization: 'Bearer admin-token',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            templateName: 'test_template'
            // Missing recipientId and variables
          })
        });

        const response = await postNotification(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Missing required fields: templateName, recipientId, variables');
      });

      it('should return 500 when queueing fails', async () => {
        mockVerifyToken.mockReturnValue(mockAdminUser);
        mockNotificationService.queueNotification.mockResolvedValue(false);

        const request = new NextRequest('http://localhost/api/notifications', {
          method: 'POST',
          headers: { 
            authorization: 'Bearer admin-token',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            templateName: 'test_template',
            recipientId: 'user123',
            variables: { name: 'John' }
          })
        });

        const response = await postNotification(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to queue notification');
      });
    });
  });

  describe('/api/notifications/[notificationId]/read', () => {
    describe('PUT', () => {
      it('should mark notification as read successfully', async () => {
        mockVerifyToken.mockReturnValue(mockUser);
        mockNotificationService.markNotificationAsRead.mockResolvedValue(true);

        const request = new NextRequest('http://localhost/api/notifications/notif123/read', {
          method: 'PUT',
          headers: { authorization: 'Bearer valid-token' }
        });

        const response = await markAsRead(request, { params: { notificationId: 'notif123' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Notification marked as read');
        expect(mockNotificationService.markNotificationAsRead).toHaveBeenCalledWith('notif123', 'user123');
      });

      it('should return 401 without authorization', async () => {
        const request = new NextRequest('http://localhost/api/notifications/notif123/read', {
          method: 'PUT'
        });

        const response = await markAsRead(request, { params: { notificationId: 'notif123' } });
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      it('should return 500 when marking fails', async () => {
        mockVerifyToken.mockReturnValue(mockUser);
        mockNotificationService.markNotificationAsRead.mockResolvedValue(false);

        const request = new NextRequest('http://localhost/api/notifications/notif123/read', {
          method: 'PUT',
          headers: { authorization: 'Bearer valid-token' }
        });

        const response = await markAsRead(request, { params: { notificationId: 'notif123' } });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to mark notification as read');
      });
    });
  });

  describe('/api/notifications/preferences', () => {
    describe('GET', () => {
      it('should return user preferences successfully', async () => {
        const mockPreferences = {
          user_id: 'user123',
          email_enabled: true,
          sms_enabled: false,
          preferences: {
            course_updates: { email: true, sms: false }
          }
        };

        mockVerifyToken.mockReturnValue(mockUser);
        mockNotificationService.getUserPreferences.mockResolvedValue(mockPreferences);

        const request = new NextRequest('http://localhost/api/notifications/preferences', {
          headers: { authorization: 'Bearer valid-token' }
        });

        const response = await getPreferences(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockPreferences);
        expect(mockNotificationService.getUserPreferences).toHaveBeenCalledWith('user123');
      });

      it('should return 401 without authorization', async () => {
        const request = new NextRequest('http://localhost/api/notifications/preferences');

        const response = await getPreferences(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('PUT', () => {
      it('should update preferences successfully', async () => {
        const preferences = {
          email_enabled: false,
          sms_enabled: true,
          preferences: {
            course_updates: { email: false, sms: true }
          }
        };

        mockVerifyToken.mockReturnValue(mockUser);
        mockNotificationService.updateUserPreferences.mockResolvedValue(true);

        const request = new NextRequest('http://localhost/api/notifications/preferences', {
          method: 'PUT',
          headers: { 
            authorization: 'Bearer valid-token',
            'content-type': 'application/json'
          },
          body: JSON.stringify(preferences)
        });

        const response = await updatePreferences(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Preferences updated successfully');
        expect(mockNotificationService.updateUserPreferences).toHaveBeenCalledWith('user123', preferences);
      });

      it('should return 500 when update fails', async () => {
        mockVerifyToken.mockReturnValue(mockUser);
        mockNotificationService.updateUserPreferences.mockResolvedValue(false);

        const request = new NextRequest('http://localhost/api/notifications/preferences', {
          method: 'PUT',
          headers: { 
            authorization: 'Bearer valid-token',
            'content-type': 'application/json'
          },
          body: JSON.stringify({ email_enabled: false })
        });

        const response = await updatePreferences(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to update preferences');
      });
    });
  });
});