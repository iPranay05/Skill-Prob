import { createClient } from '@supabase/supabase-js';
import { AppError } from './errors';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Quiz {
  id: string;
  course_id: string;
  chapter_id?: string;
  title: string;
  description?: string;
  instructions?: string;
  time_limit_minutes?: number;
  max_attempts: number;
  passing_score: number;
  is_required: boolean;
  order_index: number;
  questions?: QuizQuestion[];
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[];
  correct_answer: any;
  explanation?: string;
  points: number;
  order_index: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  attempt_number: number;
  started_at: string;
  completed_at?: string;
  score?: number;
  answers: Record<string, any>;
  time_taken_minutes?: number;
  passed: boolean;
}

export interface Assignment {
  id: string;
  course_id: string;
  chapter_id?: string;
  title: string;
  description: string;
  instructions?: string;
  due_date?: string;
  max_points: number;
  submission_format: string;
  allowed_file_types?: string[];
  max_file_size_mb: number;
  is_required: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  submission_text?: string;
  file_urls?: string[];
  submitted_at?: string;
  graded_at?: string;
  score?: number;
  feedback?: string;
  graded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentBookmark {
  id: string;
  student_id: string;
  course_id: string;
  content_id?: string;
  chapter_id?: string;
  title: string;
  notes?: string;
  timestamp_seconds?: number;
  created_at: string;
}

export interface StudentNote {
  id: string;
  student_id: string;
  course_id: string;
  content_id?: string;
  chapter_id?: string;
  title?: string;
  content: string;
  timestamp_seconds?: number;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface ForumPost {
  id: string;
  course_id: string;
  chapter_id?: string;
  author_id: string;
  title: string;
  content: string;
  post_type: 'question' | 'discussion' | 'announcement';
  is_pinned: boolean;
  is_locked: boolean;
  views_count: number;
  replies_count: number;
  last_reply_at?: string;
  last_reply_by?: string;
  author?: {
    id: string;
    profile: any;
  };
  created_at: string;
  updated_at: string;
}

export interface ForumReply {
  id: string;
  forum_post_id: string;
  author_id: string;
  content: string;
  parent_reply_id?: string;
  is_solution: boolean;
  likes_count: number;
  author?: {
    id: string;
    profile: any;
  };
  created_at: string;
  updated_at: string;
}

export interface StudentProgress {
  id: string;
  student_id: string;
  course_id: string;
  content_id?: string;
  quiz_id?: string;
  assignment_id?: string;
  completed: boolean;
  completion_percentage: number;
  time_spent_minutes: number;
  last_accessed_at: string;
  completed_at?: string;
}

export interface Certificate {
  id: string;
  student_id: string;
  course_id: string;
  certificate_number: string;
  issued_at: string;
  completion_percentage: number;
  final_score?: number;
  skills_verified?: string[];
  certificate_url?: string;
  is_verified: boolean;
  verification_code: string;
  created_at: string;
}

export class StudentLearningService {
  // Quiz Management
  static async getCourseQuizzes(courseId: string): Promise<Quiz[]> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          questions:quiz_questions(*)
        `)
        .eq('course_id', courseId)
        .order('order_index');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching course quizzes:', error);
      throw new AppError('Failed to fetch quizzes', 500);
    }
  }

  static async getQuizById(quizId: string): Promise<Quiz | null> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          questions:quiz_questions(*)
        `)
        .eq('id', quizId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw new AppError('Failed to fetch quiz', 500);
    }
  }

  static async startQuizAttempt(quizId: string, studentId: string): Promise<QuizAttempt> {
    try {
      // Check if student has remaining attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('attempt_number')
        .eq('quiz_id', quizId)
        .eq('student_id', studentId)
        .order('attempt_number', { ascending: false })
        .limit(1);

      if (attemptsError) throw attemptsError;

      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('max_attempts')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;

      const nextAttemptNumber = attempts && attempts.length > 0 ? attempts[0].attempt_number + 1 : 1;
      
      if (nextAttemptNumber > quiz.max_attempts) {
        throw new AppError('Maximum attempts exceeded', 400);
      }

      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          student_id: studentId,
          attempt_number: nextAttemptNumber,
          answers: {}
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error starting quiz attempt:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to start quiz attempt', 500);
    }
  }

