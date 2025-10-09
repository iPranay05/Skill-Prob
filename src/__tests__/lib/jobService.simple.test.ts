import { JobService } from '../../lib/jobService';
import {
  JobType,
  JobStatus,
  ApplicationStatus,
  WorkMode,
  ExperienceLevel,
  CreateJobPostingInput,
  CreateJobApplicationInput,
  JobPosting,
  JobApplication
} from '../../models/Job';
import { supabaseAdmin } from '../../lib/database';

// Mock the database
jest.mock('../../lib/database', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}));

describe('JobService - Core Functionality Tests', () => {
  let mockSupabaseQuery: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a fresh mock query object for each test
    mockSupabaseQuery = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
      head: jest.fn()
    };

    // Mock supabaseAdmin to return our mock query
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockSupabaseQuery);
  });

  // Test data
  const mockJobPosting: JobPosting = {
    id: 'job-1',
    title: 'Software Engineering Internship',
    description: 'Join our team as a software engineering intern',
    company_name: 'Tech Corp',
    employer_id: 'employer-1',
    type: JobType.INTERNSHIP,
    work_mode: WorkMode.HYBRID,
    experience_level: ExperienceLevel.ENTRY,
    requirements: {
      skills: ['JavaScript', 'React'],
      qualifications: ['Computer Science student'],
      experience: 'Entry level'
    },
    status: JobStatus.PUBLISHED,
    featured: false,
    remote_friendly: true,
    current_applications: 0,
    currency: 'INR',
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockJobApplication: JobApplication = {
    id: 'app-1',
    job_posting_id: 'job-1',
    applicant_id: 'student-1',
    cover_letter: 'I am interested in this position',
    status: ApplicationStatus.PENDING,
    status_updated_at: new Date(),
    application_data: {},
    applied_at: new Date()
  };

  describe('Job Posting CRUD Operations', () => {
    describe('createJobPosting', () => {
      it('should create a job posting successfully', async () => {
        const createJobData: CreateJobPostingInput = {
          title: 'Software Engineering Internship',
          description: 'Join our team as a software engineering intern',
          company_name: 'Tech Corp',
          type: JobType.INTERNSHIP,
          work_mode: WorkMode.HYBRID,
          experience_level: ExperienceLevel.ENTRY,
          requirements: {
            skills: ['JavaScript', 'React'],
            qualifications: ['Computer Science student'],
            experience: 'Entry level'
          },
          employer_id: 'employer-1'
        };

        const mockInsertResponse = {
          data: { ...mockJobPosting },
          error: null
        };

        mockSupabaseQuery.single.mockResolvedValue(mockInsertResponse);

        const result = await JobService.createJobPosting(createJobData);

        expect(result).toEqual(expect.objectContaining({
          title: createJobData.title,
          description: createJobData.description,
          company_name: createJobData.company_name,
          employer_id: createJobData.employer_id
        }));
        expect(supabaseAdmin.from).toHaveBeenCalledWith('job_postings');
      });

      it('should throw error when database insert fails', async () => {
        const createJobData: CreateJobPostingInput = {
          title: 'Software Engineering Internship',
          description: 'Join our team',
          company_name: 'Tech Corp',
          type: JobType.INTERNSHIP,
          work_mode: WorkMode.REMOTE,
          experience_level: ExperienceLevel.ENTRY,
          requirements: {
            skills: [],
            qualifications: [],
            experience: ''
          },
          employer_id: 'employer-1'
        };

        const mockInsertResponse = {
          data: null,
          error: { message: 'Database error' }
        };

        mockSupabaseQuery.single.mockResolvedValue(mockInsertResponse);

        await expect(JobService.createJobPosting(createJobData))
          .rejects.toThrow('Failed to create job posting: Database error');
      });
    });

    describe('getJobPostingById', () => {
      it('should retrieve job posting by ID', async () => {
        const mockResponse = {
          data: mockJobPosting,
          error: null
        };

        mockSupabaseQuery.single.mockResolvedValue(mockResponse);

        const result = await JobService.getJobPostingById('job-1');

        expect(result).toEqual(mockJobPosting);
        expect(supabaseAdmin.from).toHaveBeenCalledWith('job_postings');
      });

      it('should return null when job posting not found', async () => {
        const mockResponse = {
          data: null,
          error: { code: 'PGRST116' }
        };

        mockSupabaseQuery.single.mockResolvedValue(mockResponse);

        const result = await JobService.getJobPostingById('non-existent-job');

        expect(result).toBeNull();
      });
    });

    describe('updateJobPosting', () => {
      it('should update job posting successfully', async () => {
        const updates = { title: 'Updated Internship Title' };

        const mockUpdateResponse = {
          data: { ...mockJobPosting, ...updates },
          error: null
        };

        mockSupabaseQuery.single.mockResolvedValue(mockUpdateResponse);

        const result = await JobService.updateJobPosting('job-1', updates);

        expect(result.title).toBe(updates.title);
        expect(supabaseAdmin.from).toHaveBeenCalledWith('job_postings');
      });
    });

    describe('publishJobPosting', () => {
      it('should publish job posting successfully', async () => {
        const mockUpdateResponse = {
          data: { 
            ...mockJobPosting, 
            status: JobStatus.PUBLISHED, 
            published_at: new Date() 
          },
          error: null
        };

        mockSupabaseQuery.single.mockResolvedValue(mockUpdateResponse);

        const result = await JobService.publishJobPosting('job-1');

        expect(result.status).toBe(JobStatus.PUBLISHED);
        expect(result.published_at).toBeDefined();
      });
    });

    describe('searchJobPostings', () => {
      it('should search job postings with filters', async () => {
        const mockSearchResponse = {
          data: [mockJobPosting],
          error: null,
          count: 1
        };

        mockSupabaseQuery.range.mockResolvedValue(mockSearchResponse);

        const searchQuery = {
          search: 'software',
          filters: {
            type: JobType.INTERNSHIP,
            work_mode: WorkMode.REMOTE
          },
          page: 1,
          limit: 10
        };

        const result = await JobService.searchJobPostings(searchQuery);

        expect(result.jobs).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.page).toBe(1);
      });

      it('should handle empty search results', async () => {
        const mockSearchResponse = {
          data: [],
          error: null,
          count: 0
        };

        mockSupabaseQuery.range.mockResolvedValue(mockSearchResponse);

        const result = await JobService.searchJobPostings({ page: 1, limit: 10 });

        expect(result.jobs).toHaveLength(0);
        expect(result.total).toBe(0);
      });
    });
  });

  describe('Job Application Management', () => {
    describe('createJobApplication', () => {
      it('should create job application successfully', async () => {
        const applicationData: CreateJobApplicationInput = {
          job_posting_id: 'job-1',
          applicant_id: 'student-1',
          cover_letter: 'I am interested in this position',
          resume_url: 'https://example.com/resume.pdf'
        };

        const mockCreateResponse = {
          data: { ...mockJobApplication, ...applicationData },
          error: null
        };

        mockSupabaseQuery.single.mockResolvedValue(mockCreateResponse);

        const result = await JobService.createJobApplication(applicationData);

        expect(result).toEqual(expect.objectContaining({
          job_posting_id: applicationData.job_posting_id,
          applicant_id: applicationData.applicant_id,
          cover_letter: applicationData.cover_letter
        }));
      });

      it('should throw error when database insert fails', async () => {
        const applicationData: CreateJobApplicationInput = {
          job_posting_id: 'job-1',
          applicant_id: 'student-1',
          cover_letter: 'I am interested'
        };

        const mockCreateResponse = {
          data: null,
          error: { message: 'Database error' }
        };

        mockSupabaseQuery.single.mockResolvedValue(mockCreateResponse);

        await expect(JobService.createJobApplication(applicationData))
          .rejects.toThrow('Failed to create job application: Database error');
      });
    });

    describe('getJobApplicationById', () => {
      it('should retrieve application by ID', async () => {
        const mockResponse = {
          data: mockJobApplication,
          error: null
        };

        mockSupabaseQuery.single.mockResolvedValue(mockResponse);

        const result = await JobService.getJobApplicationById('app-1');

        expect(result).toEqual(mockJobApplication);
      });

      it('should return null when application not found', async () => {
        const mockResponse = {
          data: null,
          error: { code: 'PGRST116' }
        };

        mockSupabaseQuery.single.mockResolvedValue(mockResponse);

        const result = await JobService.getJobApplicationById('non-existent-app');

        expect(result).toBeNull();
      });
    });

    describe('updateJobApplication', () => {
      it('should update application status successfully', async () => {
        const updates = {
          status: ApplicationStatus.SHORTLISTED,
          notes: 'Good candidate'
        };

        const mockUpdateResponse = {
          data: {
            ...mockJobApplication,
            ...updates
          },
          error: null
        };

        mockSupabaseQuery.single.mockResolvedValue(mockUpdateResponse);

        const result = await JobService.updateJobApplication('app-1', updates);

        expect(result.status).toBe(ApplicationStatus.SHORTLISTED);
        expect(result.notes).toBe('Good candidate');
      });
    });

    describe('getApplicationsByJobPosting', () => {
      it('should retrieve applications for a job posting', async () => {
        const mockApplications = [mockJobApplication];

        const mockResponse = {
          data: mockApplications,
          error: null,
          count: 1
        };

        mockSupabaseQuery.range.mockResolvedValue(mockResponse);

        const result = await JobService.getApplicationsByJobPosting('job-1');

        expect(result.applications).toHaveLength(1);
        expect(result.total).toBe(1);
      });
    });

    describe('getApplicationsByApplicant', () => {
      it('should retrieve applications for a student', async () => {
        const mockApplications = [mockJobApplication];

        const mockResponse = {
          data: mockApplications,
          error: null
        };

        mockSupabaseQuery.order.mockResolvedValue(mockResponse);

        const result = await JobService.getApplicationsByApplicant('student-1');

        expect(result).toHaveLength(1);
        expect(result[0].applicant_id).toBe('student-1');
      });
    });

    describe('updateApplicationStatus', () => {
      it('should update application status with tracking', async () => {
        const mockUpdateResponse = {
          data: {
            ...mockJobApplication,
            status: ApplicationStatus.REVIEWED,
            status_updated_by: 'employer-1'
          },
          error: null
        };

        mockSupabaseQuery.single.mockResolvedValue(mockUpdateResponse);

        const result = await JobService.updateApplicationStatus(
          'app-1',
          ApplicationStatus.REVIEWED,
          'employer-1',
          'Application reviewed'
        );

        expect(result.status).toBe(ApplicationStatus.REVIEWED);
        expect(result.status_updated_by).toBe('employer-1');
      });
    });

    describe('bulkUpdateApplicationStatus', () => {
      it('should update multiple applications status', async () => {
        const applicationIds = ['app-1', 'app-2', 'app-3'];
        const status = ApplicationStatus.SHORTLISTED;
        const updatedBy = 'employer-1';
        const notes = 'Selected for next round';

        const mockUpdateResponse = { error: null };

        mockSupabaseQuery.in.mockResolvedValue(mockUpdateResponse);

        await JobService.bulkUpdateApplicationStatus(applicationIds, status, updatedBy, notes);

        expect(supabaseAdmin.from).toHaveBeenCalledWith('job_applications');
      });

      it('should throw error when bulk update fails', async () => {
        const applicationIds = ['app-1'];
        const status = ApplicationStatus.REJECTED;
        const updatedBy = 'employer-1';

        const mockUpdateResponse = { error: { message: 'Update failed' } };

        mockSupabaseQuery.in.mockResolvedValue(mockUpdateResponse);

        await expect(JobService.bulkUpdateApplicationStatus(applicationIds, status, updatedBy))
          .rejects.toThrow('Failed to bulk update applications: Update failed');
      });
    });
  });

  describe('Job Categories and Saved Jobs', () => {
    describe('getJobCategories', () => {
      it('should retrieve all job categories', async () => {
        const mockCategories = [
          { id: 'cat-1', name: 'Software Development', slug: 'software-development' },
          { id: 'cat-2', name: 'Data Science', slug: 'data-science' }
        ];

        const mockResponse = {
          data: mockCategories,
          error: null
        };

        mockSupabaseQuery.order.mockResolvedValue(mockResponse);

        const result = await JobService.getJobCategories();

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Software Development');
      });
    });

    describe('saveJob', () => {
      it('should save job for user', async () => {
        const mockResponse = { error: null };

        mockSupabaseQuery.insert.mockResolvedValue(mockResponse);

        await JobService.saveJob('user-1', 'job-1');

        expect(supabaseAdmin.from).toHaveBeenCalledWith('saved_jobs');
      });

      it('should handle duplicate save gracefully', async () => {
        const mockResponse = { error: { code: '23505' } }; // Duplicate key error

        mockSupabaseQuery.insert.mockResolvedValue(mockResponse);

        // Should not throw error for duplicate
        await expect(JobService.saveJob('user-1', 'job-1')).resolves.not.toThrow();
      });
    });

    describe('getSavedJobs', () => {
      it('should retrieve saved jobs for user', async () => {
        const mockSavedJobs = [
          { job_postings: mockJobPosting }
        ];

        const mockResponse = {
          data: mockSavedJobs,
          error: null
        };

        mockSupabaseQuery.order.mockResolvedValue(mockResponse);

        const result = await JobService.getSavedJobs('user-1');

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe(mockJobPosting.title);
      });
    });
  });

  describe('Analytics and Statistics', () => {
    describe('getJobPostingStats', () => {
      it('should retrieve job posting statistics', async () => {
        // Mock the three separate database calls
        (supabaseAdmin.from as jest.Mock)
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 10, error: null })
            })
          })
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ 
                data: [
                  { status: 'pending' },
                  { status: 'pending' },
                  { status: 'reviewed' }
                ], 
                error: null 
              })
            })
          })
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ 
                    data: [mockJobApplication], 
                    error: null 
                  })
                })
              })
            })
          });

        const result = await JobService.getJobPostingStats('job-1');

        expect(result.totalApplications).toBe(10);
        expect(result.applicationsByStatus.pending).toBe(2);
        expect(result.applicationsByStatus.reviewed).toBe(1);
        expect(result.recentApplications).toHaveLength(1);
      });
    });

    describe('getEmployerStats', () => {
      it('should retrieve employer statistics', async () => {
        // Mock the four separate database calls
        (supabaseAdmin.from as jest.Mock)
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 5, error: null })
            })
          })
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ count: 3, error: null })
              })
            })
          })
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ 
                data: [
                  { status: 'pending' },
                  { status: 'reviewed' },
                  { status: 'shortlisted' }
                ], 
                error: null 
              })
            })
          });

        const result = await JobService.getEmployerStats('employer-1');

        expect(result.totalJobPostings).toBe(5);
        expect(result.activeJobPostings).toBe(3);
        expect(result.totalApplications).toBe(3);
        expect(result.applicationsByStatus.pending).toBe(1);
      });
    });
  });
});