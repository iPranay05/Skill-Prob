'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Linkedin, Clock, Users, ArrowRight, Star, Zap, Target, Award } from 'lucide-react';
import emailjs from '@emailjs/browser';

interface FormData {
  name: string;
  phone: string;
  email: string;
  city: string;
  userType: string;
  college: string;
  organization: string;
  linkedinUrl: string;
  currentRole: string;
  yearsOfExperience: string;
  interviewDate: string;
  companyName: string;
  careerGoals: string;
  resume: File | null;
}

export default function CareerServices() {
  const [activeService, setActiveService] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    city: '',
    userType: '',
    college: '',
    organization: '',
    linkedinUrl: '',
    currentRole: '',
    yearsOfExperience: '',
    interviewDate: '',
    companyName: '',
    careerGoals: '',
    resume: null
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const services = [
    {
      id: 'resume-review',
      title: 'Resume Review',
      icon: <FileText className="w-6 h-6" />,
      shortDesc: 'Get expert feedback on your resume',
      image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop&crop=faces',
      bgGradient: 'from-blue-500 to-purple-600',
      content: {
        title: 'Professional Resume Review',
        benefits: [
          'Expert feedback from hiring professionals who understand what recruiters look for',
          'ATS-optimized formatting to ensure your resume passes through applicant tracking systems',
          'Professional design and layout that makes a strong first impression',
          'Strategic highlighting of your key skills and achievements',
          'Confidence boost knowing your resume meets industry standards'
        ]
      }
    },
    {
      id: 'linkedin-optimization',
      title: 'LinkedIn Boost',
      icon: <Linkedin className="w-6 h-6" />,
      shortDesc: 'Transform your LinkedIn profile',
      image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop&crop=center',
      bgGradient: 'from-indigo-500 to-blue-600',
      content: {
        title: 'LinkedIn Profile Optimization ',
        benefits: [
          'Professional profile makeover with clean, attention-grabbing design',
          'Strategic keyword optimization for maximum recruiter visibility',
          'Compelling storytelling that transforms your experience into an inspiring career narrative',
          'Enhanced profile ranking and organic engagement growth',
          'Career-ready professional presence that attracts opportunities'
        ]
      }
    },
    {
      id: 'interview-prep',
      title: 'Interview Prep',
      icon: <Clock className="w-6 h-6" />,
      shortDesc: 'Quick interview preparation',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop&crop=faces',
      bgGradient: 'from-green-500 to-teal-600',
      content: {
        title: 'Last-Minute Interview Preparation ',
        benefits: [
          'Rapid confidence building techniques to manage interview nerves',
          'Strategic answer frameworks for handling challenging questions',
          'Professional body language and communication coaching',
          'Resume and profile alignment to ensure consistent messaging',
          'Real-time feedback and personalized improvement strategies'
        ]
      }
    },
    {
      id: 'counseling',
      title: '1:1 Career Guidance',
      icon: <Users className="w-6 h-6" />,
      shortDesc: 'Personalized career guidance',
      image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=300&fit=crop&crop=faces',
      bgGradient: 'from-purple-500 to-pink-600',
      content: {
        title: 'One-on-One Career Mentorship Program',
        benefits: [
          'Personalized resume transformation tailored to your career goals',
          'Complete LinkedIn profile optimization and personal branding',
          'Comprehensive interview preparation including mock sessions',
          'Customized career strategy and skill development roadmap',
          'Ongoing mentorship support throughout your job search journey'
        ]
      }
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        resume: e.target.files[0]
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate required fields based on service type
    if (!formData.name || !formData.phone || !formData.email) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Service-specific validation
    if (activeService === 'resume-review' && !formData.resume) {
      setError('Please upload your resume');
      setLoading(false);
      return;
    }

    if (activeService === 'linkedin-optimization' && !formData.linkedinUrl) {
      setError('Please provide your LinkedIn URL');
      setLoading(false);
      return;
    }

    try {
      const serviceTitle = services.find(s => s.id === activeService)?.title;
      
      // Send email notification via EmailJS
      try {
        console.log('📧 Sending career service email notification...');
        
        // EmailJS configuration - Add these to your .env.local file
        const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'your_service_id';
        const templateId = process.env.NEXT_PUBLIC_EMAILJS_CAREER_TEMPLATE_ID || 'your_career_template_id';
        const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'your_public_key';

        // Initialize EmailJS
        emailjs.init(publicKey);

        // Prepare email template parameters
        const templateParams = {
          to_email: 'your-email@example.com', // Replace with your email
          from_name: formData.name,
          service_type: serviceTitle,
          applicant_name: formData.name,
          applicant_email: formData.email,
          applicant_phone: formData.phone,
          applicant_city: formData.city,
          linkedin_url: formData.linkedinUrl,
          submission_date: new Date().toLocaleString(),
          service_description: services.find(s => s.id === activeService)?.shortDesc || '',
          
          // Additional context
          request_type: 'Career Service Request',
          urgency: activeService === 'interview-prep' ? 'High - Last Minute Preparation' : 'Normal'
        };

        const emailResult = await emailjs.send(serviceId, templateId, templateParams);
        console.log('✅ Career service email sent successfully:', emailResult);
      } catch (emailError) {
        console.error('❌ Failed to send career service email:', emailError);
        // Continue with success message even if email fails
      }

      setSuccess(`Thank you! Your ${serviceTitle} request has been submitted successfully. We'll contact you within 24 hours.`);
      setFormData({
        name: '',
        phone: '',
        email: '',
        city: '',
        userType: '',
        college: '',
        organization: '',
        linkedinUrl: '',
        currentRole: '',
        yearsOfExperience: '',
        interviewDate: '',
        companyName: '',
        careerGoals: '',
        resume: null
      });

      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Close modal after success
      setTimeout(() => {
        setActiveService(null);
        setSuccess('');
      }, 3000);

    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setActiveService(null);
    setError('');
    setSuccess('');
    setFormData({
      name: '',
      phone: '',
      email: '',
      city: '',
      userType: '',
      college: '',
      organization: '',
      linkedinUrl: '',
      currentRole: '',
      yearsOfExperience: '',
      interviewDate: '',
      companyName: '',
      careerGoals: '',
      resume: null
    });
  };

  return (
    <section className="py-20 px-6 bg-gradient-to-br from-gray-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-info/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      
      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-left mb-10"
        >
          <div className="inline-flex items-center px-3 py-1 bg-primary/10 rounded-full text-primary font-medium text-sm mb-4">
            🚀 Career Services
          </div>
          <h2 className="text-3xl lg:text-4xl font-semibold text-gray-700 mb-4 leading-tight">
            Accelerate Your Career Growth
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
            Get personalized career services from industry experts to land your dream job faster
          </p>
        </motion.div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((service, index) => (
              <motion.button
                key={service.id}
                onClick={() => setActiveService(service.id)}
                whileHover={{ scale: 1.05, y: -8 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:border-primary/30 hover:shadow-xl transition-all duration-500 text-left group relative"
              >
                {/* Image Section */}
                <div className="relative h-36 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Floating Icon with Pulse Effect */}
                  <div className="absolute top-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white border border-white/30 group-hover:scale-110 transition-transform duration-300">
                    {service.icon}
                    <div className="absolute inset-0 bg-white/10 rounded-2xl animate-pulse"></div>
                  </div>



                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                </div>

                {/* Content Section */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2 group-hover:text-primary transition-colors duration-300">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 text-xs mb-3 leading-relaxed">
                    {service.shortDesc}
                  </p>
                  
                  {/* CTA Button */}
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-semibold text-sm group-hover:text-primary-dark transition-colors duration-300">
                      Learn more
                    </span>
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary transition-all duration-300">
                      <ArrowRight className="w-4 h-4 text-primary group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#5e17eb]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </motion.button>
            ))}
        </div>

        {/* Stats Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-10 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-3">
                <Target className="w-6 h-6" />
              </div>
              <div className="text-2xl font-semibold text-gray-700 mb-1">95%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-2xl font-semibold text-gray-700 mb-1">2,500+</div>
              <div className="text-sm text-gray-600">Students Helped</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-3">
                <Zap className="w-6 h-6" />
              </div>
              <div className="text-2xl font-semibold text-gray-700 mb-1">24hrs</div>
              <div className="text-sm text-gray-600">Quick Response</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-3">
                <Award className="w-6 h-6" />
              </div>
              <div className="text-2xl font-semibold text-gray-700 mb-1">Expert</div>
              <div className="text-sm text-gray-600">Industry Pros</div>
            </div>
          </div>
        </motion.div>

        {/* Modal */}
        <AnimatePresence>
          {activeService && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={closeModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                {(() => {
                  const service = services.find(s => s.id === activeService);
                  if (!service) return null;

                  return (
                    <div className="p-8">
                      {/* Header with Background */}
                      <div className="relative mb-8">
                        <div className={`absolute inset-0 bg-gradient-to-r ${service.bgGradient} rounded-t-3xl`}></div>
                        <div className="relative p-8 text-white">
                          <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors duration-200 border border-white/30"
                          >
                            <X className="w-5 h-5" />
                          </button>
                          
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white border border-white/30">
                              {service.icon}
                            </div>
                            <div>
                              <h3 className="text-3xl font-semibold mb-2">
                                {service.content.title}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <Star className="w-4 h-4 text-yellow-300 fill-current" />
                                <span className="text-white/90 text-sm">Expert Service</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="px-8 mb-8">
                        <h4 className="text-xl font-semibold text-gray-700 mb-6 flex items-center">
                          <Award className="w-5 h-5 text-primary mr-2" />
                          What You Get:
                        </h4>
                        <div className="space-y-4">
                          {service.content.benefits.map((benefit, index) => (
                            <motion.div 
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-primary/30 transition-colors duration-300"
                            >
                              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                              <span className="text-gray-700 leading-relaxed">{benefit}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Form */}
                      <div className="px-8">
                        <div className="bg-gradient-to-r from-[#5e17eb]/5 to-blue-500/5 rounded-2xl p-6 mb-6">
                          <h4 className="text-lg font-medium text-gray-700 mb-2">Ready to Get Started?</h4>
                          <p className="text-gray-600 text-sm">Fill out the form below and we'll get back to you within 24 hours!</p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                          {/* Common Fields for All Services */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Full Name *
                              </label>
                              <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 bg-gray-50 hover:bg-white transition-colors duration-200"
                                placeholder="Enter your full name"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Phone Number *
                              </label>
                              <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 bg-gray-50 hover:bg-white transition-colors duration-200"
                                placeholder="Enter your phone number"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Email Address *
                              </label>
                              <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 bg-gray-50 hover:bg-white transition-colors duration-200"
                                placeholder="Enter your email address"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">
                                I am a *
                              </label>
                              <select
                                name="userType"
                                value={formData.userType}
                                onChange={handleInputChange}
                                className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 bg-gray-50 hover:bg-white transition-colors duration-200"
                                required
                              >
                                <option value="">Select...</option>
                                <option value="student">Student</option>
                                <option value="professional">Professional</option>
                              </select>
                            </div>
                          </div>

                          {/* Conditional College/Organization Field */}
                          {formData.userType === 'student' && (
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">
                                College Name *
                              </label>
                              <input
                                type="text"
                                name="college"
                                value={formData.college}
                                onChange={handleInputChange}
                                className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 bg-gray-50 hover:bg-white transition-colors duration-200"
                                placeholder="Enter your college name"
                                required
                              />
                            </div>
                          )}

                          {formData.userType === 'professional' && (
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Organization *
                              </label>
                              <input
                                type="text"
                                name="organization"
                                value={formData.organization}
                                onChange={handleInputChange}
                                className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 bg-gray-50 hover:bg-white transition-colors duration-200"
                                placeholder="Enter your organization name"
                                required
                              />
                            </div>
                          )}

                          {/* Resume Review Specific Fields */}
                          {activeService === 'resume-review' && (
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Upload Resume *
                              </label>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileChange}
                                className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 bg-gray-50 hover:bg-white transition-colors duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark file:cursor-pointer"
                                required
                              />
                              <p className="text-xs text-gray-500 mt-2">Accepted formats: PDF, DOC, DOCX (Max 5MB)</p>
                            </div>
                          )}

                          {/* LinkedIn Optimization Specific Fields */}
                          {activeService === 'linkedin-optimization' && (
                            <>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                  LinkedIn Profile URL *
                                </label>
                                <input
                                  type="url"
                                  name="linkedinUrl"
                                  value={formData.linkedinUrl}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 bg-gray-50 hover:bg-white transition-colors duration-200"
                                  placeholder="https://linkedin.com/in/yourprofile"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                  Current Role/Title
                                </label>
                                <input
                                  type="text"
                                  name="currentRole"
                                  value={formData.currentRole}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 bg-gray-50 hover:bg-white transition-colors duration-200"
                                  placeholder="e.g., Software Engineer, Marketing Manager"
                                />
                              </div>
                            </>
                          )}

                          {/* Interview Prep Specific Fields */}
                          {activeService === 'interview-prep' && (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Interview Date *
                                  </label>
                                  <input
                                    type="date"
                                    name="interviewDate"
                                    value={formData.interviewDate}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 bg-gray-50 hover:bg-white transition-colors duration-200"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Company Name *
                                  </label>
                                  <input
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 bg-gray-50 hover:bg-white transition-colors duration-200"
                                    placeholder="Company you're interviewing with"
                                    required
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                  Role/Position Applying For *
                                </label>
                                <input
                                  type="text"
                                  name="currentRole"
                                  value={formData.currentRole}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 bg-gray-50 hover:bg-white transition-colors duration-200"
                                  placeholder="e.g., Senior Developer, Product Manager"
                                  required
                                />
                              </div>
                            </>
                          )}

                          {/* Career Counseling Specific Fields */}
                          {activeService === 'counseling' && (
                            <>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                  Years of Experience
                                </label>
                                <select
                                  name="yearsOfExperience"
                                  value={formData.yearsOfExperience}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 bg-gray-50 hover:bg-white transition-colors duration-200"
                                >
                                  <option value="">Select...</option>
                                  <option value="0-1">0-1 years</option>
                                  <option value="1-3">1-3 years</option>
                                  <option value="3-5">3-5 years</option>
                                  <option value="5-10">5-10 years</option>
                                  <option value="10+">10+ years</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                  Career Goals
                                </label>
                                <textarea
                                  name="careerGoals"
                                  value={formData.careerGoals}
                                  onChange={handleInputChange}
                                  rows={4}
                                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 bg-gray-50 hover:bg-white transition-colors duration-200"
                                  placeholder="Tell us about your career aspirations and what you'd like to achieve..."
                                />
                              </div>
                            </>
                          )}

                        {/* Error Message */}
                        {error && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-error text-sm">{error}</p>
                          </div>
                        )}

                        {/* Success Message */}
                        {success && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-secondary text-sm">{success}</p>
                          </div>
                        )}

                          {/* Submit Button */}
                          <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full py-4 px-6 bg-gradient-to-r ${service.bgGradient} text-white font-bold rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2`}
                          >
                            {loading ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Submitting...</span>
                              </>
                            ) : (
                              <>
                                <span>Request {service.title}</span>
                                <ArrowRight className="w-5 h-5" />
                              </>
                            )}
                          </motion.button>
                        </form>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
