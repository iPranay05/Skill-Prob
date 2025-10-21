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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const refFromUrl = searchParams.get('ref');
    const refFromStorage = localStorage.getItem('referralCode');

    if (refFromUrl || refFromStorage) {
      setFormData(prev => ({
        ...prev,
        referralCode: refFromUrl || refFromStorage || ''
      }));

      if (refFromStorage) {
        localStorage.removeItem('referralCode');
      }
    }

    const specialAccess = searchParams.get('access');
    if (specialAccess === 'admin' || specialAccess === 'mentor' || specialAccess === 'employee') {
      setShowSpecialRoles(true);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        setShowSpecialRoles(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchParams]);

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
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundColor: '#5e17eb' }}></div>
      
      {/* Floating gradient blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ backgroundColor: '#5e17eb' }}></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ backgroundColor: '#5e17eb', animationDelay: '2s' }}></div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left Side - Premium Content */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center lg:px-12" style={{ backgroundColor: '#5e17eb' }}>
          <div className="max-w-md">
            {/* Gradient Card with Stats */}
            <div className="mb-12 rounded-3xl p-8 shadow-2xl transform hover:scale-105 transition-transform duration-300" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '2px solid rgba(255, 255, 255, 0.2)' }}>
              <div className="mb-6">
                <div className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff' }}>
                  Join 10,000+ Students
                </div>
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#ffffff' }}>Master Your Skills</h1>
                <p className="text-lg" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  Learn from industry experts and get certified
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', border: '2px solid rgba(255, 255, 255, 0.2)' }}>
                  <div className="text-3xl font-bold" style={{ color: '#ffffff' }}>98%</div>
                  <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Success Rate</div>
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', border: '2px solid rgba(255, 255, 255, 0.2)' }}>
                  <div className="text-3xl font-bold" style={{ color: '#ffffff' }}>500+</div>
                  <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Expert Mentors</div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3" style={{ color: '#ffffff' }}>
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Lifetime access to courses</span>
                </div>
                <div className="flex items-center space-x-3" style={{ color: '#ffffff' }}>
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Industry-recognized certificates</span>
                </div>
                <div className="flex items-center space-x-3" style={{ color: '#ffffff' }}>
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">1-on-1 mentoring sessions</span>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '2px solid rgba(255, 255, 255, 0.2)' }}>
              <p className="font-semibold mb-4" style={{ color: '#ffffff' }}>
                "SkillProbe transformed my career. The mentors are incredibly supportive!"
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}></div>
                <div>
                  <p className="font-semibold" style={{ color: '#ffffff' }}>Sarah Johnson</p>
                  <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Product Manager at Tech Co.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="flex flex-col justify-center px-6 py-12 lg:px-12" style={{ backgroundColor: '#ffffff' }}>
          <div className="max-w-md mx-auto w-full">
            {/* Logo */}
            <div className="mb-8">
              <div className="w-14 h-14 mb-6 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#5e17eb' }}>
                <span className="text-2xl font-bold" style={{ color: '#ffffff' }}>SP</span>
              </div>
              <h2 className="text-4xl font-bold mb-2" style={{ color: '#000000' }}>
                Create Account
              </h2>
              <p style={{ color: '#000000' }}>
                Already have an account?{' '}
                <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: '#5e17eb' }}>
                  Sign in
                </Link>
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    First Name
                  </label>
                  <input
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '2px solid #000000',
                      color: '#000000',
                      '--tw-ring-color': '#5e17eb'
                    } as any}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Last Name
                  </label>
                  <input
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '2px solid #000000',
                      color: '#000000',
                      '--tw-ring-color': '#5e17eb'
                    } as any}
                    placeholder="Last name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #5e17eb',
                    color: '#000000',
                    '--tw-ring-color': '#5e17eb'
                  } as any}
                  placeholder="Enter your email"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Phone Number <span className="font-normal" style={{ color: '#000000' }}>(Optional)</span>
                </label>
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #5e17eb',
                    color: '#000000',
                    '--tw-ring-color': '#5e17eb'
                  } as any}
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #5e17eb',
                    color: '#000000',
                    '--tw-ring-color': '#5e17eb'
                  } as any}
                  placeholder="Create a password"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Confirm Password
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #5e17eb',
                    color: '#000000',
                    '--tw-ring-color': '#5e17eb'
                  } as any}
                  placeholder="Confirm your password"
                />
              </div>

              {/* Referral Code */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Referral Code <span className="font-normal" style={{ color: '#000000' }}>(Optional)</span>
                </label>
                <input
                  name="referralCode"
                  type="text"
                  value={formData.referralCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #5e17eb',
                    color: '#000000',
                    '--tw-ring-color': '#5e17eb'
                  } as any}
                  placeholder="Enter referral code"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="px-4 py-3 rounded-xl text-sm font-medium border-2" style={{ backgroundColor: '#ffffff', border: '2px solid #ff4444', color: '#ff4444' }}>
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="px-4 py-3 rounded-xl text-sm font-medium border-2" style={{ backgroundColor: '#ffffff', border: '2px solid #4caf50', color: '#4caf50' }}>
                  {success}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                style={{ backgroundColor: '#5e17eb', color: '#ffffff' }}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>

              {/* Special Roles Section */}
              {showSpecialRoles && (
                <div className="mt-6 p-4 rounded-2xl border-2 border-dashed" style={{ borderColor: '#5e17eb', backgroundColor: '#ffffff' }}>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: '#000000' }}>Special Registration</h3>
                    <p className="text-sm" style={{ color: '#000000' }}>Register as mentor or employee</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link
                      href="/auth/register?role=mentor"
                      className="block text-center px-4 py-3 rounded-xl border-2 transition-all duration-200 hover:shadow-md"
                      style={{ borderColor: '#5e17eb', color: '#5e17eb' }}
                    >
                      <div className="font-semibold">Mentor Registration</div>
                      <div className="text-xs opacity-75">For industry experts</div>
                    </Link>
                    <Link
                      href="/auth/register?role=employee"
                      className="block text-center px-4 py-3 rounded-xl border-2 transition-all duration-200 hover:shadow-md"
                      style={{ borderColor: '#000000', color: '#000000' }}
                    >
                      <div className="font-semibold">Employee Registration</div>
                      <div className="text-xs opacity-75">For company staff</div>
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSpecialRoles(false)}
                    className="text-xs underline w-full mt-3"
                    style={{ color: '#000000' }}
                  >
                    Hide special access
                  </button>
                </div>
              )}

              {/* Terms and Privacy */}
              <div className="text-center">
                <p className="text-xs" style={{ color: '#000000' }}>
                  By creating an account, you agree to our{' '}
                  <Link href="/terms" className="hover:underline" style={{ color: '#5e17eb' }}>
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="hover:underline" style={{ color: '#5e17eb' }}>
                    Privacy Policy
                  </Link>
                </p>
                {!showSpecialRoles && (
                  <p className="text-xs mt-3" style={{ color: '#000000' }}>
                    Press Ctrl+Shift+M for special access
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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#5e17eb' }}>
          <span className="text-2xl font-bold" style={{ color: '#ffffff' }}>SP</span>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-4 mx-auto mb-4" style={{ borderColor: '#5e17eb', borderTopColor: '#ffffff' }}></div>
        <p style={{ color: '#000000' }}>Loading registration form...</p>
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