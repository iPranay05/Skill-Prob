-- First check what courses exist
SELECT id, title, mentor_id, status, created_at 
FROM courses 
ORDER BY created_at DESC 
LIMIT 10;

-- If no courses exist, create a sample course
INSERT INTO courses (
  id,
  title,
  description,
  short_description,
  mentor_id,
  category,
  type,
  status,
  pricing,
  content,
  media,
  created_at,
  updated_at
) VALUES (
  'ebaf51cc-8670-478c-b635-06d041e3eb6d',
  'Full Stack Web Development',
  'Complete course on modern web development with React, Node.js, and databases',
  'Learn full stack development from scratch',
  (SELECT id FROM users WHERE role = 'mentor' LIMIT 1), -- Use first mentor
  'programming',
  'recorded',
  'published',
  jsonb_build_object('amount', 2999, 'currency', 'INR', 'type', 'one_time'),
  jsonb_build_object(
    'syllabus', ARRAY[
      'Introduction to Web Development',
      'HTML & CSS Fundamentals', 
      'JavaScript Basics',
      'React.js Framework',
      'Node.js Backend',
      'Database Integration',
      'Deployment & Production'
    ],
    'prerequisites', ARRAY['Basic computer knowledge', 'Internet connection'],
    'learningOutcomes', ARRAY[
      'Build complete web applications',
      'Understand frontend and backend development',
      'Deploy applications to production',
      'Work with modern development tools'
    ]
  ),
  jsonb_build_object(
    'thumbnail', 'https://wgpbedflbhbjcbdt.supabase.co/storage/v1/object/public/courses/thumbnails/17615666909-j20wjfwp3.jpg',
    'trailer', 'https://wgpbedflbhbjcbdt.supabase.co/storage/v1/object/public/courses/trailers/17615674708-5rcbc4tmx.mp4'
  ),
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  media = EXCLUDED.media,
  content = EXCLUDED.content,
  updated_at = NOW();

-- Create enrollment for testing
INSERT INTO enrollments (
  id,
  student_id,
  course_id,
  status,
  progress,
  enrolled_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM users WHERE role = 'student' LIMIT 1), -- Use first student
  'ebaf51cc-8670-478c-b635-06d041e3eb6d',
  'active',
  25,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Verify everything worked
SELECT 
  c.id, 
  c.title, 
  c.status,
  c.media,
  c.content->'syllabus' as syllabus
FROM courses c 
WHERE c.id = 'ebaf51cc-8670-478c-b635-06d041e3eb6d';