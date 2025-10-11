import { StudentLearningService } from '@/lib/studentLearningService';
import { createClient } from '@supabase/supabase-js';
import { AppError } from '@/lib/errors';

// Mock Supabase client
jest.mock('@supabase/supabase-js');
const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn()
};

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
mockCreateClient.mockReturnValue(mockSupabase as any);

describe('StudentLearningService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Quiz Management', () => {
    describe('getCourseQuizzes', () => {
      it('should fetch course quizzes successfully', async () => {
        const mockQuizzes = [
          {
            id: 'quiz-1',
            course_id: 'course-1',
            title: 'JavaScript Basics Quiz',
            description: 'Test your JavaScript knowledge',
            max_attempts: 3,
            passing_score: 70,
            questions: [
              {
                id: 'q1',
                question_text: 'What is JavaScript?',
                question_type: 'multiple_choice',
                options: ['Language', 'Framework', 'Library'],
                correct_answer: 'Language',
                points: 10
              }
            ]
          }
        ];

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: mockQuizzes, error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentLearningService.getCourseQuizzes('course-1');

        expect(mockSupabase.from).toHaveBeenCalledWith('quizzes');
        expect(mockQuery.select).toHaveBeenCalledWith(`
          *,
          questions:quiz_questions(*)
        `);
        expect(mockQuery.eq).toHaveBeenCalledWith('course_id', 'course-1');
        expect(mockQuery.order).toHaveBeenCalledWith('order_index');
        expect(result).toEqual(mockQuizzes);
      });

      it('should handle database errors', async () => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        await expect(StudentLearningService.getCourseQuizzes('course-1'))
          .rejects.toThrow(AppError);
      });
    });

    describe('startQuizAttempt', () => {
      it('should start a new quiz attempt successfully', async () => {
        const mockAttempt = {
          id: 'attempt-1',
          quiz_id: 'quiz-1',
          student_id: 'student-1',
          attempt_number: 1,
          started_at: new Date().toISOString(),
          answers: {}
        };

        // Mock attempts query (no previous attempts)
        const mockAttemptsQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [], error: null })
        };

        // Mock quiz query
        const mockQuizQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: { max_attempts: 3 }, 
            error: null 
          })
        };

        // Mock insert query
        const mockInsertQuery = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockAttempt, error: null })
        };

        mockSupabase.from
          .mockReturnValueOnce(mockAttemptsQuery) // First call for attempts
          .mockReturnValueOnce(mockQuizQuery)     // Second call for quiz
          .mockReturnValueOnce(mockInsertQuery);  // Third call for insert

        const result = await StudentLearningService.startQuizAttempt('quiz-1', 'student-1');

        expect(result).toEqual(mockAttempt);
      });

      it('should throw error when max attempts exceeded', async () => {
        const mockAttemptsQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ 
            data: [{ attempt_number: 3 }], 
            error: null 
          })
        };

        const mockQuizQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: { max_attempts: 3 }, 
            error: null 
          })
        };

        mockSupabase.from
          .mockReturnValueOnce(mockAttemptsQuery)
          .mockReturnValueOnce(mockQuizQuery);

        await expect(StudentLearningService.startQuizAttempt('quiz-1', 'student-1'))
          .rejects.toThrow('Maximum attempts exceeded');
      });
    });

    describe('submitQuizAttempt', () => {
      it('should submit quiz attempt and calculate score', async () => {
        const mockAttempt = {
          id: 'attempt-1',
          quiz_id: 'quiz-1',
          student_id: 'student-1',
          started_at: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
          quiz: {
            course_id: 'course-1',
            passing_score: 70,
            questions: [
              {
                id: 'q1',
                question_type: 'multiple_choice',
                correct_answer: 'A',
                points: 10
              },
              {
                id: 'q2',
                question_type: 'true_false',
                correct_answer: true,
                points: 10
              }
            ]
          }
        };

        const answers = {
          'q1': 'A', // Correct
          'q2': false // Incorrect
        };

        const mockSelectQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockAttempt, error: null })
        };

        const mockUpdateQuery = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: { ...mockAttempt, score: 50, passed: false }, 
            error: null 
          })
        };

        mockSupabase.from
          .mockReturnValueOnce(mockSelectQuery)
          .mockReturnValueOnce(mockUpdateQuery);

        // Mock updateProgress method
        jest.spyOn(StudentLearningService, 'updateProgress').mockResolvedValue({} as any);

        const result = await StudentLearningService.submitQuizAttempt('attempt-1', answers);

        expect(mockUpdateQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({
            score: 50,
            passed: false,
            answers
          })
        );
      });
    });
  });

  describe('Assignment Management', () => {
    describe('getCourseAssignments', () => {
      it('should fetch course assignments successfully', async () => {
        const mockAssignments = [
          {
            id: 'assignment-1',
            course_id: 'course-1',
            title: 'Build a Calculator',
            description: 'Create a simple calculator app',
            max_points: 100,
            is_required: true
          }
        ];

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: mockAssignments, error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentLearningService.getCourseAssignments('course-1');

        expect(result).toEqual(mockAssignments);
      });
    });

    describe('submitAssignment', () => {
      it('should submit assignment successfully', async () => {
        const mockSubmission = {
          id: 'submission-1',
          assignment_id: 'assignment-1',
          student_id: 'student-1',
          status: 'submitted',
          submission_text: 'My solution...',
          submitted_at: new Date().toISOString()
        };

        const mockQuery = {
          upsert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockSubmission, error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        // Mock updateProgress method
        jest.spyOn(StudentLearningService, 'updateProgress').mockResolvedValue({} as any);

        const result = await StudentLearningService.submitAssignment(
          'assignment-1',
          'student-1',
          { submission_text: 'My solution...' }
        );

        expect(result).toEqual(mockSubmission);
        expect(mockQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            assignment_id: 'assignment-1',
            student_id: 'student-1',
            status: 'submitted',
            submission_text: 'My solution...'
          })
        );
      });
    });
  });

  describe('Bookmark Management', () => {
    describe('getStudentBookmarks', () => {
      it('should fetch student bookmarks successfully', async () => {
        const mockBookmarks = [
          {
            id: 'bookmark-1',
            student_id: 'student-1',
            course_id: 'course-1',
            title: 'Important concept',
            notes: 'Remember this for exam',
            created_at: new Date().toISOString()
          }
        ];

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: mockBookmarks, error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentLearningService.getStudentBookmarks('student-1');

        expect(result).toEqual(mockBookmarks);
      });

      it('should filter by course ID when provided', async () => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        await StudentLearningService.getStudentBookmarks('student-1', 'course-1');

        expect(mockQuery.eq).toHaveBeenCalledWith('student_id', 'student-1');
        expect(mockQuery.eq).toHaveBeenCalledWith('course_id', 'course-1');
      });
    });

    describe('createBookmark', () => {
      it('should create bookmark successfully', async () => {
        const bookmarkData = {
          student_id: 'student-1',
          course_id: 'course-1',
          title: 'Important concept',
          notes: 'Remember this'
        };

        const mockBookmark = {
          id: 'bookmark-1',
          ...bookmarkData,
          created_at: new Date().toISOString()
        };

        const mockQuery = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockBookmark, error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentLearningService.createBookmark(bookmarkData);

        expect(result).toEqual(mockBookmark);
        expect(mockQuery.insert).toHaveBeenCalledWith(bookmarkData);
      });
    });

    describe('deleteBookmark', () => {
      it('should delete bookmark successfully', async () => {
        const mockQuery = {
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis()
        };

        mockQuery.eq.mockResolvedValue({ error: null });
        mockSupabase.from.mockReturnValue(mockQuery);

        await StudentLearningService.deleteBookmark('bookmark-1', 'student-1');

        expect(mockQuery.delete).toHaveBeenCalled();
        expect(mockQuery.eq).toHaveBeenCalledWith('id', 'bookmark-1');
        expect(mockQuery.eq).toHaveBeenCalledWith('student_id', 'student-1');
      });
    });
  });

  describe('Notes Management', () => {
    describe('createNote', () => {
      it('should create note successfully', async () => {
        const noteData = {
          student_id: 'student-1',
          course_id: 'course-1',
          content: 'This is my note',
          is_private: true
        };

        const mockNote = {
          id: 'note-1',
          ...noteData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const mockQuery = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockNote, error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentLearningService.createNote(noteData);

        expect(result).toEqual(mockNote);
      });
    });

    describe('updateNote', () => {
      it('should update note successfully', async () => {
        const updates = {
          title: 'Updated title',
          content: 'Updated content'
        };

        const mockNote = {
          id: 'note-1',
          student_id: 'student-1',
          ...updates,
          updated_at: new Date().toISOString()
        };

        const mockQuery = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockNote, error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentLearningService.updateNote('note-1', 'student-1', updates);

        expect(result).toEqual(mockNote);
        expect(mockQuery.update).toHaveBeenCalledWith(updates);
      });
    });
  });

  describe('Forum Management', () => {
    describe('getCourseForumPosts', () => {
      it('should fetch forum posts successfully', async () => {
        const mockPosts = [
          {
            id: 'post-1',
            course_id: 'course-1',
            title: 'Question about JavaScript',
            content: 'How does closure work?',
            author: {
              id: 'user-1',
              profile: { firstName: 'John', lastName: 'Doe' }
            },
            replies_count: 3,
            views_count: 15
          }
        ];

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: mockPosts, error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentLearningService.getCourseForumPosts('course-1');

        expect(result).toEqual(mockPosts);
      });
    });

    describe('createForumPost', () => {
      it('should create forum post successfully', async () => {
        const postData = {
          course_id: 'course-1',
          author_id: 'user-1',
          title: 'New Question',
          content: 'I need help with this topic',
          post_type: 'question' as const,
          is_pinned: false,
          is_locked: false
        };

        const mockPost = {
          id: 'post-1',
          ...postData,
          views_count: 0,
          replies_count: 0,
          created_at: new Date().toISOString(),
          author: {
            id: 'user-1',
            profile: { firstName: 'John' }
          }
        };

        const mockQuery = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockPost, error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentLearningService.createForumPost(postData);

        expect(result).toEqual(mockPost);
      });
    });

    describe('incrementForumViews', () => {
      it('should increment forum views successfully', async () => {
        mockSupabase.rpc.mockResolvedValue({ error: null });

        await StudentLearningService.incrementForumViews('post-1');

        expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_forum_views', { post_id: 'post-1' });
      });

      it('should not throw error if RPC fails', async () => {
        mockSupabase.rpc.mockResolvedValue({ error: { message: 'RPC failed' } });

        // Should not throw
        await expect(StudentLearningService.incrementForumViews('post-1'))
          .resolves.not.toThrow();
      });
    });
  });

  describe('Progress Tracking', () => {
    describe('updateProgress', () => {
      it('should update student progress successfully', async () => {
        const progressData = {
          content_id: 'content-1',
          completed: true,
          completion_percentage: 100
        };

        const mockProgress = {
          id: 'progress-1',
          student_id: 'student-1',
          course_id: 'course-1',
          ...progressData,
          last_accessed_at: new Date().toISOString()
        };

        const mockQuery = {
          upsert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockProgress, error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentLearningService.updateProgress(
          'student-1',
          'course-1',
          progressData
        );

        expect(result).toEqual(mockProgress);
        expect(mockQuery.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            student_id: 'student-1',
            course_id: 'course-1',
            ...progressData
          })
        );
      });
    });
  });

  describe('Certificate Management', () => {
    describe('generateCertificate', () => {
      it('should generate certificate successfully', async () => {
        const completionData = {
          completion_percentage: 95,
          final_score: 88,
          skills_verified: ['JavaScript', 'React']
        };

        const mockCertificate = {
          id: 'cert-1',
          student_id: 'student-1',
          course_id: 'course-1',
          certificate_number: 'CERT-2024-000001',
          verification_code: 'ABC12345',
          issued_at: new Date().toISOString(),
          ...completionData
        };

        const mockQuery = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockCertificate, error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentLearningService.generateCertificate(
          'student-1',
          'course-1',
          completionData
        );

        expect(result).toEqual(mockCertificate);
      });
    });

    describe('verifyCertificate', () => {
      it('should verify certificate successfully', async () => {
        const mockCertificate = {
          id: 'cert-1',
          certificate_number: 'CERT-2024-000001',
          is_verified: true,
          student: {
            id: 'student-1',
            profile: { firstName: 'John', lastName: 'Doe' }
          },
          course: {
            id: 'course-1',
            title: 'JavaScript Fundamentals'
          }
        };

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockCertificate, error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentLearningService.verifyCertificate('CERT-2024-000001');

        expect(result).toEqual(mockCertificate);
      });

      it('should return null for invalid certificate', async () => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { code: 'PGRST116' } // Not found error
          })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentLearningService.verifyCertificate('INVALID-CERT');

        expect(result).toBeNull();
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw AppError for database errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database connection failed' } 
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(StudentLearningService.getCourseQuizzes('course-1'))
        .rejects.toThrow(AppError);
    });

    it('should handle network errors gracefully', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockRejectedValue(new Error('Network error'))
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(StudentLearningService.getCourseQuizzes('course-1'))
        .rejects.toThrow(AppError);
    });
  });
});