  static async submitQuizAttempt(
    attemptId: string,
    answers: Record<string, any>
  ): Promise<QuizAttempt> {
    try {
      // Get the attempt and quiz details
      const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quiz:quizzes(
            *,
            questions:quiz_questions(*)
          )
        `)
        .eq('id', attemptId)
        .single();

      if (attemptError) throw attemptError;

      // Calculate score
      let totalPoints = 0;
      let earnedPoints = 0;

      attempt.quiz.questions.forEach((question: QuizQuestion) => {
        totalPoints += question.points;
        const studentAnswer = answers[question.id];
        
        if (this.isAnswerCorrect(question, studentAnswer)) {
          earnedPoints += question.points;
        }
      });

      const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const passed = score >= attempt.quiz.passing_score;

      const timeTaken = Math.round(
        (new Date().getTime() - new Date(attempt.started_at).getTime()) / (1000 * 60)
      );

      const { data, error } = await supabase
        .from('quiz_attempts')
        .update({
          completed_at: new Date().toISOString(),
          score,
          answers,
          time_taken_minutes: timeTaken,
          passed
        })
        .eq('id', attemptId)
        .select()
        .single();

      if (error) throw error;

      // Update student progress
      await this.updateProgress(attempt.student_id, attempt.quiz.course_id, {
        quiz_id: attempt.quiz_id,
        completed: passed,
        completion_percentage: score
      });

      return data;
    } catch (error) {
      console.error('Error submitting quiz attempt:', error);
      throw new AppError('Failed to submit quiz attempt', 500);
    }
  }

  private static isAnswerCorrect(question: QuizQuestion, studentAnswer: any): boolean {
    switch (question.question_type) {
      case 'multiple_choice':
        return studentAnswer === question.correct_answer;
      case 'true_false':
        return studentAnswer === question.correct_answer;
      case 'short_answer':
        return studentAnswer?.toLowerCase().trim() === 
               question.correct_answer?.toLowerCase().trim();
      case 'essay':
        // Essays need manual grading
        return false;
      default:
        return false;
    }
  }

  // Assignment Management
  static async getCourseAssignments(courseId: string): Promise<Assignment[]> {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching course assignments:', error);
      throw new AppError('Failed to fetch assignments', 500);
    }
  }

  static async getAssignmentSubmission(
    assignmentId: string,
    studentId: string
  ): Promise<AssignmentSubmission | null> {
    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching assignment submission:', error);
      throw new AppError('Failed to fetch assignment submission', 500);
    }
  }

  static async submitAssignment(
    assignmentId: string,
    studentId: string,
    submissionData: {
      submission_text?: string;
      file_urls?: string[];
    }
  ): Promise<AssignmentSubmission> {
    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .upsert({
          assignment_id: assignmentId,
          student_id: studentId,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          ...submissionData
        })
        .select()
        .single();

      if (error) throw error;

      // Update student progress
      await this.updateProgress(studentId, '', {
        assignment_id: assignmentId,
        completed: true,
        completion_percentage: 100
      });

      return data;
    } catch (error) {
      console.error('Error submitting assignment:', error);
      throw new AppError('Failed to submit assignment', 500);
    }
  }

  // Bookmark Management
  static async getStudentBookmarks(studentId: string, courseId?: string): Promise<StudentBookmark[]> {
    try {
      let query = supabase
        .from('student_bookmarks')
        .select('*')
        .eq('student_id', studentId);

      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      throw new AppError('Failed to fetch bookmarks', 500);
    }
  }

  static async createBookmark(bookmarkData: Omit<StudentBookmark, 'id' | 'created_at'>): Promise<StudentBookmark> {
    try {
      const { data, error } = await supabase
        .from('student_bookmarks')
        .insert(bookmarkData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating bookmark:', error);
      throw new AppError('Failed to create bookmark', 500);
    }
  }

  static async deleteBookmark(bookmarkId: string, studentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('student_bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('student_id', studentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      throw new AppError('Failed to delete bookmark', 500);
    }
  }

  // Notes Management
  static async getStudentNotes(studentId: string, courseId?: string): Promise<StudentNote[]> {
    try {
      let query = supabase
        .from('student_notes')
        .select('*')
        .eq('student_id', studentId);

      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw new AppError('Failed to fetch notes', 500);
    }
  }

  static async createNote(noteData: Omit<StudentNote, 'id' | 'created_at' | 'updated_at'>): Promise<StudentNote> {
    try {
      const { data, error } = await supabase
        .from('student_notes')
        .insert(noteData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating note:', error);
      throw new AppError('Failed to create note', 500);
    }
  }

  static async updateNote(
    noteId: string,
    studentId: string,
    updates: Partial<Pick<StudentNote, 'title' | 'content' | 'is_private'>>
  ): Promise<StudentNote> {
    try {
      const { data, error } = await supabase
        .from('student_notes')
        .update(updates)
        .eq('id', noteId)
        .eq('student_id', studentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating note:', error);
      throw new AppError('Failed to update note', 500);
    }
  }

  static async deleteNote(noteId: string, studentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('student_notes')
        .delete()
        .eq('id', noteId)
        .eq('student_id', studentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw new AppError('Failed to delete note', 500);
    }
  }

  // Forum Management
  static async getCourseForumPosts(courseId: string, chapterId?: string): Promise<ForumPost[]> {
    try {
      let query = supabase
        .from('course_forums')
        .select(`
          *,
          author:users!course_forums_author_id_fkey(id, profile)
        `)
        .eq('course_id', courseId);

      if (chapterId) {
        query = query.eq('chapter_id', chapterId);
      }

      const { data, error } = await query.order('is_pinned', { ascending: false })
                                      .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching forum posts:', error);
      throw new AppError('Failed to fetch forum posts', 500);
    }
  }

  static async createForumPost(postData: Omit<ForumPost, 'id' | 'views_count' | 'replies_count' | 'last_reply_at' | 'last_reply_by' | 'created_at' | 'updated_at'>): Promise<ForumPost> {
    try {
      const { data, error } = await supabase
        .from('course_forums')
        .insert(postData)
        .select(`
          *,
          author:users!course_forums_author_id_fkey(id, profile)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating forum post:', error);
      throw new AppError('Failed to create forum post', 500);
    }
  }

