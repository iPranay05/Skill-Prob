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
      <div className="absolute inset-0 opacity-10" style={{ className="bg-primary" }}></div>

      {/* Floating gradient blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ className="bg-primary" }}></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ className="bg-primary", animationDelay: '2s' }}></div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left Side - Modern Design */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center lg:px-12 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #5e17eb 0%, #4a12c4 50%, #3d0fa3 100%)' }}>
          {/* Animated Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-32 right-16 w-24 h-24 bg-white/5 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-full blur-md animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="relative z-10 max-w-lg">
            {/* Logo Section */}
            {/* <div className="mb-8">
              <div className="flex justify-center items-center mb-6">
                <img
                  src="/images/logo1.png"
                  alt="Skill Probe Logo"
                  className="h-16 w-auto object-contain"
                />
              </div>
            </div> */}

            {/* Main Content Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl mb-8">
              <div className="mb-8">
                <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full text-sm font-semibold text-white mb-6">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Join 50,000+ Students
                </div>

                <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                  Transform Your
                  <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                    Career Journey
                  </span>
                </h1>

                <p className="text-lg text-white/90 leading-relaxed">
                  Learn from industry experts, get certified, and land your dream job with our comprehensive skill development platform.
                </p>
              </div>

              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-3xl font-bold text-white">98%</div>
                    <div className="w-8 h-8 bg-green-400/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-sm text-white/80">Success Rate</div>
                </div>

                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-3xl font-bold text-white">500+</div>
                    <div className="w-8 h-8 bg-blue-400/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-sm text-white/80">Expert Mentors</div>
                </div>
              </div>

              {/* Enhanced Features */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-3 bg-white/10 rounded-xl border border-white/10">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-semibold">Live Interactive Classes</div>
                    <div className="text-white/70 text-sm">Real-time learning with experts</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-3 bg-white/10 rounded-xl border border-white/10">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-400 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-semibold">Industry Certifications</div>
                    <div className="text-white/70 text-sm">Recognized by top companies</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-3 bg-white/10 rounded-xl border border-white/10">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-semibold">Career Support</div>
                    <div className="text-white/70 text-sm">Job placement assistance</div>
                  </div>
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
              <div className="mb-1 flex justify-center">
                <img src="/images/logo1.png" alt="Logo" className="h-30 w-auto object-contain" />
              </div>

              <h2 className="text-4xl font-bold mb-2 text-center" style={{ color: '#000000' }}>
                Create Account
              </h2>
              <p className="text-center" style={{ color: '#000000' }}>
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
                style={{ className="bg-primary", color: '#ffffff' }}
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
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg" style={{ className="bg-primary" }}>
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