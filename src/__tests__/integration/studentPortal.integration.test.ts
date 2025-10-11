import { NextRequest } from 'next/server';
import { GET as getQuizzes } from '@/app/api/courses/[courseId]/quizzes/route';
import { POST as startQuizAttempt, PUT as submitQuizAttempt } from '@/app/api/quizzes/[quizId]/attempt/route';
import { GET as getAssignments } from '@/app/api/courses/[courseId]/assignments/route';
import { POST as submitAssignment } from '@/app/api/assignments/[assignmentId]/submit/route';
import { GET as getBookmarks, POST as createBookmark } from '@/app/api/student/bookmarks/route';
import { DELETE as deleteBookmark } from '@/app/api/student/bookmarks/[bookmarkId]/route';
import { GET as getNotes, POST as createNote } from '@/app/api/student/notes/route';
import { PUT as updateNote, DELETE as deleteNote } from '@/app/api/student/notes/[noteId]/route';
import { GET as getForumPosts, POST as createForumPost } from '@/app/api/courses/[courseId]/forum/route';
import { GET as getForumReplies, POST as createForumReply } from '@/app/api/forum/[postId]/replies/route';
import { StudentLearningService } from '@/lib/studentLearningService';
import { verifyToken } from '@/lib/auth';

// Mock dependencies
jest.mock('@/lib/studentLearningService');
jest.mock('@/lib/auth');

const mockStudentLearningService = StudentLearningService as jest.Mocked<typeof StudentLearningService>;
const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

