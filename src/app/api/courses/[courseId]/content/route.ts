import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../../../lib/auth';
import { APIError } from '../../../../../lib/errors';
import { UserRole } from '../../../../../types/user';
import { supabaseAdmin } from '../../../../../lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a mentor
    if (authResult.user.role !== UserRole.MENTOR) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Mentor role required.' },
        { status: 403 }
      );
    }

    const { courseId } = await params;

    // Get course with chapters and content
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, title, status')
      .eq('id', courseId)
      .eq('mentor_id', authResult.user.userId)
      .single();

    if (courseError) {
      if (courseError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Course not found or access denied' },
          { status: 404 }
        );
      }
      throw new APIError(`Failed to fetch course: ${courseError.message}`, 500);
    }

    // Get chapters
    const { data: chapters, error: chaptersError } = await supabaseAdmin
      .from('course_chapters')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');

    if (chaptersError) {
      throw new APIError(`Failed to fetch chapters: ${chaptersError.message}`, 500);
    }

    // Get content for each chapter
    const chaptersWithContent = await Promise.all(
      (chapters || []).map(async (chapter) => {
        const { data: content, error: contentError } = await supabaseAdmin
          .from('course_content')
          .select('*')
          .eq('chapter_id', chapter.id)
          .order('order_index');

        if (contentError) {
          throw new APIError(`Failed to fetch content: ${contentError.message}`, 500);
        }

        return {
          ...chapter,
          content: content || []
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        ...course,
        chapters: chaptersWithContent
      }
    });

  } catch (error) {
    console.error('Course content fetch error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a mentor
    if (authResult.user.role !== UserRole.MENTOR) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Mentor role required.' },
        { status: 403 }
      );
    }

    const { courseId } = await params;
    const body = await request.json();
    const { chapters } = body;

    // Verify course ownership
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('mentor_id', authResult.user.userId)
      .single();

    if (courseError) {
      if (courseError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Course not found or access denied' },
          { status: 404 }
        );
      }
      throw new APIError(`Failed to verify course: ${courseError.message}`, 500);
    }

    // Update chapters and content
    for (const chapter of chapters) {
      if (chapter.id) {
        // Update existing chapter
        const { error: updateError } = await supabaseAdmin
          .from('course_chapters')
          .update({
            title: chapter.title,
            description: chapter.description,
            order_index: chapter.order_index,
            duration_minutes: chapter.duration_minutes,
            is_free: chapter.is_free
          })
          .eq('id', chapter.id);

        if (updateError) {
          throw new APIError(`Failed to update chapter: ${updateError.message}`, 500);
        }
      } else {
        // Create new chapter
        const { data: newChapter, error: createError } = await supabaseAdmin
          .from('course_chapters')
          .insert({
            course_id: courseId,
            title: chapter.title,
            description: chapter.description,
            order_index: chapter.order_index,
            duration_minutes: chapter.duration_minutes,
            is_free: chapter.is_free
          })
          .select()
          .single();

        if (createError) {
          throw new APIError(`Failed to create chapter: ${createError.message}`, 500);
        }

        chapter.id = newChapter.id;
      }

      // Update chapter content
      for (const content of chapter.content || []) {
        if (content.id) {
          // Update existing content
          const { error: updateContentError } = await supabaseAdmin
            .from('course_content')
            .update({
              title: content.title,
              description: content.description,
              type: content.type,
              order_index: content.order_index,
              content_data: content.content_data,
              is_free: content.is_free,
              duration_minutes: content.duration_minutes
            })
            .eq('id', content.id);

          if (updateContentError) {
            throw new APIError(`Failed to update content: ${updateContentError.message}`, 500);
          }
        } else {
          // Create new content
          const { error: createContentError } = await supabaseAdmin
            .from('course_content')
            .insert({
              chapter_id: chapter.id,
              title: content.title,
              description: content.description,
              type: content.type,
              order_index: content.order_index,
              content_data: content.content_data,
              is_free: content.is_free,
              duration_minutes: content.duration_minutes
            });

          if (createContentError) {
            throw new APIError(`Failed to create content: ${createContentError.message}`, 500);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Course content updated successfully'
    });

  } catch (error) {
    console.error('Course content update error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}