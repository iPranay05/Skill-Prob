import { supabaseAdmin } from '@/lib/database';
import { 
  JobPosting, 
  JobApplication, 
  JobCategory,
  JobSearchQuery,
  ApplicationSearchQuery,
  CreateJobPostingInput,
  UpdateJobPostingInput,
  CreateJobApplicationInput,
  UpdateJobApplicationInput,
  ApplicationStatus,
  JobStatus
} from '@/models/Job';

export class JobService {
  // Job Posting CRUD Operations
  
  static async createJobPosting(jobData: CreateJobPostingInput): Promise<JobPosting> {
    const { data, error } = await supabaseAdmin
      .from('job_postings')
      .insert([jobData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create job posting: ${error.message}`);
    }

    return this.formatJobPosting(data);
  }

  static async getJobPostingById(id: string): Promise<JobPosting | null> {
    const { data, error } = await supabaseAdmin
      .from('job_postings')
      .select(`
        *,
        job_posting_categories (
          category_id,
          job_categories (
            id,
            name,
            slug
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get job posting: ${error.message}`);
    }

    return this.formatJobPosting(data);
  }

  static async getJobPostingBySlug(slug: string): Promise<JobPosting | null> {
    const { data, error } = await supabaseAdmin
      .from('job_postings')
      .select(`
        *,
        job_posting_categories (
          category_id,
          job_categories (
            id,
            name,
            slug
          )
        )
      `)
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get job posting: ${error.message}`);
    }

    return this.formatJobPosting(data);
  }

  static async updateJobPosting(id: string, updates: UpdateJobPostingInput): Promise<JobPosting> {
    const { data, error } = await supabaseAdmin
      .from('job_postings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update job posting: ${error.message}`);
    }

    return this.formatJobPosting(data);
  }

  static async deleteJobPosting(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('job_postings')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete job posting: ${error.message}`);
    }
  }

  static async publishJobPosting(id: string): Promise<JobPosting> {
    const { data, error } = await supabaseAdmin
      .from('job_postings')
      .update({
        status: JobStatus.PUBLISHED,
        published_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to publish job posting: ${error.message}`);
    }

    return this.formatJobPosting(data);
  }

  static async searchJobPostings(query: JobSearchQuery): Promise<{
    jobs: JobPosting[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      filters = {},
      sortBy = 'published_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = query;

    let supabaseQuery = supabaseAdmin
      .from('job_postings')
      .select(`
        *,
        job_posting_categories (
          category_id,
          job_categories (
            id,
            name,
            slug
          )
        )
      `, { count: 'exact' })
      .eq('status', 'published');

    // Apply search
    if (search) {
      supabaseQuery = supabaseQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    // Apply filters
    if (filters.type) {
      supabaseQuery = supabaseQuery.eq('type', filters.type);
    }
    if (filters.experience_level) {
      supabaseQuery = supabaseQuery.eq('experience_level', filters.experience_level);
    }
    if (filters.work_mode) {
      supabaseQuery = supabaseQuery.eq('work_mode', filters.work_mode);
    }
    if (filters.location) {
      supabaseQuery = supabaseQuery.ilike('location', `%${filters.location}%`);
    }
    if (filters.salary_min) {
      supabaseQuery = supabaseQuery.gte('salary_min', filters.salary_min);
    }
    if (filters.salary_max) {
      supabaseQuery = supabaseQuery.lte('salary_max', filters.salary_max);
    }
    if (filters.company_name) {
      supabaseQuery = supabaseQuery.ilike('company_name', `%${filters.company_name}%`);
    }
    if (filters.featured !== undefined) {
      supabaseQuery = supabaseQuery.eq('featured', filters.featured);
    }
    if (filters.remote_friendly !== undefined) {
      supabaseQuery = supabaseQuery.eq('remote_friendly', filters.remote_friendly);
    }

    // Apply sorting
    supabaseQuery = supabaseQuery.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await supabaseQuery;

    if (error) {
      throw new Error(`Failed to search job postings: ${error.message}`);
    }

    return {
      jobs: (data || []).map(job => this.formatJobPosting(job)),
      total: count || 0,
      page,
      limit
    };
  }

  static async getJobPostingsByEmployer(employerId: string, status?: JobStatus): Promise<JobPosting[]> {
    let query = supabaseAdmin
      .from('job_postings')
      .select(`
        *,
        job_posting_categories (
          category_id,
          job_categories (
            id,
            name,
            slug
          )
        )
      `)
      .eq('employer_id', employerId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get employer job postings: ${error.message}`);
    }

    return (data || []).map(job => this.formatJobPosting(job));
  }

  // Job Application CRUD Operations

  static async createJobApplication(applicationData: CreateJobApplicationInput): Promise<JobApplication> {
    const { data, error } = await supabaseAdmin
      .from('job_applications')
      .insert([applicationData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create job application: ${error.message}`);
    }

    return this.formatJobApplication(data);
  }

  static async getJobApplicationById(id: string): Promise<JobApplication | null> {
    const { data, error } = await supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        job_postings (
          id,
          title,
          company_name,
          employer_id
        ),
        users!job_applications_applicant_id_fkey (
          id,
          email,
          profile
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get job application: ${error.message}`);
    }

    return this.formatJobApplication(data);
  }

  static async updateJobApplication(id: string, updates: UpdateJobApplicationInput): Promise<JobApplication> {
    const { data, error } = await supabaseAdmin
      .from('job_applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update job application: ${error.message}`);
    }

    return this.formatJobApplication(data);
  }

