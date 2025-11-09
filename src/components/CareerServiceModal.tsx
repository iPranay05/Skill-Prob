'use client';
import { useState } from 'react';
import { X } from 'lucide-react';

// Custom scrollbar styles
const scrollbarStyles = `
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
`;

interface CareerServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: 'resume' | 'linkedin' | 'interview' | 'counseling';
}

function CareerServiceModal({ isOpen, onClose, serviceType }: CareerServiceModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    resumeUrl: '',
    linkedinUrl: '',
    preferredDate: '',
    preferredTime: '',
    experience: '',
    targetRole: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const getServiceTitle = () => {
    switch (serviceType) {
      case 'resume':
        return 'Resume Review Service';
      case 'linkedin':
        return 'LinkedIn Boost Service';
      case 'interview':
        return 'Interview Preparation';
      case 'counseling':
        return '1-on-1 Career Counseling';
      default:
        return 'Career Service';
    }
  };

  const getServiceDescription = () => {
    switch (serviceType) {
      case 'resume':
        return 'Get expert feedback on your resume from industry professionals. We\'ll help you create a resume that stands out.';
      case 'linkedin':
        return 'Transform your LinkedIn profile to attract recruiters and opportunities. Optimize your profile for maximum visibility.';
      case 'interview':
        return 'Prepare for your dream job interview with personalized coaching and mock interview sessions.';
      case 'counseling':
        return 'Get personalized career guidance from experienced mentors. Discuss your career goals and create an action plan.';
      default:
        return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // TODO: Implement API call to submit the form
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulated API call
      
      setSubmitStatus('success');
      setTimeout(() => {
        onClose();
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: '',
          resumeUrl: '',
          linkedinUrl: '',
          preferredDate: '',
          preferredTime: '',
          experience: '',
          targetRole: '',
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
      <style>{scrollbarStyles}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{getServiceTitle()}</h2>
            <p className="text-sm text-gray-600 mt-1">{getServiceDescription()}</p>
          </div>
          <button
            onClick={onClose}
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
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>
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

          {/* Service-specific fields */}
          {serviceType === 'resume' && (
            <>
              <div>
                <label htmlFor="resumeUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Resume URL (Google Drive, Dropbox, etc.) <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  id="resumeUrl"
                  name="resumeUrl"
                  required
                  value={formData.resumeUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://drive.google.com/..."
                />
              </div>
              <div>
                <label htmlFor="targetRole" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Role/Industry <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="targetRole"
                  name="targetRole"
                  required
                  value={formData.targetRole}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Software Engineer, Marketing Manager, etc."
                />
              </div>
            </>
          )}

          {serviceType === 'linkedin' && (
            <>
              <div>
                <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn Profile URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  id="linkedinUrl"
                  name="linkedinUrl"
                  required
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
              <div>
                <label htmlFor="targetRole" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Role/Industry <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="targetRole"
                  name="targetRole"
                  required
                  value={formData.targetRole}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Software Engineer, Marketing Manager, etc."
                />
              </div>
            </>
          )}

          {(serviceType === 'interview' || serviceType === 'counseling') && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="preferredDate"
                    name="preferredDate"
                    required
                    value={formData.preferredDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="preferredTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Time <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="preferredTime"
                    name="preferredTime"
                    required
                    value={formData.preferredTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select time</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                  Experience Level <span className="text-red-500">*</span>
                </label>
                <select
                  id="experience"
                  name="experience"
                  required
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select experience level</option>
                  <option value="fresher">Fresher (0-1 years)</option>
                  <option value="junior">Junior (1-3 years)</option>
                  <option value="mid">Mid-level (3-5 years)</option>
                  <option value="senior">Senior (5+ years)</option>
                </select>
              </div>
              {serviceType === 'interview' && (
                <div>
                  <label htmlFor="targetRole" className="block text-sm font-medium text-gray-700 mb-1">
                    Target Role/Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="targetRole"
                    name="targetRole"
                    required
                    value={formData.targetRole}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Software Engineer at Google"
                  />
                </div>
              )}
            </>
          )}

          {/* Message */}
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
              placeholder="Tell us more about your requirements..."
            />
          </div>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              <p className="font-medium">Success!</p>
              <p className="text-sm">Your request has been submitted. We'll contact you soon.</p>
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
              onClick={onClose}
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
  );
}

export default CareerServiceModal;
