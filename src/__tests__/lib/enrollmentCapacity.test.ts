import { EnrollmentService } from '../../lib/enrollmentService';
import { 
  EnrollmentStatus, 
  CreateEnrollmentInput
} from '../../models/Enrollment';
import { APIError } from '../../lib/errors';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null })),
          range: jest.fn(() => ({ data: [], error: null, count: 0 }))
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({ data: [], error: null }))
        })),
        order: jest.fn(() => ({
          range: jest.fn(() => ({ data: [], error: null, count: 0 }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({ 
            data: { 
              id: 'enrollment-123',
              course_id: 'course-1',
              student_id: 'student-1',
              status: EnrollmentStatus.ACTIVE,
              amount_paid: 1000,
              currency: 'INR',
              enrollment_date: new Date(),
              created_at: new Date(),
              updated_at: new Date()
            }, 
            error: null 
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({ 
              data: { 
                id: 'enrollment-123',
                status: EnrollmentStatus.COMPLETED
              }, 
              error: null 
            }))
          }))
        }))
      }))
    }))
  }))
}));

describe('EnrollmentService - Capacity Management', () => {
  let enrollmentService: EnrollmentService;
  let mockSupabaseClient: any;

  beforeEach(() => {
    enrollmentService = new EnrollmentService();
    mockSupabaseClient = require('@supabase/supabase-js').createClient();
    jest.clearAllMocks();
  });

  describe('Course Capacity Limits', () => {
    it('should allow enrollment when course has available capacity', async () => {
      // Mock capacity check - course has space
      mockSupabaseClient.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ 
                data: null, 
                error: { code: 'PGRST116' } // No capacity record
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ 
                data: { 
                  enrollment: { 
                    maxStudents: 50, 
                    currentEnrollment: 25 
                  } 
                }, 
                error: null 
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ data: null, error: null })) // No existing enrollment
            }))
          }))
        })
        .mockReturnValueOnce({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({ 
                data: { 
                  id: 'enrollment-123',
                  course_id: 'course-1',
                  student_id: 'student-1',
                  status: EnrollmentStatus.ACTIVE
                }, 
                error: null 
              }))
            }))
          }))
        });

      const enrollmentData: CreateEnrollmentInput = {
        course_id: 'course-1',
        student_id: 'student-1',
        status: EnrollmentStatus.ACTIVE,
        amount_paid: 1000,
        currency: 'INR',
        enrollment_source: 'direct'
      };

      const result = await enrollmentService.enrollStudent(enrollmentData);

      expect(result).toBeDefined();
      expect(result.course_id).toBe('course-1');
      expect(result.student_id).toBe('student-1');
    });

    it('should prevent enrollment when course is at capacity', async () => {
      // Mock capacity check - course is full
      mockSupabaseClient.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ 
                data: null, 
                error: { code: 'PGRST116' }
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ 
                data: { 
                  enrollment: { 
                    maxStudents: 30, 
                    currentEnrollment: 30 // Full capacity
                  } 
                }, 
                error: null 
              }))
            }))
          }))
        });

      const enrollmentData: CreateEnrollmentInput = {
        course_id: 'course-1',
        student_id: 'student-1',
        status: EnrollmentStatus.ACTIVE,
        amount_paid: 1000,
        currency: 'INR',
        enrollment_source: 'direct'
      };

      await expect(enrollmentService.enrollStudent(enrollmentData))
        .rejects.toThrow('Course enrollment capacity exceeded');
    });

    it('should allow unlimited enrollment when no capacity limit is set', async () => {
      // Mock capacity check - no limit set
      mockSupabaseClient.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ 
                data: null, 
                error: { code: 'PGRST116' }
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ 
                data: { 
                  enrollment: { 
                    maxStudents: null, // No limit
                    currentEnrollment: 100 
                  } 
                }, 
                error: null 
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ data: null, error: null }))
            }))
          }))
        })
        .mockReturnValueOnce({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({ 
                data: { 
                  id: 'enrollment-123',
                  course_id: 'course-1',
                  student_id: 'student-1'
                }, 
                error: null 
              }))
            }))
          }))
        });

      const enrollmentData: CreateEnrollmentInput = {
        course_id: 'course-1',
        student_id: 'student-1',
        status: EnrollmentStatus.ACTIVE,
        amount_paid: 1000,
        currency: 'INR',
        enrollment_source: 'direct'
      };

      const result = await enrollmentService.enrollStudent(enrollmentData);

      expect(result).toBeDefined();
    });

    it('should prevent duplicate enrollment for same student and course', async () => {
      // Mock existing enrollment check
      mockSupabaseClient.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({ 
              data: { 
                id: 'existing-enrollment',
                course_id: 'course-1',
                student_id: 'student-1'
              }, 
              error: null 
            }))
          }))
        }))
      }));

      const enrollmentData: CreateEnrollmentInput = {
        course_id: 'course-1',
        student_id: 'student-1',
        status: EnrollmentStatus.ACTIVE,
        amount_paid: 1000,
        currency: 'INR',
        enrollment_source: 'direct'
      };

      await expect(enrollmentService.enrollStudent(enrollmentData))
        .rejects.toThrow('Student is already enrolled in this course');
    });
  });

  describe('getCourseCapacity', () => {
    it('should return capacity information from course_capacity table', async () => {
      const mockCapacity = {
        course_id: 'course-1',
        max_students: 50,
        current_enrollment: 30,
        waitlist_count: 5
      };

      mockSupabaseClient.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({ data: mockCapacity, error: null }))
          }))
        }))
      }));

      const result = await enrollmentService.getCourseCapacity('course-1');

      expect(result).toEqual({
        course_id: 'course-1',
        max_students: 50,
        current_enrollment: 30,
        waitlist_count: 5,
        available_spots: 20,
        is_full: false
      });
    });

    it('should fallback to course table when no capacity record exists', async () => {
      const mockCourse = {
        enrollment: {
          maxStudents: 25,
          currentEnrollment: 15
        }
      };

      mockSupabaseClient.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ 
                data: null, 
                error: { code: 'PGRST116' }
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ data: mockCourse, error: null }))
            }))
          }))
        });

      const result = await enrollmentService.getCourseCapacity('course-1');

      expect(result).toEqual({
        course_id: 'course-1',
        max_students: 25,
        current_enrollment: 15,
        waitlist_count: 0,
        available_spots: 10,
        is_full: false
      });
    });

    it('should indicate when course is full', async () => {
      const mockCapacity = {
        course_id: 'course-1',
        max_students: 20,
        current_enrollment: 20,
        waitlist_count: 3
      };

      mockSupabaseClient.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({ data: mockCapacity, error: null }))
          }))
        }))
      }));

      const result = await enrollmentService.getCourseCapacity('course-1');

      expect(result.is_full).toBe(true);
      expect(result.available_spots).toBe(0);
    });

    it('should handle unlimited capacity courses', async () => {
      const mockCapacity = {
        course_id: 'course-1',
        max_students: null,
        current_enrollment: 100,
        waitlist_count: 0
      };

      mockSupabaseClient.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({ data: mockCapacity, error: null }))
          }))
        }))
      }));

      const result = await enrollmentService.getCourseCapacity('course-1');

      expect(result.is_full).toBe(false);
      expect(result.available_spots).toBeUndefined();
      expect(result.max_students).toBeNull();
    });
  });

  describe('Enrollment Status Management', () => {
    it('should update enrollment status with proper authorization', async () => {
      const mockEnrollment = {
        id: 'enrollment-123',
        student_id: 'student-1',
        course_id: 'course-1',
        courses: { mentor_id: 'mentor-1' }
      };

      const mockUser = {
        role: 'student'
      };

      mockSupabaseClient.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ data: mockEnrollment, error: null }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ data: mockUser, error: null }))
            }))
          }))
        })
        .mockReturnValueOnce({
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => ({ 
                  data: { 
                    ...mockEnrollment, 
                    status: EnrollmentStatus.COMPLETED 
                  }, 
                  error: null 
                }))
              }))
            }))
          }))
        });

      const result = await enrollmentService.updateEnrollmentStatus(
        'enrollment-123',
        EnrollmentStatus.COMPLETED,
        'student-1' // Student updating their own enrollment
      );

      expect(result.status).toBe(EnrollmentStatus.COMPLETED);
    });

    it('should prevent unauthorized status updates', async () => {
      const mockEnrollment = {
        id: 'enrollment-123',
        student_id: 'student-1',
        course_id: 'course-1',
        courses: { mentor_id: 'mentor-1' }
      };

      const mockUser = {
        role: 'student'
      };

      mockSupabaseClient.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ data: mockEnrollment, error: null }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ data: mockUser, error: null }))
            }))
          }))
        });

      await expect(enrollmentService.updateEnrollmentStatus(
        'enrollment-123',
        EnrollmentStatus.CANCELLED,
        'different-student' // Different student trying to update
      )).rejects.toThrow('Unauthorized to update this enrollment');
    });

    it('should allow mentor to update enrollment status', async () => {
      const mockEnrollment = {
        id: 'enrollment-123',
        student_id: 'student-1',
        course_id: 'course-1',
        courses: { mentor_id: 'mentor-1' }
      };

      const mockUser = {
        role: 'mentor'
      };

      mockSupabaseClient.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ data: mockEnrollment, error: null }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ data: mockUser, error: null }))
            }))
          }))
        })
        .mockReturnValueOnce({
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => ({ 
                  data: { 
                    ...mockEnrollment, 
                    status: EnrollmentStatus.CANCELLED 
                  }, 
                  error: null 
                }))
              }))
            }))
          }))
        });

      const result = await enrollmentService.updateEnrollmentStatus(
        'enrollment-123',
        EnrollmentStatus.CANCELLED,
        'mentor-1' // Mentor updating enrollment
      );

      expect(result.status).toBe(EnrollmentStatus.CANCELLED);
    });

    it('should allow admin to update any enrollment status', async () => {
      const mockEnrollment = {
        id: 'enrollment-123',
        student_id: 'student-1',
        course_id: 'course-1',
        courses: { mentor_id: 'mentor-1' }
      };

      const mockUser = {
        role: 'admin'
      };

      mockSupabaseClient.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ data: mockEnrollment, error: null }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ data: mockUser, error: null }))
            }))
          }))
        })
        .mockReturnValueOnce({
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => ({ 
                  data: { 
                    ...mockEnrollment, 
                    status: EnrollmentStatus.EXPIRED 
                  }, 
                  error: null 
                }))
              }))
            }))
          }))
        });

      const result = await enrollmentService.updateEnrollmentStatus(
        'enrollment-123',
        EnrollmentStatus.EXPIRED,
        'admin-1' // Admin updating enrollment
      );

      expect(result.status).toBe(EnrollmentStatus.EXPIRED);
    });
  });

  describe('Progress Tracking', () => {
    it('should update enrollment progress correctly', async () => {
      const mockEnrollment = {
        progress: {
          completedSessions: ['session-1'],
          totalSessions: 10,
          completionPercentage: 10,
          timeSpent: 60
        }
      };

      mockSupabaseClient.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ data: mockEnrollment, error: null }))
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn(() => ({ 
                    data: { 
                      ...mockEnrollment,
                      progress: {
                        completedSessions: ['session-1', 'session-2'],
                        totalSessions: 10,
                        completionPercentage: 20,
                        timeSpent: 180
                      }
                    }, 
                    error: null 
                  }))
                }))
              }))
            }))
          }))
        });

      const progressUpdate = {
        completedSessions: ['session-1', 'session-2'],
        completionPercentage: 20,
        timeSpent: 120 // Additional time
      };

      const result = await enrollmentService.updateEnrollmentProgress(
        'enrollment-123',
        'student-1',
        progressUpdate
      );

      expect(result.progress.completedSessions).toContain('session-2');
      expect(result.progress.completionPercentage).toBe(20);
      expect(result.progress.timeSpent).toBe(180); // 60 + 120
    });

    it('should handle progress updates for new enrollments', async () => {
      const mockEnrollment = {
        progress: null // New enrollment with no progress
      };

      mockSupabaseClient.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ data: mockEnrollment, error: null }))
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn(() => ({ 
                    data: { 
                      ...mockEnrollment,
                      progress: {
                        completedSessions: ['session-1'],
                        totalSessions: 10,
                        completionPercentage: 10,
                        timeSpent: 45
                      }
                    }, 
                    error: null 
                  }))
                }))
              }))
            }))
          }))
        });

      const progressUpdate = {
        completedSessions: ['session-1'],
        totalSessions: 10,
        completionPercentage: 10,
        timeSpent: 45
      };

      const result = await enrollmentService.updateEnrollmentProgress(
        'enrollment-123',
        'student-1',
        progressUpdate
      );

      expect(result.progress.completedSessions).toEqual(['session-1']);
      expect(result.progress.totalSessions).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.from = jest.fn(() => {
        throw new Error('Database connection failed');
      });

      const enrollmentData: CreateEnrollmentInput = {
        course_id: 'course-1',
        student_id: 'student-1',
        status: EnrollmentStatus.ACTIVE,
        amount_paid: 1000,
        currency: 'INR',
        enrollment_source: 'direct'
      };

      await expect(enrollmentService.enrollStudent(enrollmentData))
        .rejects.toThrow(APIError);
    });

    it('should handle invalid enrollment data', async () => {
      const invalidEnrollmentData = {
        course_id: 'invalid-uuid',
        student_id: '',
        status: 'invalid-status' as EnrollmentStatus,
        amount_paid: -100,
        currency: '',
        enrollment_source: ''
      } as CreateEnrollmentInput;

      await expect(enrollmentService.enrollStudent(invalidEnrollmentData))
        .rejects.toThrow();
    });
  });
});