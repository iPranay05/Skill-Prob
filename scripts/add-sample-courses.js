const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sampleCourses = [
  {
    title: 'React Fundamentals',
    description: 'Learn the basics of React including components, props, state, and hooks. Perfect for beginners who want to start building modern web applications.',
    short_description: 'Master React basics with hands-on projects',
    type: 'live',
    status: 'published',
    slug: 'react-fundamentals',
    meta_title: 'React Fundamentals Course - Learn React from Scratch',
    meta_description: 'Complete React course covering components, hooks, and modern development practices',
    pricing: {
      type: 'paid',
      amount: 2999,
      currency: 'INR',
      discountedAmount: 1999
    },
    content: {
      duration: '8 weeks',
      level: 'beginner',
      language: 'English',
      prerequisites: ['Basic HTML', 'Basic CSS', 'Basic JavaScript']
    },
    media: {
      thumbnail: 'https://via.placeholder.com/400x300?text=React+Course',
      trailer: null
    },
    enrollment: {
      maxStudents: 50,
      currentEnrollment: 0
    },
    ratings: {
      average: 0,
      count: 0
    }
  },
  {
    title: 'Node.js Backend Development',
    description: 'Build scalable backend applications with Node.js, Express, and MongoDB. Learn API development, authentication, and deployment.',
    short_description: 'Build powerful backend APIs with Node.js',
    type: 'live',
    status: 'published',
    slug: 'nodejs-backend-development',
    meta_title: 'Node.js Backend Development Course',
    meta_description: 'Learn to build REST APIs, handle authentication, and deploy Node.js applications',
    pricing: {
      type: 'paid',
      amount: 3999,
      currency: 'INR',
      discountedAmount: 2999
    },
    content: {
      duration: '10 weeks',
      level: 'intermediate',
      language: 'English',
      prerequisites: ['JavaScript fundamentals', 'Basic understanding of databases']
    },
    media: {
      thumbnail: 'https://via.placeholder.com/400x300?text=Node.js+Course',
      trailer: null
    },
    enrollment: {
      maxStudents: 30,
      currentEnrollment: 0
    },
    ratings: {
      average: 0,
      count: 0
    }
  },
  {
    title: 'Python for Data Science',
    description: 'Learn Python programming for data analysis, visualization, and machine learning. Includes pandas, numpy, matplotlib, and scikit-learn.',
    short_description: 'Master Python for data analysis and ML',
    type: 'live',
    status: 'published',
    slug: 'python-for-data-science',
    meta_title: 'Python for Data Science Course',
    meta_description: 'Complete Python data science course with hands-on projects and real datasets',
    pricing: {
      type: 'paid',
      amount: 4999,
      currency: 'INR',
      discountedAmount: 3499
    },
    content: {
      duration: '12 weeks',
      level: 'beginner',
      language: 'English',
      prerequisites: ['Basic programming knowledge']
    },
    media: {
      thumbnail: 'https://via.placeholder.com/400x300?text=Python+Data+Science',
      trailer: null
    },
    enrollment: {
      maxStudents: 40,
      currentEnrollment: 0
    },
    ratings: {
      average: 0,
      count: 0
    }
  },
  {
    title: 'Digital Marketing Masterclass',
    description: 'Complete digital marketing course covering SEO, social media marketing, Google Ads, content marketing, and analytics.',
    short_description: 'Master all aspects of digital marketing',
    type: 'live',
    status: 'published',
    slug: 'digital-marketing-masterclass',
    meta_title: 'Digital Marketing Masterclass - Complete Course',
    meta_description: 'Learn SEO, social media marketing, Google Ads, and content marketing strategies',
    pricing: {
      type: 'paid',
      amount: 3499,
      currency: 'INR',
      discountedAmount: 2499
    },
    content: {
      duration: '8 weeks',
      level: 'beginner',
      language: 'English',
      prerequisites: ['Basic computer skills']
    },
    media: {
      thumbnail: 'https://via.placeholder.com/400x300?text=Digital+Marketing',
      trailer: null
    },
    enrollment: {
      maxStudents: 60,
      currentEnrollment: 0
    },
    ratings: {
      average: 0,
      count: 0
    }
  },
  {
    title: 'UI/UX Design Fundamentals',
    description: 'Learn user interface and user experience design principles, tools like Figma, and create stunning designs for web and mobile.',
    short_description: 'Design beautiful and user-friendly interfaces',
    type: 'live',
    status: 'published',
    slug: 'ui-ux-design-fundamentals',
    meta_title: 'UI/UX Design Fundamentals Course',
    meta_description: 'Learn design principles, Figma, and create amazing user experiences',
    pricing: {
      type: 'paid',
      amount: 3999,
      currency: 'INR',
      discountedAmount: 2799
    },
    content: {
      duration: '10 weeks',
      level: 'beginner',
      language: 'English',
      prerequisites: ['Creative mindset', 'Basic computer skills']
    },
    media: {
      thumbnail: 'https://via.placeholder.com/400x300?text=UI+UX+Design',
      trailer: null
    },
    enrollment: {
      maxStudents: 35,
      currentEnrollment: 0
    },
    ratings: {
      average: 0,
      count: 0
    }
  }
];

