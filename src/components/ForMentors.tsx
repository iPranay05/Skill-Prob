'use client';
import Footer from './Footer';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function ForMentors() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const benefits = [
    'Complete Course Management Dashboard',
    'Integrated Payment System - Direct payouts to your account',
    'Student Analytics - Track enrollments, engagement, and revenue',
    'Marketing Support - Feature your courses on homepage',
    'Technical Support - Live chat and email assistance',
    'Zero Setup Costs - Start teaching immediately',
    'Flexible Scheduling - Teach on your own time',
    'Community Building - Create your student base'
  ];



  const steps = [
    {
      step: 'Apply',
      description: 'Fill out our mentor application form with your credentials, expertise areas, and teaching experience.'
    },
    {
      step: 'Verification',
      description: 'Our team reviews your application and verifies your qualifications. Approval typically takes 2-3 business days.'
    },
    {
      step: 'Profile Setup',
      description: 'Create your mentor profile, add bio, qualifications, social links, and profile picture.'
    },
    {
      step: 'Create Your First Course',
      description: 'Use our course builder to create engaging content. Upload videos, add resources, and set pricing.'
    },
    {
      step: 'Launch & Earn',
      description: 'Publish your course and start enrolling students. Receive payouts directly to your bank account.'
    }
  ];

  const testimonials = [
    {
      text: 'I\'ve been teaching web development on Skill Probe for 8 months and have already trained 500+ students. The platform is intuitive and support is excellent!',
      author: 'R. Kumar, Web Development Mentor'
    },
    {
      text: 'As a working professional, I conduct live classes on weekends. It\'s a great way to share knowledge and earn extra income.',
      author: 'P. Sharma, Data Science Mentor'
    },
    {
      text: 'My recorded courses generate passive income while I focus on my day job. Best decision I ever made!',
      author: 'A. Verma, Digital Marketing Mentor'
    }
  ];

  const eligibility = [
    'Industry Professionals with 2+ years experience',
    'Subject Matter Experts in any skill domain',
    'Certified Trainers and educators',
    'Freelancers looking to expand income',
    'Consultants wanting to scale knowledge',
    'College Professors seeking additional platform',
    'Entrepreneurs sharing business expertise'
  ];

  const requirements = [
    'Proven expertise in your subject area',
    'Good communication skills',
    'Stable internet connection for live classes',
    'Basic recording equipment (for recorded courses)',
    'Commitment to student success',
    'Professional conduct and integrity'
  ];

  const faqs = [
    {
      question: 'Do I need teaching experience?',
      answer: 'While teaching experience helps, it\'s not mandatory. Subject expertise and the ability to communicate effectively are most important.'
    },
    {
      question: 'How long does course approval take?',
      answer: 'Once you submit your course, our team reviews it within 48 hours and provides feedback if any changes are needed.'
    },
    {
      question: 'Can I teach multiple subjects?',
      answer: 'Yes! You can create courses across different categories based on your expertise.'
    },
    {
      question: 'When do I receive payments?',
      answer: 'Payouts are processed weekly/monthly based on your preference. Minimum payout threshold is ₹2,000.'
    },
    {
      question: 'Can I offer courses for free?',
      answer: 'Yes, you can create free courses to build your audience and then launch paid premium content.'
    }
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-visible bg-white">
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left Side - Text Content */}
            <div className="space-y-6">
              {/* Main Heading */}
              <h1 className="text-4xl lg:text-5xl font-semibold leading-tight text-gray-700">
                <span className="block" style={{color:'#000000ff'}}>Share Your Expertise,</span>
                <span className="block" style={{ color: '#000000ff' }}>Inspire Learners,<br/> Earn Revenue<span className='text-primary'>.</span></span>
              </h1>

              {/* Description */}
              <div className="space-y-4">
                <h2 className="text-2xl font-extrabold italic text-[#dd36bfff]">Why Teach on Skill Probe?</h2>
                <p className="text-xl leading-relaxed text-gray-600">
                  Join India's fastest-growing online learning platform and <br/>monetize your knowledge with live classes or recorded<br/> courses at one place.
                </p>
              </div>

              {/* CTA Button */}
              <div className="pt-4">
                <Link href="/mentor/signup">
                  <button className="flex items-center justify-center gap-2 px-8 py-4 bg-black text-white font-semibold text-lg rounded-xl hover:bg-gray-800 transition-all duration-300">
                    <span>Become a Mentor</span>
                    <ArrowRight className='w-4 h-4'/>
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Side - Hero Image */}
            <div className="relative">
              <div className="relative w-full h-96 rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/SkillProbe/Mentors/Hero/mentorhero.jpg"
                  alt="Professional mentor conducting online teaching session - representing expertise sharing and mentorship"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mentor Benefits */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-semibold mb-4 text-black">Build Your Teaching Business<span className='text-primary'>.</span></h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Create courses, set prices, and reach learners; while we handle the platform,<br/>payments, and support.
            </p>
          </div>

          {/* Teaching Options */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="mb-4">
                <img
                  src="/SkillProbe/Mentors/Build Your Teaching Business Section/maxresdefault.jpg"
                  alt="Live Classes"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-bold mb-3 text-black">Live Classes</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Host Google Meet sessions, engage in real-time, run Q&As, build a community, and earn more.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="mb-4">
                <img
                  src="/SkillProbe/Mentors/Build Your Teaching Business Section/recording-online-courses.jpg"
                  alt="Recorded Courses"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-bold mb-3 text-black">Recorded Courses</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Create self-paced videos, organize chapters, upload materials, earn passively, and reach globally.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="mb-4">
                <img
                  src="/SkillProbe/Mentors/Build Your Teaching Business Section/1-scaled.jpg"
                  alt="Hybrid Approach"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-bold mb-3 text-black">Hybrid Approach</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Combine both live and recorded content for maximum impact and revenue.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* What You Get as a Mentor */}
      <section className="relative py-16 px-6 overflow-visible" style={{ backgroundColor: '#9063ddff' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Side - Text Content */}
            <div className="text-white pt-8">
              <h2 className="text-4xl font-bold mb-6">What You Get as a Mentor.</h2>
              <p className="text-lg mb-8 leading-relaxed">
                Empower your teaching with an all-in-one system designed to handle management, payments, analytics, and community building.
              </p>
              <Link href="/mentor/signup">
                <button className="px-8 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition-all duration-300">
                  Become a Mentor
                </button>
              </Link>
            </div>

            {/* Right Side - Feature Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Card 1 */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 mb-4">
                  <img 
                    src="/SkillProbe/Mentors/What You Get As a Mentor Section/credit-card.png" 
                    alt="Payment System"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-base font-bold mb-2 text-black">Integrated Payment System</h3>
                <p className="text-sm text-gray-600">Direct payouts to your account</p>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 mb-4">
                  <img 
                    src="/SkillProbe/Mentors/What You Get As a Mentor Section/pie-chart.png" 
                    alt="Student Analytics"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-base font-bold mb-2 text-black">Student Analytics</h3>
                <p className="text-sm text-gray-600">Track enrollments, engagement, and revenue</p>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 mb-4">
                  <img 
                    src="/SkillProbe/Mentors/What You Get As a Mentor Section/social-media (1).png" 
                    alt="Marketing Support"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-base font-bold mb-2 text-black">Marketing Support</h3>
                <p className="text-sm text-gray-600">Feature your courses on the homepage</p>
              </div>

              {/* Card 4 */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 mb-4">
                  <img 
                    src="/SkillProbe/Mentors/What You Get As a Mentor Section/customer-service (1).png" 
                    alt="Technical Support"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-base font-bold mb-2 text-black">Technical Support</h3>
                <p className="text-sm text-gray-600">Live chat and email assistance</p>
              </div>

              {/* Card 5 */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 mb-4">
                  <img 
                    src="/SkillProbe/Mentors/What You Get As a Mentor Section/calculator.png" 
                    alt="Zero Setup Costs"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-base font-bold mb-2 text-black">Zero Setup Costs</h3>
                <p className="text-sm text-gray-600">Start teaching immediately</p>
              </div>

              {/* Card 6 */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 mb-4">
                  <img 
                    src="/SkillProbe/Mentors/What You Get As a Mentor Section/dashboard.png" 
                    alt="Course Dashboard"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-base font-bold mb-2 text-black">Course Dashboard</h3>
                <p className="text-sm text-gray-600">Manage courses with ease</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mentor Dashboard Features */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-semibold mb-4 text-black">Mentor Dashboard Features<span className='text-primary'>.</span></h2>
            <p className="text-xl text-gray-600">
              Explore the exclusive advantages crafted to support your growth and success.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 - Course Creation Tools */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="w-16 h-16 mb-4 flex items-center justify-center bg-blue-100 rounded-xl">
                <img 
                  src="/SkillProbe/Mentors/Mentor Dashboard Features Section/audio.png" 
                  alt="Course Creation Tools"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <h3 className="text-lg font-bold mb-3 text-black">Course Creation Tools</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Drag-and-drop course builder</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Upload HD videos (up to 4K)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Add PDFs, docs, and code files</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Create quizzes with multiple formats</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Manage and review assignments</span>
                </li>
              </ul>
            </div>

            {/* Card 2 - Student Management */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="w-16 h-16 mb-4 flex items-center justify-center bg-blue-100 rounded-xl">
                <img 
                  src="/SkillProbe/Mentors/Mentor Dashboard Features Section/avatar.png" 
                  alt="Student Management"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <h3 className="text-lg font-bold mb-3 text-black">Student Management</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Track course enrollments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Monitor attendance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Analyze student progress</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Message students directly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Collect and manage feedback</span>
                </li>
              </ul>
            </div>

            {/* Card 3 - Live Class Management */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="w-16 h-16 mb-4 flex items-center justify-center bg-blue-100 rounded-xl">
                <img 
                  src="/SkillProbe/Mentors/Mentor Dashboard Features Section/video-call.png" 
                  alt="Live Class Management"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <h3 className="text-lg font-bold mb-3 text-black">Live Class Management</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Schedule and manage sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>One-click Google Meet setup</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Set class capacity limits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Auto-record live sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Track attendance easily</span>
                </li>
              </ul>
            </div>

            {/* Card 4 - Revenue Dashboard */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="w-16 h-16 mb-4 flex items-center justify-center bg-blue-100 rounded-xl">
                <img 
                  src="/SkillProbe/Mentors/Mentor Dashboard Features Section/webpage-list.png" 
                  alt="Revenue Dashboard"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <h3 className="text-lg font-bold mb-3 text-black">Revenue Dashboard</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>View real-time earnings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Track enrollments and trends</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Access payout records</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Generate financial summaries</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Create invoices and receipts</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How to Become a Mentor */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Steps */}
            <div className="space-y-8">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-6 items-start">
                  {/* Number Circle */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: '#c4b5fd', color: '#000' }}>
                      {idx + 1}
                    </div>
                    {/* Vertical Line - only show if not last item */}
                    {idx < steps.length - 1 && (
                      <div className="w-0.5 h-16 bg-gray-300 mx-auto mt-2"></div>
                    )}
                  </div>
                  
                  {/* Step Content */}
                  <div className="flex-1 pt-3">
                    <h3 className="text-xl font-bold mb-2 text-black">{step.step}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Side - Image with Purple Banner */}
            <div className="relative pt-16">
              {/* Purple Banner - positioned to overlap */}
              <div className="absolute top-0 left-6 right-6 z-10 bg-[#c4b5fd] px-8 py-6 rounded-lg shadow-lg">
                <p className="text-white text-lg font-semibold leading-relaxed">
                  Guide learners, grow your reach, and earn doing what you love.
                </p>
              </div>
              
              {/* Image Container */}
              <div className="relative rounded-xl overflow-hidden shadow-xl">
                <img
                  src="/SkillProbe/Mentors/How to Become a Mentor Section/pexels-kampus-7551644.jpg"
                  alt="Mentor guiding learner"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mentor Success Stories */}
      <section className="py-10 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-semibold mb-4 text-black">Mentor Success Stories<span className='text-primary'>.</span></h2>
            <p className="text-base md:text-xl text-gray-600">Real mentors. Real impact. Real growth.</p>
          </div>

          {/* Testimonials Carousel */}
          <div className="relative px-12 md:px-0">
            {/* Left Arrow */}
            <button 
              onClick={() => setCurrentTestimonial(currentTestimonial > 0 ? currentTestimonial - 1 : testimonials.length - 1)}
              className="absolute left-0 md:left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black flex items-center justify-center hover:bg-gray-800 transition-colors"
            >
              <img 
                src="/SkillProbe/Mentors/Mentor Success Stories Section/Carousel arrow.png" 
                alt="Previous"
                className="w-5 h-5 md:w-6 md:h-6 rotate-180"
              />
            </button>

            {/* Testimonial Cards */}
            <div className="mx-0 md:mx-16">
              {/* Mobile - Single Card */}
              <div className="block md:hidden">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  {/* Quote Icon */}
                  <div className="mb-4">
                    <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
                    </svg>
                  </div>
                  
                  {/* Testimonial Text */}
                  <p className="text-sm mb-6 leading-relaxed text-gray-700">
                    "{testimonials[currentTestimonial].text}"
                  </p>
                  
                  {/* Author Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: '#ec4899' }}>
                      {testimonials[currentTestimonial].author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-black">{testimonials[currentTestimonial].author.split(',')[0]}</p>
                      <p className="text-sm text-gray-500">{testimonials[currentTestimonial].author.split(',')[1]}</p>
                    </div>
                  </div>
                  
                  {/* Star Rating */}
                  <div className="flex gap-1 mt-4">
                    {[1, 2, 3, 4].map((star) => (
                      <img 
                        key={star}
                        src="/SkillProbe/Mentors/Mentor Success Stories Section/star.png" 
                        alt="Star"
                        className="w-5 h-5"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop - Two Cards */}
              <div className="hidden md:grid md:grid-cols-2 gap-6">
                {[testimonials[currentTestimonial], testimonials[(currentTestimonial + 1) % testimonials.length]].map((testimonial, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                    {/* Quote Icon */}
                    <div className="mb-4">
                      <svg className="w-10 h-10 text-primary" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
                      </svg>
                    </div>
                    
                    {/* Testimonial Text */}
                    <p className="text-base mb-6 leading-relaxed text-gray-700">
                      "{testimonial.text}"
                    </p>
                    
                    {/* Author Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: '#ec4899' }}>
                        {testimonial.author.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-black">{testimonial.author.split(',')[0]}</p>
                        <p className="text-sm text-gray-500">{testimonial.author.split(',')[1]}</p>
                      </div>
                    </div>
                    
                    {/* Star Rating */}
                    <div className="flex gap-1 mt-4">
                      {[1, 2, 3, 4].map((star) => (
                        <img 
                          key={star}
                          src="/SkillProbe/Mentors/Mentor Success Stories Section/star.png" 
                          alt="Star"
                          className="w-5 h-5"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Arrow */}
            <button 
              onClick={() => setCurrentTestimonial((currentTestimonial + 1) % testimonials.length)}
              className="absolute right-0 md:right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black flex items-center justify-center hover:bg-gray-800 transition-colors"
            >
              <img 
                src="/SkillProbe/Mentors/Mentor Success Stories Section/Carousel arrow.png" 
                alt="Next"
                className="w-5 h-5 md:w-6 md:h-6"
              />
            </button>
          </div>
        </div>
      </section>

      {/* Mentor Requirements */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-semibold mb-4 text-black">Mentor Requirements<span className='text-primary'>.</span></h2>
            <p className="text-xl text-gray-600">Real mentors. Real impact. Real growth.</p>
          </div>

          {/* Image with Overlay Cards */}
          <div className="relative rounded-3xl overflow-hidden shadow-xl">
            {/* Background Image */}
            <img
              src="/SkillProbe/Mentors/Mentor Requirements/Understanding-Reverse-Mentoring.jpg"
              alt="Mentor Requirements"
              className="w-full h-[400px] object-cover"
            />
            
            {/* Overlay Cards */}
            <div className="absolute inset-0 flex items-center justify-start px-12">
              <div className="grid grid-cols-1 gap-3 max-w-md w-full">
                {requirements.slice(0, 4).map((requirement, idx) => (
                  <div key={idx} className="bg-white rounded-lg px-5 py-3 shadow-lg flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <img 
                        src="/SkillProbe/Mentors/Mentor Requirements/check-list.png" 
                        alt="Check"
                        className="w-5 h-5"
                      />
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">{requirement}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support & Resources */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-semibold mb-4 text-black">Support & Resources<span className='text-primary'>.</span></h2>
            <p className="text-xl text-gray-600">Everything You Need to Succeed as a Mentor.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Mentor Training */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img 
                    src="/SkillProbe/Mentors/Support & Resources/online-class.png" 
                    alt="Mentor Training"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-3 text-center text-black">Mentor Training</h3>
              <ul className="space-y-1.5 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Create engaging content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Learn live teaching tips</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Boost student engagement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Market your courses</span>
                </li>
              </ul>
            </div>

            {/* Marketing Assistance */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img 
                    src="/SkillProbe/Mentors/Support & Resources/headphone.png" 
                    alt="Marketing Assistance"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-3 text-center text-black">Marketing Assistance</h3>
              <ul className="space-y-1.5 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Homepage feature</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Social media promo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Email outreach</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>SEO support</span>
                </li>
              </ul>
            </div>

            {/* Technical Support */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img 
                    src="/SkillProbe/Mentors/Support & Resources/customer-chat.png" 
                    alt="Technical Support"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-3 text-center text-black">Technical Support</h3>
              <ul className="space-y-1.5 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Live chat (business hours)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>24/7 email help</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Docs & guides</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Webinars & training</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-semibold mb-4 text-black">Frequently Asked Questions<span className='text-primary'>.</span></h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-300 overflow-hidden">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                >
                  <h3 className="text-base font-semibold text-black">{faq.question}</h3>
                  <div className="flex-shrink-0 ml-4">
                    {openFaq === idx ? (
                      <span className="text-2xl text-gray-600">−</span>
                    ) : (
                      <span className="text-2xl text-gray-600">+</span>
                    )}
                  </div>
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5">
                    <div className="pt-2">
                      <p className="text-gray-600 leading-relaxed text-sm">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text and Buttons */}
            <div>
              <h2 className="text-4xl font-semibold mb-6 text-black">
                Ready to Start Teaching<span className='text-primary'>?</span>
              </h2>
              <p className="text-lg mb-8 text-gray-600 leading-relaxed">
                Join 200+ mentors who are already building successful teaching businesses on Skill Probe.
              </p>

              <div>
                <Link href="/mentor/signup">
                  <button className="px-8 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-all duration-300">
                    Become a Mentor
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Side - Illustration */}
            <div className="flex justify-center lg:justify-end">
              <img 
                src="/SkillProbe/Mentors/Ready to start teaching Section/knowledge-transfer.png" 
                alt="Knowledge Transfer"
                className="w-64 h-64 object-contain"
              />
            </div>
          </div>
        </div>
      </section>
      <Footer></Footer>
    </div>
  );
}


