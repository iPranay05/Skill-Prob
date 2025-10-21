'use client';

import { Video, Award, Briefcase, Users, TrendingUp, Zap, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function WhyChooseUs() {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);

  const features = [
    {
      num: "01",
      icon: <Video className="w-6 h-6" />,
      title: "Live Interactive Classes",
      description: "Learn directly from industry experts through live Google Meet sessions. Ask questions in real-time, participate in discussions, and get instant feedback.",
    },
    {
      num: "02",
      icon: <Zap className="w-6 h-6" />,
      title: "Self-Paced Recorded Content",
      description: "Access comprehensive video libraries organized by chapters. Learn at your own pace with downloadable resources and lifetime access to course materials.",
    },
    {
      num: "03",
      icon: <Award className="w-6 h-6" />,
      title: "Industry-Recognized Certifications",
      description: "Earn verified certificates upon course completion that showcase your skills to employers and enhance your professional portfolio.",
    },
    {
      num: "04",
      icon: <Briefcase className="w-6 h-6" />,
      title: "Real Internship Opportunities",
      description: "Apply directly to curated internships and job openings. Our platform connects skilled learners with companies actively seeking talent.",
    },
    {
      num: "05",
      icon: <Users className="w-6 h-6" />,
      title: "Expert Mentorship",
      description: "Connect with experienced mentors who guide you through your learning journey, provide career advice, and help you achieve your goals.",
    },
    {
      num: "06",
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Earn While You Learn",
      description: "Join our Campus Ambassador Program and earn rewards by referring friends. Convert your points to real money while building your network.",
    }
  ];

  return (
    <section 
      className="relative py-24 px-6 overflow-visible bg-purple-50"
      style={{
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-20">
          {/* Tag */}
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full border-2 border-purple-200 mb-8"
          >
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-bold text-purple-600 uppercase tracking-wide">
              Why Choose Skill Probe
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-5xl lg:text-6xl font-black leading-tight text-gray-900 mb-6"
          >
            <span className="block">Your Complete Learning &</span>
            <span className="block text-purple-600">Career Growth Platform</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto"
          >
            Transform your career with live classes, industry certifications, real internships, and expert mentorship - all in one platform.
          </motion.p>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white rounded-2xl p-8 text-center shadow-lg border-2 border-gray-100 hover:border-purple-300 transition-all duration-300"
          >
            <div className="text-4xl font-black text-purple-600 mb-2">10K+</div>
            <p className="text-gray-900 font-bold text-lg">Active Learners</p>
            <p className="text-gray-600 text-sm">Worldwide community</p>
          </motion.div>
          
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white rounded-2xl p-8 text-center shadow-lg border-2 border-gray-100 hover:border-purple-300 transition-all duration-300"
          >
            <div className="text-4xl font-black text-purple-600 mb-2">1000+</div>
            <p className="text-gray-900 font-bold text-lg">Successful Placements</p>
            <p className="text-gray-600 text-sm">Top companies hired</p>
          </motion.div>
          
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white rounded-2xl p-8 text-center shadow-lg border-2 border-gray-100 hover:border-purple-300 transition-all duration-300"
          >
            <div className="text-4xl font-black text-purple-600 mb-2">95%</div>
            <p className="text-gray-900 font-bold text-lg">Success Rate</p>
            <p className="text-gray-600 text-sm">Industry leading</p>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx: number) => (
            <div
              key={idx}
              onMouseEnter={() => setActiveFeature(idx)}
              onMouseLeave={() => setActiveFeature(null)}
              className="group cursor-pointer"
            >
              {/* Feature Card */}
              <div className="h-full bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-100 hover:border-purple-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                
                {/* Number Badge */}
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-xl font-black text-lg mb-6">
                  {feature.num}
                </div>

                {/* Icon */}
                <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center text-white mb-6 group-hover:bg-purple-700 transition-colors duration-300">
                  {feature.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-black text-gray-900 mb-4 group-hover:text-purple-900 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {feature.description}
                </p>

                {/* Arrow */}
                <div className="flex items-center gap-2 text-purple-600 font-semibold group-hover:text-purple-700 transition-colors duration-300">
                  <span>Learn More</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-gray-100">
            <h3 className="text-3xl font-black text-gray-900 mb-4">
              Ready to Transform Your Career?
            </h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of learners who are already advancing their careers with Skill Probe. Start with a free trial today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 hover:shadow-lg transition-all duration-300">
                Start Free Trial
              </button>
              <button className="px-8 py-4 border-2 border-purple-600 text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-all duration-300">
                Watch Demo
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}