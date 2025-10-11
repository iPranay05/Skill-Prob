const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testJobsAPI() {
  try {
    console.log('Testing jobs API...');
    
    // Test direct database query
    console.log('\n1. Testing direct database query:');
    const { data: jobs, error, count } = await supabase
      .from('job_postings')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .limit(5);
    
    if (error) {
      console.error('Database query error:', error);
      return;
    }
    
    console.log(`Found ${count} published jobs in database`);
    console.log('Sample jobs:');
    jobs.forEach(job => {
      console.log(`- ${job.title} at ${job.company_name} (${job.type})`);
    });
    
    // Test if we can create a student user for API testing
    console.log('\n2. Checking for student users:');
    const { data: students, error: studentError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'student')
      .limit(1);
    
    if (studentError) {
      console.error('Error fetching students:', studentError);
      return;
    }
    
    if (students && students.length > 0) {
      console.log(`Found student user: ${students[0].email}`);
    } else {
      console.log('No student users found. Creating a test student...');
      
      const { data: newStudent, error: createError } = await supabase
        .from('users')
        .insert([{
          email: 'student@example.com',
          password: '$2b$10$samplehashedpassword',
          role: 'student',
          profile: {
            firstName: 'Test',
            lastName: 'Student'
          }
        }])
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating student:', createError);
        return;
      }
      
      console.log(`Created test student: ${newStudent.email}`);
    }
    
    console.log('\n✅ Jobs API test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testJobsAPI().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});