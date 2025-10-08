import { createClient } from '@supabase/supabase-js';
import {
  CourseChapter,
  CourseContent,
  CourseResource,
  CreateChapterInput,
  UpdateChapterInput,
  CreateContentInput,
  UpdateContentInput,
  CreateResourceInput,
  CreateChapterSchema,
  UpdateChapterSchema,
  CreateContentSchema,
  UpdateContentSchema,
  CreateResourceSchema,
  ContentType
} from '../models/CourseContent';
import { APIError } from './errors';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class CourseContentService {
  /**
   * Validate UUID format
   */
  private validateUUID(id: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new APIError('Invalid ID format', 400);
    }
  }

  /**
   * Check if user owns the course
   */
  private async validateCourseOwnership(courseId: string, mentorId: string): Promise<void> {
    const { data, error } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('mentor_id', mentorId)
      .single();

    if (error || !data) {
      throw new APIError('Course not found or unauthorized', 404);
    }
  }

  // ==================== CHAPTER MANAGEMENT ====================

  /**
   * Create a new chapter
   */
  async createChapter(courseId: string, mentorId: string, chapterData: CreateChapterInput): Promise<CourseChapter> {
    try {
      this.validateUUID(courseId);
      await this.validateCourseOwnership(courseId, mentorId);

      // Validate input
      const validatedData = CreateChapterSchema.parse({
        ...chapterData,
        course_id: courseId
      });

      // Insert chapter
      const { data, error } = await supabase
        .from('course_chapters')
        .insert(validatedData)
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to create chapter', 500, 'CREATE_CHAPTER_ERROR', error);
      }

      return data as CourseChapter;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to create chapter', 500, 'CREATE_CHAPTER_ERROR', error);
    }
  }

  /**
   * Get chapters for a course
   */
  async getChaptersByCourse(courseId: string): Promise<CourseChapter[]> {
    try {
      this.validateUUID(courseId);

      const { data, error } = await supabase
        .from('course_chapters')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) {
        throw new APIError('Failed to fetch chapters', 500, 'FETCH_CHAPTERS_ERROR', error);
      }

      return data as CourseChapter[];
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to fetch chapters', 500, 'FETCH_CHAPTERS_ERROR', error);
    }
  }

  /**
   * Update chapter
   */
  async updateChapter(
    chapterId: string,
    courseId: string,
    mentorId: string,
    updateData: UpdateChapterInput
  ): Promise<CourseChapter> {
    try {
      this.validateUUID(chapterId);
      this.validateUUID(courseId);
      await this.validateCourseOwnership(courseId, mentorId);

      // Validate input
      const validatedData = UpdateChapterSchema.parse(updateData);

      // Update chapter
      const { data, error } = await supabase
        .from('course_chapters')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', chapterId)
        .eq('course_id', courseId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new APIError('Chapter not found', 404);
        }
        throw new APIError('Failed to update chapter', 500, 'UPDATE_CHAPTER_ERROR', error);
      }

      return data as CourseChapter;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to update chapter', 500, 'UPDATE_CHAPTER_ERROR', error);
    }
  }

  /**
   * Delete chapter
   */
  async deleteChapter(chapterId: string, courseId: string, mentorId: string): Promise<void> {
    try {
      this.validateUUID(chapterId);
      this.validateUUID(courseId);
      await this.validateCourseOwnership(courseId, mentorId);

      // Delete chapter (this will cascade delete content due to foreign key constraints)
      const { error } = await supabase
        .from('course_chapters')
        .delete()
        .eq('id', chapterId)
        .eq('course_id', courseId);

      if (error) {
        throw new APIError('Failed to delete chapter', 500, 'DELETE_CHAPTER_ERROR', error);
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to delete chapter', 500, 'DELETE_CHAPTER_ERROR', error);
    }
  }

  // ==================== CONTENT MANAGEMENT ====================

  /**
   * Create content within a chapter
   */
  async createContent(
    chapterId: string,
    courseId: string,
    mentorId: string,
    contentData: CreateContentInput
  ): Promise<CourseContent> {
    try {
      this.validateUUID(chapterId);
      this.validateUUID(courseId);
      await this.validateCourseOwnership(courseId, mentorId);

      // Validate input
      const validatedData = CreateContentSchema.parse({
        ...contentData,
        chapter_id: chapterId
      });

      // Insert content
      const { data, error } = await supabase
        .from('course_content')
        .insert(validatedData)
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to create content', 500, 'CREATE_CONTENT_ERROR', error);
      }

      return data as CourseContent;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to create content', 500, 'CREATE_CONTENT_ERROR', error);
    }
  }

  /**
   * Get content for a chapter
   */
  async getContentByChapter(chapterId: string): Promise<CourseContent[]> {
    try {
      this.validateUUID(chapterId);

      const { data, error } = await supabase
        .from('course_content')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('order_index', { ascending: true });

      if (error) {
        throw new APIError('Failed to fetch content', 500, 'FETCH_CONTENT_ERROR', error);
      }

      return data as CourseContent[];
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to fetch content', 500, 'FETCH_CONTENT_ERROR', error);
    }
  }

  /**
   * Update content
   */
  async updateContent(
    contentId: string,
    chapterId: string,
    courseId: string,
    mentorId: string,
    updateData: UpdateContentInput
  ): Promise<CourseContent> {
    try {
      this.validateUUID(contentId);
      this.validateUUID(chapterId);
      this.validateUUID(courseId);
      await this.validateCourseOwnership(courseId, mentorId);

      // Validate input
      const validatedData = UpdateContentSchema.parse(updateData);

      // Update content
      const { data, error } = await supabase
        .from('course_content')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId)
        .eq('chapter_id', chapterId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new APIError('Content not found', 404);
        }
        throw new APIError('Failed to update content', 500, 'UPDATE_CONTENT_ERROR', error);
      }

      return data as CourseContent;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to update content', 500, 'UPDATE_CONTENT_ERROR', error);
    }
  }

  /**
   * Delete content
   */
  async deleteContent(
    contentId: string,
    chapterId: string,
    courseId: string,
    mentorId: string
  ): Promise<void> {
    try {
      this.validateUUID(contentId);
      this.validateUUID(chapterId);
      this.validateUUID(courseId);
      await this.validateCourseOwnership(courseId, mentorId);

      // Delete content
      const { error } = await supabase
        .from('course_content')
        .delete()
        .eq('id', contentId)
        .eq('chapter_id', chapterId);

      if (error) {
        throw new APIError('Failed to delete content', 500, 'DELETE_CONTENT_ERROR', error);
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to delete content', 500, 'DELETE_CONTENT_ERROR', error);
    }
  }

  // ==================== RESOURCE MANAGEMENT ====================

  /**
   * Create a resource
   */
  async createResource(
    courseId: string,
    mentorId: string,
    resourceData: CreateResourceInput
  ): Promise<CourseResource> {
    try {
      this.validateUUID(courseId);
      await this.validateCourseOwnership(courseId, mentorId);

      // Validate input
      const validatedData = CreateResourceSchema.parse({
        ...resourceData,
        course_id: courseId
      });

      // Insert resource
      const { data, error } = await supabase
        .from('course_resources')
        .insert(validatedData)
        .select()
        .single();

      if (error) {
        throw new APIError('Failed to create resource', 500, 'CREATE_RESOURCE_ERROR', error);
      }

      return data as CourseResource;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to create resource', 500, 'CREATE_RESOURCE_ERROR', error);
    }
  }

  /**
   * Get resources for a course
   */
  async getResourcesByCourse(courseId: string): Promise<CourseResource[]> {
    try {
      this.validateUUID(courseId);

      const { data, error } = await supabase
        .from('course_resources')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new APIError('Failed to fetch resources', 500, 'FETCH_RESOURCES_ERROR', error);
      }

      return data as CourseResource[];
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to fetch resources', 500, 'FETCH_RESOURCES_ERROR', error);
    }
  }

  /**
   * Get resources for a chapter
   */
  async getResourcesByChapter(chapterId: string): Promise<CourseResource[]> {
    try {
      this.validateUUID(chapterId);

      const { data, error } = await supabase
        .from('course_resources')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new APIError('Failed to fetch chapter resources', 500, 'FETCH_CHAPTER_RESOURCES_ERROR', error);
      }

      return data as CourseResource[];
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to fetch chapter resources', 500, 'FETCH_CHAPTER_RESOURCES_ERROR', error);
    }
  }

  /**
   * Delete resource
   */
  async deleteResource(resourceId: string, courseId: string, mentorId: string): Promise<void> {
    try {
      this.validateUUID(resourceId);
      this.validateUUID(courseId);
      await this.validateCourseOwnership(courseId, mentorId);

      // Delete resource
      const { error } = await supabase
        .from('course_resources')
        .delete()
        .eq('id', resourceId)
        .eq('course_id', courseId);

      if (error) {
        throw new APIError('Failed to delete resource', 500, 'DELETE_RESOURCE_ERROR', error);
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to delete resource', 500, 'DELETE_RESOURCE_ERROR', error);
    }
  }

  /**
   * Increment download count for a resource
   */
  async incrementDownloadCount(resourceId: string): Promise<void> {
    try {
      this.validateUUID(resourceId);

      const { error } = await supabase
        .rpc('increment_download_count', { resource_id: resourceId });

      if (error) {
        throw new APIError('Failed to update download count', 500, 'UPDATE_DOWNLOAD_COUNT_ERROR', error);
      }
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to update download count', 500, 'UPDATE_DOWNLOAD_COUNT_ERROR', error);
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get complete course structure with chapters and content
   */
  async getCourseStructure(courseId: string): Promise<{
    chapters: (CourseChapter & { content: CourseContent[] })[];
    resources: CourseResource[];
  }> {
    try {
      this.validateUUID(courseId);

      // Get chapters with their content
      const { data: chapters, error: chaptersError } = await supabase
        .from('course_chapters')
        .select(`
          *,
          course_content (*)
        `)
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (chaptersError) {
        throw new APIError('Failed to fetch course structure', 500, 'FETCH_STRUCTURE_ERROR', chaptersError);
      }

      // Get course resources
      const resources = await this.getResourcesByCourse(courseId);

      // Format the response
      const formattedChapters = chapters.map(chapter => ({
        ...chapter,
        content: (chapter as any).course_content.sort((a: any, b: any) => a.order_index - b.order_index)
      }));

      return {
        chapters: formattedChapters as (CourseChapter & { content: CourseContent[] })[],
        resources
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to fetch course structure', 500, 'FETCH_STRUCTURE_ERROR', error);
    }
  }
}