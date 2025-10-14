'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });
  const [showSpecialRoles, setShowSpecialRoles] = useState(false);

  useEffect(() => {
    // Check for referral code from URL parameter or localStorage
    const refFromUrl = searchParams.get('ref');
    const refFromStorage = localStorage.getItem('referralCode');

    if (refFromUrl || refFromStorage) {
      setFormData(prev => ({
        ...prev,
        referralCode: refFromUrl || refFromStorage || ''
      }));

      // Clear from localStorage after using it
      if (refFromStorage) {
        localStorage.removeItem('referralCode');
      }
    }

    // Check for special access parameter
    const specialAccess = searchParams.get('access');
    if (specialAccess === 'admin' || specialAccess === 'mentor' || specialAccess === 'employee') {
      setShowSpecialRoles(true);
    }

    // Listen for key combination (Ctrl + Shift + R for Register)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        setShowSpecialRoles(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password,
          referralCode: formData.referralCode || undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration successful! Please check your email for verification.');
        setTimeout(() => {
          router.push('/auth/verify-otp?email=' + encodeURIComponent(formData.email));
        }, 2000);
      } else {
        setError(data.error?.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center lg:px-12" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f5f5f5' }}>
                <span className="text-3xl font-bold" style={{ color: '#181c31' }}>SP</span>
              </div>
              <h1 className="text-4xl font-bold mb-4" style={{ color: '#f5f5f5' }}>Join SkillProbe!</h1>
              <p className="text-xl opacity-90" style={{ color: '#f5f5f5' }}>
                Start your learning journey with thousands of students worldwide
              </p>
            </div>

            <div className="space-y-6 opacity-90" style={{ color: '#f5f5f5' }}>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 245, 245, 0.2)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Expert Mentors</h3>
                  <p className="text-sm opacity-75">Learn from industry professionals</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 245, 245, 0.2)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Certified Courses</h3>
                  <p className="text-sm opacity-75">Get recognized certifications</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 245, 245, 0.2)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Fast Track Learning</h3>
                  <p className="text-sm opacity-75">Accelerate your career growth</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="flex flex-col justify-center px-6 py-12 lg:px-12">
          <div className="max-w-md mx-auto w-full">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                <span className="text-2xl font-bold" style={{ color: '#f5f5f5' }}>SP</span>
              </div>
              <h1 className="text-2xl font-bold" style={{ color: '#181c31' }}>SkillProbe</h1>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2" style={{ color: '#181c31' }}>
                Create your account
              </h2>
              <p style={{ color: '#666' }}>
                Already have an account?{' '}
                <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: '#3a8ebe' }}>
                  Sign in here
                </Link>
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold mb-2" style={{ color: '#181c31' }}>
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white"
                    style={{ borderColor: 'rgba(58, 142, 190, 0.3)', color: '#181c31', '--tw-ring-color': '#3a8ebe' } as any}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold mb-2" style={{ color: '#181c31' }}>
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white"
                    style={{ borderColor: 'rgba(58, 142, 190, 0.3)', color: '#181c31', '--tw-ring-color': '#3a8ebe' } as any}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: '#181c31' }}>
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white"
                  style={{ borderColor: 'rgba(58, 142, 190, 0.3)', color: '#181c31', '--tw-ring-color': '#3a8ebe' } as any}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold mb-2" style={{ color: '#181c31' }}>
                  Phone Number <span style={{ color: '#666' }} className="font-normal">(Optional)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white"
                  style={{ borderColor: 'rgba(58, 142, 190, 0.3)', color: '#181c31', '--tw-ring-color': '#3a8ebe' } as any}
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: '#181c31' }}>
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white"
                  style={{ borderColor: 'rgba(58, 142, 190, 0.3)', color: '#181c31', '--tw-ring-color': '#3a8ebe' } as any}
                  placeholder="Create a password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2" style={{ color: '#181c31' }}>
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white"
                  style={{ borderColor: 'rgba(58, 142, 190, 0.3)', color: '#181c31', '--tw-ring-color': '#3a8ebe' } as any}
                  placeholder="Confirm your password"
                />
              </div>

              <div>
                <label htmlFor="referralCode" className="block text-sm font-semibold mb-2" style={{ color: '#181c31' }}>
                  Referral Code <span style={{ color: '#666' }} className="font-normal">(Optional)</span>
                </label>
                <input
                  id="referralCode"
                  name="referralCode"
                  type="text"
                  value={formData.referralCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white"
                  style={{ borderColor: 'rgba(58, 142, 190, 0.3)', color: '#181c31', '--tw-ring-color': '#3a8ebe' } as any}
                  placeholder="Enter referral code"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)', color: '#f5f5f5' }}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {loading ? 'Creating Account...' : 'Sending Verification Email...'}
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>

              {/* Special Roles Section - Hidden by default */}
              {showSpecialRoles && (
                <div className="mt-6 p-4 rounded-lg border-2 border-dashed" style={{ borderColor: '#3a8ebe', backgroundColor: 'rgba(58, 142, 190, 0.05)' }}>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: '#181c31' }}>Special Registration</h3>
                    <p className="text-sm" style={{ color: '#666' }}>Register as mentor or employee</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link
                      href="/auth/register?role=mentor"
                      className="block text-center px-4 py-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md"
                      style={{ borderColor: '#3a8ebe', color: '#3a8ebe' }}
                    >
                      <div className="font-semibold">Mentor Registration</div>
                      <div className="text-xs opacity-75">For industry experts</div>
                    </Link>
                    <Link
                      href="/auth/register?role=employee"
                      className="block text-center px-4 py-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md"
                      style={{ borderColor: '#181c31', color: '#181c31' }}
                    >
                      <div className="font-semibold">Employee Registration</div>
                      <div className="text-xs opacity-75">For company staff</div>
                    </Link>
                  </div>
                  <div className="text-center mt-3">
                    <button
                      onClick={() => setShowSpecialRoles(false)}
                      className="text-xs underline"
                      style={{ color: '#666' }}
                    >
                      Hide special access
                    </button>
                  </div>
                </div>
              )}

              <div className="text-center">
                <p className="text-sm" style={{ color: '#666' }}>
                  By creating an account, you agree to our{' '}
                  <Link href="/terms" className="hover:underline" style={{ color: '#3a8ebe' }}>
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="hover:underline" style={{ color: '#3a8ebe' }}>
                    Privacy Policy
                  </Link>
                </p>
                {!showSpecialRoles && (
                  <p className="text-xs mt-2" style={{ color: '#999' }}>
                    Press Ctrl+Shift+R for special access
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
          <span className="text-2xl font-bold" style={{ color: '#f5f5f5' }}>SP</span>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: '#3a8ebe' }}></div>
        <p style={{ color: '#666' }}>Loading registration form...</p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RegisterContent />
    </Suspense>
  );
}