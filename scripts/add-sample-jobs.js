const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sampleJobs = [
  {
    title: 'Frontend Developer Intern',
    description: 'Join our team as a Frontend Developer Intern and work on exciting web applications using React, Next.js, and TypeScript. You will collaborate with senior developers to build user-friendly interfaces and gain hands-on experience in modern web development.',
    short_description: 'Frontend development internship working with React, Next.js, and TypeScript.',
    company_name: 'TechCorp Solutions',
    company_website: 'https://techcorp.example.com',
    type: 'internship',
    experience_level: 'entry',
    work_mode: 'hybrid',
    location: 'Bangalore, India',
    stipend: 25000,
    currency: 'INR',
    requirements: {
      skills: ['React', 'JavaScript', 'HTML', 'CSS', 'TypeScript'],
      qualifications: ['Bachelor\'s degree in Computer Science or related field', 'Basic understanding of web development'],
      experience: 'No prior experience required, but portfolio projects are a plus'
    },
    application_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    max_applications: 50,
    contact_email: 'careers@techcorp.example.com',
    status: 'published',
    featured: true,
    remote_friendly: true,
    published_at: new Date()
  },
  {
    title: 'Full Stack Developer',
    description: 'We are looking for a talented Full Stack Developer to join our growing team. You will be responsible for developing and maintaining web applications using modern technologies including Node.js, React, and PostgreSQL.',
    short_description: 'Full stack development role with Node.js, React, and PostgreSQL.',
    company_name: 'InnovateLabs',
    company_website: 'https://innovatelabs.example.com',
    type: 'full-time',
    experience_level: 'mid',
    work_mode: 'remote',
    location: 'Mumbai, India',
    salary_min: 800000,
    salary_max: 1200000,
    currency: 'INR',
    requirements: {
      skills: ['Node.js', 'React', 'PostgreSQL', 'JavaScript', 'TypeScript', 'Git'],
      qualifications: ['Bachelor\'s degree in Computer Science', '2-4 years of experience in web development'],
      experience: '2-4 years of experience in full stack development'
    },
    application_deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    max_applications: 100,
    contact_email: 'hr@innovatelabs.example.com',
    status: 'published',
    featured: false,
    remote_friendly: true,
    published_at: new Date()
  },
  {
    title: 'Data Science Intern',
    description: 'Exciting opportunity for a Data Science Intern to work on machine learning projects and data analysis. You will work with Python, pandas, scikit-learn, and other data science tools to extract insights from large datasets.',
    short_description: 'Data science internship focusing on machine learning and data analysis.',
    company_name: 'DataDriven Analytics',
    company_website: 'https://datadriven.example.com',
    type: 'internship',
    experience_level: 'entry',
    work_mode: 'onsite',
    location: 'Hyderabad, India',
    stipend: 30000,
    currency: 'INR',
    requirements: {
      skills: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'SQL', 'Statistics'],
      qualifications: ['Bachelor\'s or Master\'s degree in Data Science, Statistics, or related field'],
      experience: 'Academic projects in data science or machine learning'
    },
    application_deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
    max_applications: 30,
    contact_email: 'internships@datadriven.example.com',
    status: 'published',
    featured: true,
    remote_friendly: false,
    published_at: new Date()
  },
  {
    title: 'UI/UX Designer',
    description: 'Join our design team as a UI/UX Designer and help create beautiful, user-friendly interfaces for our web and mobile applications. You will work closely with product managers and developers to deliver exceptional user experiences.',
    short_description: 'UI/UX design role focusing on web and mobile applications.',
    company_name: 'DesignStudio Pro',
    company_website: 'https://designstudio.example.com',
    type: 'full-time',
    experience_level: 'junior',
    work_mode: 'hybrid',
    location: 'Pune, India',
    salary_min: 600000,
    salary_max: 900000,
    currency: 'INR',
    requirements: {
      skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research', 'Wireframing'],
      qualifications: ['Bachelor\'s degree in Design, HCI, or related field', 'Portfolio showcasing UI/UX work'],
      experience: '1-3 years of experience in UI/UX design'
    },
    application_deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
    max_applications: 75,
    contact_email: 'design-jobs@designstudio.example.com',
    status: 'published',
    featured: false,
    remote_friendly: true,
    published_at: new Date()
  },
  {
    title: 'DevOps Engineer',
    description: 'We are seeking a DevOps Engineer to help streamline our development and deployment processes. You will work with cloud platforms, containerization, and CI/CD pipelines to ensure reliable and scalable infrastructure.',
    short_description: 'DevOps role working with cloud platforms and CI/CD pipelines.',
    company_name: 'CloudTech Systems',
    company_website: 'https://cloudtech.example.com',
    type: 'full-time',
    experience_level: 'senior',
    work_mode: 'remote',
    location: 'Delhi, India',
    salary_min: 1200000,
    salary_max: 1800000,
    currency: 'INR',
    requirements: {
      skills: ['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'Linux', 'Python'],
      qualifications: ['Bachelor\'s degree in Computer Science or related field', 'Strong understanding of cloud platforms'],
      experience: '4-6 years of experience in DevOps or system administration'
    },
    application_deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // 40 days from now
    max_applications: 50,
    contact_email: 'devops-careers@cloudtech.example.com',
    status: 'published',
    featured: true,
    remote_friendly: true,
    published_at: new Date()
  }
];

async function addSampleJobs() {
  try {
    console.log('Adding sample job postings...');
    
    // First, we need to get or create an employer user
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'employer')
      .limit(1);
    
    if (userError) {
      console.error('Error fetching employer users:', userError);
      return;
    }
    
    let employerId;
    
    if (users && users.length > 0) {
      employerId = users[0].id;
      console.log('Using existing employer:', employerId);
    } else {
      // Create a sample employer user
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert([{
          email: 'employer@example.com',
          password: '$2b$10$samplehashedpassword', // Sample hashed password
          role: 'employer',
          profile: {
            firstName: 'Sample',
            lastName: 'Employer',
            company: 'Sample Company'
          }
        }])
        .select()
        .single();
      
      if (createUserError) {
        console.error('Error creating employer user:', createUserError);
        return;
      }
      
      employerId = newUser.id;
      console.log('Created new employer:', employerId);
    }
    
    // Add employer_id to all sample jobs
    const jobsWithEmployer = sampleJobs.map(job => ({
      ...job,
      employer_id: employerId
    }));
    
    // Insert sample jobs
    const { data, error } = await supabase
      .from('job_postings')
      .insert(jobsWithEmployer)
      .select();
    
    if (error) {
      console.error('Error inserting sample jobs:', error);
      return;
    }
    
    console.log(`Successfully added ${data.length} sample job postings:`);
    data.forEach(job => {
      console.log(`- ${job.title} at ${job.company_name} (${job.type})`);
    });
    
  } catch (error) {
    console.error('Error adding sample jobs:', error);
  }
}

// Run the script
addSampleJobs().then(() => {
  console.log('Sample jobs script completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});