import { NextRequest, NextResponse } from 'next/server';
import { CourseService } from '../../../../lib/courseService';
import { APIError } from '../../../../lib/errors';

const courseService = new CourseService();

// Fallback categories if database is not available
const FALLBACK_CATEGORIES = [
  { id: '1', name: 'Programming', description: 'Software development and programming courses' },
  { id: '2', name: 'Data Science', description: 'Data analysis, machine learning, and AI courses' },
  { id: '3', name: 'Web Development', description: 'Frontend and backend web development' },
  { id: '4', name: 'Mobile Development', description: 'iOS and Android app development' },
  { id: '5', name: 'DevOps', description: 'DevOps and infrastructure courses' },
  { id: '6', name: 'Cybersecurity', description: 'Security and ethical hacking courses' },
  { id: '7', name: 'AI/ML', description: 'Artificial Intelligence and Machine Learning' },
  { id: '8', name: 'Cloud Computing', description: 'AWS, Azure, GCP cloud platforms' },
  { id: '9', name: 'Database', description: 'Database design and management' },
  { id: '10', name: 'UI/UX Design', description: 'User interface and experience design' },
  { id: '11', name: 'Digital Marketing', description: 'Online marketing and growth strategies' },
  { id: '12', name: 'Business', description: 'Business skills and entrepreneurship' },
  { id: '13', name: 'Other', description: 'Other miscellaneous courses' }
];

/**
 * GET /api/courses/categories - Get course categories
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeCounts = searchParams.get('includeCounts') === 'true';

    // Try to fetch from database first
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Fetch categories from database
        const { data: categories, error } = await supabase
          .from('categories')
          .select('id, name, description')
          .order('name');

        if (!error && categories && categories.length > 0) {
          if (includeCounts) {
            // Get course counts for each category
            const { data: courseCounts } = await supabase
              .from('courses')
              .select('category_id')
              .eq('status', 'published');

            // Count courses per category
            const countMap: { [key: string]: number } = {};
            courseCounts?.forEach(course => {
              if (course.category_id) {
                countMap[course.category_id] = (countMap[course.category_id] || 0) + 1;
              }
            });

            // Add counts to categories
            const categoriesWithCounts = categories.map(category => ({
              id: category.id,
              name: category.name,
              description: category.description,
              count: countMap[category.id] || 0
            }));

            return NextResponse.json({
              success: true,
              data: categoriesWithCounts
            });
          } else {
            // Return categories without counts
            return NextResponse.json({
              success: true,
              data: categories.map(category => ({
                id: category.id,
                name: category.name,
                description: category.description,
                count: 0
              }))
            });
          }
        }
      }
    } catch (dbError) {
      console.log('Database not available, using fallback categories:', dbError);
    }

    // Fallback to hardcoded categories
    console.log('Using fallback categories');
    return NextResponse.json({
      success: true,
      data: FALLBACK_CATEGORIES.map(category => ({
        ...category,
        count: 0
      }))
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    
    // Return fallback categories even on error
    return NextResponse.json({
      success: true,
      data: FALLBACK_CATEGORIES.map(category => ({
        ...category,
        count: 0
      }))
    });
  }
}
