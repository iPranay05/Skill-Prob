'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Footer from './Footer';

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
    { number: '10,000+', label: 'Active Learners' },
    { number: '200+', label: 'Expert Mentors' },
    { number: '1,000+', label: 'Internship Placements' },
    { number: '300+', label: 'Active Campus Ambassadors' }
  ];

  const values = [
    {
      title: 'Accessibility',
      description: 'Quality education should be available to everyone, everywhere.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Excellence',
      description: 'We maintain the highest standards in course content, mentorship, and student support.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    },
    {
      title: 'Innovation',
      description: 'We continuously evolve our platform with the latest learning technologies and methodologies.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      title: 'Integrity',
      description: 'Transparent pricing, honest communication, and genuine care for student success.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: 'Community',
      description: 'Building a supportive ecosystem where learners, mentors, and ambassadors grow together.',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
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
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#5e17eb]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#5e17eb]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left Side - Text Content */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* Main Heading */}
              <motion.h1
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="text-5xl lg:text-6xl font-black leading-tight text-gray-700"
              >
                <span className="block">Empowering Learners,</span>
                <span className="block" style={{ color: '#5e17eb' }}>Building Careers</span>
              </motion.h1>

              {/* Sub-hero Text */}
              <motion.p
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                className="text-lg lg:text-xl text-gray-600 leading-relaxed max-w-2xl"
              >
                We're on a mission to democratize quality education and make skill development accessible to everyone, everywhere.
              </motion.p>
            </motion.div>

            {/* Right Side - Hero Image */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="relative"
            >
              <div className="relative w-full h-96 rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600&h=400&fit=crop"
                  alt="Professional woman working on laptop - representing career growth and skill development"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Who's Using Skill Probe Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full border-2 border-black mb-8">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
              <span className="text-sm font-bold uppercase tracking-wide" style={{ color: '#5e17eb' }}>
                WHO'S USING SKILL PROBE?
              </span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-black leading-tight mb-6 text-gray-700">
              <span className="block">Empowering Every Stakeholder in the</span>
              <span className="block" style={{ color: '#5e17eb' }}>Education Ecosystem</span>
            </h2>

            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From students to corporations to educational institutions - we provide tailored solutions for everyone
            </p>
          </div>

          {/* Three Column Layout */}
          <div className="grid md:grid-cols-3 gap-8">

            {/* Students and Professionals */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#3b82f6' }}>
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>

              <h3 className="text-xl font-black mb-4 text-gray-700">Students and Professionals</h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Unlock Your Potential, Compete, Build Resume, Grow and get Hired!
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span className="text-sm text-gray-700">Live interactive classes with industry experts</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span className="text-sm text-gray-700">Industry-recognized certifications</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span className="text-sm text-gray-700">Real internship and job opportunities</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span className="text-sm text-gray-700">Expert mentorship and career guidance</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span className="text-sm text-gray-700">Self-paced learning with lifetime access</span>
                </div>
              </div>
            </div>

            {/* Companies and Recruiters */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#5e17eb' }}>
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z" />
                </svg>
              </div>

              <h3 className="text-xl font-black mb-4 text-gray-700">Companies and Recruiters</h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Discover Right Talent, Hire, Engage, and Build Like Never Before!
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#5e17eb' }}></div>
                  <span className="text-sm text-gray-700">Access to skilled and certified professionals</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#5e17eb' }}></div>
                  <span className="text-sm text-gray-700">Direct recruitment from our talent pool</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#5e17eb' }}></div>
                  <span className="text-sm text-gray-700">Custom training programs for employees</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#5e17eb' }}></div>
                  <span className="text-sm text-gray-700">Campus hiring and internship programs</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#5e17eb' }}></div>
                  <span className="text-sm text-gray-700">Employer branding and visibility</span>
                </div>
              </div>
            </div>

            {/* Colleges */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#f97316' }}>
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
                </svg>
              </div>

              <h3 className="text-xl font-black mb-4 text-gray-700">Colleges</h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Bridge Academia and Industry, Empower Students with Real World Experience!
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#f97316' }}></div>
                  <span className="text-sm text-gray-700">Industry-aligned curriculum integration</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#f97316' }}></div>
                  <span className="text-sm text-gray-700">Campus ambassador programs</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#f97316' }}></div>
                  <span className="text-sm text-gray-700">Student placement assistance</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#f97316' }}></div>
                  <span className="text-sm text-gray-700">Faculty development programs</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#f97316' }}></div>
                  <span className="text-sm text-gray-700">Industry partnerships and collaborations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-purple-50/30 via-white to-blue-50/30">
        <div className="max-w-7xl mx-auto">

          {/* Mission - Text Left, Image Right */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-black mb-6 text-gray-700">Our Mission</h2>
              <p className="text-lg leading-relaxed text-gray-600">
                Skill Probe is India's leading skill training and certification platform dedicated to bridging the gap between education and employment. We believe that quality education should be accessible, affordable, and outcome-driven.
              </p>
            </motion.div>

            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="relative"
            >
              <div className="relative w-full h-72 rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop"
                  alt="Students learning together - representing bridging education and employment gap"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>

          {/* Vision - Image Left, Text Right */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="relative order-2 lg:order-1"
            >
              <div className="relative w-full h-72 rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop"
                  alt="Online learning and skill development - representing democratized education"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              className="space-y-6 order-1 lg:order-2"
            >
              <h2 className="text-4xl font-black mb-6 text-gray-700">Our Vision</h2>
              <p className="text-lg leading-relaxed text-gray-600">
                Founded with a vision to democratize skill development, we combine the best of live interactive learning with flexible recorded content, ensuring every learner can master in-demand skills at their own pace.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-gray-700">Our Impact</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
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
                <p className="font-bold text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-gray-700">What Makes Us Different</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {differentiators.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <h3 className="text-2xl font-black mb-4" style={{ color: '#5e17eb' }}>{item.title}</h3>
                <p className="leading-relaxed text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section ref={valuesRef} className="py-16 px-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ y: 50, opacity: 0 }}
              animate={isValuesInView ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-3xl font-black mb-2 text-white"
            >
              Our Values
            </motion.h2>
            <p className="text-slate-300 text-sm">The principles that guide everything we do</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {values.map((value, idx) => (
              <motion.div
                key={idx}
                initial={{ y: 50, opacity: 0 }}
                animate={isValuesInView ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: "easeOut" }}
                whileHover={{ y: -5 }}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-cyan-400/50 hover:bg-white/10 transition-all duration-300 group"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    {value.icon}
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors duration-300">{value.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-300 group-hover:text-white transition-colors duration-300">{value.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Skill Probe Advantage */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-gray-700">The Skill Probe Advantage</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {advantages.map((advantage, idx) => (
              <div key={idx} className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: '#5e17eb' }}>
                  <CheckCircle className="w-4 h-4" style={{ color: '#ffffff' }} />
                </div>
                <p className="font-semibold text-gray-600">{advantage}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision for the Future */}
      <section className="py-20 px-6 bg-gray-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#5e17eb]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left Side - Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 bg-[#5e17eb]/10 rounded-full text-[#5e17eb] font-medium text-sm">
                  🚀 Future Goals
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-gray-700 leading-tight">
                  Our Roadmap to 2030
                </h2>
                <p className="text-xl leading-relaxed text-gray-600">
                  We're building more than just a learning platform—we're creating an ecosystem where skill development, mentorship, and career opportunities converge.
                </p>
              </div>

              {/* Vision Points */}
              <div className="space-y-4">
                {[
                  "Become India's most trusted partner for professional skill development",
                  "Help millions of learners achieve their career aspirations",
                  "Bridge the gap between education and industry requirements",
                  "Create sustainable earning opportunities for educators and students"
                ].map((point, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
                    <div className="w-6 h-6 bg-[#5e17eb] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-gray-700 leading-relaxed font-medium">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Visual Element */}
            <div className="relative">
              <div className="relative w-full h-96 rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop"
                  alt="Future of education and technology - representing innovation and growth"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#5e17eb]/20 to-transparent"></div>
              </div>

              {/* Floating Stats */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                <div className="text-center">
                  <div className="text-3xl font-black text-[#5e17eb] mb-1">1M+</div>
                  <div className="text-sm font-semibold text-gray-600">Future Learners</div>
                </div>
              </div>

              <div className="absolute -top-6 -right-6 bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                <div className="text-center">
                  <div className="text-3xl font-black text-[#5e17eb] mb-1">2030</div>
                  <div className="text-sm font-semibold text-gray-600">Vision Goal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl p-12 shadow-2xl border-2 border-gray-200 text-center">
            <h2 className="text-4xl font-black mb-6 text-gray-700">Join Our Journey</h2>
            <p className="text-lg mb-12 max-w-3xl mx-auto text-gray-600 leading-relaxed">
              Whether you're a learner seeking to upskill, a professional wanting to mentor, or a company looking for skilled talent, Skill Probe is your partner in growth.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/mentor/signup"
                className="px-10 py-4 bg-[#5e17eb] text-white font-bold text-lg rounded-xl hover:bg-[#4a12c4] hover:shadow-lg transition-all duration-300"
              >
                Become a Mentor
              </Link>
              <button
                onClick={() => document.getElementById('hiring-form-modal')?.classList.remove('hidden')}
                className="px-10 py-4 border-2 border-gray-700 text-gray-700 font-bold text-lg rounded-xl hover:bg-gray-700 hover:text-white transition-all duration-300"
              >
                Hire Talent
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Hiring Form Modal */}
      <div id="hiring-form-modal" className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                  Partner with SkillProbe for Hiring
                </h3>
                <p className="text-gray-600">
                  Tell us about your hiring needs and we'll connect you with the right talent
                </p>
              </div>
              <button
                onClick={() => document.getElementById('hiring-form-modal')?.classList.add('hidden')}
                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5e17eb] focus:border-transparent text-gray-700"
                    placeholder="Enter your company name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5e17eb] focus:border-transparent text-gray-700"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5e17eb] focus:border-transparent text-gray-700"
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5e17eb] focus:border-transparent text-gray-700"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Job Title/Position *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5e17eb] focus:border-transparent text-gray-700"
                    placeholder="e.g., HR Manager, Talent Acquisition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Company Size
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5e17eb] focus:border-transparent text-gray-700">
                    <option value="">Select company size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Skills/Roles You're Looking For *
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5e17eb] focus:border-transparent text-gray-700"
                  placeholder="e.g., Full Stack Developers, Data Scientists, Digital Marketers..."
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Additional Requirements (Optional)
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5e17eb] focus:border-transparent text-gray-700"
                  placeholder="Any specific requirements, experience level, location preferences, etc."
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-6 bg-[#5e17eb] text-white font-semibold rounded-lg hover:bg-[#4a12c4] hover:shadow-lg transition-all duration-300"
              >
                Submit Request
              </button>
            </form>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Our team will review your request and get back to you within 24 hours
            </p>

          </div>
        </div>
      </div>

      <Footer></Footer>
    </div>
  );
}