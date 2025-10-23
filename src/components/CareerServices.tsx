'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Linkedin, Clock, Users, ArrowRight } from 'lucide-react';

interface FormData {
  name: string;
  phone: string;
  email: string;
  city: string;
  collegeName: string;
}

export default function CareerServices() {
  const [activeService, setActiveService] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    city: '',
    collegeName: ''
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
      content: {
        title: 'Professional Resume Review Service',
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
      title: 'LinkedIn Optimization',
      icon: <Linkedin className="w-6 h-6" />,
      shortDesc: 'Transform your LinkedIn profile',
      content: {
        title: 'LinkedIn Profile Optimization Service',
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
      title: 'Last Minute Interview Preparation',
      icon: <Clock className="w-6 h-6" />,
      shortDesc: 'Quick interview preparation',
      content: {
        title: 'Last-Minute Interview Preparation Service',
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
      title: 'One on One Counseling',
      icon: <Users className="w-6 h-6" />,
      shortDesc: 'Personalized career guidance',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate required fields
    if (!formData.name || !formData.phone || !formData.email || !formData.city || !formData.collegeName) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const serviceTitle = services.find(s => s.id === activeService)?.title;
      
      const requestBody = {
        service: serviceTitle,
        ...formData,
        submittedAt: Date.now() // Use timestamp instead of ISO string
      };

      console.log('Career service request:', requestBody);

      // Here you would typically send to your API
      // const response = await fetch('/api/career-services', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(requestBody)
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess(`Thank you! Your ${serviceTitle} request has been submitted successfully. We'll contact you within 24 hours.`);
      setFormData({
        name: '',
        phone: '',
        email: '',
        city: '',
        collegeName: ''
      });

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
      collegeName: ''
    });
  };

  return (
    <section className="py-16 px-6 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Accelerate Your Career Growth
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get personalized career services from industry experts to land your dream job faster
          </p>
        </div>

        {/* Service Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <motion.button
              key={service.id}
              onClick={() => setActiveService(service.id)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:border-[#5e17eb] hover:shadow-xl transition-all duration-300 text-left group relative"
            >
              <div className="w-12 h-12 bg-[#5e17eb]/10 rounded-xl flex items-center justify-center text-[#5e17eb] mb-4 group-hover:bg-[#5e17eb] group-hover:text-white transition-colors duration-300">
                {service.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#5e17eb] transition-colors duration-300">
                {service.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {service.shortDesc}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[#5e17eb] font-medium text-sm group-hover:text-[#4a12c4] transition-colors duration-300">
                  Learn More
                </span>
                <ArrowRight className="w-4 h-4 text-[#5e17eb] group-hover:text-[#4a12c4] group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </motion.button>
          ))}
        </div>

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
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {(() => {
                  const service = services.find(s => s.id === activeService);
                  if (!service) return null;

                  return (
                    <div className="p-8">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-[#5e17eb]/10 rounded-lg flex items-center justify-center text-[#5e17eb]">
                            {service.icon}
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900">
                            {service.content.title}
                          </h3>
                        </div>
                        <button
                          onClick={closeModal}
                          className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors duration-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="mb-8">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">What You Get:</h4>
                        <ul className="space-y-3">
                          {service.content.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-start space-x-3">
                              <div className="w-2 h-2 bg-[#5e17eb] rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-gray-700">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Form */}
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5e17eb] focus:border-transparent text-gray-900"
                              placeholder="Enter your full name"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5e17eb] focus:border-transparent text-gray-900"
                              placeholder="Enter your phone number"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email Address *
                            </label>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5e17eb] focus:border-transparent text-gray-900"
                              placeholder="Enter your email address"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              City *
                            </label>
                            <input
                              type="text"
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5e17eb] focus:border-transparent text-gray-900"
                              placeholder="Enter your city"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            College Name *
                          </label>
                          <input
                            type="text"
                            name="collegeName"
                            value={formData.collegeName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5e17eb] focus:border-transparent text-gray-900"
                            placeholder="Enter your college name"
                            required
                          />
                        </div>

                        {/* Error Message */}
                        {error && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-600 text-sm">{error}</p>
                          </div>
                        )}

                        {/* Success Message */}
                        {success && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-green-600 text-sm">{success}</p>
                          </div>
                        )}

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-3 px-4 bg-[#5e17eb] text-white font-semibold rounded-lg hover:bg-[#4a12c4] focus:outline-none focus:ring-2 focus:ring-[#5e17eb] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          {loading ? (
                            <div className="flex items-center justify-center">
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Submitting...
                            </div>
                          ) : (
                            `Request ${service.title}`
                          )}
                        </button>
                      </form>
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