'use client';

import Link from 'next/link';
import { CheckCircle, Play, BookOpen, Award, Users, Clock, Star, Download, Smartphone, Globe, Shield, Gift } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function ForStudents() {
  // Refs for scroll animations
  const benefitsRef = useRef(null);
  const stepsRef = useRef(null);
  const successRef = useRef(null);

  // Check if sections are in view
  const isBenefitsInView = useInView(benefitsRef, { once: true, margin: "-100px" });
  const isStepsInView = useInView(stepsRef, { once: true, margin: "-100px" });
  const isSuccessInView = useInView(successRef, { once: true, margin: "-100px" });

  const features = [
    {
      title: 'Unlimited Course Access',
      description: 'Browse & Enroll in courses across 15+ categories. Filter by your interests, skill level, and learning preferences.'
    },
    {
      title: 'Flexible Learning Options',
      description: 'Choose between live interactive classes for real-time engagement or recorded sessions for self-paced learning. Switch between both as needed.'
    },
    {
      title: 'Live Class Experience',
      points: [
        'Join classes via one-click Google Meet links',
        'Participate in real-time Q&A sessions',
        'Engage with polls and interactive activities',
        'Access session recordings for revision',
        'Chat with mentors and peers during class'
      ]
    },
    {
      title: 'Recorded Content Library',
      points: [
        'On-demand video playback',
        'Chapter-wise navigation',
        'Progress tracking',
        'Downloadable study materials',
        'Bookmarking and note-taking features'
      ]
    },
    {
      title: 'Assessment & Certification',
      points: [
        'Take quizzes to test your knowledge',
        'Submit assignments for mentor review',
        'Track your progress with detailed analytics',
        'Earn verified certificates upon completion',
        'Download and share certificates on LinkedIn'
      ]
    },
    {
      title: 'Career Opportunities',
      points: [
        'Browse internship postings tailored to your skills',
        'One-click applications with prefilled profiles',
        'Track application status in real-time',
        'Access exclusive job opportunities',
        'Get offer letters directly in your portal'
      ]
    },
    {
      title: 'Personalized Dashboard',
      points: [
        'Track enrolled courses and progress',
        'View upcoming live sessions',
        'Manage subscriptions and payments',
        'Access certificates and achievements',
        'Monitor internship applications'
      ]
    }
  ];

  const steps = [
    {
      step: 'Step 1: Create Your Profile',
      description: 'Sign up with email, phone, or social login. Complete your profile with educational background and skill interests.'
    },
    {
      step: 'Step 2: Explore Courses',
      description: 'Browse our catalog using advanced filters. Read course descriptions, check mentor profiles, and preview content.'
    },
    {
      step: 'Step 3: Enroll & Subscribe',
      description: 'Choose your subscription plan. Make secure payments and get instant access to course materials.'
    },
    {
      step: 'Step 4: Start Learning',
      description: 'Attend live classes or watch recorded content. Complete assignments, take quizzes, and build projects.'
    },
    {
      step: 'Step 5: Get Certified',
      description: 'Complete all course requirements to earn your certification. Download and share your achievement.'
    },
    {
      step: 'Step 6: Apply for Internships',
      description: 'Browse opportunities matching your newly acquired skills. Submit applications and land your dream role.'
    }
  ];

  const benefits = [
    'Multiple Payment Options - Cards, UPI, Net Banking, Wallets',
    'Easy Refund Policy - 7-day money-back guarantee',
    'Wallet Credits - Earn and use credits for discounts',
    'Course Recommendations - Personalized suggestions based on your interests',
    'Progress Tracking - Detailed analytics on your learning journey',
    'Achievement Badges - Earn badges for milestones and completions',
    'Community Forum - Connect with fellow learners',
    '24/7 Support - Help desk always available'
  ];

  const testimonials = [
    {
      text: 'I completed the Full Stack Development course and got my first internship within 3 weeks. The live classes were incredibly helpful!',
      author: 'Sneha Reddy, Hyderabad'
    },
    {
      text: 'The recorded sessions allowed me to learn while managing college. Perfect for students with busy schedules.',
      author: 'Arjun Patel, Mumbai'
    },
    {
      text: 'Best platform for practical learning. The projects helped me build a strong portfolio that impressed recruiters.',
      author: 'Meera Singh, Delhi'
    }
  ];

  const offers = [
    {
      title: 'Student Discount Program',
      description: 'Show your student ID and get 20% off on all courses. Valid for college and university students.'
    },
    {
      title: 'Refer & Earn',
      description: 'Invite friends to join Skill Probe. Earn 500 coins wallet credit for every successful referral.'
    },
    {
      title: 'Scholarship Program',
      description: 'Limited scholarships available for meritorious students. Apply now to get up to 50% fee waiver.'
    }
  ];

  const faqs = [
    {
      question: 'Can I access courses on mobile devices?',
      answer: 'Yes! Our platform is fully responsive and works seamlessly on smartphones, tablets, and computers.'
    },
    {
      question: 'How long do I have access to recorded courses?',
      answer: 'Once enrolled, you get lifetime access to all recorded course content and materials.'
    },
    {
      question: 'What happens if I miss a live class?',
      answer: 'All live sessions are recorded and uploaded within 24 hours so you never miss any content.'
    },
    {
      question: 'Are certificates recognized by employers?',
      answer: 'Yes, our certificates are industry-recognized and can be verified through our platform.'
    },
    {
      question: 'Can I pause my subscription?',
      answer: 'Yes, you can pause your subscription for up to 3 months and resume anytime.'
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
            <div className="w-4 h-4 rounded-full" className="bg-primary"></div>
            <span className="text-sm font-bold uppercase tracking-wide" style={{ color: '#5e17eb' }}>
              Student Learning Portal
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl lg:text-6xl font-black leading-tight mb-6" style={{ color: '#000000' }}>
            <span className="block">Your Gateway to Skill Mastery</span>
            <span className="block" style={{ color: '#5e17eb' }}>& Career Success</span>
          </h1>

          {/* Description */}
          <p className="text-xl leading-relaxed max-w-4xl mx-auto mb-12" style={{ color: '#000000' }}>
            Everything You Need to Learn, Grow, and Succeed. Skill Probe's student portal is designed to be your complete learning companion. From discovering courses to landing internships, we support you at every step of your learning journey.
          </p>
        </div>
      </section>

      {/* What You Get as a Student */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ color: '#000000' }}>What You Get as a Student</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 border-2 border-black">
                <h3 className="text-2xl font-black mb-4" style={{ color: '#5e17eb' }}>{feature.title}</h3>
                {feature.description && (
                  <p className="leading-relaxed mb-4" style={{ color: '#000000' }}>{feature.description}</p>
                )}
                {feature.points && (
                  <div className="space-y-2">
                    {feature.points.map((point, pointIdx) => (
                      <div key={pointIdx} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" className="bg-primary"></div>
                        <span style={{ color: '#000000' }}>{point}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Get Started */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ color: '#000000' }}>How to Get Started</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 text-center shadow-lg border-2 border-gray-100">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" className="bg-primary">
                  <span className="text-2xl font-black" style={{ color: '#ffffff' }}>{idx + 1}</span>
                </div>
                <h3 className="text-xl font-black mb-4" style={{ color: '#000000' }}>{step.step}</h3>
                <p className="leading-relaxed" style={{ color: '#000000' }}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student Benefits */}
      <section ref={benefitsRef} className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ y: 50, opacity: 0 }}
              animate={isBenefitsInView ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-4xl font-black mb-4" 
              style={{ color: '#000000' }}
            >
              Student Benefits
            </motion.h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, idx) => (
              <motion.div 
                key={idx} 
                initial={{ y: 50, opacity: 0 }}
                animate={isBenefitsInView ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: "easeOut" }}
                whileHover={{ scale: 1.02, y: -3 }}
                className="flex items-start gap-4 p-6 bg-white rounded-xl border-2 border-gray-100"
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1" className="bg-primary">
                  <CheckCircle className="w-4 h-4" style={{ color: '#ffffff' }} />
                </div>
                <p className="font-semibold" style={{ color: '#000000' }}>{benefit}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Student Success Stories */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ color: '#000000' }}>Student Success Stories</h2>
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

      {/* Special Offers */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ color: '#000000' }}>Special Offers for Students</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {offers.map((offer, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 text-center border-2 border-black">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" className="bg-primary">
                  <Gift className="w-8 h-8" style={{ color: '#ffffff' }} />
                </div>
                <h3 className="text-xl font-black mb-4" style={{ color: '#000000' }}>{offer.title}</h3>
                <p className="leading-relaxed" style={{ color: '#000000' }}>{offer.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ color: '#000000' }}>Frequently Asked Questions</h2>
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
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl p-12 shadow-2xl border-2 border-black text-center">
            <h2 className="text-4xl font-black mb-6" style={{ color: '#000000' }}>Ready to Start Your Learning Journey?</h2>
            <p className="text-lg mb-12 max-w-3xl mx-auto" style={{ color: '#000000' }}>
              Join 50,000+ students already advancing their careers with Skill Probe.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/auth/register"
                className="px-10 py-4 font-bold text-lg rounded-xl transition-all duration-300 hover:shadow-lg bg-primary"
                style={{ color: '#ffffff' }}
              >
                Register Now
              </Link>
              <Link
                href="/courses/browse"
                className="px-10 py-4 border-2 font-bold text-lg rounded-xl transition-all duration-300 hover:bg-gray-50"
                style={{ borderColor: '#000000', color: '#000000' }}
              >
                Explore Courses
              </Link>
              <Link
                href="/demo"
                className="px-10 py-4 border-2 font-bold text-lg rounded-xl transition-all duration-300 hover:bg-gray-50"
                style={{ borderColor: '#000000', color: '#000000' }}
              >
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
