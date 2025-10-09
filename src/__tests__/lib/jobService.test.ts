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
import { AppError } from '@/lib/errors';
import { AppError } from '@/lib/errors';
import { AppError } from '@/lib/errors';
import { JobApplicationWithDetails } from '@/models/JobPosting';
import { JobPostingWithCompany } from '@/models/JobPosting';
import { AppError } from '@/lib/errors';
import { AppError } from '@/lib/errors';
import { Company } from '@/models/JobPosting';

// Mock the database
jest.mock('../../lib/database', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}));

describe('JobService - Internship Module Unit Tests', () => {
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
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      textSearch: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
      head: jest.fn()
    };

    // Mock supabaseAdmin to return our mock query
    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockSupabaseQuery);
  });

  // Test data
  const mockCompany: Company = {
    id: 'company-1',
    name: 'Tech Corp',
    description: 'A leading tech company',
    website: 'https://techcorp.com',
    industry: 'Technology',
    size: '51-200',
    is_verified: true,
    social_links: {},
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockJobPosting: JobPosting = {
    id: 'job-1',
    title: 'Software Engineering Internship',
    description: 'Join our team as a software engineering intern',
    company_id: 'company-1',
    posted_by: 'employer-1',
    job_type: JobType.INTERNSHIP,
    work_mode: WorkMode.HYBRID,
    experience_level: ExperienceLevel.ENTRY,
    requirements: ['JavaScript', 'React'],
    qualifications: ['Computer Science student'],
    skills: ['JavaScript', 'React', 'Node.js'],
    benefits: ['Mentorship', 'Certificate'],
    status: JobStatus.PUBLISHED,
    is_featured: false,
    current_applications: 0,
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
    communication_count: 0,
    applied_at: new Date(),
    created_at: new Date(),
    updated_at: new Date()
  };

  describe('Job Posting CRUD Operations and Authorization', () => {
    describe('createJobPosting', () => {
      it('should create a job posting successfully', async () => {
        const createJobData: CreateJobPostingInput = {
          title: 'Software Engineering Internship',
          description: 'Join our team as a software engineering intern',
          company_id: 'company-1',
          job_type: JobType.INTERNSHIP,
          work_mode: WorkMode.HYBRID,
          experience_level: ExperienceLevel.ENTRY,
          requirements: ['JavaScript', 'React'],
          qualifications: ['Computer Science student'],
          skills: ['JavaScript', 'React', 'Node.js'],
          benefits: ['Mentorship', 'Certificate']
        };

        const mockInsertResponse = {
          data: { ...mockJobPosting, slug: 'software-engineering-internship-123456789' },
          error: null
        };

        (supabaseAdmin.from as jest.Mock).mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(mockInsertResponse)
            })
          })
        });

        const result = await JobService.createJobPosting(createJobData, 'employer-1');

        expect(result).toEqual(expect.objectContaining({
          title: createJobData.title,
          description: createJobData.description,
          company_id: createJobData.company_id,
          posted_by: 'employer-1'
        }));
        expect(supabaseAdmin.from).toHaveBeenCalledWith('job_postings');
      });

      it('should throw error when database insert fails', async () => {
        const createJobData: CreateJobPostingInput = {
          title: 'Software Engineering Internship',
          description: 'Join our team',
          company_id: 'company-1',
          job_type: JobType.INTERNSHIP,
          work_mode: WorkMode.REMOTE,
          experience_level: ExperienceLevel.ENTRY,
          requirements: [],
          qualifications: [],
          skills: [],
          benefits: []
        };

        const mockInsertResponse = {
          data: null,
          error: { message: 'Database error' }
        };

        (supabaseAdmin.from as jest.Mock).mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(mockInsertResponse)
            })
          })
        });

        await expect(JobService.createJobPosting(createJobData, 'employer-1'))
          .rejects.toThrow(AppError);
      });
    });

    describe('updateJobPosting', () => {
      it('should update job posting when user is authorized', async () => {
        const updates = { title: 'Updated Internship Title' };

        // Mock the authorization check
        const mockAuthResponse = {
          data: { posted_by: 'employer-1' },
          error: null
        };

        // Mock the update response
        const mockUpdateResponse = {
          data: { ...mockJobPosting, ...updates },
          error: null
        };

        (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(mockAuthResponse)
            })
          })
        }).mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(mockUpdateResponse)
              })
            })
          })
        });

        const result = await JobService.updateJobPosting('job-1', updates, 'employer-1');

        expect(result.title).toBe(updates.title);
        expect(supabaseAdmin.from).toHaveBeenCalledWith('job_postings');
      });

      it('should throw unauthorized error when user does not own job posting', async () => {
        const updates = { title: 'Updated Title' };

        const mockAuthResponse = {
          data: { posted_by: 'different-employer' },
          error: null
        };

        (supabaseAdmin.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(mockAuthResponse)
            })
          })
        });

        await expect(JobService.updateJobPosting('job-1', updates, 'employer-1'))
          .rejects.toThrow('Unauthorized to update this job posting');
      });

      it('should throw error when job posting not found', async () => {
        const updates = { title: 'Updated Title' };

        const mockAuthResponse = {
          data: null,
          error: null
        };

        (supabaseAdmin.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(mockAuthResponse)
            })
          })
        });

        await expect(JobService.updateJobPosting('job-1', updates, 'employer-1'))
          .rejects.toThrow(AppError);
      });
    });

    describe('publishJobPosting', () => {
      it('should publish job posting successfully', async () => {
        const mockAuthResponse = {
          data: { posted_by: 'employer-1' },
          error: null
        };

        const mockUpdateResponse = {
          data: { ...mockJobPosting, status: JobStatus.PUBLISHED, published_at: new Date() },
          error: null
        };

        (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(mockAuthResponse)
            })
          })
        }).mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(mockUpdateResponse)
              })
            })
          })
        });

        const result = await JobService.publishJobPosting('job-1', 'employer-1');

        expect(result.status).toBe(JobStatus.PUBLISHED);
        expect(result.published_at).toBeDefined();
      });
    });

    describe('getJobPosting', () => {
      it('should retrieve job posting with company details', async () => {
        const mockJobWithCompany: JobPostingWithCompany = {
          ...mockJobPosting,
          company: mockCompany,
          categories: [],
          is_saved: false,
          user_application: undefined
        };

        const mockResponse = {
          data: {
            ...mockJobPosting,
            company: mockCompany,
            categories: []
          },
          error: null
        };

        // Mock the main job query
        mockSupabaseQuery.single.mockResolvedValueOnce(mockResponse);

        // Mock saved job check
        mockSupabaseQuery.single.mockResolvedValueOnce({ data: null, error: null });

        // Mock application check
        mockSupabaseQuery.single.mockResolvedValueOnce({ data: null, error: null });

        const result = await JobService.getJobPosting('job-1', 'student-1');

        expect(result).toEqual(expect.objectContaining({
          id: 'job-1',
          company: mockCompany,
          is_saved: false,
          user_application: null
        }));
      });

      it('should return null when job posting not found', async () => {
        const mockResponse = {
          data: null,
          error: { code: 'PGRST116' }
        };

        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(mockResponse)
            })
          })
        });

        const result = await JobService.getJobPosting('non-existent-job');

        expect(result).toBeNull();
      });
    });

    describe('searchJobPostings', () => {
      it('should search job postings with filters', async () => {
        const mockSearchResponse = {
          data: [{ ...mockJobPosting, company: mockCompany, categories: [] }],
          error: null,
          count: 1
        };

        // Mock the search query chain
        mockSupabaseQuery.range.mockResolvedValue(mockSearchResponse);

        const searchQuery = {
          search: 'software',
          filters: {
            job_types: [JobType.INTERNSHIP],
            work_modes: [WorkMode.REMOTE]
          },
          page: 1,
          limit: 10
        };

        const result = await JobService.searchJobPostings(searchQuery);

        expect(result.jobs).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.page).toBe(1);
        expect(result.totalPages).toBe(1);
      });

      it('should handle empty search results', async () => {
        const mockSearchResponse = {
          data: [],
          error: null,
          count: 0
        };

        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              or: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  range: jest.fn().mockResolvedValue(mockSearchResponse)
                })
              })
            })
          })
        });

        const result = await JobService.searchJobPostings({ page: 1, limit: 10 });

        expect(result.jobs).toHaveLength(0);
        expect(result.total).toBe(0);
      });
    });

    describe('getEmployerJobPostings', () => {
      it('should retrieve job postings for employer', async () => {
        const mockResponse = {
          data: [{ ...mockJobPosting, company: mockCompany, categories: [] }],
          error: null
        };

        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue(mockResponse)
            })
          })
        });

        const result = await JobService.getEmployerJobPostings('employer-1');

        expect(result).toHaveLength(1);
        expect(result[0].posted_by).toBe('employer-1');
      });

      it('should filter by status when provided', async () => {
        const mockResponse = {
          data: [{ ...mockJobPosting, company: mockCompany, categories: [] }],
          error: null
        };

        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue(mockResponse)
              })
            })
          })
        });

        const result = await JobService.getEmployerJobPostings('employer-1', JobStatus.PUBLISHED);

        expect(result).toHaveLength(1);
      });
    });
  });

  describe('Application Submission and Status Tracking', () => {
    describe('createJobApplication', () => {
      it('should create job application successfully', async () => {
        const applicationData: CreateJobApplicationInput = {
          job_posting_id: 'job-1',
          applicant_id: 'student-1',
          cover_letter: 'I am interested in this position',
          resume_url: 'https://example.com/resume.pdf'
        };

        // Mock existing application check
        const mockExistingCheck = {
          data: null,
          error: null
        };

        // Mock job posting validation
        const mockJobCheck = {
          data: {
            status: 'published',
            max_applications: 100,
            current_applications: 5,
            application_deadline: null
          },
          error: null
        };

        // Mock application creation
        const mockCreateResponse = {
          data: { ...mockJobApplication, ...applicationData },
          error: null
        };

        // Mock the existing application check
        mockSupabaseQuery.single.mockResolvedValueOnce(mockExistingCheck);

        // Mock the job posting validation
        mockSupabaseQuery.single.mockResolvedValueOnce(mockJobCheck);

        // Mock the application creation
        mockSupabaseQuery.single.mockResolvedValueOnce(mockCreateResponse);

        const result = await JobService.createJobApplication(applicationData);

        expect(result).toEqual(expect.objectContaining({
          job_posting_id: applicationData.job_posting_id,
          applicant_id: applicationData.applicant_id,
          cover_letter: applicationData.cover_letter
        }));
      });

      it('should throw error when user has already applied', async () => {
        const applicationData: CreateJobApplicationInput = {
          job_posting_id: 'job-1',
          applicant_id: 'student-1',
          cover_letter: 'I am interested'
        };

        const mockExistingCheck = {
          data: { id: 'existing-app' },
          error: null
        };

        // Mock the existing application check
        mockSupabaseQuery.single.mockResolvedValue(mockExistingCheck);

        await expect(JobService.createJobApplication(applicationData))
          .rejects.toThrow('You have already applied to this job');
      });

      it('should throw error when job is not accepting applications', async () => {
        const applicationData: CreateJobApplicationInput = {
          job_posting_id: 'job-1',
          applicant_id: 'student-1',
          cover_letter: 'I am interested'
        };

        const mockExistingCheck = { data: null, error: null };
        const mockJobCheck = {
          data: { status: 'closed' },
          error: null
        };

        // Mock the existing application check
        mockSupabaseQuery.single.mockResolvedValueOnce(mockExistingCheck);

        // Mock the job posting validation
        mockSupabaseQuery.single.mockResolvedValueOnce(mockJobCheck);

        await expect(JobService.createJobApplication(applicationData))
          .rejects.toThrow('Job posting is not available for applications');
      });

      it('should throw error when application deadline has passed', async () => {
        const applicationData: CreateJobApplicationInput = {
          job_posting_id: 'job-1',
          applicant_id: 'student-1',
          cover_letter: 'I am interested'
        };

        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);

        const mockExistingCheck = { data: null, error: null };
        const mockJobCheck = {
          data: {
            status: 'published',
            application_deadline: pastDate.toISOString()
          },
          error: null
        };

        // Mock the existing application check
        mockSupabaseQuery.single.mockResolvedValueOnce(mockExistingCheck);

        // Mock the job posting validation
        mockSupabaseQuery.single.mockResolvedValueOnce(mockJobCheck);

        await expect(JobService.createJobApplication(applicationData))
          .rejects.toThrow('Application deadline has passed');
      });

      it('should throw error when maximum applications reached', async () => {
        const applicationData: CreateJobApplicationInput = {
          job_posting_id: 'job-1',
          applicant_id: 'student-1',
          cover_letter: 'I am interested'
        };

        const mockExistingCheck = { data: null, error: null };
        const mockJobCheck = {
          data: {
            status: 'published',
            max_applications: 10,
            current_applications: 10
          },
          error: null
        };

        // Mock the existing application check
        mockSupabaseQuery.single.mockResolvedValueOnce(mockExistingCheck);

        // Mock the job posting validation
        mockSupabaseQuery.single.mockResolvedValueOnce(mockJobCheck);

        await expect(JobService.createJobApplication(applicationData))
          .rejects.toThrow('Maximum number of applications reached');
      });
    });

    describe('updateJobApplicationStatus', () => {
      it('should update application status successfully', async () => {
        const updates = {
          status: ApplicationStatus.SHORTLISTED,
          interview_notes: 'Good candidate'
        };

        const mockUpdateResponse = {
          data: {
            ...mockJobApplication,
            ...updates,
            status_updated_by: 'employer-1'
          },
          error: null
        };

        // Mock the update response
        mockSupabaseQuery.single.mockResolvedValue(mockUpdateResponse);

        const result = await JobService.updateJobApplicationStatus('app-1', updates, 'employer-1');

        expect(result.status).toBe(ApplicationStatus.SHORTLISTED);
        expect(result.interview_notes).toBe('Good candidate');
        expect(result.status_updated_by).toBe('employer-1');
      });

      it('should throw error when application not found', async () => {
        const updates = { status: ApplicationStatus.REJECTED };

        const mockUpdateResponse = {
          data: null,
          error: null
        };

        (supabaseAdmin.from as jest.Mock).mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue(mockUpdateResponse)
              })
            })
          })
        });

        await expect(JobService.updateJobApplicationStatus('app-1', updates, 'employer-1'))
          .rejects.toThrow('Job application not found');
      });
    });

    describe('getJobApplication', () => {
      it('should retrieve application with details', async () => {
        const mockApplicationWithDetails: JobApplicationWithDetails = {
          ...mockJobApplication,
          job_posting: {
            ...mockJobPosting,
            company: mockCompany
          },
          applicant: {
            id: 'student-1',
            email: 'student@example.com',
            profile: {
              firstName: 'John',
              lastName: 'Doe'
            }
          }
        };

        const mockResponse = {
          data: mockApplicationWithDetails,
          error: null
        };

        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(mockResponse)
            })
          })
        });

        const result = await JobService.getJobApplication('app-1');

        expect(result).toEqual(mockApplicationWithDetails);
        expect(result?.applicant.email).toBe('student@example.com');
      });

      it('should return null when application not found', async () => {
        const mockResponse = {
          data: null,
          error: { code: 'PGRST116' }
        };

        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(mockResponse)
            })
          })
        });

        const result = await JobService.getJobApplication('non-existent-app');

        expect(result).toBeNull();
      });
    });

    describe('getJobApplications', () => {
      it('should retrieve applications with filters', async () => {
        const mockApplications = [{
          ...mockJobApplication,
          job_posting: { ...mockJobPosting, company: mockCompany },
          applicant: {
            id: 'student-1',
            email: 'student@example.com',
            profile: { firstName: 'John', lastName: 'Doe' }
          }
        }];

        const mockResponse = {
          data: mockApplications,
          error: null,
          count: 1
        };

        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue(mockResponse)
              })
            })
          })
        });

        const query = {
          filters: {
            status: [ApplicationStatus.PENDING, ApplicationStatus.REVIEWED]
          },
          page: 1,
          limit: 10
        };

        const result = await JobService.getJobApplications(query);

        expect(result.applications).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.page).toBe(1);
      });
    });

    describe('getStudentApplications', () => {
      it('should retrieve applications for a student', async () => {
        const mockApplications = [{
          ...mockJobApplication,
          job_posting: { ...mockJobPosting, company: mockCompany }
        }];

        const mockResponse = {
          data: mockApplications,
          error: null
        };

        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue(mockResponse)
            })
          })
        });

        const result = await JobService.getStudentApplications('student-1');

        expect(result).toHaveLength(1);
        expect(result[0].applicant_id).toBe('student-1');
      });
    });

    describe('getEmployerApplications', () => {
      it('should retrieve applications for an employer', async () => {
        const mockApplications = [{
          ...mockJobApplication,
          job_posting: { ...mockJobPosting, company: mockCompany },
          applicant: {
            id: 'student-1',
            email: 'student@example.com',
            profile: { firstName: 'John', lastName: 'Doe' }
          }
        }];

        const mockResponse = {
          data: mockApplications,
          error: null
        };

        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue(mockResponse)
            })
          })
        });

        const result = await JobService.getEmployerApplications('employer-1');

        expect(result).toHaveLength(1);
        expect(result[0].job_posting.posted_by).toBe('employer-1');
      });

      it('should filter by job ID when provided', async () => {
        const mockApplications = [{
          ...mockJobApplication,
          job_posting: { ...mockJobPosting, company: mockCompany },
          applicant: {
            id: 'student-1',
            email: 'student@example.com',
            profile: { firstName: 'John', lastName: 'Doe' }
          }
        }];

        const mockResponse = {
          data: mockApplications,
          error: null
        };

        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue(mockResponse)
              })
            })
          })
        });

        const result = await JobService.getEmployerApplications('employer-1', 'job-1');

        expect(result).toHaveLength(1);
        expect(result[0].job_posting_id).toBe('job-1');
      });
    });
  });

  describe('Candidate Filtering and Shortlisting Logic', () => {
    describe('bulkUpdateApplicationStatus', () => {
      it('should update multiple applications status', async () => {
        const applicationIds = ['app-1', 'app-2', 'app-3'];
        const status = ApplicationStatus.SHORTLISTED;
        const updatedBy = 'employer-1';
        const notes = 'Selected for next round';

        const mockUpdateResponse = { error: null };
        const mockHistoryResponse = { error: null };

        (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue(mockUpdateResponse)
          })
        }).mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue(mockHistoryResponse)
        });

        await JobService.bulkUpdateApplicationStatus(applicationIds, status, updatedBy, notes);

        expect(supabaseAdmin.from).toHaveBeenCalledWith('job_applications');
        expect(supabaseAdmin.from).toHaveBeenCalledWith('application_status_history');
      });

      it('should handle bulk update without notes', async () => {
        const applicationIds = ['app-1', 'app-2'];
        const status = ApplicationStatus.REJECTED;
        const updatedBy = 'employer-1';

        const mockUpdateResponse = { error: null };

        (supabaseAdmin.from as jest.Mock).mockReturnValue({
          update: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue(mockUpdateResponse)
          })
        });

        await JobService.bulkUpdateApplicationStatus(applicationIds, status, updatedBy);

        expect(supabaseAdmin.from).toHaveBeenCalledWith('job_applications');
        expect(supabaseAdmin.from).toHaveBeenCalledTimes(1); // Should not call history table
      });

      it('should throw error when bulk update fails', async () => {
        const applicationIds = ['app-1'];
        const status = ApplicationStatus.REJECTED;
        const updatedBy = 'employer-1';

        const mockUpdateResponse = { error: { message: 'Update failed' } };

        (supabaseAdmin.from as jest.Mock).mockReturnValue({
          update: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue(mockUpdateResponse)
          })
        });

        await expect(JobService.bulkUpdateApplicationStatus(applicationIds, status, updatedBy))
          .rejects.toThrow(AppError);
      });
    });

    describe('Application filtering and search', () => {
      it('should filter applications by multiple status values', async () => {
        const mockApplications = [
          {
            ...mockJobApplication,
            status: ApplicationStatus.PENDING,
            job_posting: { ...mockJobPosting, company: mockCompany },
            applicant: { id: 'student-1', email: 'student1@example.com', profile: { firstName: 'John', lastName: 'Doe' } }
          },
          {
            ...mockJobApplication,
            id: 'app-2',
            status: ApplicationStatus.SHORTLISTED,
            job_posting: { ...mockJobPosting, company: mockCompany },
            applicant: { id: 'student-2', email: 'student2@example.com', profile: { firstName: 'Jane', lastName: 'Smith' } }
          }
        ];

        const mockResponse = {
          data: mockApplications,
          error: null,
          count: 2
        };

        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue(mockResponse)
              })
            })
          })
        });

        const query = {
          filters: {
            status: [ApplicationStatus.PENDING, ApplicationStatus.SHORTLISTED]
          }
        };

        const result = await JobService.getJobApplications(query);

        expect(result.applications).toHaveLength(2);
        expect(result.applications[0].status).toBe(ApplicationStatus.PENDING);
        expect(result.applications[1].status).toBe(ApplicationStatus.SHORTLISTED);
      });

      it('should filter applications by job posting ID', async () => {
        const mockApplications = [{
          ...mockJobApplication,
          job_posting_id: 'specific-job-1',
          job_posting: { ...mockJobPosting, id: 'specific-job-1', company: mockCompany },
          applicant: { id: 'student-1', email: 'student@example.com', profile: { firstName: 'John', lastName: 'Doe' } }
        }];

        const mockResponse = {
          data: mockApplications,
          error: null,
          count: 1
        };

        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue(mockResponse)
              })
            })
          })
        });

        const query = {
          filters: {
            job_posting_id: 'specific-job-1'
          }
        };

        const result = await JobService.getJobApplications(query);

        expect(result.applications).toHaveLength(1);
        expect(result.applications[0].job_posting_id).toBe('specific-job-1');
      });

      it('should filter applications by applicant ID', async () => {
        const mockApplications = [{
          ...mockJobApplication,
          applicant_id: 'specific-student-1',
          job_posting: { ...mockJobPosting, company: mockCompany },
          applicant: { id: 'specific-student-1', email: 'student@example.com', profile: { firstName: 'John', lastName: 'Doe' } }
        }];

        const mockResponse = {
          data: mockApplications,
          error: null,
          count: 1
        };

        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue(mockResponse)
              })
            })
          })
        });

        const query = {
          filters: {
            applicant_id: 'specific-student-1'
          }
        };

        const result = await JobService.getJobApplications(query);

        expect(result.applications).toHaveLength(1);
        expect(result.applications[0].applicant_id).toBe('specific-student-1');
      });

      it('should filter applications by date range', async () => {
        const mockApplications = [{
          ...mockJobApplication,
          applied_at: new Date(),
          job_posting: { ...mockJobPosting, company: mockCompany },
          applicant: { id: 'student-1', email: 'student@example.com', profile: { firstName: 'John', lastName: 'Doe' } }
        }];

        const mockResponse = {
          data: mockApplications,
          error: null,
          count: 1
        };

        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue(mockResponse)
              })
            })
          })
        });

        const query = {
          filters: {
            applied_within_days: 7
          }
        };

        const result = await JobService.getJobApplications(query);

        expect(result.applications).toHaveLength(1);
      });
    });

    describe('Advanced filtering scenarios', () => {
      it('should handle complex multi-filter scenarios', async () => {
        const mockApplications = [{
          ...mockJobApplication,
          status: ApplicationStatus.SHORTLISTED,
          job_posting_id: 'job-1',
          applicant_id: 'student-1',
          job_posting: { ...mockJobPosting, company: mockCompany },
          applicant: { id: 'student-1', email: 'student@example.com', profile: { firstName: 'John', lastName: 'Doe' } }
        }];

        const mockResponse = {
          data: mockApplications,
          error: null,
          count: 1
        };

        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  gte: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                      range: jest.fn().mockResolvedValue(mockResponse)
                    })
                  })
                })
              })
            })
          })
        });

        const query = {
          filters: {
            status: [ApplicationStatus.SHORTLISTED],
            job_posting_id: 'job-1',
            applicant_id: 'student-1',
            applied_within_days: 30
          },
          sortBy: 'applied_at' as const,
          sortOrder: 'desc' as const,
          page: 1,
          limit: 20
        };

        const result = await JobService.getJobApplications(query);

        expect(result.applications).toHaveLength(1);
        expect(result.applications[0].status).toBe(ApplicationStatus.SHORTLISTED);
        expect(result.applications[0].job_posting_id).toBe('job-1');
        expect(result.applications[0].applicant_id).toBe('student-1');
      });

      it('should handle pagination correctly', async () => {
        const mockApplications = Array.from({ length: 5 }, (_, i) => ({
          ...mockJobApplication,
          id: `app-${i + 1}`,
          job_posting: { ...mockJobPosting, company: mockCompany },
          applicant: { id: `student-${i + 1}`, email: `student${i + 1}@example.com`, profile: { firstName: 'John', lastName: 'Doe' } }
        }));

        const mockResponse = {
          data: mockApplications.slice(0, 3), // First page with limit 3
          error: null,
          count: 5 // Total count
        };

        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue(mockResponse)
            })
          })
        });

        const query = {
          page: 1,
          limit: 3
        };

        const result = await JobService.getJobApplications(query);

        expect(result.applications).toHaveLength(3);
        expect(result.total).toBe(5);
        expect(result.page).toBe(1);
        expect(result.totalPages).toBe(2);
      });

      it('should handle sorting by different fields', async () => {
        const mockApplications = [{
          ...mockJobApplication,
          job_posting: { ...mockJobPosting, company: mockCompany },
          applicant: { id: 'student-1', email: 'student@example.com', profile: { firstName: 'John', lastName: 'Doe' } }
        }];

        const mockResponse = {
          data: mockApplications,
          error: null,
          count: 1
        };

        (supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue(mockResponse)
            })
          })
        });

        const query = {
          sortBy: 'status_updated_at' as const,
          sortOrder: 'asc' as const
        };

        const result = await JobService.getJobApplications(query);

        expect(result.applications).toHaveLength(1);
      });
    });
  });

  describe('Statistics and Analytics', () => {
    describe('getJobPostingStats', () => {
      it('should return job posting statistics', async () => {
        const mockTotalCount = { count: 15 };
        const mockStatusData = {
          data: [
            { status: 'pending' },
            { status: 'pending' },
            { status: 'shortlisted' },
            { status: 'rejected' }
          ]
        };
        const mockRecentCount = { count: 3 };

        (supabase.from as jest.Mock).mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(mockTotalCount)
          })
        }).mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(mockStatusData)
          })
        }).mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockResolvedValue(mockRecentCount)
            })
          })
        });

        const result = await JobService.getJobPostingStats('job-1');

        expect(result.total_applications).toBe(15);
        expect(result.applications_by_status.pending).toBe(2);
        expect(result.applications_by_status.shortlisted).toBe(1);
        expect(result.applications_by_status.rejected).toBe(1);
        expect(result.recent_applications).toBe(3);
      });
    });

    describe('getEmployerStats', () => {
      it('should return employer statistics', async () => {
        const mockTotalJobs = { count: 10 };
        const mockActiveJobs = { count: 7 };
        const mockTotalApplications = { count: 45 };
        const mockPendingApplications = { count: 12 };

        (supabase.from as jest.Mock).mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(mockTotalJobs)
          })
        }).mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue(mockActiveJobs)
            })
          })
        }).mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue(mockTotalApplications)
          })
        }).mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue(mockPendingApplications)
            })
          })
        });

        const result = await JobService.getEmployerStats('employer-1');

        expect(result.total_jobs).toBe(10);
        expect(result.active_jobs).toBe(7);
        expect(result.total_applications).toBe(45);
        expect(result.pending_applications).toBe(12);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Connection failed'))
          })
        })
      });

      await expect(JobService.getJobPosting('job-1'))
        .rejects.toThrow(AppError);
    });

    it('should handle invalid input data', async () => {
      const invalidJobData: CreateJobPostingInput = {
        title: '', // Invalid: empty title
        description: 'Test',
        company_id: 'company-1',
        job_type: JobType.INTERNSHIP,
        work_mode: WorkMode.REMOTE,
        experience_level: ExperienceLevel.ENTRY,
        requirements: [],
        qualifications: [],
        skills: [],
        benefits: []
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Validation failed' }
            })
          })
        })
      });

      await expect(JobService.createJobPosting(invalidJobData, 'employer-1'))
        .rejects.toThrow(AppError);
    });
  });
});