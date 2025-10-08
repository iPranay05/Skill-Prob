export interface LiveSession {
  id: string;
  courseId: string;
  mentorId: string;
  title: string;
  description?: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  googleMeetLink?: string;
  googleEventId?: string;
  maxParticipants: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  recordingUrl?: string;
  chatEnabled: boolean;
  qaEnabled: boolean;
  pollingEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionAttendance {
  id: string;
  sessionId: string;
  studentId: string;
  joinedAt?: Date;
  leftAt?: Date;
  durationMinutes: number;
  status: 'registered' | 'joined' | 'left' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionChat {
  id: string;
  sessionId: string;
  userId: string;
  message: string;
  messageType: 'text' | 'question' | 'answer' | 'system';
  isPrivate: boolean;
  repliedTo?: string;
  createdAt: Date;
}

export interface SessionQA {
  id: string;
  sessionId: string;
  studentId: string;
  question: string;
  answer?: string;
  answeredBy?: string;
  answeredAt?: Date;
  isAnonymous: boolean;
  upvotes: number;
  status: 'pending' | 'answered' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionPoll {
  id: string;
  sessionId: string;
  createdBy: string;
  question: string;
  options: PollOption[];
  pollType: 'multiple_choice' | 'single_choice' | 'text' | 'rating';
  isAnonymous: boolean;
  isActive: boolean;
  endsAt?: Date;
  createdAt: Date;
}

export interface PollOption {
  id: string;
  text: string;
  votes?: number;
}

export interface PollResponse {
  id: string;
  pollId: string;
  userId: string;
  response: any; // Flexible response data based on poll type
  createdAt: Date;
}

export interface CreateLiveSessionRequest {
  courseId: string;
  title: string;
  description?: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  maxParticipants?: number;
  chatEnabled?: boolean;
  qaEnabled?: boolean;
  pollingEnabled?: boolean;
}

export interface UpdateLiveSessionRequest {
  title?: string;
  description?: string;
  scheduledStartTime?: Date;
  scheduledEndTime?: Date;
  maxParticipants?: number;
  chatEnabled?: boolean;
  qaEnabled?: boolean;
  pollingEnabled?: boolean;
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
}

export interface JoinSessionRequest {
  sessionId: string;
  studentId: string;
}

export interface SendChatMessageRequest {
  sessionId: string;
  userId: string;
  message: string;
  messageType?: 'text' | 'question' | 'answer';
  isPrivate?: boolean;
  repliedTo?: string;
}

export interface CreateQARequest {
  sessionId: string;
  studentId: string;
  question: string;
  isAnonymous?: boolean;
}

export interface AnswerQARequest {
  qaId: string;
  answer: string;
  answeredBy: string;
}

export interface CreatePollRequest {
  sessionId: string;
  createdBy: string;
  question: string;
  options: Omit<PollOption, 'id' | 'votes'>[];
  pollType: 'multiple_choice' | 'single_choice' | 'text' | 'rating';
  isAnonymous?: boolean;
  endsAt?: Date;
}

export interface SubmitPollResponseRequest {
  pollId: string;
  userId: string;
  response: any;
}