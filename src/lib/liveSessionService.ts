import { supabase } from './database';
import { createGoogleMeetService, checkMentorOAuthSetup } from './googleMeetService';
import {
  LiveSession,
  SessionAttendance,
  SessionChat,
  SessionQA,
  SessionPoll,
  PollResponse,
  CreateLiveSessionRequest,
  UpdateLiveSessionRequest,
  JoinSessionRequest,
  SendChatMessageRequest,
  CreateQARequest,
  AnswerQARequest,
  CreatePollRequest,
  SubmitPollResponseRequest,
} from '../models/LiveSession';
import { APIError } from './errors';

export class LiveSessionService {

  /**
   * Create a new live session with Google Meet integration
   */
  async createLiveSession(
    mentorId: string,
    sessionData: CreateLiveSessionRequest
  ): Promise<LiveSession> {
    try {
      // Validate mentor has access to the course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id, mentor_id')
        .eq('id', sessionData.courseId)
        .eq('mentor_id', mentorId)
        .single();

      if (courseError || !course) {
        throw new APIError('Course not found or access denied', 403);
      }

      // Check if mentor has OAuth setup
      const hasOAuth = await checkMentorOAuthSetup(mentorId);
      if (!hasOAuth) {
        throw new APIError('Google OAuth setup required. Please complete OAuth setup first.', 400);
      }

      // Create Google Meet service for this mentor
      const googleMeetService = await createGoogleMeetService(mentorId);

      // Create Google Meet meeting
      const meetingDetails = await googleMeetService.createMeeting({
        title: sessionData.title,
        description: sessionData.description,
        startTime: sessionData.scheduledStartTime,
        endTime: sessionData.scheduledEndTime,
      });

      // Insert session into database
      const { data: session, error } = await supabase
        .from('live_sessions')
        .insert({
          course_id: sessionData.courseId,
          mentor_id: mentorId,
          title: sessionData.title,
          description: sessionData.description,
          scheduled_start_time: sessionData.scheduledStartTime.toISOString(),
          scheduled_end_time: sessionData.scheduledEndTime.toISOString(),
          google_meet_link: meetingDetails.meetLink,
          google_event_id: meetingDetails.eventId,
          max_participants: sessionData.maxParticipants || 100,
          chat_enabled: sessionData.chatEnabled ?? true,
          qa_enabled: sessionData.qaEnabled ?? true,
          polling_enabled: sessionData.pollingEnabled ?? true,
        })
        .select()
        .single();

      if (error) {
        // Cleanup Google Meet if database insert fails
        try {
          await googleMeetService.cancelMeeting(meetingDetails.eventId);
        } catch (cleanupError) {
          console.error('Failed to cleanup Google Meet:', cleanupError);
        }
        throw new APIError('Failed to create live session', 500);
      }

      return this.mapSessionFromDB(session);
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error('Error creating live session:', error);
      throw new APIError('Failed to create live session', 500);
    }
  }

