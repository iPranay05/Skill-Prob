'use client';

import Link from 'next/link';
import { CheckCircle, DollarSign, Users, BarChart3, Calendar, Video, FileText, MessageCircle, Award, Clock, Globe, Shield } from 'lucide-react';

export default function ForMentors() {
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

  const dashboardFeatures = [
    {
      title: 'Course Creation Tools',
      points: [
        'Course Builder - Easy drag-and-drop interface',
        'Video Upload - Support for HD videos up to 4K',
        'Resource Manager - Upload PDFs, documents, code files',
        'Quiz Creator - Build assessments with multiple question types',
        'Assignment System - Create and review student submissions'
      ]
    },
    {
      title: 'Student Management',
      points: [
        'Enrollment Tracking - See who\'s enrolled in your courses',
        'Attendance Records - Monitor live class participation',
        'Performance Analytics - Track student progress and scores',
        'Communication Tools - Message students directly',
        'Feedback System - Collect and respond to reviews'
      ]
    },
    {
      title: 'Live Class Management',
      points: [
        'Scheduling Calendar - Plan and schedule sessions',
        'Google Meet Integration - One-click session creation',
        'Capacity Controls - Set maximum enrollment limits',
        'Recording Management - Automatic recording upload',
        'Attendance Tracking - See who attended each session'
      ]
    },
    {
      title: 'Revenue Dashboard',
      points: [
        'Real-time Earnings - Track revenue as it happens',
        'Student Analytics - Conversion rates and enrollment trends',
        'Payout History - Complete transaction records',
        'Financial Reports - Monthly and annual summaries',
        'Tax Documentation - Generate invoices and receipts'
      ]
    }
  ];

  const steps = [
    {
      step: 'Step 1: Apply',
      description: 'Fill out our mentor application form with your credentials, expertise areas, and teaching experience.'
    },
    {
      step: 'Step 2: Verification',
      description: 'Our team reviews your application and verifies your qualifications. Approval typically takes 2-3 business days.'
    },
    {
      step: 'Step 3: Profile Setup',
      description: 'Create your mentor profile, add bio, qualifications, social links, and profile picture.'
    },
    {
      step: 'Step 4: Create Your First Course',
      description: 'Use our course builder to create engaging content. Upload videos, add resources, and set pricing.'
    },
    {
      step: 'Step 5: Launch & Earn',
      description: 'Publish your course and start enrolling students. Receive payouts directly to your bank account.'
    }
  ];

  const testimonials = [
    {
      text: 'I\'ve been teaching web development on Skill Probe for 8 months and have already trained 500+ students. The platform is intuitive and support is excellent!',
      author: 'Rajesh Kumar, Web Development Mentor'
    },
    {
      text: 'As a working professional, I conduct live classes on weekends. It\'s a great way to share knowledge and earn extra income.',
      author: 'Priyanka Sharma, Data Science Mentor'
    },
    {
      text: 'My recorded courses generate passive income while I focus on my day job. Best decision I ever made!',
      author: 'Amit Verma, Digital Marketing Mentor'
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
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full border-2 border-black mb-8">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
            <span className="text-sm font-bold uppercase tracking-wide" style={{ color: '#5e17eb' }}>
              For Mentors
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl lg:text-6xl font-black leading-tight mb-6 text-gray-700">
            <span className="block">Share Your Expertise,</span>
            <span className="block" style={{ color: '#5e17eb' }}>Inspire Learners, Earn Revenue</span>
          </h1>

          {/* Description */}
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-2xl font-black mb-4 text-gray-700">Why Teach on Skill Probe?</h2>
            <p className="text-xl leading-relaxed" style={{ color: '#000000' }}>
              Join India's fastest-growing online learning platform and monetize your knowledge. Whether you want to conduct live interactive classes or create comprehensive recorded courses, we provide everything you need to succeed as an online mentor.
            </p>
          </div>
        </div>
      </section>

      {/* Mentor Benefits */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-gray-700">Build Your Teaching Business</h2>
            <p className="text-lg" style={{ color: '#000000' }}>
              Create your own courses, set your pricing, and reach thousands of eager learners. We handle the platform, payments, and support—you focus on teaching.
            </p>
          </div>
          
          {/* Teaching Options */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl p-8 border-2 border-black text-center">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#5e17eb' }}>
                <Video className="w-8 h-8" style={{ color: '#ffffff' }} />
              </div>
              <h3 className="text-2xl font-black mb-4 text-gray-700">Live Classes</h3>
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                  <span style={{ color: '#000000' }}>Conduct scheduled Google Meet sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                  <span style={{ color: '#000000' }}>Interact with students in real-time</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                  <span style={{ color: '#000000' }}>Host Q&A sessions and discussions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                  <span style={{ color: '#000000' }}>Build a loyal student community</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                  <span style={{ color: '#000000' }}>Higher revenue potential</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-black text-center">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#5e17eb' }}>
                <FileText className="w-8 h-8" style={{ color: '#ffffff' }} />
              </div>
              <h3 className="text-2xl font-black mb-4 text-gray-700">Recorded Courses</h3>
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                  <span style={{ color: '#000000' }}>Create self-paced video content</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                  <span style={{ color: '#000000' }}>Organize content chapter-wise</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                  <span style={{ color: '#000000' }}>Upload resources and materials</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                  <span style={{ color: '#000000' }}>Passive income opportunity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                  <span style={{ color: '#000000' }}>Reach more students globally</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-black text-center">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#5e17eb' }}>
                <Globe className="w-8 h-8" style={{ color: '#ffffff' }} />
              </div>
              <h3 className="text-2xl font-black mb-4 text-gray-700">Hybrid Approach</h3>
              <p className="leading-relaxed" style={{ color: '#000000' }}>
                Combine both live and recorded content for maximum impact and revenue.
              </p>
            </div>
          </div>

          {/* What You Get */}
          <div className="text-center mb-8">
            <h3 className="text-3xl font-black mb-8 text-gray-700">What You Get</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-4 p-6 bg-white rounded-xl border-2 border-gray-100">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: '#5e17eb' }}>
                  <CheckCircle className="w-4 h-4" style={{ color: '#ffffff' }} />
                </div>
                <p className="font-semibold" style={{ color: '#000000' }}>{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mentor Dashboard Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-gray-700">Mentor Dashboard Features</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {dashboardFeatures.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 border-2 border-black">
                <h3 className="text-2xl font-black mb-4" style={{ color: '#5e17eb' }}>{feature.title}</h3>
                <div className="space-y-2">
                  {feature.points.map((point, pointIdx) => (
                    <div key={pointIdx} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                      <span style={{ color: '#000000' }}>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Become a Mentor */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-gray-700">How to Become a Mentor</h2>
          </div>
          
          <div className="grid md:grid-cols-5 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 text-center shadow-lg border-2 border-gray-100">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#5e17eb' }}>
                  <span className="text-2xl font-black" style={{ color: '#ffffff' }}>{idx + 1}</span>
                </div>
                <h3 className="text-lg font-black mb-4 text-gray-700">{step.step}</h3>
                <p className="leading-relaxed text-sm" style={{ color: '#000000' }}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mentor Success Stories */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-gray-700">Mentor Success Stories</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 border-2 border-black">
                <p className="text-lg mb-6 leading-relaxed" style={{ color: '#000000' }}>
                  "{testimonial.text}"
                </p>
                <p className="font-bold" style={{ color: '#5e17eb' }}>- {testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Can Become a Mentor & Requirements */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-black mb-8 text-gray-700">Who Can Become a Mentor?</h2>
              <div className="space-y-4">
                {eligibility.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-white rounded-xl border-2 border-gray-100">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: '#5e17eb' }}>
                      <CheckCircle className="w-4 h-4" style={{ color: '#ffffff' }} />
                    </div>
                    <p className="font-semibold" style={{ color: '#000000' }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-black mb-8 text-gray-700">Mentor Requirements</h2>
              <div className="space-y-4">
                {requirements.map((requirement, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                    <span style={{ color: '#000000' }}>{requirement}</span>
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
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-gray-700">Support & Resources</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 border-2 border-black">
              <h3 className="text-2xl font-black mb-4" style={{ color: '#5e17eb' }}>Mentor Training</h3>
              <p className="mb-4" style={{ color: '#000000' }}>Free onboarding program covering:</p>
              <div className="space-y-2">
                {[
                  'Creating engaging course content',
                  'Best practices for live teaching',
                  'Student engagement techniques',
                  'Marketing your courses'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                    <span style={{ color: '#000000' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-black">
              <h3 className="text-2xl font-black mb-4" style={{ color: '#5e17eb' }}>Technical Support</h3>
              <div className="space-y-2">
                {[
                  'Live chat support during business hours',
                  'Email support 24/7',
                  'Detailed documentation and guides',
                  'Regular webinars and training sessions'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                    <span style={{ color: '#000000' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-black">
              <h3 className="text-2xl font-black mb-4" style={{ color: '#5e17eb' }}>Marketing Assistance</h3>
              <div className="space-y-2">
                {[
                  'Feature on platform homepage',
                  'Social media promotion',
                  'Email marketing to relevant students',
                  'SEO optimization for your courses'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                    <span style={{ color: '#000000' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-gray-700">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 border-2 border-black">
                <h3 className="text-xl font-black mb-4" style={{ color: '#5e17eb' }}>{faq.question}</h3>
                <p className="leading-relaxed" style={{ color: '#000000' }}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl p-12 shadow-2xl border-2 border-black text-center">
            <h2 className="text-4xl font-black mb-6 text-gray-700">Ready to Start Teaching?</h2>
            <p className="text-lg mb-12 max-w-3xl mx-auto" style={{ color: '#000000' }}>
              Join 200+ mentors who are already building successful teaching businesses on Skill Probe.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/apply-mentor"
                className="px-10 py-4 font-bold text-lg rounded-xl transition-all duration-300 hover:shadow-lg"
                style={{ backgroundColor: '#5e17eb', color: '#ffffff' }}
              >
                Apply to Become a Mentor
              </Link>
              <Link
                href="/mentor-guide"
                className="px-10 py-4 border-2 font-bold text-lg rounded-xl transition-all duration-300 hover:bg-gray-50"
                style={{ borderColor: '#000000', color: '#000000' }}
              >
                View Mentor Guide
              </Link>
              <Link
                href="/contact"
                className="px-10 py-4 border-2 font-bold text-lg rounded-xl transition-all duration-300 hover:bg-gray-50"
                style={{ borderColor: '#000000', color: '#000000' }}
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}