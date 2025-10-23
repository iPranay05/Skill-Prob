'use client';

import { GraduationCap, Building2, School, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WhyChooseUs() {
  const userTypes = [
    {
      id: 'students',
      title: 'Students and Professionals',
      description: 'Unlock Your Potential: Compete, Build Resume, Grow and get Hired!',
      icon: <GraduationCap className="w-6 h-6 text-white" />,
      bgColor: 'bg-blue-500',
      features: [
        'Live interactive classes with industry experts',
        'Industry-recognized certifications',
        'Real internship and job opportunities',
        'Expert mentorship and career guidance',
        'Self-paced learning with lifetime access'
      ]
    },
    {
      id: 'companies',
      title: 'Companies and Recruiters',
      description: 'Discover Right Talent: Hire, Engage, and Build Like Never Before!',
      icon: <Building2 className="w-6 h-6 text-white" />,
      bgColor: 'bg-purple-500',
      features: [
        'Access to skilled and certified professionals',
        'Direct recruitment from our talent pool',
        'Custom training programs for employees',
        'Campus hiring and internship programs',
        'Employer branding and visibility'
      ]
    },
    {
      id: 'colleges',
      title: 'Colleges',
      description: 'Bridge Academia and Industry: Empower Students with Real-World Opportunities!',
      icon: <School className="w-6 h-6 text-white" />,
      bgColor: 'bg-orange-500',
      features: [
        'Industry-aligned curriculum integration',
        'Campus ambassador programs',
        'Student placement assistance',
        'Faculty development programs',
        'Industry partnerships and collaborations'
      ]
    }
  ];

  return (
    <section
      className="relative py-24 px-6 overflow-visible bg-gradient-to-br from-slate-50 to-blue-50"
      style={{
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* Header Section */}
        <div className="text-center mb-16">
          {/* Tag */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full border-2 border-gray-200 mb-8 shadow-sm"
          >
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Who's using Skill Probe?
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-4xl lg:text-5xl font-bold leading-tight text-gray-900 mb-6"
          >
            Empowering Every Stakeholder in the
            <span className="block text-purple-600">Education Ecosystem</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto"
          >
            From students to corporations to educational institutions - we provide tailored solutions for everyone
          </motion.p>
        </div>

        {/* User Type Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {userTypes.map((userType, index) => (
            <motion.div
              key={userType.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 * index, ease: "easeOut" }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              {/* Single Icon */}
              <div className="mb-6">
                <div className={`w-12 h-12 ${userType.bgColor} rounded-xl flex items-center justify-center`}>
                  {userType.icon}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {userType.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                {userType.description}
              </p>

              {/* Features List */}
              <ul className="space-y-2">
                {userType.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <div className={`w-1.5 h-1.5 ${userType.bgColor} rounded-full mt-2 flex-shrink-0`}></div>
                    <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
            className="text-center"
          >
            <div className="text-3xl font-bold text-gray-900 mb-2">10K+</div>
            <p className="text-gray-600">Active Learners</p>
          </motion.div>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
            className="text-center"
          >
            <div className="text-3xl font-bold text-gray-900 mb-2">500+</div>
            <p className="text-gray-600">Partner Companies</p>
          </motion.div>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
            className="text-center"
          >
            <div className="text-3xl font-bold text-gray-900 mb-2">200+</div>
            <p className="text-gray-600">Educational Institutions</p>
          </motion.div>
        </div>

      </div>
    </section>
  );
}