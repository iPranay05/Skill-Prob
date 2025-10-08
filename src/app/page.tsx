'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-left">
              {/* <div className="mb-6">
                <span className="text-gray-600 text-lg font-medium">Online education</span>
              </div> */}

              <h1 className="text-5xl lg:text-6xl font-bold text-black mb-8 leading-tight">
                Start learning
                <br />
                <span className="text-gray-600">at home</span>
              </h1>

              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Transform your career with expert-led courses, live interactive sessions, and personalized mentorship.
                Join thousands of learners who are advancing their skills from the comfort of their homes.
              </p>

              {/* Search Bar */}
              <div className="mb-8">
                <div className="relative max-w-md">
                  <input
                    type="text"
                    placeholder="What are you looking for?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 text-lg rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 text-black"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <button className="w-12 h-12 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#5e17eb' }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Pagination Dots */}
              <div className="flex space-x-2 mb-8">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#5e17eb' }}></div>
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth/register"
                  className="px-8 py-4 text-white font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl text-center"
                  style={{ backgroundColor: '#5e17eb' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4c14c7'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5e17eb'}
                >
                  Get Started Free
                </Link>
                <Link
                  href="/auth/login"
                  className="px-8 py-4 text-black font-semibold rounded-full border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 text-center bg-white"
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="relative">
              <div className="relative z-10">
                {/* Laptop/Computer */}
                <div className="bg-gray-100 rounded-2xl p-8 shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <div className="bg-white rounded-lg p-6 shadow-inner">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ffd700' }}>
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 rounded"></div>
                      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>

                {/* Books Stack */}
                <div className="absolute -bottom-8 -left-8 z-20">
                  <div className="relative">
                    <div className="w-24 h-32 rounded-lg shadow-lg transform -rotate-12" style={{ backgroundColor: '#4ade80' }}>
                      <div className="w-full h-4 bg-white/20 mt-2 rounded"></div>
                    </div>
                    <div className="absolute top-2 left-2 w-24 h-32 rounded-lg shadow-lg transform -rotate-6" style={{ backgroundColor: '#3b82f6' }}>
                      <div className="w-full h-4 bg-white/20 mt-2 rounded"></div>
                    </div>
                    <div className="absolute top-4 left-4 w-24 h-32 rounded-lg shadow-lg" style={{ backgroundColor: '#f59e0b' }}>
                      <div className="w-full h-4 bg-white/20 mt-2 rounded"></div>
                    </div>
                  </div>
                </div>

                {/* Coffee Mug */}
                <div className="absolute -top-4 -right-4 z-20">
                  <div className="w-16 h-20 rounded-lg shadow-lg" style={{ backgroundColor: '#ec4899' }}>
                    <div className="w-4 h-8 bg-gray-300 rounded-r-lg absolute -right-2 top-6"></div>
                  </div>
                </div>

                {/* Plant */}
                <div className="absolute -bottom-4 right-8 z-20">
                  <div className="w-12 h-16 rounded-lg shadow-lg" style={{ backgroundColor: '#fbbf24' }}>
                    <div className="flex justify-center pt-2">
                      <div className="w-8 h-12 rounded-full" style={{ backgroundColor: '#22c55e' }}>
                        <div className="w-2 h-6 bg-green-600 rounded-full mx-auto"></div>
                        <div className="w-3 h-4 bg-green-600 rounded-full mx-auto -mt-2"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute top-8 right-16 w-8 h-8 bg-blue-200 rounded-full opacity-60 animate-bounce"></div>
                <div className="absolute bottom-16 left-16 w-6 h-6 bg-purple-200 rounded-full opacity-60 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-lg text-gray-700 font-medium mb-8">
              Trusted by students and mentors worldwide
            </p>
            <div className="flex justify-center items-center space-x-12 opacity-60">
              <div className="text-2xl font-bold text-gray-600">10,000+ Students</div>
              <div className="text-2xl font-bold text-gray-600">500+ Mentors</div>
              <div className="text-2xl font-bold text-gray-600">50+ Courses</div>
              <div className="text-2xl font-bold text-gray-600">95% Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4">Why Choose Skill Probe LMS?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive learning platform offers everything you need to advance your career and achieve your goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#5e17eb' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Live Classes</h3>
              <p className="text-gray-600">
                Interactive live sessions with Google Meet integration. Real-time Q&A, polls, and collaborative learning experiences.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#5e17eb' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Recorded Content</h3>
              <p className="text-gray-600">
                Self-paced learning with chapter-based organization. Access high-quality video content anytime, anywhere.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#5e17eb' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Campus Ambassadors</h3>
              <p className="text-gray-600">
                Referral program with rewards and analytics. Earn while you learn and help others discover quality education.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#5e17eb' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Career Opportunities</h3>
              <p className="text-gray-600">
                Internships and job placements for students. Connect with top companies and advance your career with our network.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple steps to start your learning journey</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: '#5e17eb' }}>
                1
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Sign Up</h3>
              <p className="text-gray-600">
                Create your free account and choose your learning path. Browse our extensive course catalog and find the perfect fit for your goals.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: '#5e17eb' }}>
                2
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Learn</h3>
              <p className="text-gray-600">
                Attend live sessions, watch recorded content, and interact with expert mentors. Learn at your own pace with our flexible platform.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: '#5e17eb' }}>
                3
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Succeed</h3>
              <p className="text-gray-600">
                Apply your new skills, get certified, and advance your career. Access job opportunities and build your professional network.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-black mb-6">Ready to Transform Your Career?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of learners who have already started their journey to success.
            Get access to expert mentors, live sessions, and career opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-10 py-4 text-white font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
              style={{ backgroundColor: '#5e17eb' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4c14c7'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5e17eb'}
            >
              Start Learning Today
            </Link>
            <Link
              href="/courses"
              className="px-10 py-4 text-black font-semibold rounded-full border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 text-lg bg-white"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Skill Probe</h3>
              <p className="text-gray-400">
                Empowering learners worldwide with quality education and career opportunities.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/courses" className="hover:text-white">Courses</Link></li>
                <li><Link href="/live-sessions" className="hover:text-white">Live Sessions</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/about" className="hover:text-white">About</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Skill Probe LMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}