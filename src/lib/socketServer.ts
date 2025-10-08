import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { LiveSessionService } from './liveSessionService';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

interface Socket {
  id: string;
  userId?: string;
  userRole?: string;
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (event: string, data?: any) => void;
  to: (room: string) => any;
  broadcast: any;
  handshake: {
    auth: {
      token?: string;
    };
  };
}

export class SocketServer {
  private io: SocketIOServer;
  private liveSessionService: LiveSessionService;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.liveSessionService = new LiveSessionService();
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected`);

      // Join session room
      socket.on('join-session', async (data: { sessionId: string }) => {
        try {
          const session = await this.liveSessionService.getSessionById(data.sessionId);
          if (!session) {
            socket.emit('error', { message: 'Session not found' });
            return;
          }

          // Join the session room
          socket.join(`session-${data.sessionId}`);
          
          // If student, record attendance
          if (socket.userRole === 'student') {
            await this.liveSessionService.joinSession({
              sessionId: data.sessionId,
              studentId: socket.userId!,
            });
          }

          // Notify others in the session
          socket.to(`session-${data.sessionId}`).emit('user-joined', {
            userId: socket.userId,
            userRole: socket.userRole,
          });

          socket.emit('session-joined', { sessionId: data.sessionId });
        } catch (error) {
          console.error('Error joining session:', error);
          socket.emit('error', { message: 'Failed to join session' });
        }
      });

      // Leave session room
      socket.on('leave-session', async (data: { sessionId: string }) => {
        try {
          socket.leave(`session-${data.sessionId}`);
          
          // If student, update attendance
          if (socket.userRole === 'student') {
            await this.liveSessionService.leaveSession(data.sessionId, socket.userId!);
          }

          // Notify others in the session
          socket.to(`session-${data.sessionId}`).emit('user-left', {
            userId: socket.userId,
            userRole: socket.userRole,
          });

          socket.emit('session-left', { sessionId: data.sessionId });
        } catch (error) {
          console.error('Error leaving session:', error);
          socket.emit('error', { message: 'Failed to leave session' });
        }
      });

      // Send chat message
      socket.on('send-message', async (data: {
        sessionId: string;
        message: string;
        messageType?: 'text' | 'question' | 'answer';
        isPrivate?: boolean;
        repliedTo?: string;
      }) => {
        try {
          const chatMessage = await this.liveSessionService.sendChatMessage({
            sessionId: data.sessionId,
            userId: socket.userId!,
            message: data.message,
            messageType: data.messageType,
            isPrivate: data.isPrivate,
            repliedTo: data.repliedTo,
          });

          // Broadcast to session room
          this.io.to(`session-${data.sessionId}`).emit('new-message', chatMessage);
        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Create Q&A question
      socket.on('create-qa', async (data: {
        sessionId: string;
        question: string;
        isAnonymous?: boolean;
      }) => {
        try {
          if (socket.userRole !== 'student') {
            socket.emit('error', { message: 'Only students can ask questions' });
            return;
          }

          const qa = await this.liveSessionService.createQA({
            sessionId: data.sessionId,
            studentId: socket.userId!,
            question: data.question,
            isAnonymous: data.isAnonymous,
          });

          // Broadcast to session room
          this.io.to(`session-${data.sessionId}`).emit('new-qa', qa);
        } catch (error) {
          console.error('Error creating Q&A:', error);
          socket.emit('error', { message: 'Failed to create question' });
        }
      });

      // Answer Q&A question
      socket.on('answer-qa', async (data: {
        qaId: string;
        answer: string;
        sessionId: string;
      }) => {
        try {
          if (socket.userRole !== 'mentor') {
            socket.emit('error', { message: 'Only mentors can answer questions' });
            return;
          }

          const qa = await this.liveSessionService.answerQA({
            qaId: data.qaId,
            answer: data.answer,
            answeredBy: socket.userId!,
          });

          // Broadcast to session room
          this.io.to(`session-${data.sessionId}`).emit('qa-answered', qa);
        } catch (error) {
          console.error('Error answering Q&A:', error);
          socket.emit('error', { message: 'Failed to answer question' });
        }
      });

      // Create poll
      socket.on('create-poll', async (data: {
        sessionId: string;
        question: string;
        options: { text: string }[];
        pollType: 'multiple_choice' | 'single_choice' | 'text' | 'rating';
        isAnonymous?: boolean;
        endsAt?: Date;
      }) => {
        try {
          if (socket.userRole !== 'mentor') {
            socket.emit('error', { message: 'Only mentors can create polls' });
            return;
          }

          const poll = await this.liveSessionService.createPoll({
            sessionId: data.sessionId,
            createdBy: socket.userId!,
            question: data.question,
            options: data.options,
            pollType: data.pollType,
            isAnonymous: data.isAnonymous,
            endsAt: data.endsAt,
          });

          // Broadcast to session room
          this.io.to(`session-${data.sessionId}`).emit('new-poll', poll);
        } catch (error) {
          console.error('Error creating poll:', error);
          socket.emit('error', { message: 'Failed to create poll' });
        }
      });

      // Submit poll response
      socket.on('submit-poll-response', async (data: {
        pollId: string;
        response: any;
        sessionId: string;
      }) => {
        try {
          const pollResponse = await this.liveSessionService.submitPollResponse({
            pollId: data.pollId,
            userId: socket.userId!,
            response: data.response,
          });

          // Notify poll creator about new response
          this.io.to(`session-${data.sessionId}`).emit('poll-response-submitted', {
            pollId: data.pollId,
            responseCount: 1, // This would need to be calculated properly
          });

          socket.emit('poll-response-success', { pollId: data.pollId });
        } catch (error) {
          console.error('Error submitting poll response:', error);
          socket.emit('error', { message: 'Failed to submit poll response' });
        }
      });

      // Session status updates (for mentors)
      socket.on('update-session-status', async (data: {
        sessionId: string;
        status: 'live' | 'completed' | 'cancelled';
      }) => {
        try {
          if (socket.userRole !== 'mentor') {
            socket.emit('error', { message: 'Only mentors can update session status' });
            return;
          }

          await this.liveSessionService.updateLiveSession(
            data.sessionId,
            socket.userId!,
            { status: data.status }
          );

          // Broadcast status update to all session participants
          this.io.to(`session-${data.sessionId}`).emit('session-status-updated', {
            sessionId: data.sessionId,
            status: data.status,
          });
        } catch (error) {
          console.error('Error updating session status:', error);
          socket.emit('error', { message: 'Failed to update session status' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
      });
    });
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

// Global socket server instance
let socketServer: SocketServer | null = null;

export function initializeSocketServer(httpServer: HTTPServer): SocketServer {
  if (!socketServer) {
    socketServer = new SocketServer(httpServer);
  }
  return socketServer;
}

export function getSocketServer(): SocketServer | null {
  return socketServer;
}