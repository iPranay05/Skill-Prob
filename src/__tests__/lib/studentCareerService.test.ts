import { StudentCareerService } from '@/lib/studentCareerService';
import { createClient } from '@supabase/supabase-js';
import { AppError } from '@/lib/errors';

// Mock Supabase client
jest.mock('@supabase/supabase-js');
const mockSupabase = {
  from: jest.fn()
};

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
mockCreateClient.mockReturnValue(mockSupabase as any);

describe('StudentCareerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Job Browsing', () => {
    describe('getJobPostings', () => {
      it('should fetch job postings successfully', async () => {
        const mockJobs = [
          {
            id: 'job-1',
            title: 'Frontend Developer Intern',
            company_name: 'Tech Corp',
            type: 'internship',
            experience_level: 'entry',
            work_mode: 'remote',
            location: 'Mumbai',
            stipend: 25000,
            currency: 'INR',
            status: 'published',
            featured: false,
            current_applications: 5,
            categories: [
              { category: { id: 'cat-1', name: 'Software Development' } }
            ]
          }
        ];

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ 
            data: mockJobs, 
            error: null, 
            count: 1 
          })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentCareerService.getJobPostings();

        expect(mockSupabase.from).toHaveBeenCalledWith('job_postings');
        expect(mockQuery.eq).toHaveBeenCalledWith('status', 'published');
        expect(result.jobs).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.jobs[0].categories).toEqual([{ id: 'cat-1', name: 'Software Development' }]);
      });

      it('should apply filters correctly', async () => {
        const filters = {
          type: 'internship',
          experience_level: 'entry',
          work_mode: 'remote',
          location: 'Mumbai',
          keywords: 'frontend',
          salary_min: 20000,
          featured_only: true,
          limit: 10,
          offset: 0
        };

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          range: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        await StudentCareerService.getJobPostings(filters);

        expect(mockQuery.eq).toHaveBeenCalledWith('type', 'internship');
        expect(mockQuery.eq).toHaveBeenCalledWith('experience_level', 'entry');
        expect(mockQuery.eq).toHaveBeenCalledWith('work_mode', 'remote');
        expect(mockQuery.ilike).toHaveBeenCalledWith('location', '%Mumbai%');
        expect(mockQuery.or).toHaveBeenCalledWith('title.ilike.%frontend%,description.ilike.%frontend%,company_name.ilike.%frontend%');
        expect(mockQuery.gte).toHaveBeenCalledWith('salary_min', 20000);
        expect(mockQuery.eq).toHaveBeenCalledWith('featured', true);
        expect(mockQuery.limit).toHaveBeenCalledWith(10);
      });

      it('should handle database errors', async () => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Database error' }, 
            count: null 
          })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        await expect(StudentCareerService.getJobPostings())
          .rejects.toThrow(AppError);
      });
    });

    describe('getJobById', () => {
      it('should fetch job by ID successfully', async () => {
        const mockJob = {
          id: 'job-1',
          title: 'Frontend Developer',
          company_name: 'Tech Corp',
          status: 'published',
          categories: [
            { category: { id: 'cat-1', name: 'Software Development' } }
          ],
          employer: {
            id: 'employer-1',
            profile: { firstName: 'John', lastName: 'Doe' }
          }
        };

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockJob, error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentCareerService.getJobById('job-1');

        expect(result).toEqual({
          ...mockJob,
          categories: [{ id: 'cat-1', name: 'Software Development' }]
        });
      });

      it('should check if job is saved by user', async () => {
        const mockJob = {
          id: 'job-1',
          title: 'Frontend Developer',
          status: 'published',
          categories: []
        };

        const mockJobQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockJob, error: null })
        };

        const mockSavedQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 'saved-1' }, error: null })
        };

        const mockApplicationQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
        };

        mockSupabase.from
          .mockReturnValueOnce(mockJobQuery)
          .mockReturnValueOnce(mockSavedQuery)
          .mockReturnValueOnce(mockApplicationQuery);

        const result = await StudentCareerService.getJobById('job-1', 'user-1');

        expect(result?.is_saved).toBe(true);
      });

      it('should return null for non-existent job', async () => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { code: 'PGRST116' } 
          })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentCareerService.getJobById('non-existent');

        expect(result).toBeNull();
      });
    });
  });

  describe('Job Applications', () => {
    describe('applyToJob', () => {
      it('should apply to job successfully', async () => {
        const applicationData = {
          resume_url: 'https://example.com/resume.pdf',
          cover_letter: 'I am interested in this position...',
          portfolio_url: 'https://portfolio.com'
        };

        const mockApplication = {
          id: 'app-1',
          job_posting_id: 'job-1',
          applicant_id: 'user-1',
          ...applicationData,
          status: 'pending',
          applied_at: new Date().toISOString()
        };

        // Mock existing application check (none found)
        const mockExistingQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { code: 'PGRST116' } 
          })
        };

        // Mock job validation
        const mockJobQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: { 
              status: 'published',
              max_applications: 100,
              current_applications: 5,
              application_deadline: null
            }, 
            error: null 
          })
        };

        // Mock application insert
        const mockInsertQuery = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockApplication, error: null })
        };

        mockSupabase.from
          .mockReturnValueOnce(mockExistingQuery)
          .mockReturnValueOnce(mockJobQuery)
          .mockReturnValueOnce(mockInsertQuery);

        const result = await StudentCareerService.applyToJob('job-1', 'user-1', applicationData);

        expect(result).toEqual(mockApplication);
        expect(mockInsertQuery.insert).toHaveBeenCalledWith({
          job_posting_id: 'job-1',
          applicant_id: 'user-1',
          ...applicationData
        });
      });

      it('should throw error if already applied', async () => {
        const mockExistingQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: { id: 'existing-app' }, 
            error: null 
          })
        };

        mockSupabase.from.mockReturnValue(mockExistingQuery);

        await expect(StudentCareerService.applyToJob('job-1', 'user-1', {}))
          .rejects.toThrow('You have already applied to this job');
      });

      it('should throw error if application deadline passed', async () => {
        const mockExistingQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { code: 'PGRST116' } 
          })
        };

        const mockJobQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: { 
              status: 'published',
              application_deadline: new Date(Date.now() - 86400000).toISOString() // Yesterday
            }, 
            error: null 
          })
        };

        mockSupabase.from
          .mockReturnValueOnce(mockExistingQuery)
          .mockReturnValueOnce(mockJobQuery);

        await expect(StudentCareerService.applyToJob('job-1', 'user-1', {}))
          .rejects.toThrow('Application deadline has passed');
      });

      it('should throw error if max applications reached', async () => {
        const mockExistingQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { code: 'PGRST116' } 
          })
        };

        const mockJobQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: { 
              status: 'published',
              max_applications: 10,
              current_applications: 10,
              application_deadline: null
            }, 
            error: null 
          })
        };

        mockSupabase.from
          .mockReturnValueOnce(mockExistingQuery)
          .mockReturnValueOnce(mockJobQuery);

        await expect(StudentCareerService.applyToJob('job-1', 'user-1', {}))
          .rejects.toThrow('Maximum applications reached for this job');
      });
    });

    describe('getStudentApplications', () => {
      it('should fetch student applications successfully', async () => {
        const mockApplications = [
          {
            id: 'app-1',
            job_posting_id: 'job-1',
            applicant_id: 'user-1',
            status: 'pending',
            applied_at: new Date().toISOString(),
            job_posting: {
              id: 'job-1',
              title: 'Frontend Developer',
              company_name: 'Tech Corp'
            }
          }
        ];

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: mockApplications, error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentCareerService.getStudentApplications('user-1');

        expect(result).toEqual(mockApplications);
        expect(mockQuery.eq).toHaveBeenCalledWith('applicant_id', 'user-1');
      });
    });

    describe('withdrawApplication', () => {
      it('should withdraw application successfully', async () => {
        const mockQuery = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis()
        };

        mockQuery.eq.mockResolvedValue({ error: null });
        mockSupabase.from.mockReturnValue(mockQuery);

        await StudentCareerService.withdrawApplication('app-1', 'user-1');

        expect(mockQuery.update).toHaveBeenCalledWith({
          status: 'withdrawn',
          status_updated_at: expect.any(String)
        });
        expect(mockQuery.eq).toHaveBeenCalledWith('id', 'app-1');
        expect(mockQuery.eq).toHaveBeenCalledWith('applicant_id', 'user-1');
      });
    });
  });

  describe('Saved Jobs', () => {
    describe('saveJob', () => {
      it('should save job successfully', async () => {
        const mockSavedJob = {
          id: 'saved-1',
          user_id: 'user-1',
          job_posting_id: 'job-1',
          created_at: new Date().toISOString()
        };

        const mockQuery = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockSavedJob, error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentCareerService.saveJob('user-1', 'job-1');

        expect(result).toEqual(mockSavedJob);
        expect(mockQuery.insert).toHaveBeenCalledWith({
          user_id: 'user-1',
          job_posting_id: 'job-1'
        });
      });

      it('should throw error if job already saved', async () => {
        const mockQuery = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { code: '23505' } // Unique constraint violation
          })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        await expect(StudentCareerService.saveJob('user-1', 'job-1'))
          .rejects.toThrow('Job already saved');
      });
    });

    describe('unsaveJob', () => {
      it('should unsave job successfully', async () => {
        const mockQuery = {
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis()
        };

        mockQuery.eq.mockResolvedValue({ error: null });
        mockSupabase.from.mockReturnValue(mockQuery);

        await StudentCareerService.unsaveJob('user-1', 'job-1');

        expect(mockQuery.delete).toHaveBeenCalled();
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
        expect(mockQuery.eq).toHaveBeenCalledWith('job_posting_id', 'job-1');
      });
    });
  });

  describe('Student Profile Management', () => {
    describe('getStudentProfile', () => {
      it('should fetch student profile successfully', async () => {
        const mockProfile = {
          id: 'profile-1',
          user_id: 'user-1',
          resume_url: 'https://example.com/resume.pdf',
          skills: ['JavaScript', 'React', 'Node.js'],
          experience_level: 'junior',
          bio: 'Passionate developer...',
          education: [
            {
              institution: 'University of Mumbai',
              degree: 'Bachelor of Engineering',
              field_of_study: 'Computer Science',
              start_date: '2020-06-01',
              end_date: '2024-05-31'
            }
          ]
        };

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentCareerService.getStudentProfile('user-1');

        expect(result).toEqual(mockProfile);
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
      });

      it('should return null if profile not found', async () => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { code: 'PGRST116' } 
          })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentCareerService.getStudentProfile('user-1');

        expect(result).toBeNull();
      });
    });

    describe('createOrUpdateStudentProfile', () => {
      it('should create or update profile successfully', async () => {
        const profileData = {
          resume_url: 'https://example.com/resume.pdf',
          skills: ['JavaScript', 'React'],
          experience_level: 'junior',
          bio: 'Updated bio'
        };

        const mockProfile = {
          id: 'profile-1',
          user_id: 'user-1',
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const mockQuery = {
          upsert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentCareerService.createOrUpdateStudentProfile('user-1', profileData);

        expect(result).toEqual(mockProfile);
        expect(mockQuery.upsert).toHaveBeenCalledWith({
          user_id: 'user-1',
          ...profileData
        });
      });
    });
  });

  describe('Analytics and Recommendations', () => {
    describe('getJobRecommendations', () => {
      it('should fetch job recommendations based on profile', async () => {
        const mockProfile = {
          preferred_job_types: ['internship', 'full-time'],
          experience_level: 'junior',
          preferred_work_modes: ['remote', 'hybrid']
        };

        const mockJobs = [
          {
            id: 'job-1',
            title: 'Junior Developer',
            type: 'full-time',
            experience_level: 'junior',
            work_mode: 'remote',
            categories: []
          }
        ];

        // Mock profile fetch
        jest.spyOn(StudentCareerService, 'getStudentProfile')
          .mockResolvedValue(mockProfile as any);

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: mockJobs, error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentCareerService.getJobRecommendations('user-1', 5);

        expect(result).toEqual(mockJobs);
        expect(mockQuery.in).toHaveBeenCalledWith('type', ['internship', 'full-time']);
        expect(mockQuery.eq).toHaveBeenCalledWith('experience_level', 'junior');
        expect(mockQuery.in).toHaveBeenCalledWith('work_mode', ['remote', 'hybrid']);
        expect(mockQuery.limit).toHaveBeenCalledWith(5);
      });

      it('should fetch recommendations without profile filtering', async () => {
        // Mock no profile found
        jest.spyOn(StudentCareerService, 'getStudentProfile')
          .mockResolvedValue(null);

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentCareerService.getJobRecommendations('user-1');

        expect(result).toEqual([]);
        expect(mockQuery.limit).toHaveBeenCalledWith(10); // Default limit
      });
    });

    describe('getApplicationStats', () => {
      it('should calculate application statistics correctly', async () => {
        const mockApplications = [
          { status: 'pending' },
          { status: 'pending' },
          { status: 'reviewed' },
          { status: 'shortlisted' },
          { status: 'rejected' },
          { status: 'selected' }
        ];

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockApplications, error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentCareerService.getApplicationStats('user-1');

        expect(result).toEqual({
          total_applications: 6,
          pending: 2,
          reviewed: 1,
          shortlisted: 1,
          interview_scheduled: 0,
          rejected: 1,
          selected: 1,
          withdrawn: 0
        });
      });

      it('should handle empty applications', async () => {
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [], error: null })
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        const result = await StudentCareerService.getApplicationStats('user-1');

        expect(result.total_applications).toBe(0);
        expect(result.pending).toBe(0);
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
          error: { message: 'Database connection failed' }, 
          count: null 
        })
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(StudentCareerService.getJobPostings())
        .rejects.toThrow(AppError);
    });

    it('should handle network errors gracefully', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockRejectedValue(new Error('Network error'))
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(StudentCareerService.getJobPostings())
        .rejects.toThrow(AppError);
    });
  });
});