describe('Student Portal Integration Tests', () => {
  const mockToken = 'valid-jwt-token';
  const mockUserId = 'user-123';
  const mockCourseId = 'course-123';
  const mockQuizId = 'quiz-123';
  const mockAssignmentId = 'assignment-123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyToken.mockReturnValue({ userId: mockUserId, role: 'student' });
  });

  describe('Quiz Management API', () => {
    describe('GET /api/courses/[courseId]/quizzes', () => {
      it('should fetch course quizzes successfully', async () => {
        const mockQuizzes = [
          {
            id: 'quiz-1',
            title: 'JavaScript Basics',
            description: 'Test your JS knowledge',
            max_attempts: 3,
            passing_score: 70,
            questions: [
              {
                id: 'q1',
                question_text: 'What is JavaScript?',
                question_type: 'multiple_choice',
                options: ['Language', 'Framework'],
                correct_answer: 'Language',
                points: 10
              }
            ]
          }
        ];

        mockStudentLearningService.getCourseQuizzes.mockResolvedValue(mockQuizzes);

        const request = new NextRequest('http://localhost/api/courses/course-123/quizzes', {
          headers: { authorization: `Bearer ${mockToken}` }
        });

        const response = await getQuizzes(request, { params: { courseId: mockCourseId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.quizzes).toEqual(mockQuizzes);
        expect(mockStudentLearningService.getCourseQuizzes).toHaveBeenCalledWith(mockCourseId);
      });

      it('should return 401 for missing token', async () => {
        const request = new NextRequest('http://localhost/api/courses/course-123/quizzes');

        const response = await getQuizzes(request, { params: { courseId: mockCourseId } });
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      it('should handle service errors', async () => {
        mockStudentLearningService.getCourseQuizzes.mockRejectedValue(
          new Error('Database connection failed')
        );

        const request = new NextRequest('http://localhost/api/courses/course-123/quizzes', {
          headers: { authorization: `Bearer ${mockToken}` }
        });

        const response = await getQuizzes(request, { params: { courseId: mockCourseId } });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Internal server error');
      });
    });

    describe('POST /api/quizzes/[quizId]/attempt', () => {
      it('should start quiz attempt successfully', async () => {
        const mockAttempt = {
          id: 'attempt-1',
          quiz_id: mockQuizId,
          student_id: mockUserId,
          attempt_number: 1,
          started_at: new Date().toISOString(),
          answers: {}
        };

        mockStudentLearningService.startQuizAttempt.mockResolvedValue(mockAttempt);

        const request = new NextRequest(`http://localhost/api/quizzes/${mockQuizId}/attempt`, {
          method: 'POST',
          headers: { authorization: `Bearer ${mockToken}` }
        });

        const response = await startQuizAttempt(request, { params: { quizId: mockQuizId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.attempt).toEqual(mockAttempt);
        expect(mockStudentLearningService.startQuizAttempt).toHaveBeenCalledWith(mockQuizId, mockUserId);
      });
    });

    describe('PUT /api/quizzes/[quizId]/attempt', () => {
      it('should submit quiz attempt successfully', async () => {
        const attemptId = 'attempt-1';
        const answers = { 'q1': 'A', 'q2': 'B' };
        const mockSubmittedAttempt = {
          id: attemptId,
          quiz_id: mockQuizId,
          student_id: mockUserId,
          score: 80,
          passed: true,
          completed_at: new Date().toISOString()
        };

        mockStudentLearningService.submitQuizAttempt.mockResolvedValue(mockSubmittedAttempt);

        const request = new NextRequest(`http://localhost/api/quizzes/${mockQuizId}/attempt`, {
          method: 'PUT',
          headers: { 
            authorization: `Bearer ${mockToken}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify({ attemptId, answers })
        });

        const response = await submitQuizAttempt(request, { params: { quizId: mockQuizId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.attempt).toEqual(mockSubmittedAttempt);
        expect(mockStudentLearningService.submitQuizAttempt).toHaveBeenCalledWith(attemptId, answers);
      });

      it('should return 400 for missing required fields', async () => {
        const request = new NextRequest(`http://localhost/api/quizzes/${mockQuizId}/attempt`, {
          method: 'PUT',
          headers: { 
            authorization: `Bearer ${mockToken}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify({ attemptId: 'attempt-1' }) // Missing answers
        });

        const response = await submitQuizAttempt(request, { params: { quizId: mockQuizId } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Attempt ID and answers are required');
      });
    });
  });

  describe('Assignment Management API', () => {
    describe('GET /api/courses/[courseId]/assignments', () => {
      it('should fetch course assignments successfully', async () => {
        const mockAssignments = [
          {
            id: 'assignment-1',
            title: 'Build a Calculator',
            description: 'Create a simple calculator app',
            max_points: 100,
            due_date: '2024-12-31T23:59:59Z',
            is_required: true
          }
        ];

        mockStudentLearningService.getCourseAssignments.mockResolvedValue(mockAssignments);

        const request = new NextRequest('http://localhost/api/courses/course-123/assignments', {
          headers: { authorization: `Bearer ${mockToken}` }
        });

        const response = await getAssignments(request, { params: { courseId: mockCourseId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.assignments).toEqual(mockAssignments);
      });
    });

    describe('POST /api/assignments/[assignmentId]/submit', () => {
      it('should submit assignment successfully', async () => {
        const submissionData = {
          submission_text: 'Here is my solution...',
          file_urls: ['https://example.com/file1.pdf']
        };

        const mockSubmission = {
          id: 'submission-1',
          assignment_id: mockAssignmentId,
          student_id: mockUserId,
          status: 'submitted',
          ...submissionData,
          submitted_at: new Date().toISOString()
        };

        mockStudentLearningService.submitAssignment.mockResolvedValue(mockSubmission);

        const request = new NextRequest(`http://localhost/api/assignments/${mockAssignmentId}/submit`, {
          method: 'POST',
          headers: { 
            authorization: `Bearer ${mockToken}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify(submissionData)
        });

        const response = await submitAssignment(request, { params: { assignmentId: mockAssignmentId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.submission).toEqual(mockSubmission);
        expect(mockStudentLearningService.submitAssignment).toHaveBeenCalledWith(
          mockAssignmentId,
          mockUserId,
          submissionData
        );
      });
    });
  });

  describe('Bookmark Management API', () => {
    describe('GET /api/student/bookmarks', () => {
      it('should fetch student bookmarks successfully', async () => {
        const mockBookmarks = [
          {
            id: 'bookmark-1',
            student_id: mockUserId,
            course_id: 'course-1',
            title: 'Important concept',
            notes: 'Remember this',
            created_at: new Date().toISOString()
          }
        ];

        mockStudentLearningService.getStudentBookmarks.mockResolvedValue(mockBookmarks);

        const request = new NextRequest('http://localhost/api/student/bookmarks', {
          headers: { authorization: `Bearer ${mockToken}` }
        });

        const response = await getBookmarks(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.bookmarks).toEqual(mockBookmarks);
        expect(mockStudentLearningService.getStudentBookmarks).toHaveBeenCalledWith(mockUserId, undefined);
      });

      it('should filter by course ID when provided', async () => {
        mockStudentLearningService.getStudentBookmarks.mockResolvedValue([]);

        const request = new NextRequest('http://localhost/api/student/bookmarks?courseId=course-123', {
          headers: { authorization: `Bearer ${mockToken}` }
        });

        const response = await getBookmarks(request);

        expect(mockStudentLearningService.getStudentBookmarks).toHaveBeenCalledWith(mockUserId, 'course-123');
      });
    });

    describe('POST /api/student/bookmarks', () => {
      it('should create bookmark successfully', async () => {
        const bookmarkData = {
          course_id: 'course-1',
          title: 'Important concept',
          notes: 'Remember this',
          content_id: 'content-1',
          timestamp_seconds: 120
        };

        const mockBookmark = {
          id: 'bookmark-1',
          student_id: mockUserId,
          ...bookmarkData,
          created_at: new Date().toISOString()
        };

        mockStudentLearningService.createBookmark.mockResolvedValue(mockBookmark);

        const request = new NextRequest('http://localhost/api/student/bookmarks', {
          method: 'POST',
          headers: { 
            authorization: `Bearer ${mockToken}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify(bookmarkData)
        });

        const response = await createBookmark(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.bookmark).toEqual(mockBookmark);
        expect(mockStudentLearningService.createBookmark).toHaveBeenCalledWith({
          student_id: mockUserId,
          ...bookmarkData
        });
      });

      it('should return 400 for missing required fields', async () => {
        const request = new NextRequest('http://localhost/api/student/bookmarks', {
          method: 'POST',
          headers: { 
            authorization: `Bearer ${mockToken}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify({ title: 'Test' }) // Missing course_id
        });

        const response = await createBookmark(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Course ID and title are required');
      });
    });

    describe('DELETE /api/student/bookmarks/[bookmarkId]', () => {
      it('should delete bookmark successfully', async () => {
        const bookmarkId = 'bookmark-1';
        mockStudentLearningService.deleteBookmark.mockResolvedValue();

        const request = new NextRequest(`http://localhost/api/student/bookmarks/${bookmarkId}`, {
          method: 'DELETE',
          headers: { authorization: `Bearer ${mockToken}` }
        });

        const response = await deleteBookmark(request, { params: { bookmarkId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Bookmark deleted successfully');
        expect(mockStudentLearningService.deleteBookmark).toHaveBeenCalledWith(bookmarkId, mockUserId);
      });
    });
  });

  describe('Notes Management API', () => {
    describe('POST /api/student/notes', () => {
      it('should create note successfully', async () => {
        const noteData = {
          course_id: 'course-1',
          content: 'This is my note',
          title: 'Important Note',
          content_id: 'content-1'
        };

        const mockNote = {
          id: 'note-1',
          student_id: mockUserId,
          is_private: true,
          ...noteData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        mockStudentLearningService.createNote.mockResolvedValue(mockNote);

        const request = new NextRequest('http://localhost/api/student/notes', {
          method: 'POST',
          headers: { 
            authorization: `Bearer ${mockToken}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify(noteData)
        });

        const response = await createNote(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.note).toEqual(mockNote);
        expect(mockStudentLearningService.createNote).toHaveBeenCalledWith({
          student_id: mockUserId,
          is_private: true,
          ...noteData
        });
      });
    });

    describe('PUT /api/student/notes/[noteId]', () => {
      it('should update note successfully', async () => {
        const noteId = 'note-1';
        const updates = {
          title: 'Updated Title',
          content: 'Updated content'
        };

        const mockUpdatedNote = {
          id: noteId,
          student_id: mockUserId,
          ...updates,
          updated_at: new Date().toISOString()
        };

        mockStudentLearningService.updateNote.mockResolvedValue(mockUpdatedNote);

        const request = new NextRequest(`http://localhost/api/student/notes/${noteId}`, {
          method: 'PUT',
          headers: { 
            authorization: `Bearer ${mockToken}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify(updates)
        });

        const response = await updateNote(request, { params: { noteId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.note).toEqual(mockUpdatedNote);
        expect(mockStudentLearningService.updateNote).toHaveBeenCalledWith(noteId, mockUserId, updates);
      });
    });
  });

  describe('Forum Management API', () => {
    describe('GET /api/courses/[courseId]/forum', () => {
      it('should fetch forum posts successfully', async () => {
        const mockPosts = [
          {
            id: 'post-1',
            course_id: mockCourseId,
            title: 'Question about JavaScript',
            content: 'How does closure work?',
            author: {
              id: 'user-1',
              profile: { firstName: 'John', lastName: 'Doe' }
            },
            replies_count: 3,
            views_count: 15,
            created_at: new Date().toISOString()
          }
        ];

        mockStudentLearningService.getCourseForumPosts.mockResolvedValue(mockPosts);

        const request = new NextRequest(`http://localhost/api/courses/${mockCourseId}/forum`, {
          headers: { authorization: `Bearer ${mockToken}` }
        });

        const response = await getForumPosts(request, { params: { courseId: mockCourseId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.posts).toEqual(mockPosts);
        expect(mockStudentLearningService.getCourseForumPosts).toHaveBeenCalledWith(mockCourseId, undefined);
      });

      it('should filter by chapter ID when provided', async () => {
        const chapterId = 'chapter-1';
        mockStudentLearningService.getCourseForumPosts.mockResolvedValue([]);

        const request = new NextRequest(`http://localhost/api/courses/${mockCourseId}/forum?chapterId=${chapterId}`, {
          headers: { authorization: `Bearer ${mockToken}` }
        });

        const response = await getForumPosts(request, { params: { courseId: mockCourseId } });

        expect(mockStudentLearningService.getCourseForumPosts).toHaveBeenCalledWith(mockCourseId, chapterId);
      });
    });

    describe('POST /api/courses/[courseId]/forum', () => {
      it('should create forum post successfully', async () => {
        const postData = {
          title: 'New Question',
          content: 'I need help with this topic',
          chapter_id: 'chapter-1'
        };

        const mockPost = {
          id: 'post-1',
          course_id: mockCourseId,
          author_id: mockUserId,
          post_type: 'discussion',
          is_pinned: false,
          is_locked: false,
          views_count: 0,
          replies_count: 0,
          ...postData,
          created_at: new Date().toISOString(),
          author: {
            id: mockUserId,
            profile: { firstName: 'John' }
          }
        };

        mockStudentLearningService.createForumPost.mockResolvedValue(mockPost);

        const request = new NextRequest(`http://localhost/api/courses/${mockCourseId}/forum`, {
          method: 'POST',
          headers: { 
            authorization: `Bearer ${mockToken}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify(postData)
        });

        const response = await createForumPost(request, { params: { courseId: mockCourseId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.post).toEqual(mockPost);
        expect(mockStudentLearningService.createForumPost).toHaveBeenCalledWith({
          course_id: mockCourseId,
          author_id: mockUserId,
          post_type: 'discussion',
          is_pinned: false,
          is_locked: false,
          ...postData
        });
      });

      it('should return 400 for missing required fields', async () => {
        const request = new NextRequest(`http://localhost/api/courses/${mockCourseId}/forum`, {
          method: 'POST',
          headers: { 
            authorization: `Bearer ${mockToken}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify({ title: 'Test' }) // Missing content
        });

        const response = await createForumPost(request, { params: { courseId: mockCourseId } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Title and content are required');
      });
    });
  });

  describe('Forum Replies API', () => {
    describe('GET /api/forum/[postId]/replies', () => {
      it('should fetch forum replies and increment views', async () => {
        const postId = 'post-1';
        const mockReplies = [
          {
            id: 'reply-1',
            forum_post_id: postId,
            author_id: 'user-2',
            content: 'Here is the answer...',
            is_solution: false,
            likes_count: 2,
            author: {
              id: 'user-2',
              profile: { firstName: 'Jane' }
            },
            created_at: new Date().toISOString()
          }
        ];

        mockStudentLearningService.incrementForumViews.mockResolvedValue();
        mockStudentLearningService.getForumReplies.mockResolvedValue(mockReplies);

        const request = new NextRequest(`http://localhost/api/forum/${postId}/replies`, {
          headers: { authorization: `Bearer ${mockToken}` }
        });

        const response = await getForumReplies(request, { params: { postId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.replies).toEqual(mockReplies);
        expect(mockStudentLearningService.incrementForumViews).toHaveBeenCalledWith(postId);
        expect(mockStudentLearningService.getForumReplies).toHaveBeenCalledWith(postId);
      });
    });

    describe('POST /api/forum/[postId]/replies', () => {
      it('should create forum reply successfully', async () => {
        const postId = 'post-1';
        const replyData = {
          content: 'This is my reply',
          parent_reply_id: null
        };

        const mockReply = {
          id: 'reply-1',
          forum_post_id: postId,
          author_id: mockUserId,
          is_solution: false,
          likes_count: 0,
          ...replyData,
          created_at: new Date().toISOString(),
          author: {
            id: mockUserId,
            profile: { firstName: 'John' }
          }
        };

        mockStudentLearningService.createForumReply.mockResolvedValue(mockReply);

        const request = new NextRequest(`http://localhost/api/forum/${postId}/replies`, {
          method: 'POST',
          headers: { 
            authorization: `Bearer ${mockToken}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify(replyData)
        });

        const response = await createForumReply(request, { params: { postId } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.reply).toEqual(mockReply);
        expect(mockStudentLearningService.createForumReply).toHaveBeenCalledWith({
          forum_post_id: postId,
          author_id: mockUserId,
          is_solution: false,
          ...replyData
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid tokens', async () => {
      mockVerifyToken.mockReturnValue(null);

      const request = new NextRequest('http://localhost/api/courses/course-123/quizzes', {
        headers: { authorization: 'Bearer invalid-token' }
      });

      const response = await getQuizzes(request, { params: { courseId: mockCourseId } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid token');
    });

    it('should handle service errors gracefully', async () => {
      mockStudentLearningService.getCourseQuizzes.mockRejectedValue(
        new Error('Service unavailable')
      );

      const request = new NextRequest('http://localhost/api/courses/course-123/quizzes', {
        headers: { authorization: `Bearer ${mockToken}` }
      });

      const response = await getQuizzes(request, { params: { courseId: mockCourseId } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});