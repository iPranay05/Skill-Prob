import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

interface GoogleMeetConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
}

interface MeetingDetails {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendeeEmails?: string[];
}

interface CreatedMeeting {
  meetLink: string;
  eventId: string;
  calendarEventId: string;
}

export class GoogleMeetService {
  private oauth2Client: OAuth2Client;
  private calendar: any;

  constructor(config: GoogleMeetConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );

    this.oauth2Client.setCredentials({
      refresh_token: config.refreshToken,
    });

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Create a Google Meet meeting with calendar event
   */
  async createMeeting(details: MeetingDetails): Promise<CreatedMeeting> {
    try {
      const event = {
        summary: details.title,
        description: details.description || '',
        start: {
          dateTime: details.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: details.endTime.toISOString(),
          timeZone: 'UTC',
        },
        attendees: details.attendeeEmails?.map(email => ({ email })) || [],
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 30 }, // 30 minutes before
          ],
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all',
      });

      const meetLink = response.data.conferenceData?.entryPoints?.find(
        (entry: any) => entry.entryPointType === 'video'
      )?.uri;

      if (!meetLink) {
        throw new Error('Failed to create Google Meet link');
      }

      return {
        meetLink,
        eventId: response.data.id!,
        calendarEventId: response.data.id!,
      };
    } catch (error) {
      console.error('Error creating Google Meet:', error);
      throw new Error('Failed to create Google Meet meeting');
    }
  }

  /**
   * Update an existing meeting
   */
  async updateMeeting(
    eventId: string,
    details: Partial<MeetingDetails>
  ): Promise<void> {
    try {
      const updateData: any = {};

      if (details.title) updateData.summary = details.title;
      if (details.description) updateData.description = details.description;
      if (details.startTime) {
        updateData.start = {
          dateTime: details.startTime.toISOString(),
          timeZone: 'UTC',
        };
      }
      if (details.endTime) {
        updateData.end = {
          dateTime: details.endTime.toISOString(),
          timeZone: 'UTC',
        };
      }
      if (details.attendeeEmails) {
        updateData.attendees = details.attendeeEmails.map(email => ({ email }));
      }

      await this.calendar.events.update({
        calendarId: 'primary',
        eventId,
        resource: updateData,
        sendUpdates: 'all',
      });
    } catch (error) {
      console.error('Error updating Google Meet:', error);
      throw new Error('Failed to update Google Meet meeting');
    }
  }

  /**
   * Cancel a meeting
   */
  async cancelMeeting(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId,
        sendUpdates: 'all',
      });
    } catch (error) {
      console.error('Error canceling Google Meet:', error);
      throw new Error('Failed to cancel Google Meet meeting');
    }
  }

  /**
   * Get meeting details
   */
  async getMeetingDetails(eventId: string): Promise<any> {
    try {
      const response = await this.calendar.events.get({
        calendarId: 'primary',
        eventId,
      });

      return response.data;
    } catch (error) {
      console.error('Error getting meeting details:', error);
      throw new Error('Failed to get meeting details');
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<void> {
    try {
      await this.oauth2Client.getAccessToken();
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh Google API access token');
    }
  }
}

// Factory function to create GoogleMeetService instance
export function createGoogleMeetService(): GoogleMeetService {
  const config: GoogleMeetConfig = {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN!,
  };

  if (!config.clientId || !config.clientSecret || !config.refreshToken) {
    throw new Error('Missing required Google API configuration');
  }

  return new GoogleMeetService(config);
}