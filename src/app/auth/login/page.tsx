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
  const [showSpecialRoles, setShowSpecialRoles] = useState(false);

  useEffect(() => {
    // Check for special access parameter or key combination
    const specialAccess = searchParams.get('access');
    if (specialAccess === 'admin' || specialAccess === 'mentor' || specialAccess === 'employee') {
      setShowSpecialRoles(true);
    }

    // Listen for key combination (Ctrl + Shift + M)
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
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center lg:px-12" style={{ background: 'linear-gradient(135deg, #5e17eb 0%,rgb(119, 95, 95) 100%)' }}>
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f5f5f5' }}>
                <span className="text-3xl font-bold" style={{ color: '#181c31' }}>SP</span>
              </div>
              <h1 className="text-4xl font-bold mb-4" style={{ color: '#f5f5f5' }}>Welcome Back!</h1>
              <p className="text-xl opacity-90" style={{ color: '#f5f5f5' }}>
                Continue your learning journey with SkillProbe
              </p>
            </div>

            <div className="space-y-6 opacity-90" style={{ color: '#f5f5f5' }}>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 245, 245, 0.2)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Live Interactive Sessions</h3>
                  <p className="text-sm opacity-75">Join real-time classes with expert mentors</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 245, 245, 0.2)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Comprehensive Courses</h3>
                  <p className="text-sm opacity-75">Access structured learning paths</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 245, 245, 0.2)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Career Opportunities</h3>
                  <p className="text-sm opacity-75">Get placed with top companies</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex flex-col justify-center px-6 py-12 lg:px-12">
          <div className="max-w-md mx-auto w-full">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #5e17eb 0%, #ffffff 100%)' }}>
                <span className="text-2xl font-bold" style={{ color: '#f5f5f5' }}>SP</span>
              </div>
              <h1 className="text-2xl font-bold" style={{ color: '#181c31' }}>SkillProbe</h1>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2" style={{ color: '#181c31' }}>
                Sign in to your account
              </h2>
              <p style={{ color: '#666' }}>
                Don't have an account?{' '}
                <Link href="/auth/register" className="font-semibold hover:underline" style={{ color: '#3a8ebe' }}>
                  Create one here
                </Link>
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
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
                    style={{ accentColor: '#3a8ebe', borderColor: 'rgba(58, 142, 190, 0.3)' }}
                  />
                  <label htmlFor="remember-me" className="ml-2 text-sm" style={{ color: '#666' }}>
                    Remember me
                  </label>
                </div>
                <Link href="/auth/forgot-password" className="text-sm font-semibold hover:underline" style={{ color: '#3a8ebe' }}>
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #5e17eb 0%, #ffffff 100%)', color: '#f5f5f5' }}
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

              {/* Special Roles Section - Hidden by default */}
              {showSpecialRoles && (
                <div className="mt-6 p-4 rounded-lg border-2 border-dashed" style={{ borderColor: '#3a8ebe', backgroundColor: 'rgba(58, 142, 190, 0.05)' }}>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: '#181c31' }}>Special Access</h3>
                    <p className="text-sm" style={{ color: '#666' }}>Login as mentor or employee</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link
                      href="/auth/login?role=mentor"
                      className="block text-center px-4 py-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md"
                      style={{ borderColor: '#3a8ebe', color: '#3a8ebe' }}
                    >
                      <div className="font-semibold">Mentor Login</div>
                      <div className="text-xs opacity-75">For industry experts</div>
                    </Link>
                    <Link
                      href="/auth/login?role=employee"
                      className="block text-center px-4 py-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md"
                      style={{ borderColor: '#181c31', color: '#181c31' }}
                    >
                      <div className="font-semibold">Employee Login</div>
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
                  By signing in, you agree to our{' '}
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
    <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #5e17eb 0%, #ffffff 100%)' }}>
          <span className="text-2xl font-bold" style={{ color: '#f5f5f5' }}>SP</span>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: '#3a8ebe' }}></div>
        <p style={{ color: '#666' }}>Loading login form...</p>
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