async function addSampleCourses() {
  try {
    console.log('🚀 Adding sample courses to database...');

    // First, let's check if we have any mentors to assign courses to
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'mentor')
      .limit(1);

    if (usersError) {
      console.error('Error fetching mentors:', usersError);
      return;
    }

    let mentorId;
    if (users && users.length > 0) {
      mentorId = users[0].id;
      console.log(`📚 Using existing mentor: ${users[0].email}`);
    } else {
      // Create a sample mentor user
      console.log('👨‍🏫 Creating sample mentor user...');
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          email: 'mentor@skillprobe.com',
          password: '$2b$10$example.hash.for.demo.purposes.only',
          role: 'mentor',
          profile: {
            firstName: 'John',
            lastName: 'Mentor',
            bio: 'Experienced instructor with 10+ years in tech education',
            expertise: ['Web Development', 'Data Science', 'Digital Marketing'],
            socialLinks: {
              linkedin: 'https://linkedin.com/in/johnmentor',
              twitter: 'https://twitter.com/johnmentor'
            }
          },
          verification: {
            emailVerified: true,
            phoneVerified: false,
            kycStatus: 'approved'
          }
        })
        .select()
        .single();

      if (createUserError) {
        console.error('Error creating mentor:', createUserError);
        return;
      }

      mentorId = newUser.id;
      console.log(`✅ Created mentor: ${newUser.email}`);
    }

    // Get categories for assignment
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return;
    }

    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });

    // Map courses to categories and add mentor_id
    const coursesWithMentor = [
      { ...sampleCourses[0], mentor_id: mentorId, category_id: categoryMap['Programming'] },
      { ...sampleCourses[1], mentor_id: mentorId, category_id: categoryMap['Programming'] },
      { ...sampleCourses[2], mentor_id: mentorId, category_id: categoryMap['Data Science'] },
      { ...sampleCourses[3], mentor_id: mentorId, category_id: categoryMap['Marketing'] },
      { ...sampleCourses[4], mentor_id: mentorId, category_id: categoryMap['Design'] }
    ];

    // Insert courses
    const { data: insertedCourses, error: coursesError } = await supabase
      .from('courses')
      .insert(coursesWithMentor)
      .select();

    if (coursesError) {
      console.error('Error inserting courses:', coursesError);
      return;
    }

    console.log(`✅ Successfully added ${insertedCourses.length} sample courses:`);
    insertedCourses.forEach(course => {
      console.log(`   📖 ${course.title} (${course.category})`);
    });

    console.log('\n🎉 Sample courses added successfully!');
    console.log('You can now create live sessions for these courses.');

  } catch (error) {
    console.error('❌ Error adding sample courses:', error);
  }
}

// Run the script
addSampleCourses().then(() => {
  console.log('Script completed.');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});