import { z } from 'zod';

// Job-related enums
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
  HIRED = 'hired'
}

export enum WorkMode {
  REMOTE = 'remote',
  ONSITE = 'onsite',
  HYBRID = 'hybrid'
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead'
}

// Zod schemas for validation
export const LocationSchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('India'),
  is_remote: z.boolean().default(false)
});

export const SalarySchema = z.object({
  min: z.number().min(0).optional(),
  max: z.number().min(0).optional(),
  currency: z.string().default('INR'),
  period: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'yearly']).default('monthly')
});

export const ContactPersonSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional()
});

export const CompanySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  website: z.string().url().optional(),
  logo_url: z.string().url().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  location: LocationSchema.optional(),
  founded_year: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  social_links: z.record(z.string().url()).default({}),
  is_verified: z.boolean().default(false),
  verified_at: z.date().optional(),
  verified_by: z.string().uuid().optional(),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date())
});

export const JobPostingSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  description: z.string().min(10),
  short_description: z.string().max(500).optional(),
  company_id: z.string().uuid(),
  posted_by: z.string().uuid(),
  job_type: z.nativeEnum(JobType).default(JobType.INTERNSHIP),
  work_mode: z.nativeEnum(WorkMode).default(WorkMode.REMOTE),
  experience_level: z.nativeEnum(ExperienceLevel).default(ExperienceLevel.ENTRY),
  location: LocationSchema.optional(),
  requirements: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  salary: SalarySchema.optional(),
  benefits: z.array(z.string()).default([]),
  application_deadline: z.date().optional(),
  max_applications: z.number().int().positive().optional(),
  current_applications: z.number().int().min(0).default(0),
  application_email: z.string().email().optional(),
  application_url: z.string().url().optional(),
  contact_person: ContactPersonSchema.optional(),
  status: z.nativeEnum(JobStatus).default(JobStatus.DRAFT),
  is_featured: z.boolean().default(false),
  slug: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  published_at: z.date().optional(),
  expires_at: z.date().optional(),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date())
});

export const JobApplicationSchema = z.object({
  id: z.string().uuid().optional(),
  job_posting_id: z.string().uuid(),
  applicant_id: z.string().uuid(),
  resume_url: z.string().url().optional(),
  cover_letter: z.string().optional(),
  portfolio_url: z.string().url().optional(),
  expected_salary: SalarySchema.optional(),
  availability_date: z.date().optional(),
  additional_info: z.string().optional(),
  status: z.nativeEnum(ApplicationStatus).default(ApplicationStatus.PENDING),
  status_updated_at: z.date().default(() => new Date()),
  status_updated_by: z.string().uuid().optional(),
  interview_scheduled_at: z.date().optional(),
  interview_notes: z.string().optional(),
  interview_feedback: z.string().optional(),
  last_communication_at: z.date().optional(),
  communication_count: z.number().int().min(0).default(0),
  applied_at: z.date().default(() => new Date()),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date())
});

export const JobCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  slug: z.string().min(1).max(100),
  parent_id: z.string().uuid().optional(),
  created_at: z.date().default(() => new Date())
});

export const SavedJobSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  job_posting_id: z.string().uuid(),
  created_at: z.date().default(() => new Date())
});

export const JobAlertSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  keywords: z.array(z.string()).default([]),
  job_types: z.array(z.nativeEnum(JobType)).default([]),
  work_modes: z.array(z.nativeEnum(WorkMode)).default([]),
  locations: z.array(LocationSchema).default([]),
  salary_range: SalarySchema.optional(),
  is_active: z.boolean().default(true),
  frequency: z.enum(['immediate', 'daily', 'weekly']).default('daily'),
  last_sent_at: z.date().optional(),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date())
});

// TypeScript interfaces
export interface Location {
  city?: string;
  state?: string;
  country: string;
  is_remote: boolean;
}