  /**
   * Update an existing live session
   */
  async updateLiveSession(
    sessionId: string,
    mentorId: string,
    updateData: UpdateLiveSessionRequest
  ): Promise<LiveSession> {
    try {
      // Verify mentor owns the session
      const { data: existingSession, error: fetchError } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('mentor_id', mentorId)
        .single();

      if (fetchError || !existingSession) {
        throw new APIError('Session not found or access denied', 403);
      }

      // Update Google Meet if time changes
      if (updateData.scheduledStartTime || updateData.scheduledEndTime || updateData.title) {
        const googleMeetService = await createGoogleMeetService(mentorId);
        await googleMeetService.updateMeeting(existingSession.google_event_id, {
          title: updateData.title,
          startTime: updateData.scheduledStartTime,
          endTime: updateData.scheduledEndTime,
        });
      }

      // Update database
      const updateFields: any = {};
      if (updateData.title) updateFields.title = updateData.title;
      if (updateData.description) updateFields.description = updateData.description;
      if (updateData.scheduledStartTime) {
        updateFields.scheduled_start_time = updateData.scheduledStartTime.toISOString();
      }
      if (updateData.scheduledEndTime) {
        updateFields.scheduled_end_time = updateData.scheduledEndTime.toISOString();
      }
      if (updateData.maxParticipants) updateFields.max_participants = updateData.maxParticipants;
      if (updateData.chatEnabled !== undefined) updateFields.chat_enabled = updateData.chatEnabled;
      if (updateData.qaEnabled !== undefined) updateFields.qa_enabled = updateData.qaEnabled;
      if (updateData.pollingEnabled !== undefined) updateFields.polling_enabled = updateData.pollingEnabled;
      if (updateData.status) updateFields.status = updateData.status;

      const { data: session, error } = await supabase
        .from('live_sessions')
        .update(updateFields)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to update live session', 500);
      }

      return this.mapSessionFromDB(session);
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error('Error updating live session:', error);
      throw new APIError('Failed to update live session', 500);
    }
  }

  /**
   * Get live sessions for a course
   */
  async getSessionsForCourse(courseId: string): Promise<LiveSession[]> {
    try {
      const { data: sessions, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('course_id', courseId)
        .order('scheduled_start_time', { ascending: true });

      if (error) {
        throw new APIError('Failed to fetch sessions', 500);
      }

      return sessions.map(this.mapSessionFromDB);
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error('Error fetching sessions:', error);
      throw new APIError('Failed to fetch sessions', 500);
    }
  }

  /**
   * Get session details by ID
   */
  async getSessionById(sessionId: string): Promise<LiveSession | null> {
    try {
      const { data: session, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new APIError('Failed to fetch session', 500);
      }

      return this.mapSessionFromDB(session);
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error('Error fetching session:', error);
      throw new APIError('Failed to fetch session', 500);
    }
  }

  /**
   * Join a live session (for students)
   */
  async joinSession(joinData: JoinSessionRequest): Promise<SessionAttendance> {
    try {
      // Check if session exists and is live or scheduled
      const session = await this.getSessionById(joinData.sessionId);
      if (!session) {
        throw new APIError('Session not found', 404);
      }

      if (session.status === 'cancelled' || session.status === 'completed') {
        throw new APIError('Session is not available for joining', 400);
      }

      // Check if student is enrolled in the course
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('course_id', session.courseId)
        .eq('student_id', joinData.studentId)
        .eq('status', 'active')
        .single();

      if (enrollmentError || !enrollment) {
        throw new APIError('Student not enrolled in this course', 403);
      }

      // Check current attendance count
      const { count: currentAttendees } = await supabase
        .from('session_attendance')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', joinData.sessionId)
        .eq('status', 'joined');

      if (currentAttendees && currentAttendees >= session.maxParticipants) {
        throw new APIError('Session is at maximum capacity', 400);
      }

      // Create or update attendance record
      const { data: attendance, error } = await supabase
        .from('session_attendance')
        .upsert({
          session_id: joinData.sessionId,
          student_id: joinData.studentId,
          joined_at: new Date().toISOString(),
          status: 'joined',
        })
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to join session', 500);
      }

      return this.mapAttendanceFromDB(attendance);
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error('Error joining session:', error);
      throw new APIError('Failed to join session', 500);
    }
  }

  /**
   * Leave a live session
   */
  async leaveSession(sessionId: string, studentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('session_attendance')
        .update({
          left_at: new Date().toISOString(),
          status: 'left',
        })
        .eq('session_id', sessionId)
        .eq('student_id', studentId);

      if (error) {
        throw new APIError('Failed to leave session', 500);
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error('Error leaving session:', error);
      throw new APIError('Failed to leave session', 500);
    }
  }

  /**
   * Send chat message in session
   */
  async sendChatMessage(messageData: SendChatMessageRequest): Promise<SessionChat> {
    try {
      const { data: message, error } = await supabase
        .from('session_chat')
        .insert({
          session_id: messageData.sessionId,
          user_id: messageData.userId,
          message: messageData.message,
          message_type: messageData.messageType || 'text',
          is_private: messageData.isPrivate || false,
          replied_to: messageData.repliedTo,
        })
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to send message', 500);
      }

      return this.mapChatFromDB(message);
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error('Error sending chat message:', error);
      throw new APIError('Failed to send message', 500);
    }
  }

  /**
   * Get chat messages for a session
   */
  async getChatMessages(sessionId: string, limit: number = 50): Promise<SessionChat[]> {
    try {
      const { data: messages, error } = await supabase
        .from('session_chat')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new APIError('Failed to fetch chat messages', 500);
      }

      return messages.map(this.mapChatFromDB).reverse();
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error('Error fetching chat messages:', error);
      throw new APIError('Failed to fetch chat messages', 500);
    }
  }

  /**
   * Create Q&A question
   */
  async createQA(qaData: CreateQARequest): Promise<SessionQA> {
    try {
      const { data: qa, error } = await supabase
        .from('session_qa')
        .insert({
          session_id: qaData.sessionId,
          student_id: qaData.studentId,
          question: qaData.question,
          is_anonymous: qaData.isAnonymous || false,
        })
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to create Q&A', 500);
      }

      return this.mapQAFromDB(qa);
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error('Error creating Q&A:', error);
      throw new APIError('Failed to create Q&A', 500);
    }
  }

  /**
   * Answer Q&A question
   */
  async answerQA(answerData: AnswerQARequest): Promise<SessionQA> {
    try {
      const { data: qa, error } = await supabase
        .from('session_qa')
        .update({
          answer: answerData.answer,
          answered_by: answerData.answeredBy,
          answered_at: new Date().toISOString(),
          status: 'answered',
        })
        .eq('id', answerData.qaId)
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to answer Q&A', 500);
      }

      return this.mapQAFromDB(qa);
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error('Error answering Q&A:', error);
      throw new APIError('Failed to answer Q&A', 500);
    }
  }

  /**
   * Create poll in session
   */
  async createPoll(pollData: CreatePollRequest): Promise<SessionPoll> {
    try {
      const { data: poll, error } = await supabase
        .from('session_polls')
        .insert({
          session_id: pollData.sessionId,
          created_by: pollData.createdBy,
          question: pollData.question,
          options: JSON.stringify(pollData.options.map((opt, index) => ({ ...opt, id: index.toString() }))),
          poll_type: pollData.pollType,
          is_anonymous: pollData.isAnonymous ?? true,
          ends_at: pollData.endsAt?.toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to create poll', 500);
      }

      return this.mapPollFromDB(poll);
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error('Error creating poll:', error);
      throw new APIError('Failed to create poll', 500);
    }
  }

  /**
   * Submit poll response
   */
  async submitPollResponse(responseData: SubmitPollResponseRequest): Promise<PollResponse> {
    try {
      const { data: response, error } = await supabase
        .from('poll_responses')
        .upsert({
          poll_id: responseData.pollId,
          user_id: responseData.userId,
          response: JSON.stringify(responseData.response),
        })
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to submit poll response', 500);
      }

      return this.mapPollResponseFromDB(response);
    } catch (error) {
      if (error instanceof APIError) throw error;
      console.error('Error submitting poll response:', error);
      throw new APIError('Failed to submit poll response', 500);
    }
  }

  // Helper methods to map database records to models
  private mapSessionFromDB(dbSession: any): LiveSession {
    return {
      id: dbSession.id,
      courseId: dbSession.course_id,
      mentorId: dbSession.mentor_id,
      title: dbSession.title,
      description: dbSession.description,
      scheduledStartTime: new Date(dbSession.scheduled_start_time),
      scheduledEndTime: new Date(dbSession.scheduled_end_time),
      actualStartTime: dbSession.actual_start_time ? new Date(dbSession.actual_start_time) : undefined,
      actualEndTime: dbSession.actual_end_time ? new Date(dbSession.actual_end_time) : undefined,
      googleMeetLink: dbSession.google_meet_link,
      googleEventId: dbSession.google_event_id,
      maxParticipants: dbSession.max_participants,
      status: dbSession.status,
      recordingUrl: dbSession.recording_url,
      chatEnabled: dbSession.chat_enabled,
      qaEnabled: dbSession.qa_enabled,
      pollingEnabled: dbSession.polling_enabled,
      createdAt: new Date(dbSession.created_at),
      updatedAt: new Date(dbSession.updated_at),
    };
  }

  private mapAttendanceFromDB(dbAttendance: any): SessionAttendance {
    return {
      id: dbAttendance.id,
      sessionId: dbAttendance.session_id,
      studentId: dbAttendance.student_id,
      joinedAt: dbAttendance.joined_at ? new Date(dbAttendance.joined_at) : undefined,
      leftAt: dbAttendance.left_at ? new Date(dbAttendance.left_at) : undefined,
      durationMinutes: dbAttendance.duration_minutes,
      status: dbAttendance.status,
      createdAt: new Date(dbAttendance.created_at),
      updatedAt: new Date(dbAttendance.updated_at),
    };
  }

  private mapChatFromDB(dbChat: any): SessionChat {
    return {
      id: dbChat.id,
      sessionId: dbChat.session_id,
      userId: dbChat.user_id,
      message: dbChat.message,
      messageType: dbChat.message_type,
      isPrivate: dbChat.is_private,
      repliedTo: dbChat.replied_to,
      createdAt: new Date(dbChat.created_at),
    };
  }

  private mapQAFromDB(dbQA: any): SessionQA {
    return {
      id: dbQA.id,
      sessionId: dbQA.session_id,
      studentId: dbQA.student_id,
      question: dbQA.question,
      answer: dbQA.answer,
      answeredBy: dbQA.answered_by,
      answeredAt: dbQA.answered_at ? new Date(dbQA.answered_at) : undefined,
      isAnonymous: dbQA.is_anonymous,
      upvotes: dbQA.upvotes,
      status: dbQA.status,
      createdAt: new Date(dbQA.created_at),
      updatedAt: new Date(dbQA.updated_at),
    };
  }

  private mapPollFromDB(dbPoll: any): SessionPoll {
    return {
      id: dbPoll.id,
      sessionId: dbPoll.session_id,
      createdBy: dbPoll.created_by,
      question: dbPoll.question,
      options: JSON.parse(dbPoll.options),
      pollType: dbPoll.poll_type,
      isAnonymous: dbPoll.is_anonymous,
      isActive: dbPoll.is_active,
      endsAt: dbPoll.ends_at ? new Date(dbPoll.ends_at) : undefined,
      createdAt: new Date(dbPoll.created_at),
    };
  }

  private mapPollResponseFromDB(dbResponse: any): PollResponse {
    return {
      id: dbResponse.id,
      pollId: dbResponse.poll_id,
      userId: dbResponse.user_id,
      response: JSON.parse(dbResponse.response),
      createdAt: new Date(dbResponse.created_at),
    };
  }
}
