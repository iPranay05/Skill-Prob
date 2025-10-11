import { createClient } from '@supabase/supabase-js';
import { AppError } from './errors';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  company_name: string;
  company_logo?: string;
  company_website?: string;
  type: 'internship' | 'full-time' | 'part-time' | 'contract' | 'freelance';
  experience_level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead';
  work_mode: 'remote' | 'onsite' | 'hybrid';
  location?: string;
  salary_min?: number;
  salary_max?: number;
  currency: string;
  stipend?: number;
  requirements: {
    skills: string[];
    qualifications: string[];
    experience: string;
  };
  application_deadline?: string;
  max_applications?: number;
  current_applications: number;
  contact_email?: string;
  application_instructions?: string;
  external_application_url?: string;
  employer_id: string;
  status: 'draft' | 'published' | 'closed' | 'archived';
  featured: boolean;
  remote_friendly: boolean;
  slug?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  categories?: JobCategory[];
  is_saved?: boolean;
  application?: JobApplication;
}

export interface JobCategory {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parent_id?: string;
  created_at: string;
}

export interface JobApplication {
  id: string;
  job_posting_id: string;
  applicant_id: string;
  resume_url?: string;
  cover_letter?: string;
  portfolio_url?: string;
  application_data: Record<string, any>;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interview_scheduled' | 'rejected' | 'selected' | 'withdrawn';
  status_updated_at: string;
  status_updated_by?: string;
  notes?: string;
  feedback?: string;
  interview_scheduled_at?: string;
  interview_location?: string;
  interview_notes?: string;
  applied_at: string;
  reviewed_at?: string;
  job_posting?: JobPosting;
}

export interface ApplicationStatusHistory {
  id: string;
  application_id: string;
  previous_status?: string;
  new_status: string;
  changed_by?: string;
  notes?: string;
  created_at: string;
}

export interface SavedJob {
  id: string;
  user_id: string;
  job_posting_id: string;
  created_at: string;
  job_posting?: JobPosting;
}

export interface JobAlert {
  id: string;
  user_id: string;
  name: string;
  keywords?: string;
  location?: string;
  job_type?: string;
  experience_level?: string;
  work_mode?: string;
  salary_min?: number;
  category_ids?: string[];
  is_active: boolean;
  frequency: string;
  last_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  resume_url?: string;
  portfolio_url?: string;
  skills: string[];
  experience_level: string;
  preferred_job_types: string[];
  preferred_locations: string[];
  preferred_work_modes: string[];
  salary_expectations?: {
    min: number;
    max: number;
    currency: string;
  };
  availability_date?: string;
  bio?: string;
  education: Array<{
    institution: string;
    degree: string;
    field_of_study: string;
    start_date: string;
    end_date?: string;
    grade?: string;
  }>;
  work_experience: Array<{
    company: string;
    position: string;
    start_date: string;
    end_date?: string;
    description: string;
    skills_used: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    github_url?: string;
    start_date: string;
    end_date?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issue_date: string;
    expiry_date?: string;
    credential_id?: string;
    credential_url?: string;
  }>;
  created_at: string;
  updated_at: string;
}

