import { z } from 'zod';

// Content types
export enum ContentType {
  VIDEO = 'video',
  DOCUMENT = 'document',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment'
}

// Course Chapter Schema
export const CourseChapterSchema = z.object({
  id: z.string().uuid().optional(),
  course_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  order_index: z.number().int().min(0),
  duration_minutes: z.number().int().min(0).default(0),
  is_free: z.boolean().default(false),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date())
});

// Course Content Schema
export const CourseContentSchema = z.object({
  id: z.string().uuid().optional(),
  chapter_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.nativeEnum(ContentType),
  order_index: z.number().int().min(0),
  content_data: z.record(z.string(), z.any()).default({}),
  is_free: z.boolean().default(false),
  duration_minutes: z.number().int().min(0).default(0),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date())
});

// Course Resource Schema
export const CourseResourceSchema = z.object({
  id: z.string().uuid().optional(),
  course_id: z.string().uuid(),
  chapter_id: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  file_url: z.string().url(),
  file_type: z.string().optional(),
  file_size: z.number().int().min(0).optional(),
  download_count: z.number().int().min(0).default(0),
  is_free: z.boolean().default(false),
  created_at: z.date().default(() => new Date())
});

// TypeScript interfaces
export interface CourseChapter {
  id?: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  duration_minutes: number;
  is_free: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CourseContent {
  id?: string;
  chapter_id: string;
  title: string;
  description?: string;
  type: ContentType;
  order_index: number;
  content_data: Record<string, any>;
  is_free: boolean;
  duration_minutes: number;
  created_at: Date;
  updated_at: Date;
}

export interface CourseResource {
  id?: string;
  course_id: string;
  chapter_id?: string;
  title: string;
  description?: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  download_count: number;
  is_free: boolean;
  created_at: Date;
}

// Video content data structure
export interface VideoContentData {
  video_url: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  quality_options?: {
    resolution: string;
    url: string;
    file_size?: number;
  }[];
  subtitles?: {
    language: string;
    url: string;
  }[];
}

// Document content data structure
export interface DocumentContentData {
  document_url: string;
  preview_url?: string;
  page_count?: number;
  file_size?: number;
}

// Quiz content data structure
export interface QuizContentData {
  questions: {
    id: string;
    question: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer';
    options?: string[];
    correct_answer: string | string[];
    explanation?: string;
    points: number;
  }[];
  time_limit_minutes?: number;
  passing_score?: number;
  max_attempts?: number;
}

// Assignment content data structure
export interface AssignmentContentData {
  instructions: string;
  submission_type: 'file' | 'text' | 'url';
  max_file_size?: number;
  allowed_file_types?: string[];
  due_date?: string;
  max_score: number;
  rubric?: {
    criteria: string;
    points: number;
    description: string;
  }[];
}

// Create/Update DTOs
export const CreateChapterSchema = CourseChapterSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const UpdateChapterSchema = CreateChapterSchema.partial();

export const CreateContentSchema = CourseContentSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const UpdateContentSchema = CreateContentSchema.partial();

export const CreateResourceSchema = CourseResourceSchema.omit({
  id: true,
  created_at: true,
  download_count: true
});

export type CreateChapterInput = z.infer<typeof CreateChapterSchema>;
export type UpdateChapterInput = z.infer<typeof UpdateChapterSchema>;
export type CreateContentInput = z.infer<typeof CreateContentSchema>;
export type UpdateContentInput = z.infer<typeof UpdateContentSchema>;
export type CreateResourceInput = z.infer<typeof CreateResourceSchema>;