  static async getForumReplies(postId: string): Promise<ForumReply[]> {
    try {
      const { data, error } = await supabase
        .from('forum_replies')
        .select(`
          *,
          author:users!forum_replies_author_id_fkey(id, profile)
        `)
        .eq('forum_post_id', postId)
        .order('created_at');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching forum replies:', error);
      throw new AppError('Failed to fetch forum replies', 500);
    }
  }

  static async createForumReply(replyData: Omit<ForumReply, 'id' | 'likes_count' | 'created_at' | 'updated_at'>): Promise<ForumReply> {
    try {
      const { data, error } = await supabase
        .from('forum_replies')
        .insert(replyData)
        .select(`
          *,
          author:users!forum_replies_author_id_fkey(id, profile)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating forum reply:', error);
      throw new AppError('Failed to create forum reply', 500);
    }
  }

  static async incrementForumViews(postId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_forum_views', { post_id: postId });
      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing forum views:', error);
      // Don't throw error for view counting
    }
  }

  // Progress Tracking
  static async getStudentProgress(studentId: string, courseId: string): Promise<StudentProgress[]> {
    try {
      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('course_id', courseId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching student progress:', error);
      throw new AppError('Failed to fetch student progress', 500);
    }
  }

  static async updateProgress(
    studentId: string,
    courseId: string,
    progressData: Partial<StudentProgress>
  ): Promise<StudentProgress> {
    try {
      const { data, error } = await supabase
        .from('student_progress')
        .upsert({
          student_id: studentId,
          course_id: courseId,
          last_accessed_at: new Date().toISOString(),
          ...progressData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating progress:', error);
      throw new AppError('Failed to update progress', 500);
    }
  }

  // Certificate Management
  static async getStudentCertificates(studentId: string): Promise<Certificate[]> {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('student_id', studentId)
        .order('issued_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching certificates:', error);
      throw new AppError('Failed to fetch certificates', 500);
    }
  }

  static async generateCertificate(
    studentId: string,
    courseId: string,
    completionData: {
      completion_percentage: number;
      final_score?: number;
      skills_verified?: string[];
    }
  ): Promise<Certificate> {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .insert({
          student_id: studentId,
          course_id: courseId,
          ...completionData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating certificate:', error);
      throw new AppError('Failed to generate certificate', 500);
    }
  }

  static async verifyCertificate(certificateNumber: string): Promise<Certificate | null> {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          student:users!certificates_student_id_fkey(id, profile),
          course:courses!certificates_course_id_fkey(id, title)
        `)
        .eq('certificate_number', certificateNumber)
        .eq('is_verified', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error verifying certificate:', error);
      throw new AppError('Failed to verify certificate', 500);
    }
  }
}