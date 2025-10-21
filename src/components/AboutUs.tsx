'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function AboutUs() {
  // Refs for scroll animations
  const valuesRef = useRef(null);
  const advantagesRef = useRef(null);
  const differentiatorRef = useRef(null);

  // Check if sections are in view
  const isValuesInView = useInView(valuesRef, { once: true, margin: "-100px" });
  const isAdvantagesInView = useInView(advantagesRef, { once: true, margin: "-100px" });
  const isDifferentiatorInView = useInView(differentiatorRef, { once: true, margin: "-100px" });

  const stats = [
    { number: '50,000+', label: 'Active Learners' },
    { number: '500+', label: 'Skill Development Courses' },
    { number: '200+', label: 'Expert Mentors' },
    { number: '5,000+', label: 'Certifications Issued' },
    { number: '1,000+', label: 'Internship Placements' },
    { number: '300+', label: 'Active Campus Ambassadors' }
  ];

  const values = [
    {
      title: 'Accessibility',
      description: 'Quality education should be available to everyone, everywhere.'
    },
    {
      title: 'Excellence',
      description: 'We maintain the highest standards in course content, mentorship, and student support.'
    },
    {
      title: 'Innovation',
      description: 'We continuously evolve our platform with the latest learning technologies and methodologies.'
    },
    {
      title: 'Integrity',
      description: 'Transparent pricing, honest communication, and genuine care for student success.'
    },
    {
      title: 'Community',
      description: 'Building a supportive ecosystem where learners, mentors, and ambassadors grow together.'
    }
  ];

  const advantages = [
    'Live Interactive Learning - Real-time classes with industry experts',
    'Flexible Scheduling - Learn at your pace with recorded content',
    'Verified Certifications - Industry-recognized credentials',
    'Career Support - Direct access to internships and jobs',
    'Mentorship Network - Connect with experienced professionals',
    'Earn While Learning - Campus ambassador rewards program'
  ];

  const differentiators = [
    {
      title: 'Hybrid Learning Approach',
      description: 'Unlike traditional online course platforms, we offer both live mentor-led classes and comprehensive recorded sessions, giving you the flexibility to choose what works best for your learning style.'
    },
    {
      title: 'Real Career Opportunities',
      description: 'We don\'t just teach—we connect. Our integrated internship and job portal links skilled learners directly with companies seeking talent, ensuring your learning translates into real opportunities.'
    },
    {
      title: 'Community-Driven Growth',
      description: 'Our unique Campus Ambassador Program creates a win-win ecosystem where students can earn while helping others discover quality education, building networks that last beyond the classroom.'
    },
    {
      title: 'Quality Over Quantity',
      description: 'Every mentor is vetted, every course is curated, and every certificate is industry-recognized. We maintain strict quality standards to ensure you receive education that truly matters.'
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
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full border-2 border-black mb-8"
          >
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
            <span className="text-sm font-bold uppercase tracking-wide" style={{ color: '#5e17eb' }}>
              About Skill Probe
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-5xl lg:text-6xl font-black leading-tight mb-6" 
            style={{ color: '#000000' }}
          >
            <span className="block">Empowering Learners,</span>
            <span className="block" style={{ color: '#5e17eb' }}>Building Careers</span>
          </motion.h1>

          {/* Our Mission */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-black mb-6" style={{ color: '#000000' }}>Our Mission</h2>
            <p className="text-lg leading-relaxed mb-6" style={{ color: '#000000' }}>
              Skill Probe is India's leading skill training and certification platform dedicated to bridging the gap between education and employment. We believe that quality education should be accessible, affordable, and outcome-driven.
            </p>
            <p className="text-lg leading-relaxed" style={{ color: '#000000' }}>
              Founded with a vision to democratize skill development, we combine the best of live interactive learning with flexible recorded content, ensuring every learner can master in-demand skills at their own pace.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ color: '#000000' }}>Our Impact</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stats.map((stat, idx) => (
              <motion.div 
                key={idx} 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: "easeOut" }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white rounded-2xl p-8 text-center shadow-lg border-2 border-gray-100"
              >
                <div className="text-4xl font-black mb-2" style={{ color: '#5e17eb' }}>{stat.number}</div>
                <p className="font-bold" style={{ color: '#000000' }}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ color: '#000000' }}>What Makes Us Different</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {differentiators.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 border-2 border-black">
                <h3 className="text-2xl font-black mb-4" style={{ color: '#5e17eb' }}>{item.title}</h3>
                <p className="leading-relaxed" style={{ color: '#000000' }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section ref={valuesRef} className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ y: 50, opacity: 0 }}
              animate={isValuesInView ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-4xl font-black mb-4" 
              style={{ color: '#000000' }}
            >
              Our Values
            </motion.h2>
          </div>
          
          <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-8 max-w-4xl mx-auto">
            {values.map((value, idx) => (
              <motion.div 
                key={idx} 
                initial={{ x: idx % 2 === 0 ? -50 : 50, opacity: 0 }}
                animate={isValuesInView ? { x: 0, opacity: 1 } : { x: idx % 2 === 0 ? -50 : 50, opacity: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.2, ease: "easeOut" }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white rounded-2xl p-8 border-2 border-black"
              >
                <h3 className="text-xl font-black mb-4" style={{ color: '#5e17eb' }}>{value.title}</h3>
                <p className="leading-relaxed" style={{ color: '#000000' }}>{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Skill Probe Advantage */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4" style={{ color: '#000000' }}>The Skill Probe Advantage</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {advantages.map((advantage, idx) => (
              <div key={idx} className="flex items-start gap-4 p-6 bg-white rounded-xl border-2 border-gray-100">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: '#5e17eb' }}>
                  <CheckCircle className="w-4 h-4" style={{ color: '#ffffff' }} />
                </div>
                <p className="font-semibold" style={{ color: '#000000' }}>{advantage}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision for the Future */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-8" style={{ color: '#000000' }}>Our Vision for the Future</h2>
          <p className="text-lg leading-relaxed mb-8" style={{ color: '#000000' }}>
            We're building more than just a learning platform—we're creating an ecosystem where skill development, mentorship, and career opportunities converge. Our goal is to become India's most trusted partner for professional skill development, helping millions of learners achieve their career aspirations.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl p-12 shadow-2xl border-2 border-black text-center">
            <h2 className="text-4xl font-black mb-6" style={{ color: '#000000' }}>Join Our Journey</h2>
            <p className="text-lg mb-12 max-w-3xl mx-auto" style={{ color: '#000000' }}>
              Whether you're a learner seeking to upskill, a professional wanting to mentor, or a company looking for skilled talent, Skill Probe is your partner in growth.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/courses"
                className="px-10 py-4 font-bold text-lg rounded-xl transition-all duration-300 hover:shadow-lg"
                style={{ backgroundColor: '#5e17eb', color: '#ffffff' }}
              >
                Explore Courses
              </Link>
              <Link
                href="/for-mentors"
                className="px-10 py-4 border-2 font-bold text-lg rounded-xl transition-all duration-300 hover:bg-gray-50"
                style={{ borderColor: '#000000', color: '#000000' }}
              >
                Become a Mentor
              </Link>
              <Link
                href="/contact"
                className="px-10 py-4 border-2 font-bold text-lg rounded-xl transition-all duration-300 hover:bg-gray-50"
                style={{ borderColor: '#000000', color: '#000000' }}
              >
                Hire Talent
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}