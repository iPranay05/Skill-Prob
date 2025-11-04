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
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-100">
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
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-100">
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
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-100">
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
      <section className="py-20 px-6 bg-white">
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
              <p className="text-lg leading-relaxed" style={{ color: '#000000' }}>
                Skill Probe is India's leading skill training and certification platform dedicated to bridging the gap between education and employment. We believe that quality education should be accessible, affordable, and outcome-driven.
              </p>
            </motion.div>

            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="relative"
            >
              <div className="relative w-full h-96 rounded-3xl overflow-hidden shadow-2xl">
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
              <div className="relative w-full h-96 rounded-3xl overflow-hidden shadow-2xl">
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
              <p className="text-lg leading-relaxed" style={{ color: '#000000' }}>
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
            <h2 className="text-4xl font-black mb-4 text-gray-700">What Makes Us Different</h2>
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
              className="text-4xl font-black mb-4 text-gray-700"
            >
              Our Values
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, idx) => (
              <motion.div
                key={idx}
                initial={{ y: 50, opacity: 0 }}
                animate={isValuesInView ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: "easeOut" }}
                whileHover={{ scale: 1.05, y: -8 }}
                className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-100 hover:border-[#5e17eb]/30 hover:shadow-xl transition-all duration-300 text-center group"
              >
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 bg-[#5e17eb]/10 group-hover:bg-[#5e17eb] transition-colors duration-300">
                  <div className="w-8 h-8 rounded-full bg-[#5e17eb] group-hover:bg-white transition-colors duration-300"></div>
                </div>
                <h3 className="text-xl font-black mb-4 text-gray-700 group-hover:text-[#5e17eb] transition-colors duration-300">{value.title}</h3>
                <p className="leading-relaxed text-gray-600">{value.description}</p>
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
                  🚀 Future Vision
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-gray-700 leading-tight">
                  Our Vision for the Future
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
              {/* <Link
                href="/courses/browse"
                className="px-10 py-4 bg-[#5e17eb] text-white font-bold text-lg rounded-xl hover:bg-[#4a12c4] hover:shadow-lg transition-all duration-300"
              >
                Explore Courses
              </Link> */}
              <Link
                href="/for-mentors"
                className="px-10 py-4 bg-[#5e17eb] text-white font-bold text-lg rounded-xl hover:bg-[#4a12c4] hover:shadow-lg transition-all duration-300"
              >
                Become a Mentor
              </Link>
              <Link
                href="/contact"
                className="px-10 py-4 border-2 border-gray-700 text-gray-700 font-bold text-lg rounded-xl hover:bg-gray-700 hover:text-white transition-all duration-300"
              >
                Hire Talent
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer></Footer>
    </div>
  );
}