  static async getApplicationsByJobPosting(jobPostingId: string, query?: ApplicationSearchQuery): Promise<{
    applications: JobApplication[];
    total: number;
  }> {
    const {
      filters = {},
      sortBy = 'applied_at',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = query || {};

    let supabaseQuery = supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        users!job_applications_applicant_id_fkey (
          id,
          email,
          profile
        )
      `, { count: 'exact' })
      .eq('job_posting_id', jobPostingId);

    // Apply filters
    if (filters.status) {
      supabaseQuery = supabaseQuery.eq('status', filters.status);
    }
    if (filters.applied_after) {
      supabaseQuery = supabaseQuery.gte('applied_at', filters.applied_after.toISOString());
    }
    if (filters.applied_before) {
      supabaseQuery = supabaseQuery.lte('applied_at', filters.applied_before.toISOString());
    }

    // Apply sorting
    supabaseQuery = supabaseQuery.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await supabaseQuery;

    if (error) {
      throw new Error(`Failed to get job applications: ${error.message}`);
    }

    return {
      applications: (data || []).map(app => this.formatJobApplication(app)),
      total: count || 0
    };
  }

  static async getApplicationsByApplicant(applicantId: string): Promise<JobApplication[]> {
    const { data, error } = await supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        job_postings (
          id,
          title,
          company_name,
          type,
          location,
          status
        )
      `)
      .eq('applicant_id', applicantId)
      .order('applied_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get applicant applications: ${error.message}`);
    }

    return (data || []).map(app => this.formatJobApplication(app));
  }

  static async updateApplicationStatus(
    applicationId: string, 
    status: ApplicationStatus, 
    updatedBy: string,
    notes?: string
  ): Promise<JobApplication> {
    const updates: any = {
      status,
      status_updated_by: updatedBy,
      notes
    };

    if (status === ApplicationStatus.REVIEWED) {
      updates.reviewed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('job_applications')
      .update(updates)
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update application status: ${error.message}`);
    }

    return this.formatJobApplication(data);
  }

  static async bulkUpdateApplicationStatus(
    applicationIds: string[],
    status: ApplicationStatus,
    updatedBy: string,
    notes?: string
  ): Promise<void> {
    const updates = {
      status,
      status_updated_by: updatedBy,
      status_updated_at: new Date(),
      notes
    };

    const { error } = await supabaseAdmin
      .from('job_applications')
      .update(updates)
      .in('id', applicationIds);

    if (error) {
      throw new Error(`Failed to bulk update applications: ${error.message}`);
    }
  }

  // Job Categories

  static async getJobCategories(): Promise<JobCategory[]> {
    const { data, error } = await supabaseAdmin
      .from('job_categories')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Failed to get job categories: ${error.message}`);
    }

