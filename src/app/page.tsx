'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import CareerServices from '@/components/CareerServices';
import WhyChooseUs from '@/components/WhyChooseUs';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-black overflow-hidden">

      {/* Hero Section */}
      <section
        className="relative py-24 px-6 overflow-visible bg-white"
      >
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>

        {/* Right Bottom Decoration */}
        <div className="absolute bottom-0 right-0 w-full h-1/2 pointer-events-none">
          <div className="absolute bottom-0 right-0 w-3/4 h-full bg-purple-100/40 rounded-tl-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="mb-28">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Left Side */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-6 md:space-y-8 max-w-2xl"
              >

                {/* Main Heading */}
                <motion.h1
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  className="text-5xl font-black leading-tight text-gray-900"
                >
                  <span className="block">Transform Your</span>
                  <span className="block">Skills, Transform</span>
                  <span className="block">Your Future</span>
                </motion.h1>

                {/* Description */}
                <motion.p
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                  className="text-lg md:text-xl lg:text-xl text-gray-600 leading-relaxed max-w-xl font-medium"
                >
                  Master skills through live classes and expert mentorship. Get certified and land your dream job.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
                  className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 md:px-8 py-3 md:py-4 bg-purple-600 text-white font-semibold text-sm md:text-base rounded-xl hover:bg-purple-700 transition-all duration-300 w-full sm:w-auto"
                  >
                    Start Learning Free
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 md:px-8 py-3 md:py-4 border border-gray-300 text-gray-700 font-semibold text-sm md:text-base rounded-xl hover:bg-gray-50 transition-all duration-300 w-full sm:w-auto"
                  >
                    Explore Courses
                  </motion.button>
                  <Link href="/mentor/signup">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 md:px-8 py-3 md:py-4 border-2 border-purple-600 text-purple-600 font-semibold text-sm md:text-base rounded-xl hover:bg-purple-600 hover:text-white hover:shadow-lg transition-all duration-300 w-full sm:w-auto text-center"
                    >
                      Become a Mentor
                    </motion.button>
                  </Link>
                </motion.div>
              </motion.div>

              {/* Right Side - Hero Image with Statistics */}
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                className="relative h-96 lg:h-full flex items-center justify-center"
              >
                <div className="relative w-full h-96">

                  {/* Hero Image */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                    className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl"
                  >
                    <img
                      src="/images/girl working on laptop.jpeg"
                      alt="Girl working on laptop"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>

                  {/* 50K+ Active Learners - Bottom Left Corner */}
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="absolute bottom-4 left-4 bg-white rounded-2xl px-5 py-4 shadow-xl border border-gray-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-7 h-7 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-gray-900">50K+</div>
                        <div className="text-sm font-semibold text-gray-600">Active Learners</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* 10K+ Certifications - Top Right Corner */}
                  <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="absolute top-4 right-4 bg-white rounded-2xl px-5 py-4 shadow-xl border border-gray-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-gray-900">10K+</div>
                        <div className="text-sm font-semibold text-gray-600">Certifications</div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      <CareerServices />
      <WhyChooseUs />


      {/* Featured Categories Section */}
      <section
        className="relative py-24 px-6 overflow-visible bg-gray-50"
      >
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="mb-28">
            <div className="text-center space-y-8">

              {/* Tag */}
              <div className="inline-flex items-center gap-2 px-5 py-3 bg-white/40 backdrop-blur-lg rounded-full border-2 border-white/60">
                <div className="w-4 h-4 rounded-full bg-purple-600"></div>
                <span className="text-sm font-black text-purple-600">
                  FEATURED CATEGORIES
                </span>
              </div>

              {/* Main Heading */}
              <h2 className="text-6xl lg:text-7xl font-black leading-tight text-gray-900">
                <span className="block">Explore</span>
                <span className="block text-purple-600">
                  In-Demand Skills
                </span>
              </h2>

              {/* Subheading */}
              <p className="text-2xl text-gray-900 leading-relaxed font-black max-w-lg mx-auto">
                Choose from our most popular skill categories and start your learning journey today
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                title: "Web Development",
                description: "Full-stack development with modern frameworks and technologies. Build scalable web applications.",
                skills: ["HTML, CSS, JavaScript", "React, Node.js", "MERN Stack"],
                courses: "120+ Courses",
                style: "featured", // Featured card
                icon: (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.6 16.6l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4zm-5.2 0L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4z" />
                  </svg>
                )
              },
              {
                title: "Data Science & AI",
                description: "Advanced analytics, machine learning, and artificial intelligence solutions for business.",
                skills: ["Python Programming", "Machine Learning", "Data Analytics"],
                courses: "85+ Courses",
                style: "compact", // Compact card
                icon: (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                  </svg>
                )
              },
              {
                title: "Digital Marketing",
                description: "Strategic digital marketing, SEO optimization, and brand building for modern businesses.",
                skills: ["SEO Optimization", "Social Media Marketing", "Content Strategy"],
                courses: "95+ Courses",
                style: "minimal", // Minimal card
                icon: (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                  </svg>
                )
              },
              {
                title: "Design & Creative",
                description: "Professional UI/UX design, graphic design, and creative solutions for digital products.",
                skills: ["UI/UX Design", "Adobe Creative Suite", "Video Production"],
                courses: "75+ Courses",
                style: "bordered", // Bordered card
                icon: (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )
              },
              {
                title: "Business & Management",
                description: "Leadership development, strategic management, and business operations excellence.",
                skills: ["Leadership Skills", "Project Management", "Business Strategy"],
                courses: "110+ Courses",
                style: "elevated", // Elevated card
                icon: (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z" />
                  </svg>
                )
              },
              {
                title: "Programming Languages",
                description: "Master essential programming languages and software development fundamentals.",
                skills: ["Java Programming", "Python Development", "JavaScript Mastery"],
                courses: "140+ Courses",
                style: "solid", // Solid card
                icon: (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.6 16.6l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4zm-5.2 0L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4z" />
                  </svg>
                )
              }
            ].map((category, idx: number) => {
              // Different card styles based on category.style
              const getCardStyle = (style: string) => {
                switch (style) {
                  case 'featured':
                    return "relative h-full bg-purple-600 text-white rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2";
                  case 'compact':
                    return "relative h-full bg-white rounded-lg border-l-4 border-purple-600 p-5 shadow-sm transition-all duration-300 hover:shadow-md";
                  case 'minimal':
                    return "relative h-full bg-transparent border-2 border-gray-200 rounded-xl p-6 transition-all duration-300 hover:bg-white hover:shadow-lg";
                  case 'bordered':
                    return "relative h-full bg-white rounded-xl border-2 border-purple-200 p-6 transition-all duration-300 hover:border-purple-400 hover:shadow-lg";
                  case 'elevated':
                    return "relative h-full bg-white rounded-xl p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1";
                  case 'solid':
                    return "relative h-full bg-white rounded-xl p-6 border border-gray-200 transition-all duration-300 hover:shadow-lg hover:bg-purple-50";
                  default:
                    return "relative h-full bg-white rounded-xl border border-gray-200 p-6 transition-all duration-300 hover:shadow-lg";
                }
              };

              const getIconStyle = (style: string) => {
                switch (style) {
                  case 'featured':
                    return "w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white";
                  case 'compact':
                    return "w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600";
                  case 'minimal':
                    return "w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors duration-300";
                  case 'bordered':
                    return "w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600";
                  case 'elevated':
                    return "w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-gray-700 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors duration-300";
                  case 'solid':
                    return "w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 group-hover:bg-purple-200 transition-colors duration-300";
                  default:
                    return "w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600";
                }
              };

              const getTextStyle = (style: string) => {
                switch (style) {
                  case 'featured':
                    return { title: "text-xl font-bold text-white mb-2", desc: "text-white/90 text-sm leading-relaxed", skill: "text-white/80 text-xs font-medium" };
                  case 'compact':
                    return { title: "text-lg font-bold text-gray-900 mb-2", desc: "text-gray-600 text-sm leading-relaxed", skill: "text-gray-600 text-xs font-medium" };
                  case 'minimal':
                    return { title: "text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-900 transition-colors duration-300", desc: "text-gray-600 text-sm leading-relaxed", skill: "text-gray-600 text-xs font-medium" };
                  case 'bordered':
                    return { title: "text-xl font-bold text-gray-900 mb-2", desc: "text-gray-600 text-sm leading-relaxed", skill: "text-gray-600 text-xs font-medium" };
                  case 'elevated':
                    return { title: "text-xl font-bold text-gray-900 mb-2", desc: "text-gray-600 text-sm leading-relaxed", skill: "text-gray-600 text-xs font-medium" };
                  case 'solid':
                    return { title: "text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-900 transition-colors duration-300", desc: "text-gray-600 text-sm leading-relaxed", skill: "text-gray-600 text-xs font-medium" };
                  default:
                    return { title: "text-xl font-bold text-gray-900 mb-2", desc: "text-gray-600 text-sm leading-relaxed", skill: "text-gray-600 text-xs font-medium" };
                }
              };

              return (
                <div key={idx} className="group cursor-pointer">
                  <div className={getCardStyle(category.style)}>

                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={getIconStyle(category.style)}>
                        {category.icon}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${category.style === 'featured' ? 'text-white bg-white/20' : 'text-gray-500 bg-gray-100'
                        }`}>
                        {category.courses}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                      <div>
                        <h3 className={getTextStyle(category.style).title}>
                          {category.title}
                        </h3>
                        <p className={getTextStyle(category.style).desc}>
                          {category.description}
                        </p>
                      </div>

                      {/* Skills List */}
                      <div className="space-y-1">
                        {category.skills.map((skill, skillIndex) => (
                          <div key={skillIndex} className="flex items-center gap-2">
                            <div className={`w-1 h-1 rounded-full ${category.style === 'featured' ? 'bg-white/60' : 'bg-gray-400'
                              }`}></div>
                            <span className={getTextStyle(category.style).skill}>{skill}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      <div className="pt-2">
                        <div className={`flex items-center text-sm font-semibold transition-colors duration-300 ${category.style === 'featured' ? 'text-white hover:text-white/80' : 'text-purple-600 hover:text-purple-700'
                          }`}>
                          <span>Explore Courses</span>
                          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View All Categories Button */}
          <div className="text-center mt-12">
            <Link href="/courses" className="inline-flex items-center px-8 py-4 bg-[#5e17eb] text-white font-semibold rounded-xl hover:bg-[#4a12c4] hover:shadow-lg transition-all duration-300">
              View All Categories
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        className="relative py-24 px-6 overflow-visible bg-gray-50"
      >
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="mb-28">
            <div className="text-center space-y-8">

              {/* Tag */}
              <div className="inline-flex items-center gap-2 px-5 py-3 bg-white/40 backdrop-blur-lg rounded-full border-2 border-white/60">
                <div className="w-4 h-4 rounded-full bg-purple-600"></div>
                <span className="text-sm font-black text-purple-600">
                  HOW IT WORKS
                </span>
              </div>

              {/* Main Heading */}
              <h2 className="text-6xl lg:text-7xl font-black leading-tight text-gray-900">
                <span className="block">Start Your</span>
                <span className="block text-purple-600">
                  Learning Journey
                </span>
              </h2>

              {/* Subheading */}
              <p className="text-2xl text-gray-900 leading-relaxed font-black max-w-lg mx-auto">
                Master new skills in just 3 simple steps
              </p>
            </div>
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                num: "01",
                icon: (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                ),
                title: "Choose Your Course",
                description: "Browse through 500+ courses across multiple categories. Filter by type (live/recorded), price, ratings, and mentor expertise to find your perfect match."
              },
              {
                num: "02",
                icon: (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                ),
                title: "Learn & Practice",
                description: "Attend live interactive sessions or watch recorded content. Complete assignments, take quizzes, and work on real-world projects with expert guidance."
              },
              {
                num: "03",
                icon: (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ),
                title: "Get Certified & Hired",
                description: "Earn your certification and apply to exclusive internships. Showcase your skills and kickstart your career with confidence and industry recognition."
              }
            ].map((step, idx) => (
              <div
                key={idx}
                className="group cursor-pointer"
              >
                {/* Step Card */}
                <div className="min-h-[400px] p-8 rounded-2xl transition-all duration-300 bg-white border-4 border-purple-600 shadow-2xl hover:shadow-3xl hover:-translate-y-2 hover:border-purple-800 hover:scale-105 hover:bg-purple-50">

                  {/* Number */}
                  <div className="text-6xl font-black text-purple-600 mb-4">
                    {step.num}
                  </div>

                  {/* Icon */}
                  <div className="w-14 h-14 rounded-lg flex items-center justify-center mb-6 bg-purple-100 text-purple-600">
                    {step.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-black mb-3 text-gray-900">{step.title}</h3>
                  <p className="text-base leading-relaxed font-semibold text-gray-600 mb-4">
                    {step.description}
                  </p>

                  {/* Arrow */}
                  <div className="flex items-center gap-2 font-black mt-6 text-purple-600 hover:text-purple-700 transition-colors duration-300">
                    <span>Learn More</span>
                    <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student Success Stories */}
      <section
        className="relative py-24 px-6 overflow-visible bg-purple-50"
      >
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">

            {/* Left Side - Content */}
            <div className="space-y-8">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 px-5 py-3 bg-white/40 backdrop-blur-lg rounded-full border-2 border-white/60">
                <div className="w-4 h-4 rounded-full bg-purple-600"></div>
                <span className="text-sm font-black text-purple-600">
                  SUCCESS STORIES
                </span>
              </div>

              {/* Main Heading */}
              <h2 className="text-5xl lg:text-6xl font-black leading-tight text-gray-900">
                <span className="block">Real Stories,</span>
                <span className="block text-purple-600">
                  Real Success
                </span>
              </h2>

              {/* Subheading */}
              <p className="text-xl text-gray-900 leading-relaxed font-semibold">
                Join 50,000+ learners who transformed their careers with Skill Probe. From beginners to industry experts.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-black text-white mb-2">50K+</div>
                  <div className="text-sm font-semibold text-gray-900">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-white mb-2">95%</div>
                  <div className="text-sm font-semibold text-gray-900">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-white mb-2">₹8L+</div>
                  <div className="text-sm font-semibold text-gray-900">Avg Package</div>
                </div>
              </div>
            </div>

            {/* Right Side - Featured Testimonial */}
            <div className="relative">
              <div className="bg-white/20 backdrop-blur-lg border-2 border-white/30 rounded-3xl p-8 shadow-2xl">
                {/* Quote Icon */}
                <div className="w-16 h-16 bg-white/30 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
                  </svg>
                </div>

                {/* Quote */}
                <p className="text-xl text-gray-900 font-semibold leading-relaxed mb-8 italic">
                  "Skill Probe completely transformed my career. From a confused college student to landing my dream job at Google - this platform made it possible!"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-black text-xl">AS</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-gray-900">Arjun Singh</h4>
                    <p className="text-purple-600 font-semibold">Software Engineer @ Google</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-purple-100 rounded-full"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-purple-50 rounded-full"></div>
            </div>
          </div>

          {/* Testimonials Carousel Style */}
          <div className="space-y-8">
            <h3 className="text-3xl font-black text-center text-gray-900 mb-12">More Success Stories</h3>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  quote: "Live classes made learning web development so much easier. I landed my first internship within 2 months!",
                  name: "Priya Sharma",
                  role: "Full Stack Developer",
                  company: "Flipkart",
                  rating: 5,
                  initials: "PS"
                },
                {
                  quote: "The campus ambassador program is amazing! I've already earned ₹15,000 while helping friends discover quality courses.",
                  name: "Rahul Verma",
                  role: "Campus Ambassador",
                  company: "Skill Probe",
                  rating: 5,
                  initials: "RV"
                }
              ].map((testimonial, idx) => (
                <div key={idx} className="bg-white/15 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/25 transition-all duration-300 hover:scale-105">

                  {/* Quote */}
                  <p className="text-gray-900 font-semibold mb-6 italic">
                    "{testimonial.quote}"
                  </p>

                  {/* Author & Rating */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-black text-sm">{testimonial.initials}</span>
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900">{testimonial.name}</h4>
                        <p className="text-sm text-purple-600 font-semibold">{testimonial.role} @ {testimonial.company}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Campus Ambassador Program */}
      <section
        className="relative py-24 px-6 overflow-visible bg-white"
      >
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto">

          {/* Header Section */}
          <div className="text-center mb-20">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-5 py-3 bg-white rounded-full border-2 border-black mb-8">
              <div className="w-4 h-4 rounded-full bg-purple-600"></div>
              <span className="text-sm font-black text-purple-600">
                CAMPUS AMBASSADOR PROGRAM
              </span>
            </div>

            {/* Main Heading */}
            <h2 className="text-6xl lg:text-7xl font-black leading-tight mb-8 text-black">
              <span className="block">Earn Money Online</span>
              <span className="block text-purple-600">
                While You Learn
              </span>
            </h2>

            {/* Subheading */}
            <p className="text-2xl leading-relaxed font-black max-w-4xl mx-auto text-black">
              Become a Skill Probe Campus Ambassador and earn up to ₹500 per referral. Share courses, grow your network, and convert points to real money.
            </p>
          </div>

          {/* Earning Structure */}
          <div className="grid lg:grid-cols-4 gap-6 mb-16">

            {/* Registration Points */}
            <div className="bg-white border-2 border-black rounded-3xl p-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-purple-600">
                  <svg className="w-8 h-8" fill="#ffffff" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black mb-2 text-black">50 Points</h3>
                <p className="font-semibold text-sm text-black">Per Registration</p>
              </div>
            </div>

            {/* Purchase Points */}
            <div className="bg-white border-2 border-black rounded-3xl p-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-purple-600">
                  <svg className="w-8 h-8" fill="#ffffff" viewBox="0 0 24 24">
                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black mb-2 text-black">500 Points</h3>
                <p className="font-semibold text-sm text-black">Per Course Purchase</p>
              </div>
            </div>

            {/* Ambassador Referral */}
            <div className="bg-white border-2 border-black rounded-3xl p-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-purple-600">
                  <svg className="w-8 h-8" fill="#ffffff" viewBox="0 0 24 24">
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4h2v-7.5c0-1.1.9-2 2-2s2 .9 2 2V18h2v-4h3v4h4v2H0v-2h4z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black mb-2 text-black">₹100 + 10%</h3>
                <p className="font-semibold text-sm text-black">Ambassador Referral</p>
              </div>
            </div>

            {/* Point Conversion */}
            <div className="bg-white border-2 border-black rounded-3xl p-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-purple-600">
                  <svg className="w-8 h-8" fill="#ffffff" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black mb-2 text-black">100 = ₹100</h3>
                <p className="font-semibold text-sm text-black">Point Conversion</p>
              </div>
            </div>
          </div>

          {/* Milestone Bonuses */}
          <div className="mb-16">
            <h3 className="text-3xl font-black text-center mb-12 text-black">Milestone Bonuses</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { referrals: '10', bonus: '₹500' },
                { referrals: '25', bonus: '₹1,500' },
                { referrals: '50', bonus: '₹5,000' },
                { referrals: '100', bonus: '₹15,000' }
              ].map((milestone, idx: number) => (
                <div key={idx} className="bg-white border-2 border-black rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-purple-600">
                    <span className="font-black text-lg text-white">{milestone.referrals}</span>
                  </div>
                  <h4 className="text-xl font-black mb-1 text-black">{milestone.bonus}</h4>
                  <p className="font-semibold text-sm text-black">{milestone.referrals} Successful Referrals</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="bg-white border-2 border-black rounded-3xl p-12">
              <h3 className="text-3xl font-black mb-4 text-black">
                Ready to Become an Ambassador?
              </h3>
              <p className="text-lg mb-8 text-black">
                Join our Campus Ambassador Program and start earning money while you learn!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/ambassador/signup"
                  className="px-10 py-4 font-bold text-lg rounded-xl transition-all duration-300 bg-purple-600 text-white"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/contact"
                  className="px-10 py-4 border-2 font-bold text-lg rounded-xl transition-all duration-300 border-black text-black"
                >
                  Talk to Our Team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section
        className="relative py-24 px-6 overflow-visible bg-purple-50"
      >
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>

        <div className="relative z-10 max-w-6xl mx-auto">

          {/* Main CTA Card */}
          <div className="bg-white rounded-3xl p-12 lg:p-16 shadow-2xl border-2 border-gray-100 mb-16">
            <div className="text-center space-y-8">

              {/* Tag */}
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-purple-100 rounded-full border-2 border-purple-200">
                <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                <span className="text-sm font-bold text-purple-600 uppercase tracking-wide">
                  Get Started Today
                </span>
              </div>

              {/* Main Headline */}
              <div className="space-y-6">
                <h2 className="text-4xl lg:text-6xl font-black leading-tight text-gray-900">
                  <span className="block">Ready to Master</span>
                  <span className="block text-purple-600">New Skills?</span>
                </h2>

                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Join thousands of learners who are already advancing their careers with Skill Probe. Start with a free trial today!
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  href="/ambassador/signup"
                  className="group px-10 py-4 bg-purple-600 text-white font-bold text-lg rounded-xl hover:bg-purple-700 hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <span className="flex items-center justify-center gap-3">
                    Get Started Free
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
                <Link
                  href="/contact"
                  className="px-10 py-4 border-2 border-purple-600 text-purple-600 font-bold text-lg rounded-xl hover:bg-purple-50 transition-all duration-300"
                >
                  Talk to Our Team
                </Link>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                number: '500+', label: 'Courses Available', icon: (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )
              },
              {
                number: '50K+', label: 'Active Learners', icon: (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4h2v-7.5c0-1.1.9-2 2-2s2 .9 2 2V18h2v-4h3v4h4v2H0v-2h4z" />
                  </svg>
                )
              },
              {
                number: '200+', label: 'Expert Mentors', icon: (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                )
              },
              {
                number: '95%', label: 'Job Success Rate', icon: (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z" />
                  </svg>
                )
              }
            ].map((item, idx: number) => (
              <div key={idx} className="bg-white rounded-2xl p-6 text-center shadow-lg border-2 border-gray-100 hover:border-purple-300 transition-all duration-300">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-2xl font-black text-gray-900 mb-2">{item.number}</div>
                <div className="text-gray-600 font-semibold text-sm">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
