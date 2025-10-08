import { GoogleMeetService } from '../../lib/googleMeetService';
import { google } from 'googleapis';

// Mock googleapis
jest.mock('googleapis');
const mockGoogle = google as jest.Mocked<typeof google>;

describe('GoogleMeetService', () => {
  let googleMeetService: GoogleMeetService;
  let mockCalendar: any;
  let mockOAuth2Client: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock OAuth2Client
    mockOAuth2Client = {
      setCredentials: jest.fn(),
      getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-token' }),
    };

    // Mock Calendar API
    mockCalendar = {
      events: {
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        get: jest.fn(),
      },
    };

    // Mock google.auth.OAuth2 constructor
    mockGoogle.auth = {
      OAuth2: jest.fn().mockImplementation(() => mockOAuth2Client),
    } as any;

    // Mock google.calendar
    mockGoogle.calendar = jest.fn().mockReturnValue(mockCalendar);

    // Create service instance
    googleMeetService = new GoogleMeetService({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:3000/callback',
      refreshToken: 'test-refresh-token',
    });
  });

  describe('createMeeting', () => {
    it('should create a Google Meet meeting successfully', async () => {
      const mockResponse = {
        data: {
          id: 'event-123',
          conferenceData: {
            entryPoints: [
              {
                entryPointType: 'video',
                uri: 'https://meet.google.com/abc-defg-hij',
              },
            ],
          },
        },
      };

      mockCalendar.events.insert.mockResolvedValue(mockResponse);

      const meetingDetails = {
        title: 'Test Meeting',
        description: 'Test Description',
        startTime: new Date('2024-12-01T10:00:00Z'),
        endTime: new Date('2024-12-01T11:00:00Z'),
        attendeeEmails: ['student@example.com'],
      };

      const result = await googleMeetService.createMeeting(meetingDetails);

      expect(result).toEqual({
        meetLink: 'https://meet.google.com/abc-defg-hij',
        eventId: 'event-123',
        calendarEventId: 'event-123',
      });

      expect(mockCalendar.events.insert).toHaveBeenCalledWith({
        calendarId: 'primary',
        resource: {
          summary: 'Test Meeting',
          description: 'Test Description',
          start: {
            dateTime: '2024-12-01T10:00:00.000Z',
            timeZone: 'UTC',
          },
          end: {
            dateTime: '2024-12-01T11:00:00.000Z',
            timeZone: 'UTC',
          },
          attendees: [{ email: 'student@example.com' }],
          conferenceData: {
            createRequest: {
              requestId: expect.stringMatching(/^meet-\d+$/),
              conferenceSolutionKey: {
                type: 'hangoutsMeet',
              },
            },
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 },
              { method: 'popup', minutes: 30 },
            ],
          },
        },
        conferenceDataVersion: 1,
        sendUpdates: 'all',
      });
    });

    it('should throw error when Google Meet link is not created', async () => {
      const mockResponse = {
        data: {
          id: 'event-123',
          conferenceData: {
            entryPoints: [], // No video entry point
          },
        },
      };

      mockCalendar.events.insert.mockResolvedValue(mockResponse);

      const meetingDetails = {
        title: 'Test Meeting',
        startTime: new Date('2024-12-01T10:00:00Z'),
        endTime: new Date('2024-12-01T11:00:00Z'),
      };

      await expect(googleMeetService.createMeeting(meetingDetails)).rejects.toThrow(
        'Failed to create Google Meet meeting'
      );
    });

    it('should handle API errors gracefully', async () => {
      mockCalendar.events.insert.mockRejectedValue(new Error('API Error'));

      const meetingDetails = {
        title: 'Test Meeting',
        startTime: new Date('2024-12-01T10:00:00Z'),
        endTime: new Date('2024-12-01T11:00:00Z'),
      };

      await expect(googleMeetService.createMeeting(meetingDetails)).rejects.toThrow(
        'Failed to create Google Meet meeting'
      );
    });
  });

  describe('updateMeeting', () => {
    it('should update a meeting successfully', async () => {
      mockCalendar.events.update.mockResolvedValue({ data: {} });

      const updateDetails = {
        title: 'Updated Meeting',
        startTime: new Date('2024-12-01T14:00:00Z'),
        endTime: new Date('2024-12-01T15:00:00Z'),
      };

      await googleMeetService.updateMeeting('event-123', updateDetails);

      expect(mockCalendar.events.update).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'event-123',
        resource: {
          summary: 'Updated Meeting',
          start: {
            dateTime: '2024-12-01T14:00:00.000Z',
            timeZone: 'UTC',
          },
          end: {
            dateTime: '2024-12-01T15:00:00.000Z',
            timeZone: 'UTC',
          },
        },
        sendUpdates: 'all',
      });
    });

    it('should handle update errors', async () => {
      mockCalendar.events.update.mockRejectedValue(new Error('Update failed'));

      await expect(
        googleMeetService.updateMeeting('event-123', { title: 'New Title' })
      ).rejects.toThrow('Failed to update Google Meet meeting');
    });
  });

  describe('cancelMeeting', () => {
    it('should cancel a meeting successfully', async () => {
      mockCalendar.events.delete.mockResolvedValue({ data: {} });

      await googleMeetService.cancelMeeting('event-123');

      expect(mockCalendar.events.delete).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'event-123',
        sendUpdates: 'all',
      });
    });

    it('should handle cancellation errors', async () => {
      mockCalendar.events.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(googleMeetService.cancelMeeting('event-123')).rejects.toThrow(
        'Failed to cancel Google Meet meeting'
      );
    });
  });

  describe('getMeetingDetails', () => {
    it('should get meeting details successfully', async () => {
      const mockMeetingData = {
        id: 'event-123',
        summary: 'Test Meeting',
        start: { dateTime: '2024-12-01T10:00:00Z' },
        end: { dateTime: '2024-12-01T11:00:00Z' },
      };

      mockCalendar.events.get.mockResolvedValue({ data: mockMeetingData });

      const result = await googleMeetService.getMeetingDetails('event-123');

      expect(result).toEqual(mockMeetingData);
      expect(mockCalendar.events.get).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'event-123',
      });
    });

    it('should handle get details errors', async () => {
      mockCalendar.events.get.mockRejectedValue(new Error('Get failed'));

      await expect(googleMeetService.getMeetingDetails('event-123')).rejects.toThrow(
        'Failed to get meeting details'
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      mockOAuth2Client.getAccessToken.mockResolvedValue({ token: 'new-token' });

      await googleMeetService.refreshAccessToken();

      expect(mockOAuth2Client.getAccessToken).toHaveBeenCalled();
    });

    it('should handle refresh token errors', async () => {
      mockOAuth2Client.getAccessToken.mockRejectedValue(new Error('Refresh failed'));

      await expect(googleMeetService.refreshAccessToken()).rejects.toThrow(
        'Failed to refresh Google API access token'
      );
    });
  });
});