import { z } from 'zod';

// Job type enums
export enum JobType {
  INTERNSHIP = 'internship',
  FULL_TIME = 'full-time',
  PART_TIME = 'part-time',
  CONTRACT = 'contract',
  FREELANCE = 'freelance'
}

export enum JobStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
  ARCHIVED = 'archived'
}

export enum ApplicationStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  SHORTLISTED = 'shortlisted',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  REJECTED = 'rejected',
  SELECTED = 'selected',
  WITHDRAWN = 'withdrawn'
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead'
}

export enum WorkMode {
  REMOTE = 'remote',
  ONSITE = 'onsite',
  HYBRID = 'hybrid'
}

// Zod schemas for validation
export const JobRequirementsSchema = z.object({
  skills: z.array(z.string()),
  qualifications: z.array(z.string()),
  experience: z.string()
});

export const JobPostingSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  description: z.string().min(10),
  short_description: z.string().max(500).optional(),
  company_name: z.string().min(1).max(255),
  company_logo: z.string().url().optional(),
  company_website: z.string().url().optional(),
  
  // Job details
  type: z.enum(['internship', 'full-time', 'part-time', 'contract', 'freelance']),
  experience_level: z.enum(['entry', 'junior', 'mid', 'senior', 'lead']),
  work_mode: z.enum(['remote', 'onsite', 'hybrid']),
  location: z.string().optional(),
  
  // Compensation
  salary_min: z.number().min(0).optional(),
  salary_max: z.number().min(0).optional(),
  currency: z.string().default('INR'),
  stipend: z.number().min(0).optional(),
  
  // Requirements
  requirements: JobRequirementsSchema,
  
  // Application settings
  application_deadline: z.date().optional(),
  max_applications: z.number().min(1).optional(),
  current_applications: z.number().default(0),
  
  // Contact details
  contact_email: z.string().email().optional(),
  application_instructions: z.string().optional(),
  external_application_url: z.string().url().optional(),
  
  // Employer
  employer_id: z.string().uuid(),
  
  // Status and metadata
  status: z.enum(['draft', 'published', 'closed', 'archived']).default('draft'),
  featured: z.boolean().default(false),
  remote_friendly: z.boolean().default(false),
  
  // SEO
  slug: z.string().optional(),
  
  // Timestamps
  published_at: z.date().optional(),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date())
});

export const JobApplicationSchema = z.object({
  id: z.string().uuid().optional(),
  job_posting_id: z.string().uuid(),
  applicant_id: z.string().uuid(),
  
  // Application data
  resume_url: z.string().url().optional(),
  cover_letter: z.string().optional(),
  portfolio_url: z.string().url().optional(),
  application_data: z.record(z.string(), z.any()).default({}),
  
  // Status tracking
  status: z.enum(['pending', 'reviewed', 'shortlisted', 'interview_scheduled', 'rejected', 'selected', 'withdrawn']).default('pending'),
  status_updated_at: z.date().default(() => new Date()),
  status_updated_by: z.string().uuid().optional(),
  
  // Communication
  notes: z.string().optional(),
  feedback: z.string().optional(),
  
  // Interview scheduling
  interview_scheduled_at: z.date().optional(),
  interview_location: z.string().optional(),
  interview_notes: z.string().optional(),
  
  // Timestamps
  applied_at: z.date().default(() => new Date()),
  reviewed_at: z.date().optional()
});

export const JobCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  slug: z.string().min(1).max(100),
  parent_id: z.string().uuid().optional(),
  created_at: z.date().default(() => new Date())
});

export const JobAlertSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  
  // Alert criteria
  keywords: z.string().max(500).optional(),
  location: z.string().max(255).optional(),
  job_type: z.enum(['internship', 'full-time', 'part-time', 'contract', 'freelance']).optional(),
  experience_level: z.enum(['entry', 'junior', 'mid', 'senior', 'lead']).optional(),
  work_mode: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  salary_min: z.number().min(0).optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  
  // Settings
  is_active: z.boolean().default(true),
  frequency: z.enum(['daily', 'weekly', 'immediate']).default('daily'),
  
  // Tracking
  last_sent_at: z.date().optional(),
  
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date())
});

// TypeScript interfaces
export interface JobRequirements {
  skills: string[];
  qualifications: string[];
  experience: string;
}

export interface JobPosting {
  id?: string;
  title: string;
  description: string;
  short_description?: string;
  company_name: string;
  company_logo?: string;
  company_website?: string;
  
  // Job details
  type: JobType;
  experience_level: ExperienceLevel;
  work_mode: WorkMode;
  location?: string;
  