export interface Salary {
  min?: number;
  max?: number;
  currency: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface ContactPerson {
  name: string;
  email: string;
  phone?: string;
}

export interface Company {
  id?: string;
  name: string;
  description?: string;
  website?: string;
  logo_url?: string;
  industry?: string;
  size?: string;
  location?: Location;
  founded_year?: number;
  contact_email?: string;
  contact_phone?: string;
  social_links: Record<string, string>;
  is_verified: boolean;
  verified_at?: Date;
  verified_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface JobPosting {
  id?: string;
  title: string;
  description: string;
  short_description?: string;
  company_id: string;
  posted_by: string;
  job_type: JobType;
  work_mode: WorkMode;
  experience_level: ExperienceLevel;
  location?: Location;
  requirements: string[];
  qualifications: string[];
  skills: string[];
  salary?: Salary;
  benefits: string[];
  application_deadline?: Date;
  max_applications?: number;
  current_applications: number;
  application_email?: string;
  application_url?: string;
  contact_person?: ContactPerson;
  status: JobStatus;
  is_featured: boolean;
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  published_at?: Date;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface JobApplication {
  id?: string;
  job_posting_id: string;
  applicant_id: string;
  resume_url?: string;
  cover_letter?: string;
  portfolio_url?: string;
  expected_salary?: Salary;
  availability_date?: Date;
  additional_info?: string;
  status: ApplicationStatus;
  status_updated_at: Date;
  status_updated_by?: string;
  interview_scheduled_at?: Date;
  interview_notes?: string;
  interview_feedback?: string;
  last_communication_at?: Date;
  communication_count: number;
  applied_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface JobCategory {
  id?: string;
  name: string;
  description?: string;
  slug: string;
  parent_id?: string;
  created_at: Date;
}

export interface SavedJob {
  id?: string;
  user_id: string;
  job_posting_id: string;
  created_at: Date;
}

export interface JobAlert {
  id?: string;
  user_id: string;
  name: string;
  keywords: string[];
  job_types: JobType[];
  work_modes: WorkMode[];
  locations: Location[];
  salary_range?: Salary;
  is_active: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  last_sent_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// DTOs for API operations
export const CreateCompanySchema = CompanySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  is_verified: true,
  verified_at: true,
  verified_by: true
});

export const UpdateCompanySchema = CreateCompanySchema.partial();

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
  created_at: true,
  updated_at: true,
  status: true,
  status_updated_at: true,
  status_updated_by: true,
  interview_scheduled_at: true,
  interview_notes: true,
  interview_feedback: true,
  last_communication_at: true,
  communication_count: true,
  applied_at: true
});

export const UpdateJobApplicationSchema = z.object({
  status: z.nativeEnum(ApplicationStatus).optional(),
  interview_scheduled_at: z.date().optional(),
  interview_notes: z.string().optional(),
  interview_feedback: z.string().optional(),
  status_updated_by: z.string().uuid().optional()
});

export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;
export type CreateJobPostingInput = z.infer<typeof CreateJobPostingSchema>;
export type UpdateJobPostingInput = z.infer<typeof UpdateJobPostingSchema>;
export type CreateJobApplicationInput = z.infer<typeof CreateJobApplicationSchema>;
export type UpdateJobApplicationInput = z.infer<typeof UpdateJobApplicationSchema>;

// Search and filter interfaces
export interface JobSearchFilters {
  job_types?: JobType[];
  work_modes?: WorkMode[];
  experience_levels?: ExperienceLevel[];
  locations?: string[];
  salary_min?: number;
  salary_max?: number;
  company_id?: string;
  skills?: string[];
  categories?: string[];
  is_featured?: boolean;
  posted_within_days?: number;
}

export interface JobSearchQuery {
  search?: string;
  filters?: JobSearchFilters;
  sortBy?: 'title' | 'company' | 'salary' | 'posted_at' | 'application_deadline';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ApplicationSearchFilters {
  status?: ApplicationStatus[];
  job_posting_id?: string;
  applicant_id?: string;
  applied_within_days?: number;
}

export interface ApplicationSearchQuery {
  search?: string;
  filters?: ApplicationSearchFilters;
  sortBy?: 'applied_at' | 'status' | 'status_updated_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Job posting with related data
export interface JobPostingWithCompany extends JobPosting {
  company: Company;
  categories?: JobCategory[];
  application_count?: number;
  is_saved?: boolean;
  user_application?: JobApplication;
}

// Application with related data
export interface JobApplicationWithDetails extends JobApplication {
  job_posting: JobPostingWithCompany;
  applicant: {
    id: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
}

// Constants
export const JOB_CATEGORIES = [
  'Software Development',
  'Data Science',
  'Design',
  'Marketing',
  'Sales',
  'Operations',
  'Finance',
  'Human Resources',
  'Customer Support',
  'Content'
] as const;

export const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+'
] as const;

export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'E-commerce',
  'Manufacturing',
  'Consulting',
  'Media',
  'Real Estate',
  'Other'
] as const;

export type JobCategoryType = typeof JOB_CATEGORIES[number];
export type CompanySize = typeof COMPANY_SIZES[number];
export type Industry = typeof INDUSTRIES[number];