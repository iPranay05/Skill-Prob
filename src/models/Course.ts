import { z } from 'zod';

// Course type enum
export enum CourseType {
  LIVE = 'live',
  RECORDED = 'recorded',
  HYBRID = 'hybrid'
}

// Course status enum
export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

// Subscription type enum
export enum SubscriptionType {
  ONE_TIME = 'one-time',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

// Zod schemas for validation
export const CoursePricingSchema = z.object({
  amount: z.number().min(0),
  currency: z.string().default('INR'),
  subscriptionType: z.nativeEnum(SubscriptionType)
});

export const CourseContentSchema = z.object({
  syllabus: z.array(z.string()),
  prerequisites: z.array(z.string()),
  learningOutcomes: z.array(z.string())
});

export const CourseMediaSchema = z.object({
  thumbnail: z.string().optional(),
  trailer: z.string().optional(),
  resources: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string()
  })).default([])
});

export const CourseEnrollmentSchema = z.object({
  maxStudents: z.number().optional(),
  currentEnrollment: z.number().default(0),
  enrolledStudents: z.array(z.string()).default([])
});

export const CourseRatingSchema = z.object({
  average: z.number().min(0).max(5).default(0),
  count: z.number().default(0),
  reviews: z.array(z.object({
    studentId: z.string(),
    rating: z.number().min(1).max(5),
    comment: z.string(),
    date: z.date()
  })).default([])
});

export const CourseSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  short_description: z.string().max(500).optional(),
  mentor_id: z.string().uuid(),
  category_id: z.string().uuid().optional(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  type: z.nativeEnum(CourseType),
  pricing: CoursePricingSchema,
  content: CourseContentSchema,
  media: CourseMediaSchema,
  enrollment: CourseEnrollmentSchema,
  ratings: CourseRatingSchema,
  status: z.nativeEnum(CourseStatus).default(CourseStatus.DRAFT),
  slug: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  published_at: z.date().optional(),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date())
});

// TypeScript interfaces
export interface CoursePricing {
  amount: number;
  currency: string;
  subscriptionType: SubscriptionType;
}

export interface CourseContent {
  syllabus: string[];
  prerequisites: string[];
  learningOutcomes: string[];
}

export interface CourseMedia {
  thumbnail?: string;
  trailer?: string;
  resources: {
    name: string;
    url: string;
    type: string;
  }[];
}

export interface CourseEnrollment {
  maxStudents?: number;
  currentEnrollment: number;
  enrolledStudents: string[];
}

export interface CourseRating {
  average: number;
  count: number;
  reviews: {
    studentId: string;
    rating: number;
    comment: string;
    date: Date;
  }[];
}

export interface Course {
  id?: string;
  title: string;
  description: string;
  short_description?: string;
  mentor_id: string;
  category_id?: string;
  category: string;
  tags: string[];
  type: CourseType;
  pricing: CoursePricing;
  content: CourseContent;
  media: CourseMedia;
  enrollment: CourseEnrollment;
  ratings: CourseRating;
  status: CourseStatus;
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  published_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Course creation and update DTOs
export const CreateCourseSchema = CourseSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  enrollment: true,
  ratings: true,
  published_at: true,
  slug: true
}).extend({
  enrollment: z.object({
    maxStudents: z.number().optional()
  }).optional(),
  ratings: z.object({}).optional()
});

export const UpdateCourseSchema = CreateCourseSchema.partial();

export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;

// Course search and filter types
export interface CourseSearchFilters {
  category?: string;
  type?: CourseType;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  tags?: string[];
  mentor_id?: string;
  status?: CourseStatus;
}

export interface CourseSearchQuery {
  search?: string;
  filters?: CourseSearchFilters;
  sortBy?: 'title' | 'price' | 'rating' | 'createdAt' | 'enrollment';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Course categories (can be extended)
export const COURSE_CATEGORIES = [
  'Programming',
  'Data Science',
  'Web Development',
  'Mobile Development',
  'DevOps',
  'Cybersecurity',
  'AI/ML',
  'Cloud Computing',
  'Database',
  'UI/UX Design',
  'Digital Marketing',
  'Business',
  'Other'
] as const;

export type CourseCategory = typeof COURSE_CATEGORIES[number];