'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


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

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens in localStorage (you might want to use httpOnly cookies instead)
        localStorage.setItem('accessToken', data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));

        // Trigger auth change event for navbar update
        window.dispatchEvent(new Event('authChange'));

        // Redirect based on user role
        const userRole = data.data.user.role;
        switch (userRole) {
          case 'admin':
          case 'super_admin':
            router.push('/admin/dashboard');
            break;
          case 'mentor':
            router.push('/mentor/dashboard');
            break;
          case 'ambassador':
            router.push('/ambassador/dashboard');
            break;
          case 'employer':
            router.push('/employer/dashboard');
            break;
          default:
            router.push('/dashboard');
        }
      } else {
        setError(data.error?.message || 'Login failed');
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
        {/* Left Side - Modern Design */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center lg:px-12 lg:py-16 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #5e17eb 0%, #4a12c4 50%, #3d0fa3 100%)' }}>
          {/* Animated Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-32 right-16 w-24 h-24 bg-white/5 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-full blur-md animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="relative z-10 max-w-md mx-auto">
            {/* Main Content Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-2xl mb-6">
              <div className="mb-6">
                <div className="inline-flex items-center px-3 py-1.5 bg-white/20 rounded-full text-xs font-semibold text-white mb-4">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Welcome Back!
                </div>

                <h1 className="text-3xl font-bold text-white mb-3 leading-tight">
                  Continue Your
                  <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                    Learning Journey
                  </span>
                </h1>

                <p className="text-base text-white/90 leading-relaxed">
                  Access your courses, track progress, and connect with mentors to accelerate your career growth.
                </p>
              </div>

              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-2xl font-bold text-white">24/7</div>
                    <div className="w-7 h-7 bg-blue-400/20 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-xs text-white/80">Access</div>
                </div>

                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-2xl font-bold text-white">Live</div>
                    <div className="w-7 h-7 bg-red-400/20 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-xs text-white/80">Sessions</div>
                </div>
              </div>

              {/* Enhanced Features */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-2.5 bg-white/10 rounded-lg border border-white/10">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Track Progress</div>
                    <div className="text-white/70 text-xs">Monitor your learning milestones</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-2.5 bg-white/10 rounded-lg border border-white/10">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Connect with Mentors</div>
                    <div className="text-white/70 text-xs">Get personalized guidance</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-2.5 bg-white/10 rounded-lg border border-white/10">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Resume Building</div>
                    <div className="text-white/70 text-xs">Pick up where you left off</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Quote */}
            {/* <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">PS</span>
                </div>
                <div>
                  <p className="text-white/90 text-xs italic mb-1">
                    "The personalized learning path helped me transition from marketing to tech in just 6 months!"
                  </p>
                  <div className="text-white/70 text-xs">
                    <span className="font-semibold">P. Sharma</span> - Product Manager @ Microsoft
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex flex-col justify-center px-6 py-12 lg:px-12" style={{ backgroundColor: '#ffffff' }}>
          <div className="max-w-md mx-auto w-full">
            {/* Logo */}
            <div className="mb-8">
              <div className="mb-1 flex justify-center">
                <img src="/images/logo1.png" alt="Logo" className="h-30 w-auto object-contain" />
              </div>

              <h2 className="text-4xl font-bold mb-2 text-center" style={{ color: '#000000' }}>
                Welcome Back
              </h2>
              <p className="text-center" style={{ color: '#000000' }}>
                Don't have an account?{' '}
                <Link href="/auth/register" className="font-semibold hover:underline" style={{ color: '#5e17eb' }}>
                  Create one here
                </Link>
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Email Address
                </label>
                <input
                  id="email"
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

              <div>
                <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Password
                </label>
                <input
                  id="password"
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
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded focus:ring-2"
                    style={{ accentColor: '#5e17eb', borderColor: '#5e17eb' }}
                  />
                  <label htmlFor="remember-me" className="ml-2 text-sm" style={{ color: '#000000' }}>
                    Remember me
                  </label>
                </div>
                <Link href="/auth/forgot-password" className="text-sm font-semibold hover:underline" style={{ color: '#5e17eb' }}>
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl text-sm font-medium border-2" style={{ backgroundColor: '#ffffff', border: '2px solid #ff4444', color: '#ff4444' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                style={{ backgroundColor: '#5e17eb', color: '#ffffff' }}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="text-center">
                <p className="text-xs" style={{ color: '#000000' }}>
                  By signing in, you agree to our{' '}
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
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#5e17eb' }}>
          <span className="text-2xl font-bold" style={{ color: '#ffffff' }}>SP</span>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-4 mx-auto mb-4" style={{ borderColor: '#5e17eb', borderTopColor: '#ffffff' }}></div>
        <p style={{ color: '#000000' }}>Loading login form...</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginContent />
    </Suspense>
  );
}