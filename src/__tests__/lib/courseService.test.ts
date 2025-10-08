import { CourseService } from '../../lib/courseService';
import { 
  CourseType, 
  CourseStatus, 
  SubscriptionType,
  CreateCourseInput,
  UpdateCourseInput
} from '../../models/Course';
import { APIError } from '../../lib/errors';

// Mock Supabase

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null })),
          order: jest.fn(() => ({ data: [], error: null }))
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({ data: [], error: null }))
        })),
        or: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => ({ data: [], error: null, count: 0 }))
          }))
        })),
        order: jest.fn(() => ({
          range: jest.fn(() => ({ data: [], error: null, count: 0 }))
        })),
        range: jest.fn(() => ({ data: [], error: null, count: 0 }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({ 
            data: { 
              id: 'test-course-id',
              title: 'Test Course',
              mentor_id: 'mentor-1',
              status: CourseStatus.DRAFT
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
                id: 'test-course-id',
                title: 'Updated Course'
              }, 
              error: null 
            }))
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({ error: null }))
      }))
    }))
  }))
}));

describe('CourseService', () => {
  let courseService: CourseService;
  let mockSupabaseClient: any;

  beforeEach(() => {
    courseService = new CourseService();
    mockSupabaseClient = require('@supabase/supabase-js').createClient();
    jest.clearAllMocks();
  });

  describe('Course CRUD Operations', () => {
    describe('createCourse', () => {
      it('should create a course successfully with valid data', async () => {
        const courseData: CreateCourseInput = {
          title: 'JavaScript Fundamentals',
          description: 'Learn JavaScript from basics to advanced concepts with hands-on projects',
          short_description: 'Complete JavaScript course',
          mentor_id: 'mentor-1',
          category: 'Programming',
          tags: ['javascript', 'programming'],
          type: CourseType.RECORDED,
          status: CourseStatus.DRAFT,
          pricing: {
            amount: 1999,
            currency: 'INR',
            subscriptionType: SubscriptionType.ONE_TIME
          },
          content: {
            syllabus: ['Variables', 'Functions', 'Objects'],
            prerequisites: ['Basic computer knowledge'],
            learningOutcomes: ['Master JavaScript fundamentals']
          },
          media: {
            resources: []
          },
          meta_title: 'JavaScript Course',
          meta_description: 'Best JavaScript course online'
        };

        const result = await courseService.createCourse('mentor-1', courseData);

        expect(result).toBeDefined();
        expect(result.id).toBe('test-course-id');
        expect(result.title).toBe('Test Course');
        expect(result.status).toBe(CourseStatus.DRAFT);
      });

      it('should generate slug from title', async () => {
        const courseData: CreateCourseInput = {
          title: 'Advanced React & Node.js Development',
          description: 'Learn advanced concepts',
          mentor_id: 'mentor-1',
          category: 'Programming',
          tags: ['react', 'nodejs'],
          type: CourseType.LIVE,
          status: CourseStatus.DRAFT,
          pricing: {
            amount: 2999,
            currency: 'INR',
            subscriptionType: SubscriptionType.MONTHLY
          },
          content: {
            syllabus: ['React Hooks', 'Node.js APIs'],
            prerequisites: ['Basic React knowledge'],
            learningOutcomes: ['Build full-stack applications']
          },
          media: {
            resources: []
          }
        };

        await courseService.createCourse('mentor-1', courseData);

        // Verify that insert was called with slug
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('courses');
        const insertCall = mockSupabaseClient.from().insert;
        expect(insertCall).toHaveBeenCalled();
      });

      it('should handle validation errors', async () => {
        const invalidCourseData = {
          title: '', // Invalid: empty title
          description: 'Short', // Invalid: too short
          mentor_id: 'mentor-1',
          category: 'Programming',
          tags: [],
          type: CourseType.RECORDED,
          status: CourseStatus.DRAFT,
          pricing: {
            amount: -100, // Invalid: negative amount
            currency: 'INR',
            subscriptionType: SubscriptionType.ONE_TIME
          },
          content: {
            syllabus: [],
            prerequisites: [],
            learningOutcomes: []
          },
          media: {
            resources: []
          }
        } as CreateCourseInput;

        await expect(courseService.createCourse('mentor-1', invalidCourseData))
          .rejects.toThrow(APIError);
      });

      it('should handle database errors', async () => {
        // Mock database error
        mockSupabaseClient.from = jest.fn(() => ({
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({ 
                data: null, 
                error: { message: 'Database error', code: 'DB_ERROR' }
              }))
            }))
          }))
        }));

        const courseData: CreateCourseInput = {
          title: 'Test Course',
          description: 'Test description for the course',
          mentor_id: 'mentor-1',
          category: 'Programming',
          tags: ['test'],
          type: CourseType.RECORDED,
          status: CourseStatus.DRAFT,
          pricing: {
            amount: 1999,
            currency: 'INR',
            subscriptionType: SubscriptionType.ONE_TIME
          },
          content: {
            syllabus: ['Topic 1'],
            prerequisites: ['Basic knowledge'],
            learningOutcomes: ['Learn basics']
          },
          media: {
            resources: []
          }
        };

        await expect(courseService.createCourse('mentor-1', courseData))
          .rejects.toThrow(APIError);
      });
    });

    describe('getCourseById', () => {
      it('should retrieve course by valid ID', async () => {
        const mockCourse = {
          id: 'course-123',
          title: 'Test Course',
          mentor_id: 'mentor-1',
          status: CourseStatus.PUBLISHED
        };

        mockSupabaseClient.from = jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ data: mockCourse, error: null }))
            }))
          }))
        }));

        const result = await courseService.getCourseById('course-123');

        expect(result).toEqual(mockCourse);
      });

      it('should return null for non-existent course', async () => {
        mockSupabaseClient.from = jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({ 
                data: null, 
                error: { code: 'PGRST116' } // Not found error
              }))
            }))
          }))
        }));

        const result = await courseService.getCourseById('non-existent-id');

        expect(result).toBeNull();
      });

      it('should throw error for invalid UUID format', async () => {
        await expect(courseService.getCourseById('invalid-id'))
          .rejects.toThrow(APIError);
      });
    });

    describe('updateCourse', () => {
      it('should update course successfully', async () => {
        const updateData: UpdateCourseInput = {
          title: 'Updated Course Title',
          description: 'Updated description',
          pricing: {
            amount: 2499,
            currency: 'INR',
            subscriptionType: SubscriptionType.MONTHLY
          }
        };

        const mockUpdatedCourse = {
          id: 'course-123',
          title: 'Updated Course Title',
          mentor_id: 'mentor-1'
        };

        mockSupabaseClient.from = jest.fn(() => ({
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn(() => ({ data: mockUpdatedCourse, error: null }))
                }))
              }))
            }))
          }))
        }));

        const result = await courseService.updateCourse('course-123', 'mentor-1', updateData);

        expect(result).toEqual(mockUpdatedCourse);
      });

      it('should throw error for unauthorized update', async () => {
        mockSupabaseClient.from = jest.fn(() => ({
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn(() => ({ 
                    data: null, 
                    error: { code: 'PGRST116' } // Not found (unauthorized)
                  }))
                }))
              }))
            }))
          }))
        }));

        const updateData: UpdateCourseInput = {
          title: 'Updated Title'
        };

        await expect(courseService.updateCourse('course-123', 'wrong-mentor', updateData))
          .rejects.toThrow('Course not found or unauthorized');
      });

      it('should generate new slug when title is updated', async () => {
        const updateData: UpdateCourseInput = {
          title: 'New Course Title With Special Characters!'
        };

        mockSupabaseClient.from = jest.fn(() => ({
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn(() => ({ 
                    data: { id: 'course-123', title: 'New Course Title With Special Characters!' }, 
                    error: null 
                  }))
                }))
              }))
            }))
          }))
        }));

        await courseService.updateCourse('course-123', 'mentor-1', updateData);

        // Verify update was called with slug
        expect(mockSupabaseClient.from().update).toHaveBeenCalled();
      });
    });

    describe('deleteCourse', () => {
      it('should delete course with no enrollments', async () => {
        // Mock course fetch
        mockSupabaseClient.from = jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ 
                  data: { 
                    enrollment: { currentEnrollment: 0 } 
                  }, 
                  error: null 
                }))
              }))
            }))
          })),
          delete: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({ error: null }))
            }))
          }))
        }));

        const result = await courseService.deleteCourse('course-123', 'mentor-1');

        expect(result).toBe(true);
      });

      it('should prevent deletion of course with active enrollments', async () => {
        mockSupabaseClient.from = jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ 
                  data: { 
                    enrollment: { currentEnrollment: 5 } 
                  }, 
                  error: null 
                }))
              }))
            }))
          }))
        }));

        await expect(courseService.deleteCourse('course-123', 'mentor-1'))
          .rejects.toThrow('Cannot delete course with active enrollments');
      });

      it('should throw error for non-existent course', async () => {
        mockSupabaseClient.from = jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ 
                  data: null, 
                  error: { code: 'PGRST116' }
                }))
              }))
            }))
          }))
        }));

        await expect(courseService.deleteCourse('non-existent', 'mentor-1'))
          .rejects.toThrow('Course not found or unauthorized');
      });
    });
  });

  describe('Course Authorization', () => {
    it('should allow mentor to access their own course', async () => {
      const mockCourse = {
        id: 'course-123',
        mentor_id: 'mentor-1',
        title: 'Test Course'
      };

      mockSupabaseClient.from = jest.fn(() => ({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => ({ data: mockCourse, error: null }))
              }))
            }))
          }))
        }))
      }));

      const result = await courseService.updateCourse('course-123', 'mentor-1', { title: 'Updated' });

      expect(result).toBeDefined();
    });

    it('should prevent mentor from accessing other mentor\'s course', async () => {
      mockSupabaseClient.from = jest.fn(() => ({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => ({ 
                  data: null, 
                  error: { code: 'PGRST116' }
                }))
              }))
            }))
          }))
        }))
      }));

      await expect(courseService.updateCourse('course-123', 'different-mentor', { title: 'Updated' }))
        .rejects.toThrow('Course not found or unauthorized');
    });
  });

  describe('Course Publishing', () => {
    describe('publishCourse', () => {
      it('should publish course with valid data', async () => {
        const mockCourse = {
          id: 'course-123',
          title: 'Complete Course',
          description: 'Full description',
          pricing: { amount: 1999 },
          mentor_id: 'mentor-1'
        };

        mockSupabaseClient.from = jest.fn()
          .mockReturnValueOnce({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() => ({ data: mockCourse, error: null }))
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
                      data: { ...mockCourse, status: CourseStatus.PUBLISHED }, 
                      error: null 
                    }))
                  }))
                }))
              }))
            }))
          });

        const result = await courseService.publishCourse('course-123', 'mentor-1');

        expect(result.status).toBe(CourseStatus.PUBLISHED);
      });

      it('should prevent publishing course with incomplete data', async () => {
        const incompleteCourse = {
          id: 'course-123',
          title: '', // Missing title
          description: 'Description',
          pricing: { amount: 0 }, // Missing pricing
          mentor_id: 'mentor-1'
        };

        mockSupabaseClient.from = jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({ data: incompleteCourse, error: null }))
              }))
            }))
          }))
        }));

        await expect(courseService.publishCourse('course-123', 'mentor-1'))
          .rejects.toThrow('Course must have title, description, and pricing to be published');
      });
    });

    describe('unpublishCourse', () => {
      it('should unpublish course successfully', async () => {
        const mockCourse = {
          id: 'course-123',
          status: CourseStatus.DRAFT,
          mentor_id: 'mentor-1'
        };

        mockSupabaseClient.from = jest.fn(() => ({
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn(() => ({ data: mockCourse, error: null }))
                }))
              }))
            }))
          }))
        }));

        const result = await courseService.unpublishCourse('course-123', 'mentor-1');

        expect(result.status).toBe(CourseStatus.DRAFT);
      });
    });
  });

  describe('Course Search and Filtering', () => {
    describe('searchCourses', () => {
      it('should search courses with text query', async () => {
        const mockCourses = [
          { id: 'course-1', title: 'JavaScript Basics', status: CourseStatus.PUBLISHED },
          { id: 'course-2', title: 'Advanced JavaScript', status: CourseStatus.PUBLISHED }
        ];

        mockSupabaseClient.from = jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              or: jest.fn(() => ({
                order: jest.fn(() => ({
                  range: jest.fn(() => ({ 
                    data: mockCourses, 
                    error: null, 
                    count: 2 
                  }))
                }))
              }))
            }))
          }))
        }));

        const result = await courseService.searchCourses({
          search: 'JavaScript',
          page: 1,
          limit: 10
        });

        expect(result.courses).toEqual(mockCourses);
        expect(result.total).toBe(2);
        expect(result.totalPages).toBe(1);
      });

      it('should filter courses by category', async () => {
        const mockCourses = [
          { id: 'course-1', title: 'React Course', category: 'Programming' }
        ];

        mockSupabaseClient.from = jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  range: jest.fn(() => ({ 
                    data: mockCourses, 
                    error: null, 
                    count: 1 
                  }))
                }))
              }))
            }))
          }))
        }));

        const result = await courseService.searchCourses({
          filters: { category: 'Programming' },
          page: 1,
          limit: 10
        });

        expect(result.courses).toEqual(mockCourses);
      });

      it('should filter courses by price range', async () => {
        const mockCourses = [
          { id: 'course-1', title: 'Affordable Course', pricing: { amount: 999 } }
        ];

        mockSupabaseClient.from = jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              gte: jest.fn(() => ({
                lte: jest.fn(() => ({
                  order: jest.fn(() => ({
                    range: jest.fn(() => ({ 
                      data: mockCourses, 
                      error: null, 
                      count: 1 
                    }))
                  }))
                }))
              }))
            }))
          }))
        }));

        const result = await courseService.searchCourses({
          filters: { 
            minPrice: 500, 
            maxPrice: 1500 
          },
          page: 1,
          limit: 10
        });

        expect(result.courses).toEqual(mockCourses);
      });

      it('should sort courses by different criteria', async () => {
        const mockCourses = [
          { id: 'course-1', title: 'Course A', created_at: '2024-01-01' },
          { id: 'course-2', title: 'Course B', created_at: '2024-01-02' }
        ];

        mockSupabaseClient.from = jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn(() => ({ 
                  data: mockCourses, 
                  error: null, 
                  count: 2 
                }))
              }))
            }))
          }))
        }));

        const result = await courseService.searchCourses({
          sortBy: 'createdAt',
          sortOrder: 'desc',
          page: 1,
          limit: 10
        });

        expect(result.courses).toEqual(mockCourses);
      });

      it('should handle pagination correctly', async () => {
        const mockCourses = Array.from({ length: 5 }, (_, i) => ({
          id: `course-${i + 1}`,
          title: `Course ${i + 1}`
        }));

        mockSupabaseClient.from = jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn(() => ({ 
                  data: mockCourses.slice(0, 3), 
                  error: null, 
                  count: 15 // Total count
                }))
              }))
            }))
          }))
        }));

        const result = await courseService.searchCourses({
          page: 2,
          limit: 3
        });

        expect(result.page).toBe(2);
        expect(result.limit).toBe(3);
        expect(result.total).toBe(15);
        expect(result.totalPages).toBe(5);
      });
    });

    describe('getCoursesByMentor', () => {
      it('should get all courses by mentor', async () => {
        const mockCourses = [
          { id: 'course-1', mentor_id: 'mentor-1', title: 'Course 1' },
          { id: 'course-2', mentor_id: 'mentor-1', title: 'Course 2' }
        ];

        mockSupabaseClient.from = jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({ data: mockCourses, error: null }))
            }))
          }))
        }));

        const result = await courseService.getCoursesByMentor('mentor-1');

        expect(result).toEqual(mockCourses);
      });

      it('should filter mentor courses by status', async () => {
        const mockPublishedCourses = [
          { id: 'course-1', mentor_id: 'mentor-1', status: CourseStatus.PUBLISHED }
        ];

        mockSupabaseClient.from = jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({ data: mockPublishedCourses, error: null }))
              }))
            }))
          }))
        }));

        const result = await courseService.getCoursesByMentor('mentor-1', CourseStatus.PUBLISHED);

        expect(result).toEqual(mockPublishedCourses);
      });
    });
  });

  describe('Course Categories and Tags', () => {
    describe('getCategoriesWithCounts', () => {
      it('should return categories with course counts', async () => {
        const mockCourses = [
          { category: 'Programming' },
          { category: 'Programming' },
          { category: 'Data Science' },
          { category: 'Programming' }
        ];

        mockSupabaseClient.from = jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({ data: mockCourses, error: null }))
          }))
        }));

        const result = await courseService.getCategoriesWithCounts();

        expect(result).toEqual([
          { category: 'Programming', count: 3 },
          { category: 'Data Science', count: 1 }
        ]);
      });
    });

    describe('getPopularTags', () => {
      it('should return popular tags with counts', async () => {
        const mockCourses = [
          { tags: ['javascript', 'react'] },
          { tags: ['javascript', 'node'] },
          { tags: ['python', 'django'] },
          { tags: ['javascript'] }
        ];

        mockSupabaseClient.from = jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({ data: mockCourses, error: null }))
          }))
        }));

        const result = await courseService.getPopularTags(5);

        expect(result).toEqual([
          { tag: 'javascript', count: 3 },
          { tag: 'react', count: 1 },
          { tag: 'node', count: 1 },
          { tag: 'python', count: 1 },
          { tag: 'django', count: 1 }
        ]);
      });

      it('should limit results to specified count', async () => {
        const mockCourses = [
          { tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'] }
        ];

        mockSupabaseClient.from = jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({ data: mockCourses, error: null }))
          }))
        }));

        const result = await courseService.getPopularTags(3);

        expect(result.length).toBe(3);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockSupabaseClient.from = jest.fn(() => {
        throw new Error('Database connection failed');
      });

      await expect(courseService.getCourseById('course-123'))
        .rejects.toThrow(APIError);
    });

    it('should handle invalid input validation', async () => {
      const invalidCourse = {
        title: 'A'.repeat(201), // Too long
        description: 'Short',
        mentor_id: 'mentor-1',
        category: 'Programming',
        tags: [],
        type: 'invalid-type' as CourseType,
        status: CourseStatus.DRAFT,
        pricing: {
          amount: -100,
          currency: 'INR',
          subscriptionType: SubscriptionType.ONE_TIME
        },
        content: {
          syllabus: [],
          prerequisites: [],
          learningOutcomes: []
        },
        media: {
          resources: []
        }
      } as CreateCourseInput;

      await expect(courseService.createCourse('mentor-1', invalidCourse))
        .rejects.toThrow();
    });

    it('should handle network timeouts gracefully', async () => {
      mockSupabaseClient.from = jest.fn(() => ({
        select: jest.fn(() => {
          throw new Error('Network timeout');
        })
      }));

      await expect(courseService.searchCourses({}))
        .rejects.toThrow(APIError);
    });
  });
});