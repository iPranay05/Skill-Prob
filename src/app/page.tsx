'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import CareerServices from '@/components/CareerServices';
import WhyChooseUs from '@/components/WhyChooseUs';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-black overflow-hidden">

      {/* Hero Section */}
      <section
        className="relative py-12 md:py-24 px-6 overflow-visible bg-white"
      >
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>

        {/* Right Bottom Decoration */}
        <div className="absolute bottom-0 right-0 w-full h-1/2 pointer-events-none">
          <div className="absolute bottom-0 right-0 w-3/4 h-full bg-[#5e17eb]/10 rounded-tl-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="mb-28">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Left Side */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-6 md:space-y-8 max-w-2xl text-center lg:text-left"
              >

                {/* Main Heading */}
                <motion.h1
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight text-gray-700"
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
                  className="text-lg md:text-xl lg:text-xl text-gray-600 leading-relaxed max-w-xl font-medium mx-auto lg:mx-0"
                >
                  Master skills through live classes and expert mentorship. Get certified and land your dream job.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
                  className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4 justify-center lg:justify-start"
                >
                  <Link href="/auth/register">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 md:px-8 py-3 md:py-4 bg-[#5e17eb] text-white font-semibold text-sm md:text-base rounded-xl hover:bg-[#4a12c4] transition-all duration-300 w-full sm:w-auto"
                    >
                      Find a Mentor
                    </motion.button>
                  </Link>
                  <Link href="/mentor/signup">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 md:px-8 py-3 md:py-4 border-2 border-[#5e17eb] text-[#5e17eb] font-semibold text-sm md:text-base rounded-xl hover:bg-[#5e17eb] hover:text-white hover:shadow-lg transition-all duration-300 w-full sm:w-auto text-center"
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
                  {/* <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="absolute bottom-4 left-4 bg-white rounded-2xl px-5 py-4 shadow-xl border border-gray-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#5e17eb]/10 rounded-full flex items-center justify-center">
                        <svg className="w-7 h-7 text-[#5e17eb]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-700">50k</div>
                        <div className="text-sm font-semibold text-gray-600">Active Learners</div>
                      </div>
                    </div>
                  </motion.div> */}

                  {/* 10K+ Certifications - Top Right Corner */}
                  {/* <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="absolute top-4 right-4 bg-white rounded-2xl px-5 py-4 shadow-xl border border-gray-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#5e17eb]/10 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#5e17eb]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-700">10K+</div>
                        <div className="text-sm font-semibold text-gray-600">Certifications</div>
                      </div>
                    </div>
                  </motion.div> */}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      <CareerServices />
      <WhyChooseUs />


      {/* Campus Ambassador Program */}
      <section
        className="relative py-24 px-6 overflow-visible bg-white"
      >
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto">

          {/* Header Section */}
          <div className="text-left mb-12">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border-2 border-black mb-4">
              <div className="w-3 h-3 rounded-full bg-[#5e17eb]"></div>
              <span className="text-sm font-semibold text-[#5e17eb]">
                CAMPUS AMBASSADOR PROGRAM
              </span>
            </div>

            {/* Main Heading */}
            <h2 className="text-4xl lg:text-5xl font-semibold leading-tight mb-4 text-gray-700">
              <span className="block">Earn Money Online</span>
              <span className="block text-[#5e17eb]">
                While You Learn
              </span>
            </h2>

            {/* Subheading */}
            <p className="text-lg leading-relaxed font-medium max-w-3xl text-gray-700">
              Become a Skill Probe Campus Ambassador and earn up to ₹500 per referral. Share courses, grow your network, and convert points to real money.
            </p>
          </div>



          {/* CTA Section */}
          <div className="text-left">
            <div className="bg-white border-2 border-black rounded-2xl p-8">
              <h3 className="text-2xl font-semibold mb-3 text-gray-700">
                Ready to Become an Ambassador?
              </h3>
              <p className="text-base mb-6 text-gray-700">
                Join our Campus Ambassador Program and start earning money while you learn!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/for-ambassadors"
                  className="px-10 py-4 font-bold text-lg rounded-xl transition-all duration-300 bg-[#5e17eb] text-white"
                >
                  Get Started Free
                </Link>
                {/* <Link
                  href="/contact"
                  className="px-10 py-4 border-2 font-bold text-lg rounded-xl transition-all duration-300 border-black text-black"
                >
                  Talk to Our Team
                </Link> */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        className="relative py-16 px-6 overflow-visible bg-gray-50"
      >
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="text-left space-y-4">

              {/* Tag */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-lg rounded-full border-2 border-white/60">
                <div className="w-3 h-3 rounded-full bg-[#5e17eb]"></div>
                <span className="text-sm font-semibold text-[#5e17eb]">
                  HOW IT WORKS
                </span>
              </div>

              {/* Main Heading */}
              <h2 className="text-4xl lg:text-5xl font-semibold leading-tight text-gray-700">
                <span className="block">Start Your</span>
                <span className="block text-[#5e17eb]">
                  Learning Journey
                </span>
              </h2>

              {/* Subheading */}
              <p className="text-lg text-gray-700 leading-relaxed font-medium max-w-2xl">
                Master new skills in just 3 simple steps
              </p>
            </div>
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
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
                <div className="h-[280px] p-5 rounded-xl transition-all duration-300 bg-white border-2 border-[#5e17eb] shadow-lg hover:shadow-xl hover:-translate-y-1 hover:border-[#4a12c4] hover:scale-102 hover:bg-[#5e17eb]/5 flex flex-col">

                  {/* Number */}
                  <div className="text-3xl font-bold text-[#5e17eb] mb-2">
                    {step.num}
                  </div>

                  {/* Icon */}
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-[#5e17eb]/10 text-[#5e17eb]">
                    {step.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">{step.title}</h3>
                  <p className="text-sm leading-relaxed font-semibold text-gray-600 mb-3 flex-grow">
                    {step.description}
                  </p>

                  {/* Arrow */}
                  <div className="flex items-center gap-2 font-semibold mt-auto text-[#5e17eb] hover:text-[#4a12c4] transition-colors duration-300">
                    <span>Learn More</span>
                    <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="w-4 h-4 rounded-full bg-[#5e17eb]"></div>
                <span className="text-sm font-semibold text-[#5e17eb]">
                  SUCCESS STORIES
                </span>
              </div>

              {/* Main Heading */}
              <h2 className="text-5xl lg:text-6xl font-semibold leading-tight text-gray-700">
                <span className="block">Real Stories,</span>
                <span className="block text-[#5e17eb]">
                  Real Success
                </span>
              </h2>

              {/* Subheading */}
              <p className="text-xl text-gray-700 leading-relaxed font-semibold">
                Join 50,000+ learners who transformed their careers with Skill Probe. From beginners to industry experts.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-700 mb-2">50K+</div>
                  <div className="text-sm font-semibold text-gray-700">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-700 mb-2">95%</div>
                  <div className="text-sm font-semibold text-gray-700">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-700 mb-2">₹8L+</div>
                  <div className="text-sm font-semibold text-gray-700">Avg Package</div>
                </div>
              </div>
            </div>

            {/* Right Side - Featured Testimonial */}
            <div className="relative">
              <div className="bg-white/20 backdrop-blur-lg border-2 border-white/30 rounded-3xl p-8 shadow-2xl">
                {/* Quote Icon */}
                <div className="w-16 h-16 bg-[#5e17eb]/30 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
                  </svg>
                </div>

                {/* Quote */}
                <p className="text-xl text-gray-700 font-semibold leading-relaxed mb-8 italic">
                  "Skill Probe completely transformed my career. From a confused college student to landing my dream job at Google - this platform made it possible!"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#5e17eb] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-xl">AS</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-700">A. Singh</h4>
                    <p className="text-[#5e17eb] font-semibold">Software Engineer @ Google</p>
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
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#5e17eb]/10 rounded-full"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-[#5e17eb]/5 rounded-full"></div>
            </div>
          </div>

          {/* Testimonials Carousel Style */}
          <div className="space-y-8">
            <h3 className="text-3xl font-semibold text-center text-gray-700 mb-12">More Success Stories</h3>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  quote: "Live classes made learning web development so much easier. I landed my first internship within 2 months!",
                  name: "P. Sharma",
                  role: "Full Stack Developer",
                  company: "Flipkart",
                  rating: 5,
                  initials: "PS"
                },
                {
                  quote: "The campus ambassador program is amazing! I've already earned ₹15,000 while helping friends discover quality courses.",
                  name: "R. Verma",
                  role: "Campus Ambassador",
                  company: "Skill Probe",
                  rating: 5,
                  initials: "RV"
                }
              ].map((testimonial, idx) => (
                <div key={idx} className="bg-white/15 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/25 transition-all duration-300 hover:scale-105">

                  {/* Quote */}
                  <p className="text-gray-700 font-semibold mb-6 italic">
                    "{testimonial.quote}"
                  </p>

                  {/* Author & Rating */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#5e17eb] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">{testimonial.initials}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-700">{testimonial.name}</h4>
                        <p className="text-sm text-[#5e17eb] font-semibold">{testimonial.role} @ {testimonial.company}</p>
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

      {/* Featured Categories Section */}
      <section
        className="relative py-16 px-6 overflow-visible bg-gray-50"
      >
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="text-left space-y-3">

              {/* Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/40 backdrop-blur-lg rounded-full border-2 border-white/60">
                <div className="w-3 h-3 rounded-full bg-[#5e17eb]"></div>
                <span className="text-sm font-semibold text-[#5e17eb]">
                  FEATURED CATEGORIES
                </span>
              </div>

              {/* Main Heading */}
              <h2 className="text-3xl lg:text-4xl font-semibold leading-tight text-gray-700">
                <span className="block">Explore</span>
                <span className="block text-[#5e17eb]">
                  In-Demand Skills
                </span>
              </h2>

              {/* Subheading */}
              <p className="text-base text-gray-700 leading-relaxed font-medium max-w-2xl">
                Choose from our most popular skill categories and start your learning journey today
              </p>
            </div>
          </div>

          {/* Carousel Container */}
          <div className="relative mb-12">
            {/* Navigation Arrows */}
            <button
              id="prev-btn"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-[#5e17eb] hover:border-[#5e17eb] transition-all duration-300"
            >
              <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              id="next-btn"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-[#5e17eb] hover:border-[#5e17eb] transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Carousel Track */}
            <div className="overflow-hidden">
              <div id="carousel-track" className="flex transition-transform duration-500 ease-in-out" style={{ transform: 'translateX(0%)' }}>
                {[
                  {
                    title: "Web Development",
                    description: "Full-stack development with modern frameworks and technologies. Build scalable web applications.",
                    skills: ["HTML, CSS, JavaScript", "React, Node.js", "MERN Stack"],
                    courses: "120+ Courses",
                    style: "featured", // Featured card
                    image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=200&fit=crop",
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
                    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop",
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
                    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop",
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
                    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=200&fit=crop",
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
                    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=200&fit=crop",
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
                    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=200&fit=crop",
                    icon: (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.6 16.6l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4zm-5.2 0L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4z" />
                      </svg>
                    )
                  }
                ].map((category, idx: number) => {
                  // Consistent card style for all categories
                  const getCardStyle = (style: string) => {
                    return "relative h-full bg-white rounded-lg p-3 border-2 border-gray-100 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-[#5e17eb] group";
                  };

                  const getIconStyle = (style: string) => {
                    return "w-6 h-6 bg-[#5e17eb]/10 rounded-md flex items-center justify-center text-[#5e17eb] group-hover:bg-[#5e17eb] group-hover:text-white transition-all duration-300";
                  };

                  const getTextStyle = (style: string) => {
                    return {
                      title: "text-lg font-bold text-gray-700 mb-2 group-hover:text-[#5e17eb] transition-colors duration-300",
                      desc: "text-gray-600 text-xs leading-relaxed mb-3",
                      skill: "text-gray-500 text-xs font-medium"
                    };
                  };

                  return (
                    <div key={idx} className="flex-none w-80 mr-6 group cursor-pointer">
                      <div className={getCardStyle(category.style)}>

                        {/* Image */}
                        <div className="relative h-24 mb-3 rounded-md overflow-hidden">
                          <img
                            src={category.image}
                            alt={category.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          <span className="absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-full text-white bg-black/30 backdrop-blur-sm">
                            {category.courses}
                          </span>
                        </div>

                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className={getIconStyle(category.style)}>
                            {category.icon}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-3">
                          <div>
                            <h3 className={getTextStyle(category.style).title}>
                              {category.title}
                            </h3>
                            <p className={getTextStyle(category.style).desc}>
                              {category.description}
                            </p>
                          </div>

                          {/* Skills List */}
                          <div className="space-y-0.5">
                            {category.skills.map((skill, skillIndex) => (
                              <div key={skillIndex} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#5e17eb]/60 group-hover:bg-[#5e17eb] transition-colors duration-300"></div>
                                <span className={getTextStyle(category.style).skill}>{skill}</span>
                              </div>
                            ))}
                          </div>

                          {/* CTA */}
                          <div className="pt-1">
                            <div className="flex items-center text-xs font-semibold text-[#5e17eb] group-hover:text-[#4a12c4] transition-colors duration-300">
                              <span>Explore Courses</span>
                              <svg className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            </div>
          </div>

          {/* View All Categories Button */}
          <div className="text-left mt-8">
            <Link href="/courses/browse" className="inline-flex items-center px-6 py-3 bg-[#5e17eb] text-white font-semibold rounded-lg hover:bg-[#4a12c4] hover:shadow-lg transition-all duration-300">
              View All Categories
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Carousel JavaScript */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            const track = document.getElementById('carousel-track');
            const prevBtn = document.getElementById('prev-btn');
            const nextBtn = document.getElementById('next-btn');
            
            if (!track || !prevBtn || !nextBtn) return;
            
            let currentIndex = 0;
            const cardWidth = 320; // 80 * 4 (w-80 = 320px) + margin
            const visibleCards = Math.floor(track.parentElement.offsetWidth / cardWidth);
            const totalCards = track.children.length;
            const maxIndex = Math.max(0, totalCards - visibleCards);
            
            function updateCarousel() {
              const translateX = -currentIndex * cardWidth;
              track.style.transform = 'translateX(' + translateX + 'px)';
              
              // Update button states
              prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
              nextBtn.style.opacity = currentIndex >= maxIndex ? '0.5' : '1';
            }
            
            prevBtn.addEventListener('click', function() {
              if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
              }
            });
            
            nextBtn.addEventListener('click', function() {
              if (currentIndex < maxIndex) {
                currentIndex++;
                updateCarousel();
              }
            });
            
            // Initialize
            updateCarousel();
            
            // Handle window resize
            window.addEventListener('resize', function() {
              const newVisibleCards = Math.floor(track.parentElement.offsetWidth / cardWidth);
              const newMaxIndex = Math.max(0, totalCards - newVisibleCards);
              if (currentIndex > newMaxIndex) {
                currentIndex = newMaxIndex;
              }
              updateCarousel();
            });
          });
        `
      }} />

      {/* Trusted by Companies Section */}
      <section className="relative py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="text-left mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#5e17eb]/10 rounded-full mb-4">
              <div className="w-3 h-3 rounded-full bg-[#5e17eb]"></div>
              <span className="text-sm font-semibold text-[#5e17eb]">
                TRUSTED BY COMPANIES
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-semibold leading-tight text-gray-700 mb-4">
              Helping Companies
              <span className="block text-[#5e17eb]">Hire Top Talent</span>
            </h2>
            <p className="text-base text-gray-600 leading-relaxed max-w-2xl">
              Leading companies trust SkillProbe to connect them with skilled professionals ready to make an impact
            </p>
          </div>

          {/* Company Logos */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
            {[
              { name: "Caloyaa", logo: "data:image/jpeg;base64,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" },
              // { name: "Brightsky", logo: "https://via.placeholder.com/120x60/f8f9fa/6c757d?text=Brightsky" },
              // { name: "Fintech", logo: "https://via.placeholder.com/120x60/f8f9fa/6c757d?text=Fintech" },
              { name: "Transcom", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHHRol8Qpc6MbTwdPJyrJ98j-YlsgAL081QQ&s" },
              { name: "Justdial", logo: "https://indiancompanies.in/wp-content/uploads/2021/10/About-Just-Dial-Limited-Company.png" },
              { name: "Recruitminds", logo: "https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=375,fit=crop,q=95/A1aza0KoeotnbNeE/logo-AMqDqk32RBfpPKbZ.png" }
            ].map((company, index) => (
              <div key={index} className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#5e17eb]/30 hover:bg-gray-100 transition-all duration-300">
                <img
                  src={company.logo}
                  alt={company.name}
                  className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
                />
              </div>
            ))}
          </div>

          {/* CTA for Companies */}
          <div className="bg-gradient-to-r from-[#5e17eb]/5 to-blue-500/5 rounded-2xl p-8 text-left">
            <div className="max-w-3xl">
              <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                Looking to Hire Skilled Talent?
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Join these leading companies and let SkillProbe help you find the perfect candidates from our pool of certified professionals. Our team will connect you with pre-screened talent that matches your requirements.
              </p>

              <button
                onClick={() => document.getElementById('hiring-form-modal')?.classList.remove('hidden')}
                className="inline-flex items-center px-6 py-3 bg-[#5e17eb] text-white font-semibold rounded-lg hover:bg-[#4a12c4] hover:shadow-lg transition-all duration-300"
              >
                Partner with Us for Hiring
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
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

      {/* Final CTA Section */}
      <section
        className="relative py-24 px-6 overflow-visible bg-purple-50"
      >
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20  pointer-events-none"></div>

        <div className="relative z-10 max-w-6xl mx-auto">

          {/* Main CTA Card
          <div className="bg-white rounded-3xl p-12 lg:p-16 shadow-2xl border-2 border-gray-100 mb-16">
            <div className="text-center space-y-8"> */}

          {/* Tag */}
          {/* <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#5e17eb]/10 rounded-full border-2 border-[#5e17eb]/20">
                <div className="w-3 h-3 rounded-full bg-[#5e17eb]"></div>
                <span className="text-sm font-bold text-[#5e17eb] uppercase tracking-wide">
                  Get Started Today
                </span>
              </div> */}

          {/* Main Headline */}
          {/* <div className="space-y-6">
                <h2 className="text-4xl lg:text-6xl font-semibold leading-tight text-gray-700">
                  <span className="block">Ready to Master</span>
                  <span className="block text-[#5e17eb]">New Skills?</span>
                </h2>

                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Join thousands of learners who are already advancing their careers with Skill Probe. Start with a free trial today!
                </p>
              </div> */}

          {/* CTA Buttons */}
          {/* <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  href="/ambassador/signup"
                  className="group px-10 py-4 bg-[#5e17eb] text-white font-bold text-lg rounded-xl hover:bg-purple-700 hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <span className="flex items-center justify-center gap-3">
                    Get Started Free
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>

              </div> */}
          {/* </div>
          </div> */}


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
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-[#5e17eb] mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-2xl font-bold text-gray-700 mb-2">{item.number}</div>
                <div className="text-gray-600 font-semibold text-sm">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
