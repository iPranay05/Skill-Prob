import { createClient } from '@supabase/supabase-js';
import { 
  Course, 
  CreateCourseInput, 
  UpdateCourseInput, 
  CourseSearchQuery,
  CourseSearchFilters,
  CourseStatus,
  CourseType,
  CourseSchema,
  CreateCourseSchema,
  UpdateCourseSchema
} from '../models/Course';
import { APIError } from './errors';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class CourseService {
  constructor() {
    // No initialization needed for Supabase
  }

  /**
   * Generate a URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  /**
   * Create a new course
   */
  async createCourse(mentorId: string, courseData: CreateCourseInput): Promise<Course> {
    try {
      // Validate input
      const validatedData = CreateCourseSchema.parse(courseData);
      
      // Generate slug from title
      const slug = this.generateSlug(validatedData.title);
      
      // Create course object for Supabase
      const courseInsert = {
        title: validatedData.title,
        description: validatedData.description,
        short_description: validatedData.short_description,
        mentor_id: mentorId,
        category: validatedData.category,
        type: validatedData.type,
        status: CourseStatus.DRAFT,
        slug,
        meta_title: validatedData.meta_title,
        meta_description: validatedData.meta_description,
        
        // JSON fields
        pricing: validatedData.pricing,
        content: validatedData.content,
        media: validatedData.media,
        enrollment: {
          maxStudents: validatedData.enrollment?.maxStudents || null,
          currentEnrollment: 0
        },
        ratings: {
          average: 0,
          count: 0
        }
      };

      // Insert into database
      const { data, error } = await supabase
        .from('courses')
        .insert(courseInsert)
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to create course', 500, 'CREATE_COURSE_ERROR', error);
      }

      return data as Course;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to create course', 500, 'CREATE_COURSE_ERROR', error);
    }
  }

  /**
   * Get course by ID
   */
  async getCourseById(courseId: string): Promise<Course | null> {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(courseId)) {
        throw new APIError('Invalid course ID', 400);
      }

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw new APIError('Failed to fetch course', 500, 'FETCH_COURSE_ERROR', error);
      }

      return data as Course | null;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to fetch course', 500, 'FETCH_COURSE_ERROR', error);
    }
  }

  /**
   * Update course
   */
  async updateCourse(courseId: string, mentorId: string, updateData: UpdateCourseInput): Promise<Course> {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(courseId)) {
        throw new APIError('Invalid course ID', 400);
      }

      // Validate input
      const validatedData = UpdateCourseSchema.parse(updateData);

      // Prepare update object
      const updateObject: any = {
        ...validatedData,
        updated_at: new Date().toISOString()
      };

      // Generate new slug if title is being updated
      if (validatedData.title) {
        updateObject.slug = this.generateSlug(validatedData.title);
      }

      // Update course
      const { data, error } = await supabase
        .from('courses')
        .update(updateObject)
        .eq('id', courseId)
        .eq('mentor_id', mentorId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new APIError('Course not found or unauthorized', 404);
        }
        throw new APIError('Failed to update course', 500, 'API_ERROR', error);
      }

      return data as Course;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to update course', 500, 'API_ERROR', error);
    }
  }

  /**
   * Delete course
   */
  async deleteCourse(courseId: string, mentorId: string): Promise<boolean> {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(courseId)) {
        throw new APIError('Invalid course ID', 400);
      }

      // Check if course exists and belongs to mentor
      const { data: course, error: fetchError } = await supabase
        .from('courses')
        .select('enrollment')
        .eq('id', courseId)
        .eq('mentor_id', mentorId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new APIError('Course not found or unauthorized', 404);
        }
        throw new APIError('Failed to fetch course', 500, 'API_ERROR', fetchError);
      }

      // Check if course has enrollments
      const enrollment = course.enrollment as any;
      if (enrollment.currentEnrollment > 0) {
        throw new APIError('Cannot delete course with active enrollments', 400);
      }

      // Delete course
      const { error: deleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)
        .eq('mentor_id', mentorId);

      if (deleteError) {
        throw new APIError('Failed to delete course', 500, 'API_ERROR', deleteError);
      }

      return true;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to delete course', 500, 'API_ERROR', error);
    }
  }

  /**
   * Search and filter courses
   */
  async searchCourses(query: CourseSearchQuery): Promise<{
    courses: Course[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        search,
        filters = {},
        sortBy = 'created_at',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = query;

      // Start building the query
      let supabaseQuery = supabase.from('courses').select('*', { count: 'exact' });

      // Apply status filter (default to published for public search)
      if (filters.status) {
        supabaseQuery = supabaseQuery.eq('status', filters.status);
      } else {
        supabaseQuery = supabaseQuery.eq('status', CourseStatus.PUBLISHED);
      }

      // Apply filters
      if (filters.category) {
        supabaseQuery = supabaseQuery.eq('category', filters.category);
      }

      if (filters.type) {
        supabaseQuery = supabaseQuery.eq('type', filters.type);
      }

      if (filters.mentor_id) {
        supabaseQuery = supabaseQuery.eq('mentor_id', filters.mentor_id);
      }

      // Price range filter (using JSON operators)
      if (filters.minPrice !== undefined) {
        supabaseQuery = supabaseQuery.gte('pricing->>amount', filters.minPrice.toString());
      }
      if (filters.maxPrice !== undefined) {
        supabaseQuery = supabaseQuery.lte('pricing->>amount', filters.maxPrice.toString());
      }

      // Rating filter
      if (filters.rating) {
        supabaseQuery = supabaseQuery.gte('ratings->>average', filters.rating.toString());
      }

      // Text search (using full-text search or ilike)
      if (search) {
        supabaseQuery = supabaseQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Sorting
      const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy;
      supabaseQuery = supabaseQuery.order(sortColumn, { ascending: sortOrder === 'asc' });

      // Pagination
      const offset = (page - 1) * limit;
      supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

      // Execute query
      const { data, error, count } = await supabaseQuery;

      if (error) {
        throw new APIError('Failed to search courses', 500, 'API_ERROR', error);
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        courses: data as Course[],
        total: count || 0,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to search courses', 500, 'API_ERROR', error);
    }
  }

  /**
   * Get courses by mentor
   */
  async getCoursesByMentor(mentorId: string, status?: CourseStatus): Promise<Course[]> {
    try {
      let query = supabase
        .from('courses')
        .select('*')
        .eq('mentor_id', mentorId);

      if (status) {
        query = query.eq('status', status);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new APIError('Failed to fetch mentor courses', 500, 'API_ERROR', error);
      }

      return data as Course[];
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to fetch mentor courses', 500, 'API_ERROR', error);
    }
  }

  /**
   * Publish course
   */
  async publishCourse(courseId: string, mentorId: string): Promise<Course> {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(courseId)) {
        throw new APIError('Invalid course ID', 400);
      }

      // First, get the course to validate it
      const { data: course, error: fetchError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('mentor_id', mentorId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new APIError('Course not found or unauthorized', 404);
        }
        throw new APIError('Failed to fetch course', 500, 'API_ERROR', fetchError);
      }

      // Basic validation for publishing
      const pricing = course.pricing as any;
      if (!course.title || !course.description || !pricing.amount) {
        throw new APIError('Course must have title, description, and pricing to be published', 400);
      }

      // Update status to published
      const { data, error } = await supabase
        .from('courses')
        .update({ 
          status: CourseStatus.PUBLISHED,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId)
        .eq('mentor_id', mentorId)
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to publish course', 500, 'API_ERROR', error);
      }

      return data as Course;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to publish course', 500, 'API_ERROR', error);
    }
  }

  /**
   * Unpublish course
   */
  async unpublishCourse(courseId: string, mentorId: string): Promise<Course> {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(courseId)) {
        throw new APIError('Invalid course ID', 400);
      }

      const { data, error } = await supabase
        .from('courses')
        .update({ 
          status: CourseStatus.DRAFT,
          published_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId)
        .eq('mentor_id', mentorId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new APIError('Course not found or unauthorized', 404);
        }
        throw new APIError('Failed to unpublish course', 500, 'API_ERROR', error);
      }

      return data as Course;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to unpublish course', 500, 'API_ERROR', error);
    }
  }

  /**
   * Get course categories with counts
   */
  async getCategoriesWithCounts(): Promise<{ category: string; count: number }[]> {
    try {
      // Since Supabase doesn't have aggregation like MongoDB, we'll use a simpler approach
      // This could be optimized with a database function or view in production
      const { data, error } = await supabase
        .from('courses')
        .select('category')
        .eq('status', CourseStatus.PUBLISHED);

      if (error) {
        throw new APIError('Failed to fetch categories', 500, 'API_ERROR', error);
      }

      // Count categories in JavaScript
      const categoryCounts: { [key: string]: number } = {};
      data.forEach(course => {
        if (course.category) {
          categoryCounts[course.category] = (categoryCounts[course.category] || 0) + 1;
        }
      });

      // Convert to array and sort by count
      return Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to fetch categories', 500, 'API_ERROR', error);
    }
  }

  /**
   * Get popular tags
   */
  async getPopularTags(limit: number = 20): Promise<{ tag: string; count: number }[]> {
    try {
      // Get all tags from published courses
      const { data, error } = await supabase
        .from('courses')
        .select('tags')
        .eq('status', CourseStatus.PUBLISHED);

      if (error) {
        throw new APIError('Failed to fetch tags', 500, 'API_ERROR', error);
      }

      // Count tags in JavaScript
      const tagCounts: { [key: string]: number } = {};
      data.forEach(course => {
        if (course.tags && Array.isArray(course.tags)) {
          course.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      // Convert to array, sort by count, and limit
      return Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to fetch popular tags', 500, 'API_ERROR', error);
    }
  }
}

