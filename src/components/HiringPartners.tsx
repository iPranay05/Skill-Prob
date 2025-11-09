'use client';
import { useState } from 'react';
import Image from 'next/image';
import { X, Building2 } from 'lucide-react';

export default function HiringPartners() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    hrName: '',
    email: '',
    phone: '',
    companySize: '',
    hiringNeeds: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const companies = [
    {
      name: 'Caloyaa',
      logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1vf27euHVprb4VBpZf-5UlPepegozmWMGFA&s',
    },
    {
      name: 'JustDial',
      logo: 'https://indiancompanies.in/wp-content/uploads/2021/10/About-Just-Dial-Limited-Company.png',
    },
    {
      name: 'Recruitminds',
      logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQozsCDW_PjGKGw4Wuerxl5NW-qpAC5aNYCKQ&s',
    },
    {
      name: 'Transcom',
      logo: 'https://cdn.prod.website-files.com/60870cca519aca7849a9262d/63c670f716d8a72d0fba0583_Transcom.jpg',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // TODO: Implement API call to submit the form
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulated API call
      
      setSubmitStatus('success');
      setTimeout(() => {
        setIsModalOpen(false);
        setFormData({
          companyName: '',
          hrName: '',
          email: '',
          phone: '',
          companySize: '',
          hiringNeeds: '',
          message: '',
        });
        setSubmitStatus('idle');
      }, 2000);
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <>
      <section className="bg-white py-8 md:py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Helping Companies Hire Top Talent.
            </h2>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl">
              Partner with SkillProbe to access a pool of skilled, job-ready candidates. We connect you with the right talent to grow your team.
            </p>
          </div>

          {/* Company Logos */}
          <div className="mb-10">
            <p className="text-center text-sm font-semibold text-gray-500 mb-6 uppercase tracking-wide">
              Trusted by Leading Companies
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
              {companies.map((company, index) => (
                <div
                  key={index}
                  className="relative w-32 h-20 flex items-center justify-center"
                >
                  <Image
                    src={company.logo}
                    alt={`${company.name} logo`}
                    fill
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-white px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold text-sm md:text-base hover:bg-primary-dark transition-all duration-150 shadow-md hover:shadow-lg inline-flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Building2 className="w-5 h-5" />
              Partner With Us to Hire
            </button>
            <p className="text-xs md:text-sm text-gray-500 mt-3">
              Our team will get back to you within 24 hours
            </p>
          </div>
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <>
          <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #f3f4f6;
              border-radius: 4px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #d1d5db;
              border-radius: 4px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #9ca3af;
            }
          `}</style>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Partner With SkillProbe</h2>
                  <p className="text-sm text-gray-600 mt-1">Fill out the form and our team will reach out to you shortly.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form - Scrollable Content */}
              <form 
                onSubmit={handleSubmit} 
                className="px-6 py-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#d1d5db #f3f4f6'
                }}
              >
                {/* Company Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div>
                    <label htmlFor="hrName" className="block text-sm font-medium text-gray-700 mb-1">
                      HR Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="hrName"
                      name="hrName"
                      required
                      value={formData.hrName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Work Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="hr@company.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="companySize" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Size <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="companySize"
                    name="companySize"
                    required
                    value={formData.companySize}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select company size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="hiringNeeds" className="block text-sm font-medium text-gray-700 mb-1">
                    Hiring Needs <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="hiringNeeds"
                    name="hiringNeeds"
                    required
                    value={formData.hiringNeeds}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Software Engineers, Marketing Specialists"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Information
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Tell us more about your hiring requirements..."
                  />
                </div>

                {/* Status Messages */}
                {submitStatus === 'success' && (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                    <p className="font-medium">Success!</p>
                    <p className="text-sm">Your request has been submitted. Our team will contact you soon.</p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    <p className="font-medium">Error!</p>
                    <p className="text-sm">Something went wrong. Please try again.</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
