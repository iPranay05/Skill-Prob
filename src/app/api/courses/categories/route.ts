import { NextRequest, NextResponse } from 'next/server';
import { CourseService } from '../../../../lib/courseService';
import { APIError } from '../../../../lib/errors';
import { COURSE_CATEGORIES } from '../../../../models/Course';

const courseService = new CourseService();

/**
 * GET /api/courses/categories - Get course categories with counts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeCounts = searchParams.get('includeCounts') === 'true';

    if (includeCounts) {
      // Get categories with course counts
      const categoriesWithCounts = await courseService.getCategoriesWithCounts();
      
      // Merge with all available categories
      const allCategories = COURSE_CATEGORIES.map(category => {
        const found = categoriesWithCounts.find(c => c.category === category);
        return {
          category,
          count: found ? found.count : 0
        };
      });

      return NextResponse.json({
        success: true,
        data: allCategories
      });
    } else {
      // Return just the category list
      return NextResponse.json({
        success: true,
        data: COURSE_CATEGORIES.map(category => ({ category, count: 0 }))
      });
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    
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
