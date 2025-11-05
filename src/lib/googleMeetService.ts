import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MentorOAuthConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
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
  private mentorId: string;

  constructor(config: MentorOAuthConfig, mentorId: string) {
    this.mentorId = mentorId;
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/mentor/oauth/callback`
    );

    this.oauth2Client.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
      expiry_date: config.expiresAt.getTime(),
    });

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    // Set up token refresh handler
    this.oauth2Client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        // Update tokens in database
        await this.updateMentorTokens(tokens);
      }
    });
  }

  private async updateMentorTokens(tokens: any) {
    try {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expiry_date ? tokens.expiry_date / 1000 : 3600));

      await supabase
        .from('users')
        .update({
          google_access_token: tokens.access_token,
          google_token_expires_at: expiresAt.toISOString()
        })
        .eq('id', this.mentorId);
    } catch (error) {
      console.error('Error updating mentor tokens:', error);
    }
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

// Factory function to create GoogleMeetService instance for a specific mentor
export async function createGoogleMeetService(mentorUserId: string): Promise<GoogleMeetService> {
  // Get mentor's OAuth credentials from database
  const { data: mentor, error } = await supabase
    .from('users')
    .select('google_client_id, google_client_secret, google_access_token, google_refresh_token, google_token_expires_at')
    .eq('id', mentorUserId)
    .eq('role', 'mentor')
    .single();

  if (error || !mentor) {
    throw new Error('Mentor not found or OAuth not configured');
  }

  if (!mentor.google_client_id || !mentor.google_client_secret || !mentor.google_refresh_token) {
    throw new Error('Mentor OAuth credentials incomplete');
  }

  const config: MentorOAuthConfig = {
    clientId: mentor.google_client_id,
    clientSecret: mentor.google_client_secret,
    accessToken: mentor.google_access_token,
    refreshToken: mentor.google_refresh_token,
    expiresAt: new Date(mentor.google_token_expires_at)
  };

  return new GoogleMeetService(config, mentorUserId);
}

// Helper function to check if mentor has OAuth setup
export async function checkMentorOAuthSetup(mentorUserId: string): Promise<boolean> {
  const { data: mentor, error } = await supabase
    .from('users')
    .select('oauth_setup_completed')
    .eq('id', mentorUserId)
    .eq('role', 'mentor')
    .single();

  return !error && mentor?.oauth_setup_completed === true;
}