  // Compensation
  salary_min?: number;
  salary_max?: number;
  currency: string;
  stipend?: number;
  
  // Requirements
  requirements: JobRequirements;
  
  // Application settings
  application_deadline?: Date;
  max_applications?: number;
  current_applications: number;
  
  // Contact details
  contact_email?: string;
  application_instructions?: string;
  external_application_url?: string;
  
  // Employer
  employer_id: string;
  
  // Status and metadata
  status: JobStatus;
  featured: boolean;
  remote_friendly: boolean;
  
  // SEO
  slug?: string;
  
  // Timestamps
  published_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface JobApplication {
  id?: string;
  job_posting_id: string;
  applicant_id: string;
  
  // Application data
  resume_url?: string;
  cover_letter?: string;
  portfolio_url?: string;
  application_data: Record<string, any>;
  
  // Status tracking
  status: ApplicationStatus;
  status_updated_at: Date;
  status_updated_by?: string;
  
  // Communication
  notes?: string;
  feedback?: string;
  
  // Interview scheduling
  interview_scheduled_at?: Date;
  interview_location?: string;
  interview_notes?: string;
  
  // Timestamps
  applied_at: Date;
  reviewed_at?: Date;
}

export interface JobCategory {
  id?: string;
  name: string;
  description?: string;
  slug: string;
  parent_id?: string;
  created_at: Date;
}

export interface JobAlert {
  id?: string;
  user_id: string;
  name: string;
  
  // Alert criteria
  keywords?: string;
  location?: string;
  job_type?: JobType;
  experience_level?: ExperienceLevel;
  work_mode?: WorkMode;
  salary_min?: number;
  category_ids?: string[];
  
  // Settings
  is_active: boolean;
  frequency: 'daily' | 'weekly' | 'immediate';
  
  // Tracking
  last_sent_at?: Date;
  
  created_at: Date;
  updated_at: Date;
}

// DTOs for creation and updates
export const CreateJobPostingSchema = JobPostingSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  current_applications: true,
  published_at: true,
  slug: true
});

export const UpdateJobPostingSchema = CreateJobPostingSchema.partial();

export const CreateJobApplicationSchema = JobApplicationSchema.omit({
  id: true,
  applied_at: true,
  reviewed_at: true,
  status_updated_at: true,
  status: true
});

export const UpdateJobApplicationSchema = JobApplicationSchema.pick({
  status: true,
  notes: true,
  feedback: true,
  interview_scheduled_at: true,
  interview_location: true,
  interview_notes: true,
  status_updated_by: true
}).partial();

export type CreateJobPostingInput = z.infer<typeof CreateJobPostingSchema>;
export type UpdateJobPostingInput = z.infer<typeof UpdateJobPostingSchema>;
export type CreateJobApplicationInput = z.infer<typeof CreateJobApplicationSchema>;
export type UpdateJobApplicationInput = z.infer<typeof UpdateJobApplicationSchema>;

// Search and filter types
export interface JobSearchFilters {
  type?: JobType;
  experience_level?: ExperienceLevel;
  work_mode?: WorkMode;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  company_name?: string;
  category_ids?: string[];
  featured?: boolean;
  remote_friendly?: boolean;
}

export interface JobSearchQuery {
  search?: string;
  filters?: JobSearchFilters;
  sortBy?: 'title' | 'company_name' | 'salary_min' | 'published_at' | 'application_deadline';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ApplicationSearchFilters {
  status?: ApplicationStatus;
  job_posting_id?: string;
  applicant_id?: string;
  applied_after?: Date;
  applied_before?: Date;
}

export interface ApplicationSearchQuery {
  filters?: ApplicationSearchFilters;
  sortBy?: 'applied_at' | 'status_updated_at' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Predefined job categories
export const JOB_CATEGORIES = [
  'Software Development',
  'Data Science',
  'Product Management',
  'Design',
  'Marketing',
  'Sales',
  'Operations',
  'Finance',
  'Human Resources',
  'Customer Support'
] as const;

export type JobCategoryName = typeof JOB_CATEGORIES[number];

// Application status flow
export const APPLICATION_STATUS_FLOW: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.PENDING]: [ApplicationStatus.REVIEWED, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN],
  [ApplicationStatus.REVIEWED]: [ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED],
  [ApplicationStatus.SHORTLISTED]: [ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.REJECTED],
  [ApplicationStatus.INTERVIEW_SCHEDULED]: [ApplicationStatus.SELECTED, ApplicationStatus.REJECTED],
  [ApplicationStatus.REJECTED]: [],
  [ApplicationStatus.SELECTED]: [],
  [ApplicationStatus.WITHDRAWN]: []
};