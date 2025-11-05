'use client';
import Footer from './Footer';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle, DollarSign, Users, BarChart3, Calendar, Video, FileText, MessageCircle, Award, Clock, Globe, Shield, ChevronDown, ChevronUp } from 'lucide-react';

export default function ForMentors() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#5e17eb]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#5e17eb]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left Side - Text Content */}
            <div className="space-y-6">
              {/* Main Heading */}
              <h1 className="text-4xl lg:text-5xl font-black leading-tight text-gray-700">
                <span className="block">Share Your Expertise,</span>
                <span className="block" style={{ color: '#5e17eb' }}>Inspire Learners, Earn Revenue</span>
              </h1>

              {/* Description */}
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-gray-700">Why Teach on Skill Probe?</h2>
                <p className="text-xl leading-relaxed text-gray-600">
                  Join India's fastest-growing online learning platform and monetize your knowledge with live classes or recorded courses.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/mentor/signup">
                  <button className="px-8 py-4 bg-[#5e17eb] text-white font-semibold text-lg rounded-xl hover:bg-[#4a12c4] transition-all duration-300 w-full sm:w-auto">
                    Start Teaching Today
                  </button>
                </Link>
                <Link href="/mentor-guide">
                  <button className="px-8 py-4 border-2 border-[#5e17eb] text-[#5e17eb] font-semibold text-lg rounded-xl hover:bg-[#5e17eb] hover:text-white transition-all duration-300 w-full sm:w-auto">
                    Learn More
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Side - Hero Image */}
            <div className="relative">
              <div className="relative w-full h-96 rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&h=400&fit=crop"
                  alt="Professional mentor conducting online teaching session - representing expertise sharing and mentorship"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mentor Benefits */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-gray-700">Build Your Teaching Business</h2>
            <p className="text-lg text-gray-600">
              Create your own courses, set your pricing, and reach thousands of eager learners. We handle the platform, payments, and support—you focus on teaching.
            </p>
          </div>

          {/* Teaching Options */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 text-center">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#5e17eb' }}>
                <Video className="w-8 h-8" style={{ color: '#ffffff' }} />
              </div>
              <h3 className="text-2xl font-black mb-4 text-gray-700">Live Classes</h3>
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                  <span className="text-gray-600">Conduct scheduled Google Meet sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                  <span className="text-gray-600">Interact with students in real-time</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                  <span className="text-gray-600">Host Q&A sessions and discussions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                  <span className="text-gray-600">Build a loyal student community</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                  <span className="text-gray-600">Higher revenue potential</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 text-center">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#3b82f6' }}>
                <FileText className="w-8 h-8" style={{ color: '#ffffff' }} />
              </div>
              <h3 className="text-2xl font-black mb-4 text-gray-700">Create your own courses</h3>
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span className="text-gray-600">Create self-paced video content</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span className="text-gray-600">Organize content chapter-wise</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span className="text-gray-600">Upload resources and materials</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span className="text-gray-600">Passive income opportunity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span className="text-gray-600">Reach more students globally</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 text-center">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#10b981' }}>
                <Globe className="w-8 h-8" style={{ color: '#ffffff' }} />
              </div>
              <h3 className="text-2xl font-black mb-4 text-gray-700">Hybrid Approach</h3>
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
                  <span className="text-gray-600">Combine live and recorded content</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
                  <span className="text-gray-600">Maximize student engagement</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
                  <span className="text-gray-600">Flexible teaching schedule</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
                  <span className="text-gray-600">Multiple revenue streams</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
                  <span className="text-gray-600">Best of both teaching methods</span>
                </div>
              </div>
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
                <p className="font-semibold text-gray-600">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mentor Dashboard Features */}
      {/* <section className="py-20 px-6 bg-white">
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
                      <span className="text-gray-600">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

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
                <p className="leading-relaxed text-sm text-gray-600">{step.description}</p>
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
              <div key={idx} className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <p className="text-lg mb-6 leading-relaxed text-gray-600 italic">
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
          
          {/* Who Can Become a Mentor */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black mb-4 text-gray-700">Who Can Become a Mentor?</h2>
              <p className="text-lg text-gray-600">Join our community of expert educators from diverse backgrounds</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eligibility.map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-purple-200">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#5e17eb' }}>
                    <CheckCircle className="w-5 h-5" style={{ color: '#ffffff' }} />
                  </div>
                  <p className="font-semibold text-gray-700 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mentor Requirements */}
          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black mb-4 text-gray-700">Mentor Requirements</h2>
              <p className="text-lg text-gray-600">Essential qualifications to ensure quality teaching</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requirements.map((requirement, idx) => (
                <div key={idx} className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-purple-200">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3b82f6' }}>
                    <CheckCircle className="w-5 h-5" style={{ color: '#ffffff' }} />
                  </div>
                  <p className="font-semibold text-gray-700 leading-relaxed">{requirement}</p>
                </div>
              ))}
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
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-2xl font-black mb-4" style={{ color: '#5e17eb' }}>Mentor Training</h3>
              <p className="mb-4 text-gray-600">Free onboarding program covering:</p>
              <div className="space-y-2">
                {[
                  'Creating engaging course content',
                  'Best practices for live teaching',
                  'Student engagement techniques',

                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                    <span className="text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-2xl font-black mb-4" style={{ color: '#5e17eb' }}>Technical Support</h3>
              <div className="space-y-2">
                {[

                  'Email support 24/7',
                  'Detailed documentation and guides',
                  'Regular webinars and training sessions'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                    <span className="text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
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
                    <span className="text-gray-600">{item}</span>
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

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-gray-700">{faq.question}</h3>
                  <div className="flex-shrink-0 ml-4">
                    {openFaq === idx ? (
                      <ChevronUp className="w-5 h-5 text-[#5e17eb]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>
                {openFaq === idx && (
                  <div className="px-8 pb-6">
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl p-12 shadow-md border border-gray-100 text-center">
            <h2 className="text-4xl font-black mb-6 text-gray-700">Ready to Start Teaching?</h2>
            <p className="text-lg mb-12 max-w-3xl mx-auto text-gray-600">
              Join 200+ mentors who are already building successful teaching businesses on Skill Probe.
            </p>

            <div className="flex justify-center">
              <Link
                href="/mentor/signup"
                className="px-10 py-4 font-bold text-lg rounded-xl transition-all duration-300 hover:shadow-lg"
                style={{ backgroundColor: '#5e17eb', color: '#ffffff' }}
              >
                Apply to Become a Mentor
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer></Footer>
    </div>
  );
}