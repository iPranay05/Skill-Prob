'use client';

import Link from 'next/link';
import { Search, Filter, Star, Users, Clock, CheckCircle, Play, Calendar } from 'lucide-react';
import { useState } from 'react';

export default function LandingPageCourses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    courseType: [],
    categories: [],
    price: [],
    rating: [],
    level: []
  });

  const categories = [
    {
      title: 'Web Development',
      description: 'Build modern websites and applications with HTML, CSS, JavaScript, React, Node.js, and more. Get hands-on experience with real projects.',
      courses: [
        'Full Stack Web Development Bootcamp (Live + Recorded)',
        'MERN Stack Mastery',
        'Frontend Development with React',
        'Backend Development with Node.js'
      ]
    },
    {
      title: 'Data Science & AI',
      description: 'Master data analysis, machine learning, and artificial intelligence. Learn Python, R, TensorFlow, and popular data science libraries.',
      courses: [
        'Complete Data Science with Python',
        'Machine Learning A-Z',
        'Data Analytics for Beginners',
        'Deep Learning Specialization'
      ]
    },
    {
      title: 'Digital Marketing',
      description: 'Learn SEO, social media marketing, content strategy, and digital advertising. Build campaigns that drive real results.',
      courses: [
        'Digital Marketing Masterclass',
        'SEO & Content Marketing',
        'Social Media Marketing Strategy',
        'Google Ads & PPC Mastery'
      ]
    },
    {
      title: 'Design & Creative',
      description: 'Master UI/UX design, graphic design, video editing, and creative tools like Figma, Adobe XD, Photoshop, and Premiere Pro.',
      courses: [
        'UI/UX Design Bootcamp',
        'Graphic Design with Adobe Suite',
        'Video Editing Mastery',
        '3D Design & Animation'
      ]
    }
  ];

  const features = [
    {
      title: 'Live Interactive Sessions',
      description: 'Join scheduled Google Meet classes where you can interact directly with mentors, ask questions, and collaborate with peers.'
    },
    {
      title: 'Comprehensive Recorded Content',
      description: 'Access organized video libraries with chapter-wise content, downloadable resources, and lifetime access to materials.'
    },
    {
      title: 'Hands-On Projects',
      description: 'Every course includes real-world projects that build your portfolio and demonstrate practical skills to employers.'
    },
    {
      title: 'Industry-Recognized Certificates',
      description: 'Earn verifiable certificates upon completion that you can share on LinkedIn and include in your resume.'
    },
    {
      title: 'Mentor Support',
      description: 'Get guidance from experienced professionals who provide personalized feedback and career advice.'
    },
    {
      title: 'Assessment & Quizzes',
      description: 'Test your knowledge with regular quizzes and assignments that reinforce learning and track progress.'
    }
  ];

  const comparisonFeatures = [
    { feature: 'Real-time interaction', live: true, recorded: false },
    { feature: 'Learn at your pace', live: false, recorded: true },
    { feature: 'Live Q&A sessions', live: true, recorded: false },
    { feature: 'Session recordings', live: true, recorded: true },
    { feature: 'Downloadable resources', live: true, recorded: true },
    { feature: 'Certificate', live: true, recorded: true },
    { feature: 'Mentor support', live: true, recorded: true },
    { feature: 'Lifetime access', live: false, recorded: true }
  ];

  const learningPaths = [
    {
      title: 'Become a Full Stack Developer',
      duration: '6 months',
      courses: '10 courses',
      level: 'Beginner to Advanced'
    },
    {
      title: 'Data Science Career Track',
      duration: '5 months',
      courses: '8 courses',
      level: 'Project-based learning'
    },
    {
      title: 'Digital Marketing Professional',
      duration: '4 months',
      courses: '6 courses',
      level: 'Industry certifications'
    }
  ];

  const trendingCourses = [
    {
      title: 'Full Stack Web Development Bootcamp',
      mentor: 'Rahul Sharma',
      rating: 4.8,
      students: 2500,
      price: '₹4,999',
      type: 'Live + Recorded',
      thumbnail: '💻'
    },
    {
      title: 'Complete Data Science with Python',
      mentor: 'Priya Singh',
      rating: 4.9,
      students: 1800,
      price: '₹3,999',
      type: 'Recorded',
      thumbnail: '📊'
    },
    {
      title: 'Digital Marketing Masterclass',
      mentor: 'Amit Kumar',
      rating: 4.7,
      students: 3200,
      price: '₹2,999',
      type: 'Live',
      thumbnail: '📱'
    },
    {
      title: 'UI/UX Design Bootcamp',
      mentor: 'Sneha Patel',
      rating: 4.8,
      students: 1500,
      price: '₹3,499',
      type: 'Hybrid',
      thumbnail: '🎨'
    }
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
      
      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-visible bg-white">
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full border-2 border-black mb-8">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
            <span className="text-sm font-bold uppercase tracking-wide" style={{ color: '#5e17eb' }}>
              Explore Our Courses
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl lg:text-6xl font-black leading-tight mb-6" style={{ color: '#000000' }}>
            <span className="block">Master In-Demand Skills</span>
            <span className="block" style={{ color: '#5e17eb' }}>with Expert Mentors</span>
          </h1>

          {/* Description */}
          <p className="text-xl leading-relaxed max-w-4xl mx-auto mb-12" style={{ color: '#000000' }}>
            Choose from 500+ carefully curated courses designed to help you build job-ready skills. Whether you prefer live interactive sessions or self-paced learning, we have the perfect course for you.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#5e17eb' }} />
              <input
                type="text"
                placeholder="Search for courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-black rounded-xl focus:outline-none focus:border-purple-600"
                style={{ color: '#000000' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black mb-8 text-center" style={{ color: '#000000' }}>Filter Your Learning Path</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Course Type Filter */}
            <div className="bg-white rounded-2xl p-6 border-2 border-black">
              <h3 className="text-xl font-black mb-4" style={{ color: '#5e17eb' }}>Course Type</h3>
              <div className="space-y-3">
                {['Live Classes', 'Recorded Sessions', 'Hybrid (Live + Recorded)'].map((type) => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" style={{ accentColor: '#5e17eb' }} />
                    <span style={{ color: '#000000' }}>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Categories Filter */}
            <div className="bg-white rounded-2xl p-6 border-2 border-black">
              <h3 className="text-xl font-black mb-4" style={{ color: '#5e17eb' }}>Categories</h3>
              <div className="space-y-3">
                {['Web Development', 'Data Science & AI', 'Digital Marketing', 'Design & Creative', 'Business & Management', 'Programming Languages'].map((category) => (
                  <label key={category} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" style={{ accentColor: '#5e17eb' }} />
                    <span style={{ color: '#000000' }}>{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price & Level Filter */}
            <div className="bg-white rounded-2xl p-6 border-2 border-black">
              <h3 className="text-xl font-black mb-4" style={{ color: '#5e17eb' }}>Price & Level</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold mb-2" style={{ color: '#000000' }}>Price:</h4>
                  <div className="space-y-2">
                    {['Free', 'Under ₹999', '₹1000 - ₹4999', '₹5000+'].map((price) => (
                      <label key={price} className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4" style={{ accentColor: '#5e17eb' }} />
                        <span style={{ color: '#000000' }}>{price}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-2" style={{ color: '#000000' }}>Level:</h4>
                  <div className="space-y-2">
                    {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                      <label key={level} className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4" style={{ accentColor: '#5e17eb' }} />
                        <span style={{ color: '#000000' }}>{level}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ color: '#000000' }}>Popular Categories</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {categories.map((category, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 border-2 border-black">
                <h3 className="text-2xl font-black mb-4" style={{ color: '#5e17eb' }}>{category.title}</h3>
                <p className="mb-6 leading-relaxed" style={{ color: '#000000' }}>{category.description}</p>
                <div className="space-y-2">
                  <h4 className="font-bold" style={{ color: '#000000' }}>Featured Courses:</h4>
                  {category.courses.map((course, courseIdx) => (
                    <div key={courseIdx} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                      <span style={{ color: '#000000' }}>{course}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Our Courses Stand Out */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ color: '#000000' }}>Why Our Courses Stand Out</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 text-center shadow-lg border-2 border-gray-100">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#5e17eb' }}>
                  <CheckCircle className="w-8 h-8" style={{ color: '#ffffff' }} />
                </div>
                <h3 className="text-xl font-black mb-4" style={{ color: '#000000' }}>{feature.title}</h3>
                <p className="leading-relaxed" style={{ color: '#000000' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Features Comparison */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ color: '#000000' }}>Course Features Comparison</h2>
          </div>
          
          <div className="bg-white rounded-2xl border-2 border-black overflow-hidden">
            <div className="grid grid-cols-3 bg-gray-50">
              <div className="p-6 font-black text-center" style={{ color: '#000000' }}>Feature</div>
              <div className="p-6 font-black text-center border-l-2 border-black" style={{ color: '#5e17eb' }}>Live Classes</div>
              <div className="p-6 font-black text-center border-l-2 border-black" style={{ color: '#5e17eb' }}>Recorded Sessions</div>
            </div>
            {comparisonFeatures.map((item, idx) => (
              <div key={idx} className="grid grid-cols-3 border-t-2 border-black">
                <div className="p-4 font-semibold" style={{ color: '#000000' }}>{item.feature}</div>
                <div className="p-4 text-center border-l-2 border-black">
                  {item.live ? (
                    <CheckCircle className="w-6 h-6 mx-auto" style={{ color: '#5e17eb' }} />
                  ) : (
                    <span style={{ color: '#000000' }}>✗</span>
                  )}
                </div>
                <div className="p-4 text-center border-l-2 border-black">
                  {item.recorded ? (
                    <CheckCircle className="w-6 h-6 mx-auto" style={{ color: '#5e17eb' }} />
                  ) : (
                    <span style={{ color: '#000000' }}>✗</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Courses */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ color: '#000000' }}>Trending Courses This Month</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {trendingCourses.map((course, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border-2 border-black hover:shadow-lg transition-all duration-300">
                <div className="text-4xl text-center mb-4">{course.thumbnail}</div>
                <h3 className="text-lg font-black mb-2" style={{ color: '#000000' }}>{course.title}</h3>
                <p className="text-sm mb-2" style={{ color: '#5e17eb' }}>{course.mentor}</p>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 fill-current" style={{ color: '#5e17eb' }} />
                  <span className="text-sm font-bold" style={{ color: '#000000' }}>{course.rating}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4" style={{ color: '#5e17eb' }} />
                  <span className="text-sm" style={{ color: '#000000' }}>{course.students} students</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm px-2 py-1 bg-gray-100 rounded" style={{ color: '#000000' }}>{course.type}</span>
                  <span className="text-lg font-black" style={{ color: '#5e17eb' }}>{course.price}</span>
                </div>
                <button className="w-full py-3 font-bold rounded-xl transition-all duration-300" style={{ backgroundColor: '#5e17eb', color: '#ffffff' }}>
                  Enroll Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ color: '#000000' }}>Learning Paths</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {learningPaths.map((path, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 border-2 border-black text-center">
                <h3 className="text-2xl font-black mb-4" style={{ color: '#5e17eb' }}>{path.title}</h3>
                <div className="space-y-2 mb-6">
                  <p style={{ color: '#000000' }}>{path.duration}</p>
                  <p style={{ color: '#000000' }}>{path.courses}</p>
                  <p style={{ color: '#000000' }}>{path.level}</p>
                </div>
                <button className="px-8 py-3 border-2 font-bold rounded-xl transition-all duration-300 hover:bg-gray-50" style={{ borderColor: '#000000', color: '#000000' }}>
                  Explore Path
                </button>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/learning-paths" className="inline-flex items-center gap-2 px-8 py-4 font-bold text-lg rounded-xl transition-all duration-300" style={{ backgroundColor: '#5e17eb', color: '#ffffff' }}>
              Explore All Learning Paths →
            </Link>
          </div>
        </div>
      </section>

      {/* Student Reviews */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-8" style={{ color: '#000000' }}>Student Reviews</h2>
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex">
              {[1,2,3,4,5].map((star) => (
                <Star key={star} className="w-8 h-8 fill-current" style={{ color: '#5e17eb' }} />
              ))}
            </div>
            <span className="text-2xl font-black ml-2" style={{ color: '#000000' }}>4.7/5</span>
            <span className="text-lg" style={{ color: '#000000' }}>from 12,000+ reviews</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 border-2 border-black">
              <p className="text-lg mb-4" style={{ color: '#000000' }}>
                "Best online learning platform I've used. The live classes make a huge difference!"
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 border-2 border-black">
              <p className="text-lg mb-4" style={{ color: '#000000' }}>
                "Course content is up-to-date and mentors are very responsive. Highly recommended!"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl p-12 shadow-2xl border-2 border-black text-center">
            <h2 className="text-4xl font-black mb-6" style={{ color: '#000000' }}>Ready to Start Learning?</h2>
            <p className="text-lg mb-12 max-w-3xl mx-auto" style={{ color: '#000000' }}>
              Browse our complete course catalog and find the perfect course to advance your career.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/courses"
                className="px-10 py-4 font-bold text-lg rounded-xl transition-all duration-300 hover:shadow-lg"
                style={{ backgroundColor: '#5e17eb', color: '#ffffff' }}
              >
                View All Courses
              </Link>
              <Link
                href="/contact"
                className="px-10 py-4 border-2 font-bold text-lg rounded-xl transition-all duration-300 hover:bg-gray-50"
                style={{ borderColor: '#000000', color: '#000000' }}
              >
                Talk to Course Advisor
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}