    return data || [];
  }

  static async createJobCategory(categoryData: Omit<JobCategory, 'id' | 'created_at'>): Promise<JobCategory> {
    const { data, error } = await supabaseAdmin
      .from('job_categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create job category: ${error.message}`);
    }

    return data;
  }

  // Saved Jobs

  static async saveJob(userId: string, jobPostingId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('saved_jobs')
      .insert([{ user_id: userId, job_posting_id: jobPostingId }]);

    if (error && error.code !== '23505') { // Ignore duplicate key error
      throw new Error(`Failed to save job: ${error.message}`);
    }
  }

  static async unsaveJob(userId: string, jobPostingId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('saved_jobs')
      .delete()
      .eq('user_id', userId)
      .eq('job_posting_id', jobPostingId);

    if (error) {
      throw new Error(`Failed to unsave job: ${error.message}`);
    }
  }

  static async getSavedJobs(userId: string): Promise<JobPosting[]> {
    const { data, error } = await supabaseAdmin
      .from('saved_jobs')
      .select(`
        job_postings (
          *,
          job_posting_categories (
            category_id,
            job_categories (
              id,
              name,
              slug
            )
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get saved jobs: ${error.message}`);
    }

    return (data || [])
      .map(item => item.job_postings)
      .filter(job => job)
      .map(job => this.formatJobPosting(job));
  }

  // Analytics and Statistics

  static async getJobPostingStats(jobPostingId: string): Promise<{
    totalApplications: number;
    applicationsByStatus: Record<ApplicationStatus, number>;
    recentApplications: JobApplication[];
  }> {
    // Get total applications count
    const { count: totalApplications, error: countError } = await supabaseAdmin
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_posting_id', jobPostingId);

    if (countError) {
      throw new Error(`Failed to get application count: ${countError.message}`);
    }

    // Get applications by status
    const { data: statusData, error: statusError } = await supabaseAdmin
      .from('job_applications')
      .select('status')
      .eq('job_posting_id', jobPostingId);

    if (statusError) {
      throw new Error(`Failed to get status breakdown: ${statusError.message}`);
    }

    const applicationsByStatus = (statusData || []).reduce((acc, app) => {
      acc[app.status as ApplicationStatus] = (acc[app.status as ApplicationStatus] || 0) + 1;
      return acc;
    }, {} as Record<ApplicationStatus, number>);

    // Get recent applications
    const { data: recentData, error: recentError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        *,
        users!job_applications_applicant_id_fkey (
          id,
          email,
          profile
        )
      `)
      .eq('job_posting_id', jobPostingId)
      .order('applied_at', { ascending: false })
      .limit(10);

    if (recentError) {
      throw new Error(`Failed to get recent applications: ${recentError.message}`);
    }

    return {
      totalApplications: totalApplications || 0,
      applicationsByStatus,
      recentApplications: (recentData || []).map(app => this.formatJobApplication(app))
    };
  }

  static async getEmployerStats(employerId: string): Promise<{
    totalJobPostings: number;
    activeJobPostings: number;
    totalApplications: number;
    applicationsByStatus: Record<ApplicationStatus, number>;
  }> {
    // Get job postings count
    const { count: totalJobPostings, error: jobCountError } = await supabaseAdmin
      .from('job_postings')
      .select('*', { count: 'exact', head: true })
      .eq('employer_id', employerId);

    if (jobCountError) {
      throw new Error(`Failed to get job postings count: ${jobCountError.message}`);
    }

    // Get active job postings count
    const { count: activeJobPostings, error: activeCountError } = await supabaseAdmin
      .from('job_postings')
      .select('*', { count: 'exact', head: true })
      .eq('employer_id', employerId)
      .eq('status', 'published');

    if (activeCountError) {
      throw new Error(`Failed to get active job postings count: ${activeCountError.message}`);
    }

    // Get applications for employer's jobs
    const { data: applicationsData, error: applicationsError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        status,
        job_postings!inner (
          employer_id
        )
      `)
      .eq('job_postings.employer_id', employerId);

    if (applicationsError) {
      throw new Error(`Failed to get applications data: ${applicationsError.message}`);
    }

    const totalApplications = applicationsData?.length || 0;
    const applicationsByStatus = (applicationsData || []).reduce((acc, app) => {
      acc[app.status as ApplicationStatus] = (acc[app.status as ApplicationStatus] || 0) + 1;
      return acc;
    }, {} as Record<ApplicationStatus, number>);

    return {
      totalJobPostings: totalJobPostings || 0,
      activeJobPostings: activeJobPostings || 0,
      totalApplications,
      applicationsByStatus
    };
  }

  // Helper methods

  private static formatJobPosting(data: any): JobPosting {
    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      published_at: data.published_at ? new Date(data.published_at) : undefined,
      application_deadline: data.application_deadline ? new Date(data.application_deadline) : undefined
    };
  }

  private static formatJobApplication(data: any): JobApplication {
    return {
      ...data,
      applied_at: new Date(data.applied_at),
      reviewed_at: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      status_updated_at: new Date(data.status_updated_at),
      interview_scheduled_at: data.interview_scheduled_at ? new Date(data.interview_scheduled_at) : undefined
    };
  }

  // Company-related methods
  static async getJobsByCompany(companyName: string): Promise<JobPosting[]> {
    const { data, error } = await supabaseAdmin
      .from('job_postings')
      .select(`
        *,
        job_posting_categories (
          category_id,
          job_categories (
            id,
            name,
            slug
          )
        )
      `)
      .eq('company_name', companyName)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get jobs by company: ${error.message}`);
    }

    return (data || []).map(job => this.formatJobPosting(job));
  }

  static async updateCompanyInfo(
    companyName: string,
    companyData: {
      company_logo?: string;
      company_website?: string;
      company_name?: string;
    },
    employerId: string
  ): Promise<JobPosting[]> {
    const { data, error } = await supabaseAdmin
      .from('job_postings')
      .update({
        company_logo: companyData.company_logo,
        company_website: companyData.company_website,
        company_name: companyData.company_name || companyName,
        updated_at: new Date().toISOString()
      })
      .eq('company_name', companyName)
      .eq('employer_id', employerId)
      .select();

    if (error) {
      throw new Error(`Failed to update company info: ${error.message}`);
    }

    return (data || []).map(job => this.formatJobPosting(job));
  }
}