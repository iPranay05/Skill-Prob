'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SocialMediaProfile {
  platform: string;
  handle: string;
  followers: number;
}

export default function AmbassadorApplication() {
  const [formData, setFormData] = useState({
    motivation: '',
    experience: '',
    expectedReferrals: '',
    marketingStrategy: ''
  });
  const [socialMedia, setSocialMedia] = useState<SocialMediaProfile[]>([
    { platform: '', handle: '', followers: 0 }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSocialMediaChange = (index: number, field: keyof SocialMediaProfile, value: string | number) => {
    setSocialMedia(prev => prev.map((social, i) => 
      i === index ? { ...social, [field]: value } : social
    ));
  };

  const addSocialMediaProfile = () => {
    setSocialMedia(prev => [...prev, { platform: '', handle: '', followers: 0 }]);
  };

  const removeSocialMediaProfile = (index: number) => {
    if (socialMedia.length > 1) {
      setSocialMedia(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    if (formData.motivation.length < 50 || formData.motivation.length > 1000) {
      setError('Motivation must be between 50 and 1000 characters');
      return false;
    }

    if (formData.experience.length < 20 || formData.experience.length > 500) {
      setError('Experience must be between 20 and 500 characters');
      return false;
    }

    const validSocialMedia = socialMedia.filter(social => 
      social.platform && social.handle && social.followers >= 0
    );

    if (validSocialMedia.length === 0) {
      setError('At least one valid social media profile is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const validSocialMedia = socialMedia.filter(social => 
        social.platform && social.handle && social.followers >= 0
      );

      const applicationData = {
        motivation: formData.motivation,
        experience: formData.experience,
        socialMedia: validSocialMedia,
        expectedReferrals: formData.expectedReferrals ? parseInt(formData.expectedReferrals) : undefined,
        marketingStrategy: formData.marketingStrategy || undefined
      };

      const response = await fetch('/api/ambassadors/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(applicationData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Application submission failed');
      }

      const result = await response.json();
      
      // Redirect to success page or dashboard
      router.push('/ambassador/dashboard');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Become an Ambassador</h1>
            <p className="text-gray-600 mt-2">
              Join our ambassador program and earn rewards by referring students to our platform.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Motivation */}
            <div>
              <label htmlFor="motivation" className="block text-sm font-medium text-gray-700 mb-2">
                Why do you want to become an ambassador? *
              </label>
              <textarea
                id="motivation"
                name="motivation"
                rows={4}
                value={formData.motivation}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell us about your motivation to become an ambassador (50-1000 characters)"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.motivation.length}/1000 characters (minimum 50)
              </p>
            </div>

            {/* Experience */}
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                Relevant Experience *
              </label>
              <textarea
                id="experience"
                name="experience"
                rows={3}
                value={formData.experience}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your relevant experience in marketing, social media, or education (20-500 characters)"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.experience.length}/500 characters (minimum 20)
              </p>
            </div>

            {/* Social Media Profiles */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Social Media Profiles *
              </label>
              {socialMedia.map((social, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                  <div>
                    <select
                      value={social.platform}
                      onChange={(e) => handleSocialMediaChange(index, 'platform', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Platform</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Twitter">Twitter</option>
                      <option value="Facebook">Facebook</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="YouTube">YouTube</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={social.handle}
                      onChange={(e) => handleSocialMediaChange(index, 'handle', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="@username or handle"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      value={social.followers}
                      onChange={(e) => handleSocialMediaChange(index, 'followers', parseInt(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Followers count"
                      required
                    />
                  </div>
                  <div className="flex items-center">
                    {socialMedia.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSocialMediaProfile(index)}
                        className="text-error hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addSocialMediaProfile}
                className="text-info hover:text-blue-800 text-sm font-medium"
              >
                + Add Another Profile
              </button>
            </div>

            {/* Expected Referrals */}
            <div>
              <label htmlFor="expectedReferrals" className="block text-sm font-medium text-gray-700 mb-2">
                Expected Monthly Referrals (Optional)
              </label>
              <input
                type="number"
                id="expectedReferrals"
                name="expectedReferrals"
                min="1"
                value={formData.expectedReferrals}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="How many referrals do you expect to generate monthly?"
              />
            </div>

            {/* Marketing Strategy */}
            <div>
              <label htmlFor="marketingStrategy" className="block text-sm font-medium text-gray-700 mb-2">
                Marketing Strategy (Optional)
              </label>
              <textarea
                id="marketingStrategy"
                name="marketingStrategy"
                rows={3}
                value={formData.marketingStrategy}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your strategy for promoting our courses and generating referrals"
              />
            </div>

            {/* Program Benefits */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-3">Ambassador Program Benefits</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-info mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Earn 10 points for each successful registration
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-info mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Earn 50 points for each first purchase by referred users
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-info mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Convert points to cash (1 point = ₹1)
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-info mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Access to exclusive promotional materials
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-info mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Performance analytics and tracking dashboard
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-info text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}