export class StudentCareerService {
  // Job Browsing
  static async getJobPostings(filters?: {
    type?: string;
    experience_level?: string;
    work_mode?: string;
    location?: string;
    category_ids?: string[];
    keywords?: string;
    salary_min?: number;
    featured_only?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ jobs: JobPosting[]; total: number }> {
    try {
      let query = supabase
        .from('job_postings')
        .select(`
          *,
          categories:job_posting_categories(
            category:job_categories(*)
          )
        `, { count: 'exact' })
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('published_at', { ascending: false });

      if (filters) {
        if (filters.type) {
          query = query.eq('type', filters.type);
        }
        if (filters.experience_level) {
          query = query.eq('experience_level', filters.experience_level);
        }
        if (filters.work_mode) {
          query = query.eq('work_mode', filters.work_mode);
        }
        if (filters.location) {
          query = query.ilike('location', `%${filters.location}%`);
        }
        if (filters.keywords) {
          query = query.or(`title.ilike.%${filters.keywords}%,description.ilike.%${filters.keywords}%,company_name.ilike.%${filters.keywords}%`);
        }
        if (filters.salary_min) {
          query = query.gte('salary_min', filters.salary_min);
        }
        if (filters.featured_only) {
          query = query.eq('featured', true);
        }
        if (filters.limit) {
          query = query.limit(filters.limit);
        }
        if (filters.offset) {
          query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
        }
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const jobs = (data || []).map(job => ({
        ...job,
        categories: job.categories?.map((c: any) => c.category) || []
      }));

      return { jobs, total: count || 0 };
    } catch (error) {
      console.error('Error fetching job postings:', error);
      throw new AppError('Failed to fetch job postings', 500);
    }
  }

  static async getJobById(jobId: string, userId?: string): Promise<JobPosting | null> {
    try {
      let query = supabase
        .from('job_postings')
        .select(`
          *,
          categories:job_posting_categories(
            category:job_categories(*)
          ),
          employer:users!job_postings_employer_id_fkey(id, profile)
        `)
        .eq('id', jobId)
        .eq('status', 'published');

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      let jobData = {
        ...data,
        categories: data.categories?.map((c: any) => c.category) || []
      };

      // Check if job is saved by user
      if (userId) {
        const { data: savedJob } = await supabase
          .from('saved_jobs')
          .select('id')
          .eq('user_id', userId)
          .eq('job_posting_id', jobId)
          .single();

        jobData.is_saved = !!savedJob;

        // Check if user has applied
        const { data: application } = await supabase
          .from('job_applications')
          .select('*')
          .eq('applicant_id', userId)
          .eq('job_posting_id', jobId)
          .single();

        if (application) {
          jobData.application = application;
        }
      }

      return jobData;
    } catch (error) {
      console.error('Error fetching job posting:', error);
      throw new AppError('Failed to fetch job posting', 500);
    }
  }

  static async getJobCategories(): Promise<JobCategory[]> {
    try {
      const { data, error } = await supabase
        .from('job_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching job categories:', error);
      throw new AppError('Failed to fetch job categories', 500);
    }
  }

  // Job Applications
  static async applyToJob(
    jobId: string,
    applicantId: string,
    applicationData: {
      resume_url?: string;
      cover_letter?: string;
      portfolio_url?: string;
      application_data?: Record<string, any>;
    }
  ): Promise<JobApplication> {
    try {
      // Check if user has already applied
      const { data: existingApplication } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_posting_id', jobId)
        .eq('applicant_id', applicantId)
        .single();

      if (existingApplication) {
        throw new AppError('You have already applied to this job', 400);
      }

      // Check if job is still accepting applications
      const { data: job } = await supabase
        .from('job_postings')
        .select('max_applications, current_applications, application_deadline, status')
        .eq('id', jobId)
        .single();

      if (!job || job.status !== 'published') {
        throw new AppError('Job is no longer available', 400);
      }

      if (job.application_deadline && new Date(job.application_deadline) < new Date()) {
        throw new AppError('Application deadline has passed', 400);
      }

      if (job.max_applications && job.current_applications >= job.max_applications) {
        throw new AppError('Maximum applications reached for this job', 400);
      }

      const { data, error } = await supabase
        .from('job_applications')
        .insert({
          job_posting_id: jobId,
          applicant_id: applicantId,
          ...applicationData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error applying to job:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to apply to job', 500);
    }
  }

  static async getStudentApplications(studentId: string): Promise<JobApplication[]> {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_posting:job_postings(*)
        `)
        .eq('applicant_id', studentId)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching student applications:', error);
      throw new AppError('Failed to fetch applications', 500);
    }
  }

  static async getApplicationById(applicationId: string, userId: string): Promise<JobApplication | null> {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_posting:job_postings(*),
          status_history:application_status_history(*)
        `)
        .eq('id', applicationId)
        .eq('applicant_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching application:', error);
      throw new AppError('Failed to fetch application', 500);
    }
  }

  static async withdrawApplication(applicationId: string, studentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({
          status: 'withdrawn',
          status_updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .eq('applicant_id', studentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error withdrawing application:', error);
      throw new AppError('Failed to withdraw application', 500);
    }
  }

  // Saved Jobs
  static async getSavedJobs(userId: string): Promise<SavedJob[]> {
    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select(`
          *,
          job_posting:job_postings(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
      throw new AppError('Failed to fetch saved jobs', 500);
    }
  }

  static async saveJob(userId: string, jobId: string): Promise<SavedJob> {
    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .insert({
          user_id: userId,
          job_posting_id: jobId
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new AppError('Job already saved', 400);
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error saving job:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to save job', 500);
    }
  }

  static async unsaveJob(userId: string, jobId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', userId)
        .eq('job_posting_id', jobId);

      if (error) throw error;
    } catch (error) {
      console.error('Error unsaving job:', error);
      throw new AppError('Failed to unsave job', 500);
    }
  }

  // Job Alerts
  static async getJobAlerts(userId: string): Promise<JobAlert[]> {
    try {
      const { data, error } = await supabase
        .from('job_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching job alerts:', error);
      throw new AppError('Failed to fetch job alerts', 500);
    }
  }

  static async createJobAlert(userId: string, alertData: Omit<JobAlert, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<JobAlert> {
    try {
      const { data, error } = await supabase
        .from('job_alerts')
        .insert({
          user_id: userId,
          ...alertData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating job alert:', error);
      throw new AppError('Failed to create job alert', 500);
    }
  }

  static async updateJobAlert(alertId: string, userId: string, updates: Partial<JobAlert>): Promise<JobAlert> {
    try {
      const { data, error } = await supabase
        .from('job_alerts')
        .update(updates)
        .eq('id', alertId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating job alert:', error);
      throw new AppError('Failed to update job alert', 500);
    }
  }

  static async deleteJobAlert(alertId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('job_alerts')
        .delete()
        .eq('id', alertId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting job alert:', error);
      throw new AppError('Failed to delete job alert', 500);
    }
  }

  // Student Profile Management
  static async getStudentProfile(userId: string): Promise<StudentProfile | null> {
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching student profile:', error);
      throw new AppError('Failed to fetch student profile', 500);
    }
  }

  static async createOrUpdateStudentProfile(userId: string, profileData: Partial<StudentProfile>): Promise<StudentProfile> {
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .upsert({
          user_id: userId,
          ...profileData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating student profile:', error);
      throw new AppError('Failed to update student profile', 500);
    }
  }

  // Analytics and Recommendations
  static async getJobRecommendations(userId: string, limit: number = 10): Promise<JobPosting[]> {
    try {
      // Get user profile and preferences
      const profile = await this.getStudentProfile(userId);
      
      let query = supabase
        .from('job_postings')
        .select(`
          *,
          categories:job_posting_categories(
            category:job_categories(*)
          )
        `)
        .eq('status', 'published')
        .limit(limit);

      // Apply basic filtering based on profile
      if (profile) {
        if (profile.preferred_job_types && profile.preferred_job_types.length > 0) {
          query = query.in('type', profile.preferred_job_types);
        }
        if (profile.experience_level) {
          query = query.eq('experience_level', profile.experience_level);
        }
        if (profile.preferred_work_modes && profile.preferred_work_modes.length > 0) {
          query = query.in('work_mode', profile.preferred_work_modes);
        }
      }

      const { data, error } = await query.order('published_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(job => ({
        ...job,
        categories: job.categories?.map((c: any) => c.category) || []
      }));
    } catch (error) {
      console.error('Error fetching job recommendations:', error);
      throw new AppError('Failed to fetch job recommendations', 500);
    }
  }

  static async getApplicationStats(userId: string): Promise<{
    total_applications: number;
    pending: number;
    reviewed: number;
    shortlisted: number;
    interview_scheduled: number;
    rejected: number;
    selected: number;
    withdrawn: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('status')
        .eq('applicant_id', userId);

      if (error) throw error;

      const stats = {
        total_applications: data?.length || 0,
        pending: 0,
        reviewed: 0,
        shortlisted: 0,
        interview_scheduled: 0,
        rejected: 0,
        selected: 0,
        withdrawn: 0
      };

      data?.forEach(app => {
        stats[app.status as keyof typeof stats]++;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching application stats:', error);
      throw new AppError('Failed to fetch application stats', 500);
    }
  }
}