'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function HomePage() {

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      {/* Navigation */}
      <Navbar />

      {/* 1. Hero Section */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f5f5f5 0%, rgba(58, 142, 190, 0.1) 100%)' }}>
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: 'linear-gradient(135deg, #3a8ebe 0%, #181c31 100%)' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full mb-8" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(58, 142, 190, 0.2)' }}>
              <span className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: '#3a8ebe' }}></span>
              <p className="text-sm font-medium" style={{ color: '#181c31' }}>SkillProbe - Mentorships, Internships, Jobs</p>
            </div>

            <h1 className="text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              <span style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Grow your skills,
              </span>
              <br />
              <span style={{ color: '#181c31' }}>define your future</span>
            </h1>

            <p className="text-xl mb-12 leading-relaxed max-w-4xl mx-auto font-light" style={{ color: '#666' }}>
              Skillprobe empowers learners to unlock their true potential by connecting them with experienced mentors,
              showcasing real-world skills, and enabling meaningful career opportunities. Our mission is to bridge the gap
              between ambition and achievement through personalized guidance, verified capabilities, and a trusted ecosystem
              where skills matter.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                href="/auth/register"
                className="group relative px-8 py-4 text-white font-semibold rounded-xl hover:shadow-2xl transition-all duration-300 text-lg transform hover:-translate-y-1"
                style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}
              >
                <span className="relative z-10">Get Started Free</span>
              </Link>
              <Link
                href="/demo"
                className="px-8 py-4 font-semibold rounded-xl border-2 transition-all duration-300 text-lg"
                style={{ color: '#181c31', borderColor: '#3a8ebe' }}
              >
                Watch Demo
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1" style={{ color: '#3a8ebe' }}>100+</div>
                <div className="text-sm" style={{ color: '#666' }}>Expert Mentors</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1" style={{ color: '#181c31' }}>5K+</div>
                <div className="text-sm" style={{ color: '#666' }}>Students Guided</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1" style={{ color: '#3a8ebe' }}>95%</div>
                <div className="text-sm" style={{ color: '#666' }}>Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Ace Your Dream Job Interview Section */}
      <div className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full mb-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <span className="mr-2" style={{ color: '#f5f5f5' }}>⚡</span>
              <span className="text-white text-sm font-medium">Limited Time Offer</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Ace Your Dream Job Interview<br />
              <span style={{ color: '#f5f5f5' }}>
                with Expert Help – For FREE!
              </span>
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
              Struggling with interviews? Nervous about placements or switching jobs? Skill Probe brings you a FREE 1-on-1 Interview Prep Session — curated for students & professionals like YOU.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-white mb-8">Why This Is a Game-Changer</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1" style={{ backgroundColor: '#f5f5f5' }}>
                    <span className="text-sm" style={{ color: '#181c31' }}>✓</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">1-on-1 Mock Interview</h4>
                    <p style={{ color: 'rgba(245, 245, 245, 0.7)' }}>with an expert mentor from your industry</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1" style={{ backgroundColor: '#f5f5f5' }}>
                    <span className="text-sm" style={{ color: '#181c31' }}>✓</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Instant Resume Feedback</h4>
                    <p style={{ color: 'rgba(245, 245, 245, 0.7)' }}>Get actionable insights to improve your CV</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1" style={{ backgroundColor: '#f5f5f5' }}>
                    <span className="text-sm" style={{ color: '#181c31' }}>✓</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Personalized Tips</h4>
                    <p style={{ color: 'rgba(245, 245, 245, 0.7)' }}>Tailored strategies to ace your next interview</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1" style={{ backgroundColor: '#f5f5f5' }}>
                    <span className="text-sm" style={{ color: '#181c31' }}>✓</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Flexible Timing</h4>
                    <p style={{ color: 'rgba(245, 245, 245, 0.7)' }}>You choose your slot that works best</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-8 shadow-2xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div className="text-center mb-6">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold mb-4" style={{ backgroundColor: '#f5f5f5', color: '#181c31' }}>
                  🔥 FREE SESSION
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Limited-Time Free Offer!</h3>
                <p className="mb-8" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
                  No group sessions. No fluff. Just real, personalized guidance. Book your session now – slots are filling fast!
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
                  <span className="mr-3" style={{ color: '#f5f5f5' }}>✓</span>
                  <span>30-minute personalized session</span>
                </div>
                <div className="flex items-center" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
                  <span className="mr-3" style={{ color: '#f5f5f5' }}>✓</span>
                  <span>Industry expert mentor</span>
                </div>
                <div className="flex items-center" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
                  <span className="mr-3" style={{ color: '#f5f5f5' }}>✓</span>
                  <span>Actionable feedback report</span>
                </div>
              </div>

              <Link
                href="/auth/register"
                className="w-full block text-center px-8 py-4 font-bold rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ backgroundColor: '#f5f5f5', color: '#181c31' }}
              >
                Book Free Session Now
              </Link>

              <p className="text-center text-sm mt-4" style={{ color: 'rgba(245, 245, 245, 0.6)' }}>
                ⏰ Only 50 slots available this month
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Core Features Section */}
      <div className="py-24" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)', color: '#3a8ebe' }}>
              ✨ SKILLPROBE FEATURES
            </div>
            <h2 className="text-5xl font-bold mb-6 leading-tight" style={{ color: '#181c31' }}>
              Core Features of
              <span style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> Skillprobe</span>
            </h2>
            <p className="text-xl max-w-4xl mx-auto leading-relaxed" style={{ color: '#666' }}>
              Explore mentorship like never before. SkillProbe connects candidates with vetted industry mentors for paid sessions
              that offer insights, networking, and career growth. Get advice, learn the ropes, and invest in your future — one session at a time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2" style={{ borderColor: 'rgba(58, 142, 190, 0.1)' }}>
              <div className="w-16 h-16 mb-6 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 transition-colors" style={{ color: '#181c31' }}>Expert Mentor Matching</h3>
              <p className="leading-relaxed" style={{ color: '#666' }}>
                Get paired with industry professionals tailored to your career goals and interests using our AI-powered matching system.
              </p>
            </div>

            <div className="group bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2" style={{ borderColor: 'rgba(58, 142, 190, 0.1)' }}>
              <div className="w-16 h-16 mb-6 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(135deg, #3a8ebe 0%, #181c31 100%)' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 transition-colors" style={{ color: '#181c31' }}>Mentorship Opportunities</h3>
              <p className="leading-relaxed" style={{ color: '#666' }}>
                Mentors earn for their time while students invest in real, hands-on learning experiences with transparent pricing.
              </p>
            </div>

            <div className="group bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2" style={{ borderColor: 'rgba(58, 142, 190, 0.1)' }}>
              <div className="w-16 h-16 mb-6 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 transition-colors" style={{ color: '#181c31' }}>Psychometric Assessments</h3>
              <p className="leading-relaxed" style={{ color: '#666' }}>
                Enable you to identify the right candidates and help your people develop their potential through data-driven insights.
              </p>
            </div>

            <div className="group bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2" style={{ borderColor: 'rgba(58, 142, 190, 0.1)' }}>
              <div className="w-16 h-16 mb-6 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(135deg, #3a8ebe 0%, #181c31 100%)' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 transition-colors" style={{ color: '#181c31' }}>1-on-1 Sessions</h3>
              <p className="leading-relaxed" style={{ color: '#666' }}>
                Book private, personalized mentorship calls for career advice, skill-building, or portfolio reviews with video conferencing.
              </p>
            </div>

            <div className="group bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2" style={{ borderColor: 'rgba(58, 142, 190, 0.1)' }}>
              <div className="w-16 h-16 mb-6 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 transition-colors" style={{ color: '#181c31' }}>Progress Tracking</h3>
              <p className="leading-relaxed" style={{ color: '#666' }}>
                Monitor your growth, session history, and goals through an intuitive dashboard experience with detailed analytics.
              </p>
            </div>

            <div className="group bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2" style={{ borderColor: 'rgba(58, 142, 190, 0.1)' }}>
              <div className="w-16 h-16 mb-6 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(135deg, #3a8ebe 0%, #181c31 100%)' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 transition-colors" style={{ color: '#181c31' }}>Flexible Scheduling</h3>
              <p className="leading-relaxed" style={{ color: '#666' }}>
                Choose time slots that work for you and connect with mentors across different time zones with smart calendar integration.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Find Your Mentor Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)', color: '#3a8ebe' }}>
                👨‍🏫 EXPERT MENTORS
              </div>
              <h2 className="text-5xl font-bold mb-6 leading-tight" style={{ color: '#181c31' }}>
                Find Your
                <span style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> Mentor</span>
              </h2>
              <p className="text-xl mb-8 leading-relaxed" style={{ color: '#666' }}>
                Over 100 mentors trust Skillprobe to connect with passionate learners, share their expertise, and grow their professional impact. Get personalized guidance from professionals who've been where you want to go.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#3a8ebe' }}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span style={{ color: '#181c31' }}>1-on-1 personalized mentorship sessions</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#3a8ebe' }}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span style={{ color: '#181c31' }}>Industry professionals from top companies</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#3a8ebe' }}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span style={{ color: '#181c31' }}>Flexible scheduling across time zones</span>
                </div>
              </div>

              <Link
                href="/mentors"
                className="inline-flex items-center px-8 py-4 text-white font-semibold rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}
              >
                Browse Mentors
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            <div className="relative">
              {/* Mentor Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                    <span className="text-white font-bold">JS</span>
                  </div>
                  <h4 className="font-bold mb-1" style={{ color: '#181c31' }}>John Smith</h4>
                  <p className="text-sm mb-3" style={{ color: '#666' }}>Senior Developer at Google</p>
                  <div className="flex items-center">
                    <div className="flex text-sm" style={{ color: '#3a8ebe' }}>★★★★★</div>
                    <span className="text-xs ml-2" style={{ color: '#666' }}>4.9 (127)</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300 mt-8" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #3a8ebe 0%, #181c31 100%)' }}>
                    <span className="text-white font-bold">SJ</span>
                  </div>
                  <h4 className="font-bold mb-1" style={{ color: '#181c31' }}>Sarah Johnson</h4>
                  <p className="text-sm mb-3" style={{ color: '#666' }}>Data Scientist at Meta</p>
                  <div className="flex items-center">
                    <div className="flex text-sm" style={{ color: '#3a8ebe' }}>★★★★★</div>
                    <span className="text-xs ml-2" style={{ color: '#666' }}>4.8 (89)</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg transform rotate-2 hover:rotate-0 transition-transform duration-300" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                    <span className="text-white font-bold">MC</span>
                  </div>
                  <h4 className="font-bold mb-1" style={{ color: '#181c31' }}>Mike Chen</h4>
                  <p className="text-sm mb-3" style={{ color: '#666' }}>Marketing Director at Uber</p>
                  <div className="flex items-center">
                    <div className="flex text-sm" style={{ color: '#3a8ebe' }}>★★★★★</div>
                    <span className="text-xs ml-2" style={{ color: '#666' }}>4.7 (156)</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg transform -rotate-1 hover:rotate-0 transition-transform duration-300 mt-4" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #3a8ebe 0%, #181c31 100%)' }}>
                    <span className="text-white font-bold">AL</span>
                  </div>
                  <h4 className="font-bold mb-1" style={{ color: '#181c31' }}>Anna Lee</h4>
                  <p className="text-sm mb-3" style={{ color: '#666' }}>UX Designer at Apple</p>
                  <div className="flex items-center">
                    <div className="flex text-sm" style={{ color: '#3a8ebe' }}>★★★★★</div>
                    <span className="text-xs ml-2" style={{ color: '#666' }}>4.9 (203)</span>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-xl opacity-20" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full blur-xl opacity-20" style={{ background: 'linear-gradient(135deg, #3a8ebe 0%, #181c31 100%)' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Popular Courses Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)', color: '#3a8ebe' }}>
              🔥 TRENDING COURSES
            </div>
            <h2 className="text-5xl font-bold mb-6 leading-tight" style={{ color: '#181c31' }}>
              Most Popular
              <span style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> Courses</span>
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: '#666' }}>
              Join thousands of students learning from industry experts. Start your journey with our most popular courses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Course Card 1 */}
            <div className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <div className="relative">
                <div className="h-48 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                  <div className="text-center text-white">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold">Full Stack Development</h3>
                  </div>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#3a8ebe' }}>BESTSELLER</span>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                    <span className="text-sm" style={{ color: '#3a8ebe' }}>★</span>
                    <span className="text-sm font-semibold ml-1" style={{ color: '#181c31' }}>4.9</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)' }}>
                    <span className="font-bold text-sm" style={{ color: '#3a8ebe' }}>JS</span>
                  </div>
                  <span className="text-sm" style={{ color: '#666' }}>John Smith • Senior Developer</span>
                </div>
                <h4 className="text-xl font-bold mb-2 transition-colors" style={{ color: '#181c31' }}>
                  Complete Full Stack Web Development Bootcamp
                </h4>
                <p className="text-sm mb-4 line-clamp-2" style={{ color: '#666' }}>
                  Master React, Node.js, MongoDB, and more. Build real-world projects and get job-ready skills.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm" style={{ color: '#666' }}>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      40h
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      2.5k
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold" style={{ color: '#181c31' }}>$99</span>
                    <span className="line-through ml-2" style={{ color: '#666' }}>$199</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Card 2 */}
            <div className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <div className="relative">
                <div className="h-48 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3a8ebe 0%, #181c31 100%)' }}>
                  <div className="text-center text-white">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold">Data Science & AI</h3>
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                    <span className="text-sm" style={{ color: '#3a8ebe' }}>★</span>
                    <span className="text-sm font-semibold ml-1" style={{ color: '#181c31' }}>4.8</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)' }}>
                    <span className="font-bold text-sm" style={{ color: '#3a8ebe' }}>AI</span>
                  </div>
                  <span className="text-sm" style={{ color: '#666' }}>Sarah Johnson • Data Scientist</span>
                </div>
                <h4 className="text-xl font-bold mb-2 transition-colors" style={{ color: '#181c31' }}>
                  Machine Learning & AI Fundamentals
                </h4>
                <p className="text-sm mb-4 line-clamp-2" style={{ color: '#666' }}>
                  Learn Python, TensorFlow, and build ML models. Perfect for beginners starting in AI.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm" style={{ color: '#666' }}>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      35h
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 715.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      1.8k
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold" style={{ color: '#181c31' }}>$129</span>
                    <span className="line-through ml-2" style={{ color: '#666' }}>$249</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Card 3 */}
            <div className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <div className="relative">
                <div className="h-48 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3a8ebe 0%, #181c31 100%)' }}>
                  <div className="text-center text-white">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold">Digital Marketing</h3>
                  </div>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#3a8ebe' }}>HOT</span>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                    <span className="text-sm" style={{ color: '#3a8ebe' }}>★</span>
                    <span className="text-sm font-semibold ml-1" style={{ color: '#181c31' }}>4.7</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)' }}>
                    <span className="font-bold text-sm" style={{ color: '#3a8ebe' }}>DM</span>
                  </div>
                  <span className="text-sm" style={{ color: '#666' }}>Mike Chen • Marketing Expert</span>
                </div>
                <h4 className="text-xl font-bold mb-2 transition-colors" style={{ color: '#181c31' }}>
                  Complete Digital Marketing Mastery
                </h4>
                <p className="text-sm mb-4 line-clamp-2" style={{ color: '#666' }}>
                  Master SEO, Social Media, PPC, and Analytics. Grow your business or career in marketing.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      28h
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      3.2k
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold" style={{ color: '#181c31' }}>$79</span>
                    <span className="line-through ml-2" style={{ color: '#666' }}>$159</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/courses"
              className="inline-flex items-center px-8 py-4 text-white font-semibold rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}
            >
              View All Courses
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Find Your Mentor Section */}
      <div className="py-24" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)', color: '#3a8ebe' }}>
                👨‍🏫 EXPERT MENTORS
              </div>
              <h2 className="text-5xl font-bold mb-6 leading-tight" style={{ color: '#181c31' }}>
                Learn from
                <span style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> Industry Experts</span>
              </h2>
              <p className="text-xl mb-8 leading-relaxed" style={{ color: '#666' }}>
                Over 500+ verified mentors from top companies like Google, Microsoft, Amazon, and Meta trust SkillProbe to share their expertise. Get personalized guidance from professionals who've built successful careers in your field of interest.
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1" style={{ backgroundColor: '#3a8ebe' }}>
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: '#181c31' }}>1-on-1 Personalized Sessions</h4>
                    <p style={{ color: '#666' }}>Direct access to industry experts for career guidance, skill development, and portfolio reviews</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1" style={{ backgroundColor: '#3a8ebe' }}>
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: '#181c31' }}>Verified Industry Professionals</h4>
                    <p style={{ color: '#666' }}>All mentors are thoroughly vetted with proven track records at leading companies</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1" style={{ backgroundColor: '#3a8ebe' }}>
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: '#181c31' }}>Flexible Global Scheduling</h4>
                    <p style={{ color: '#666' }}>Connect with mentors across different time zones with our smart scheduling system</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1" style={{ backgroundColor: '#3a8ebe' }}>
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: '#181c31' }}>Affordable Pricing</h4>
                    <p style={{ color: '#666' }}>Quality mentorship starting from just $25/session with transparent pricing</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href="/mentors"
                  className="inline-flex items-center px-8 py-4 text-white font-semibold rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                  style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}
                >
                  Browse Mentors
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/become-mentor"
                  className="inline-flex items-center px-8 py-4 font-semibold rounded-xl border-2 transition-all duration-300"
                  style={{ color: '#181c31', borderColor: '#3a8ebe' }}
                >
                  Become a Mentor
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1" style={{ color: '#3a8ebe' }}>500+</div>
                  <div className="text-sm" style={{ color: '#666' }}>Expert Mentors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1" style={{ color: '#181c31' }}>10K+</div>
                  <div className="text-sm" style={{ color: '#666' }}>Sessions Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1" style={{ color: '#3a8ebe' }}>4.9</div>
                  <div className="text-sm" style={{ color: '#666' }}>Average Rating</div>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Mentor Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                    <span className="text-white font-bold">JS</span>
                  </div>
                  <h4 className="font-bold mb-1" style={{ color: '#181c31' }}>John Smith</h4>
                  <p className="text-sm mb-3" style={{ color: '#666' }}>Senior Developer at Google</p>
                  <div className="flex items-center justify-between">
                    <div className="flex text-sm" style={{ color: '#3a8ebe' }}>★★★★★</div>
                    <span className="text-xs" style={{ color: '#666' }}>4.9 (127)</span>
                  </div>
                  <div className="mt-2 text-xs" style={{ color: '#3a8ebe' }}>$45/session</div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300 mt-8" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #3a8ebe 0%, #181c31 100%)' }}>
                    <span className="text-white font-bold">SJ</span>
                  </div>
                  <h4 className="font-bold mb-1" style={{ color: '#181c31' }}>Sarah Johnson</h4>
                  <p className="text-sm mb-3" style={{ color: '#666' }}>Data Scientist at Meta</p>
                  <div className="flex items-center justify-between">
                    <div className="flex text-sm" style={{ color: '#3a8ebe' }}>★★★★★</div>
                    <span className="text-xs" style={{ color: '#666' }}>4.8 (89)</span>
                  </div>
                  <div className="mt-2 text-xs" style={{ color: '#3a8ebe' }}>$55/session</div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg transform rotate-2 hover:rotate-0 transition-transform duration-300" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                    <span className="text-white font-bold">MC</span>
                  </div>
                  <h4 className="font-bold mb-1" style={{ color: '#181c31' }}>Mike Chen</h4>
                  <p className="text-sm mb-3" style={{ color: '#666' }}>Marketing Director at Uber</p>
                  <div className="flex items-center justify-between">
                    <div className="flex text-sm" style={{ color: '#3a8ebe' }}>★★★★★</div>
                    <span className="text-xs" style={{ color: '#666' }}>4.7 (156)</span>
                  </div>
                  <div className="mt-2 text-xs" style={{ color: '#3a8ebe' }}>$40/session</div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg transform -rotate-1 hover:rotate-0 transition-transform duration-300 mt-4" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #3a8ebe 0%, #181c31 100%)' }}>
                    <span className="text-white font-bold">AL</span>
                  </div>
                  <h4 className="font-bold mb-1" style={{ color: '#181c31' }}>Anna Lee</h4>
                  <p className="text-sm mb-3" style={{ color: '#666' }}>UX Designer at Apple</p>
                  <div className="flex items-center justify-between">
                    <div className="flex text-sm" style={{ color: '#3a8ebe' }}>★★★★★</div>
                    <span className="text-xs" style={{ color: '#666' }}>4.9 (203)</span>
                  </div>
                  <div className="mt-2 text-xs" style={{ color: '#3a8ebe' }}>$50/session</div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-xl opacity-20" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full blur-xl opacity-20" style={{ background: 'linear-gradient(135deg, #3a8ebe 0%, #181c31 100%)' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* The Future of Career Growth Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)', color: '#3a8ebe' }}>
              🚀 FUTURE OF GROWTH
            </div>
            <h2 className="text-5xl font-bold mb-6 leading-tight" style={{ color: '#181c31' }}>
              The Future of
              <span style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> Career Growth</span>
            </h2>
            <p className="text-xl max-w-4xl mx-auto" style={{ color: '#666' }}>
              SkillProbe is revolutionizing professional development by creating a global ecosystem where ambition meets expertise. We're building the future where quality mentorship is accessible, affordable, and outcome-driven for everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
            <div>
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mr-6 mt-1" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                    <span className="text-white font-bold text-xl">01</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4" style={{ color: '#181c31' }}>AI-Powered Mentor Matching</h3>
                    <p style={{ color: '#666' }}>
                      Our advanced algorithm analyzes your goals, experience level, and learning style to connect you with the perfect mentor who understands your journey and can accelerate your growth.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mr-6 mt-1" style={{ background: 'linear-gradient(135deg, #3a8ebe 0%, #181c31 100%)' }}>
                    <span className="text-white font-bold text-xl">02</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4" style={{ color: '#181c31' }}>Outcome-Based Learning</h3>
                    <p style={{ color: '#666' }}>
                      Every mentorship session is designed with clear objectives and measurable outcomes. Track your progress, celebrate milestones, and see tangible results in your career advancement.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mr-6 mt-1" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                    <span className="text-white font-bold text-xl">03</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4" style={{ color: '#181c31' }}>Global Career Opportunities</h3>
                    <p style={{ color: '#666' }}>
                      Access exclusive job opportunities, internships, and project collaborations through our network of mentor companies and partner organizations worldwide.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-8" style={{ background: 'linear-gradient(135deg, rgba(58, 142, 190, 0.05) 0%, rgba(24, 28, 49, 0.02) 100%)', border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold mb-4" style={{ color: '#3a8ebe' }}>Empowering Professionals Globally</h4>
                <h3 className="text-3xl font-bold mb-6" style={{ color: '#181c31' }}>
                  Complete Career<br />Transformation Platform
                </h3>
                <p className="mb-8" style={{ color: '#666' }}>
                  From skill assessment and personalized learning paths to interview preparation and salary negotiation - SkillProbe provides everything professionals need to achieve their career aspirations.
                </p>
              </div>

              {/* Success Metrics */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2" style={{ color: '#3a8ebe' }}>85%</div>
                  <div className="text-sm" style={{ color: '#666' }}>Career Advancement</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2" style={{ color: '#181c31' }}>3x</div>
                  <div className="text-sm" style={{ color: '#666' }}>Faster Learning</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2" style={{ color: '#3a8ebe' }}>92%</div>
                  <div className="text-sm" style={{ color: '#666' }}>Goal Achievement</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2" style={{ color: '#181c31' }}>40%</div>
                  <div className="text-sm" style={{ color: '#666' }}>Salary Increase</div>
                </div>
              </div>

              <Link
                href="/about"
                className="w-full block text-center px-6 py-3 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}
              >
                Discover Your Potential →
              </Link>
            </div>
          </div>

          {/* Future Vision */}
          <div className="text-center p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(24, 28, 49, 0.05) 0%, rgba(58, 142, 190, 0.05) 100%)' }}>
            <h3 className="text-2xl font-bold mb-4" style={{ color: '#181c31' }}>Building Tomorrow's Workforce Today</h3>
            <p className="text-lg max-w-4xl mx-auto" style={{ color: '#666' }}>
              Join us in creating a world where geographical boundaries don't limit career growth, where expertise is shared freely, and where every professional has access to the guidance they need to reach their full potential.
            </p>
          </div>
        </div>
      </div>

      {/* Learning Paths Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)', color: '#3a8ebe' }}>
              🎯 LEARNING PATHS
            </div>
            <h2 className="text-5xl font-bold mb-6 leading-tight" style={{ color: '#181c31' }}>
              Structured
              <span style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> Learning Journeys</span>
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: '#666' }}>
              Follow curated learning tracks designed by industry experts and successful professionals. Each path includes hands-on projects, mentor guidance, and job placement assistance to ensure your success.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Learning Path 1 */}
            <div className="relative">
              <div className="rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2" style={{ background: 'linear-gradient(135deg, rgba(58, 142, 190, 0.05) 0%, rgba(24, 28, 49, 0.02) 100%)', border: '1px solid rgba(58, 142, 190, 0.1)' }}>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <span className="text-white px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#3a8ebe' }}>BEGINNER</span>
                </div>

                <h3 className="text-2xl font-bold mb-4" style={{ color: '#181c31' }}>Frontend Developer</h3>
                <p className="mb-6" style={{ color: '#666' }}>
                  Master HTML, CSS, JavaScript, and React. Build responsive websites and modern web applications with hands-on projects and mentor guidance.
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#3a8ebe' }}>
                      <span className="text-white text-xs">1</span>
                    </div>
                    <span className="text-sm" style={{ color: '#181c31' }}>HTML & CSS Fundamentals</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#3a8ebe' }}>
                      <span className="text-white text-xs">2</span>
                    </div>
                    <span className="text-sm" style={{ color: '#181c31' }}>JavaScript Essentials</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#3a8ebe' }}>
                      <span className="text-white text-xs">3</span>
                    </div>
                    <span className="text-sm" style={{ color: '#181c31' }}>React Development</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                      <span className="text-gray-600 text-xs">4</span>
                    </div>
                    <span className="text-gray-500 text-sm">Portfolio Projects & Job Prep</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mb-6" style={{ color: '#666' }}>
                  <span>6 months • 120 hours</span>
                  <span className="flex items-center">
                    <span className="mr-1" style={{ color: '#3a8ebe' }}>★</span>
                    4.8 (2.1k reviews)
                  </span>
                </div>

                <Link href="/learning-paths/frontend" className="w-full block text-center px-6 py-3 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                  Start Learning Path
                </Link>
              </div>
            </div>

            {/* Learning Path 2 */}
            <div className="relative">
              <div className="rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2" style={{ background: 'linear-gradient(135deg, rgba(24, 28, 49, 0.05) 0%, rgba(58, 142, 190, 0.02) 100%)', border: '1px solid rgba(58, 142, 190, 0.1)' }}>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3a8ebe 0%, #181c31 100%)' }}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-white px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#181c31' }}>INTERMEDIATE</span>
                </div>

                <h3 className="text-2xl font-bold mb-4" style={{ color: '#181c31' }}>Data Scientist</h3>
                <p className="mb-6" style={{ color: '#666' }}>
                  Learn Python, machine learning, and data visualization. Analyze data and build predictive models with real-world datasets.
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#3a8ebe' }}>
                      <span className="text-white text-xs">1</span>
                    </div>
                    <span className="text-sm" style={{ color: '#181c31' }}>Python for Data Science</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#3a8ebe' }}>
                      <span className="text-white text-xs">2</span>
                    </div>
                    <span className="text-sm" style={{ color: '#181c31' }}>Statistics & Probability</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#3a8ebe' }}>
                      <span className="text-white text-xs">3</span>
                    </div>
                    <span className="text-sm" style={{ color: '#181c31' }}>Machine Learning</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                      <span className="text-gray-600 text-xs">4</span>
                    </div>
                    <span className="text-gray-500 text-sm">Real-world Projects & Portfolio</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mb-6" style={{ color: '#666' }}>
                  <span>8 months • 160 hours</span>
                  <span className="flex items-center">
                    <span className="mr-1" style={{ color: '#3a8ebe' }}>★</span>
                    4.9 (1.8k reviews)
                  </span>
                </div>

                <Link href="/learning-paths/data-science" className="w-full block text-center px-6 py-3 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                  Start Learning Path
                </Link>
              </div>
            </div>

            {/* Learning Path 3 */}
            <div className="relative">
              <div className="rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2" style={{ background: 'linear-gradient(135deg, rgba(58, 142, 190, 0.02) 0%, rgba(24, 28, 49, 0.05) 100%)', border: '1px solid rgba(58, 142, 190, 0.1)' }}>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <span className="text-white px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#181c31' }}>ADVANCED</span>
                </div>

                <h3 className="text-2xl font-bold mb-4" style={{ color: '#181c31' }}>Digital Marketer</h3>
                <p className="mb-6" style={{ color: '#666' }}>
                  Master SEO, social media, PPC, and analytics. Drive growth and build successful marketing campaigns with data-driven strategies.
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#3a8ebe' }}>
                      <span className="text-white text-xs">1</span>
                    </div>
                    <span className="text-sm" style={{ color: '#181c31' }}>Marketing Fundamentals</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#3a8ebe' }}>
                      <span className="text-white text-xs">2</span>
                    </div>
                    <span className="text-sm" style={{ color: '#181c31' }}>SEO & Content Marketing</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#3a8ebe' }}>
                      <span className="text-white text-xs">3</span>
                    </div>
                    <span className="text-sm" style={{ color: '#181c31' }}>Paid Advertising</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                      <span className="text-gray-600 text-xs">4</span>
                    </div>
                    <span className="text-gray-500 text-sm">Campaign Management & Analytics</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mb-6" style={{ color: '#666' }}>
                  <span>5 months • 100 hours</span>
                  <span className="flex items-center">
                    <span className="mr-1" style={{ color: '#3a8ebe' }}>★</span>
                    4.7 (1.5k reviews)
                  </span>
                </div>

                <Link href="/learning-paths/digital-marketing" className="w-full block text-center px-6 py-3 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                  Start Learning Path
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/learning-paths"
              className="inline-flex items-center px-8 py-4 text-white font-semibold rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}
            >
              Explore All Learning Paths
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-black mb-8">
            Trusted by Mentors and candidates around the Globe.
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Skillprobe has gained trust of various mentors and candidates, helping mentors to share their experience and earn side income and guiding candidates to grow their career.
          </p>
        </div>
      </div>

      {/* Integrations Section */}
      <div className="py-24" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)', color: '#3a8ebe' }}>
              🔗 INTEGRATIONS
            </div>
            <h2 className="text-5xl font-bold mb-6 leading-tight" style={{ color: '#181c31' }}>
              Seamless Tools to Manage Your
              <span style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> Learning Journey</span>
            </h2>
            <p className="text-xl max-w-4xl mx-auto" style={{ color: '#666' }}>
              SkillProbe integrates with your favorite productivity tools and platforms, creating a unified learning ecosystem that fits seamlessly into your workflow and maximizes your learning efficiency.
            </p>
          </div>

          {/* Integration Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4" style={{ color: '#181c31' }}>Calendar & Scheduling</h3>
              <p className="mb-6" style={{ color: '#666' }}>
                Sync with Google Calendar, Outlook, and Apple Calendar for seamless session scheduling and automated reminders.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center">
                  <span className="text-sm" style={{ color: '#3a8ebe' }}>• Google Calendar</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-sm" style={{ color: '#3a8ebe' }}>• Microsoft Outlook</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-sm" style={{ color: '#3a8ebe' }}>• Apple Calendar</span>
                </div>
              </div>
            </div>

            <div className="text-center p-8 bg-white rounded-2xl shadow-sm" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3a8ebe 0%, #181c31 100%)' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4" style={{ color: '#181c31' }}>Video Conferencing</h3>
              <p className="mb-6" style={{ color: '#666' }}>
                Built-in video calls with Zoom, Google Meet, and Microsoft Teams integration for high-quality mentorship sessions.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center">
                  <span className="text-sm" style={{ color: '#3a8ebe' }}>• Zoom Integration</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-sm" style={{ color: '#3a8ebe' }}>• Google Meet</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-sm" style={{ color: '#3a8ebe' }}>• Microsoft Teams</span>
                </div>
              </div>
            </div>

            <div className="text-center p-8 bg-white rounded-2xl shadow-sm" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4" style={{ color: '#181c31' }}>Productivity Tools</h3>
              <p className="mb-6" style={{ color: '#666' }}>
                Connect with Notion, Slack, Trello, and other productivity tools to streamline your learning workflow.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center">
                  <span className="text-sm" style={{ color: '#3a8ebe' }}>• Notion Integration</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-sm" style={{ color: '#3a8ebe' }}>• Slack Notifications</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-sm" style={{ color: '#3a8ebe' }}>• Trello Boards</span>
                </div>
              </div>
            </div>
          </div>

          {/* API & Developer Tools */}
          <div className="text-center p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(58, 142, 190, 0.05) 0%, rgba(24, 28, 49, 0.02) 100%)', border: '1px solid rgba(58, 142, 190, 0.1)' }}>
            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold mb-4" style={{ color: '#181c31' }}>Developer-Friendly API</h3>
              <p className="text-lg mb-8" style={{ color: '#666' }}>
                Build custom integrations with our comprehensive REST API. Connect SkillProbe with your existing systems, create custom workflows, and extend functionality to meet your organization's unique needs.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2" style={{ color: '#3a8ebe' }}>REST API</div>
                  <div className="text-sm" style={{ color: '#666' }}>Full Access</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2" style={{ color: '#181c31' }}>Webhooks</div>
                  <div className="text-sm" style={{ color: '#666' }}>Real-time Events</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2" style={{ color: '#3a8ebe' }}>SDKs</div>
                  <div className="text-sm" style={{ color: '#666' }}>Multiple Languages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2" style={{ color: '#181c31' }}>24/7</div>
                  <div className="text-sm" style={{ color: '#666' }}>Developer Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-24 bg-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-10 blur-2xl" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full opacity-10 blur-2xl" style={{ background: 'linear-gradient(135deg, #3a8ebe 0%, #181c31 100%)' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)', color: '#3a8ebe' }}>
              💬 TESTIMONIALS
            </div>
            <h2 className="text-5xl font-bold mb-6 leading-tight" style={{ color: '#181c31' }}>
              What Our
              <span style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> Community</span> Says
            </h2>
            <p className="text-xl max-w-4xl mx-auto" style={{ color: '#666' }}>
              Hear from mentors and learners who have transformed their careers through SkillProbe. Real stories, real results, real impact on professional growth and success.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {/* Mentor Testimonial 1 */}
            <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <div className="flex items-center mb-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mr-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                    <span className="text-white font-bold text-lg">SJ</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center" style={{ backgroundColor: '#3a8ebe' }}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-lg" style={{ color: '#181c31' }}>Siddhant Jain</h4>
                  <p className="text-sm" style={{ color: '#666' }}>Senior Developer @Google</p>
                  <div className="flex items-center mt-1">
                    <div className="flex text-sm" style={{ color: '#3a8ebe' }}>★★★★★</div>
                    <span className="text-xs ml-2" style={{ color: '#666' }}>5.0</span>
                  </div>
                </div>
              </div>
              <blockquote className="text-lg leading-relaxed italic mb-4" style={{ color: '#666' }}>
                "SkillProbe gave me the platform to connect with aspiring developers globally. The process is seamless, and I've helped 80+ students land their dream jobs at top companies!"
              </blockquote>
              <div className="flex items-center text-sm" style={{ color: '#666' }}>
                <span className="mr-4">💼 80+ mentees</span>
                <span>💰 $2.5k/month</span>
              </div>
            </div>

            {/* Learner Testimonial 1 */}
            <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <div className="flex items-center mb-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mr-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #3a8ebe 0%, #181c31 100%)' }}>
                    <span className="text-white font-bold text-lg">PR</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center" style={{ backgroundColor: '#3a8ebe' }}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-lg" style={{ color: '#181c31' }}>Priya Sharma</h4>
                  <p className="text-sm" style={{ color: '#666' }}>Software Engineer @Microsoft</p>
                  <div className="flex items-center mt-1">
                    <div className="flex text-sm" style={{ color: '#3a8ebe' }}>★★★★★</div>
                    <span className="text-xs ml-2" style={{ color: '#666' }}>5.0</span>
                  </div>
                </div>
              </div>
              <blockquote className="text-lg leading-relaxed italic mb-4" style={{ color: '#666' }}>
                "My mentor helped me transition from a non-tech background to landing a software engineer role at Microsoft. The personalized guidance was invaluable!"
              </blockquote>
              <div className="flex items-center text-sm" style={{ color: '#666' }}>
                <span className="mr-4">🚀 Career Switch</span>
                <span>💼 Microsoft Hire</span>
              </div>
            </div>

            {/* Mentor Testimonial 2 */}
            <div className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <div className="flex items-center mb-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mr-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                    <span className="text-white font-bold text-lg">AK</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center" style={{ backgroundColor: '#3a8ebe' }}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-lg" style={{ color: '#181c31' }}>Abdul Kirmani</h4>
                  <p className="text-sm" style={{ color: '#666' }}>Data Scientist @Meta</p>
                  <div className="flex items-center mt-1">
                    <div className="flex text-sm" style={{ color: '#3a8ebe' }}>★★★★★</div>
                    <span className="text-xs ml-2" style={{ color: '#666' }}>4.9</span>
                  </div>
                </div>
              </div>
              <blockquote className="text-lg leading-relaxed italic mb-4" style={{ color: '#666' }}>
                "The mentor tools are exactly what professionals need. I can manage sessions, provide feedback, and track progress easily. It's my favorite side income!"
              </blockquote>
              <div className="flex items-center text-sm" style={{ color: '#666' }}>
                <span className="mr-4">💼 45+ mentees</span>
                <span>⭐ 4.9 rating</span>
              </div>
            </div>
          </div>

          {/* Success Stories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            <div className="text-center p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(58, 142, 190, 0.05) 0%, rgba(24, 28, 49, 0.02) 100%)', border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <h4 className="text-xl font-bold mb-4" style={{ color: '#181c31' }}>Career Transformations</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold" style={{ color: '#3a8ebe' }}>150+</div>
                  <div className="text-sm" style={{ color: '#666' }}>Job Placements</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: '#181c31' }}>65%</div>
                  <div className="text-sm" style={{ color: '#666' }}>Salary Increase</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: '#3a8ebe' }}>90%</div>
                  <div className="text-sm" style={{ color: '#666' }}>Goal Achievement</div>
                </div>
              </div>
            </div>
            <div className="text-center p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(24, 28, 49, 0.05) 0%, rgba(58, 142, 190, 0.05) 100%)', border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <h4 className="text-xl font-bold mb-4" style={{ color: '#181c31' }}>Mentor Success</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold" style={{ color: '#3a8ebe' }}>$3.2k</div>
                  <div className="text-sm" style={{ color: '#666' }}>Avg Monthly</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: '#181c31' }}>4.8</div>
                  <div className="text-sm" style={{ color: '#666' }}>Avg Rating</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: '#3a8ebe' }}>95%</div>
                  <div className="text-sm" style={{ color: '#666' }}>Retention Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials carousel indicators */}
          <div className="flex justify-center mt-12 space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3a8ebe' }}></div>
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-24" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)', color: '#3a8ebe' }}>
              ❓ OUR FAQS
            </div>
            <h2 className="text-5xl font-bold mb-6 leading-tight" style={{ color: '#181c31' }}>
              Frequently Asked
              <span style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> Questions</span>
            </h2>
            <p className="text-lg mb-8" style={{ color: '#666' }}>
              Everything you need to know about SkillProbe. Can't find the answer you're looking for?
              <Link href="/help" className="font-semibold hover:underline ml-1" style={{ color: '#3a8ebe' }}>
                Contact our support team
              </Link>
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: '#181c31' }}>How do I become a mentor on SkillProbe?</h3>
              <p style={{ color: '#666' }}>
                Becoming a mentor is simple! Sign up with your professional email, complete your detailed profile including work experience, skills, and expertise areas. Upload your resume and portfolio, set your availability and pricing. Our team reviews applications within 48 hours, and once approved, you can start accepting mentorship sessions immediately.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: '#181c31' }}>What does it cost to use SkillProbe?</h3>
              <p style={{ color: '#666' }}>
                Creating an account and browsing mentor profiles is completely free. Mentorship sessions are priced individually by mentors, typically ranging from $25-$150 per session. We also offer subscription plans for frequent learners with discounted rates and additional features like priority booking and extended session recordings.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: '#181c31' }}>How do I find the right mentor for my goals?</h3>
              <p style={{ color: '#666' }}>
                Our AI-powered matching system analyzes your goals, experience level, and learning preferences to recommend the best mentors. You can filter by industry, company, expertise, price range, and availability. Each mentor profile includes detailed background, specializations, student reviews, and success stories to help you make the right choice.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: '#181c31' }}>What happens during a mentorship session?</h3>
              <p style={{ color: '#666' }}>
                Sessions are conducted via integrated video calls with screen sharing capabilities. Your mentor will provide personalized guidance based on your specific goals - whether it's career advice, technical skills, interview preparation, or project reviews. Sessions are recorded (with permission) for your reference, and you'll receive actionable takeaways and resources afterward.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: '#181c31' }}>Can companies use SkillProbe for employee development?</h3>
              <p style={{ color: '#666' }}>
                Absolutely! We offer enterprise solutions for companies looking to upskill their teams. Our corporate plans include bulk session credits, team management dashboards, progress tracking, and custom mentor matching based on your company's specific needs and technologies. Contact our enterprise team for customized pricing and features.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: '#181c31' }}>What if I'm not satisfied with a session?</h3>
              <p style={{ color: '#666' }}>
                Your satisfaction is our priority. If you're not completely satisfied with a session, contact our support team within 24 hours. We offer full refunds for unsatisfactory sessions and will help you find a better mentor match. We also have a rating system that helps maintain high-quality standards across our mentor network.
              </p>
            </div>
          </div>

          {/* Additional Help Section */}
          <div className="text-center mt-16 p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(58, 142, 190, 0.05) 0%, rgba(24, 28, 49, 0.02) 100%)', border: '1px solid rgba(58, 142, 190, 0.1)' }}>
            <h3 className="text-2xl font-bold mb-4" style={{ color: '#181c31' }}>Still have questions?</h3>
            <p className="text-lg mb-6" style={{ color: '#666' }}>
              Our support team is here to help you succeed. Get in touch and we'll respond within 2 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/help"
                className="px-8 py-3 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}
              >
                Contact Support
              </Link>
              <Link
                href="/help/guides"
                className="px-8 py-3 font-semibold rounded-xl border-2 transition-all duration-300"
                style={{ color: '#181c31', borderColor: '#3a8ebe' }}
              >
                Browse Help Guides
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Ready to Level Up CTA Section */}
      <div className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-20 w-20 h-20 rounded-full blur-xl animate-pulse opacity-20" style={{ background: 'linear-gradient(135deg, #f5f5f5 0%, rgba(245, 245, 245, 0.5) 100%)' }}></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 rounded-full blur-xl animate-pulse delay-1000 opacity-20" style={{ background: 'linear-gradient(135deg, rgba(245, 245, 245, 0.5) 0%, #f5f5f5 100%)' }}></div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-12">
            <div className="inline-flex items-center px-6 py-3 rounded-full text-sm font-medium mb-8" style={{ backgroundColor: 'rgba(245, 245, 245, 0.1)', border: '1px solid rgba(245, 245, 245, 0.2)', color: '#f5f5f5' }}>
              🚀 Ready to Level Up?
            </div>
            <h2 className="text-6xl lg:text-7xl font-bold mb-8 leading-tight" style={{ color: '#f5f5f5' }}>
              Ready to Transform
              <br />
              <span style={{ background: 'linear-gradient(135deg, #f5f5f5 0%, rgba(245, 245, 245, 0.8) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Your Career?
              </span>
            </h2>
            <p className="text-xl mb-12 max-w-4xl mx-auto leading-relaxed" style={{ color: 'rgba(245, 245, 245, 0.9)' }}>
              Join over 25,000 professionals who have accelerated their careers through SkillProbe.
              Get access to industry-leading mentors, personalized learning paths, and exclusive job opportunities
              that will transform your professional journey forever.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link
              href="/auth/register"
              className="group relative px-12 py-5 font-bold rounded-2xl hover:shadow-2xl transition-all duration-300 text-lg transform hover:-translate-y-1"
              style={{ backgroundColor: '#f5f5f5', color: '#181c31' }}
            >
              <span className="relative z-10 flex items-center">
                Start Your Journey Today
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            <Link
              href="/mentors"
              className="px-12 py-5 font-semibold rounded-2xl border-2 backdrop-blur-sm transition-all duration-300 text-lg"
              style={{ color: '#f5f5f5', borderColor: 'rgba(245, 245, 245, 0.3)' }}
            >
              Find Your Mentor
            </Link>
          </div>

          {/* Success Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-12">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2" style={{ color: '#f5f5f5' }}>25K+</div>
              <div className="text-sm" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>Active Learners</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2" style={{ color: '#f5f5f5' }}>500+</div>
              <div className="text-sm" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>Expert Mentors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2" style={{ color: '#f5f5f5' }}>98%</div>
              <div className="text-sm" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2" style={{ color: '#f5f5f5' }}>50+</div>
              <div className="text-sm" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>Countries</div>
            </div>
          </div>

          {/* Value Propositions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            <div className="text-center p-6 rounded-2xl" style={{ backgroundColor: 'rgba(245, 245, 245, 0.1)', border: '1px solid rgba(245, 245, 245, 0.2)' }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 245, 245, 0.2)' }}>
                <svg className="w-8 h-8" style={{ color: '#f5f5f5' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#f5f5f5' }}>Fast-Track Your Career</h3>
              <p style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
                Accelerate your professional growth with personalized mentorship and industry insights
              </p>
            </div>
            <div className="text-center p-6 rounded-2xl" style={{ backgroundColor: 'rgba(245, 245, 245, 0.1)', border: '1px solid rgba(245, 245, 245, 0.2)' }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 245, 245, 0.2)' }}>
                <svg className="w-8 h-8" style={{ color: '#f5f5f5' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#f5f5f5' }}>Learn from the Best</h3>
              <p style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
                Connect with industry leaders from top companies like Google, Microsoft, and Meta
              </p>
            </div>
            <div className="text-center p-6 rounded-2xl" style={{ backgroundColor: 'rgba(245, 245, 245, 0.1)', border: '1px solid rgba(245, 245, 245, 0.2)' }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 245, 245, 0.2)' }}>
                <svg className="w-8 h-8" style={{ color: '#f5f5f5' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#f5f5f5' }}>Guaranteed Results</h3>
              <p style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
                98% of our learners achieve their career goals within 6 months or get their money back
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm" style={{ color: 'rgba(245, 245, 245, 0.7)' }}>
              ✨ No credit card required • 🎯 Free consultation available • 🔒 100% secure platform
            </p>
          </div>
        </div>
      </div>

      {/* Become an Ambassador Section */}
      <div className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full mb-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <span className="mr-2" style={{ color: '#f5f5f5' }}>🚀</span>
              <span className="text-white text-sm font-medium">Join Our Ambassador Program</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Become a SkillProbe<br />
              <span style={{ color: '#f5f5f5' }}>
                Ambassador
              </span>
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
              Join our exclusive ambassador program and earn while helping others discover the power of mentorship. Share SkillProbe with your network and get rewarded for every successful referral.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-white mb-8">Why Become an Ambassador?</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1" style={{ backgroundColor: '#f5f5f5' }}>
                    <span className="text-sm" style={{ color: '#181c31' }}>💰</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Earn Commission</h4>
                    <p style={{ color: 'rgba(245, 245, 245, 0.7)' }}>Get up to 20% commission on every successful referral</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1" style={{ backgroundColor: '#f5f5f5' }}>
                    <span className="text-sm" style={{ color: '#181c31' }}>🎯</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Flexible Work</h4>
                    <p style={{ color: 'rgba(245, 245, 245, 0.7)' }}>Work on your own schedule and promote at your pace</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1" style={{ backgroundColor: '#f5f5f5' }}>
                    <span className="text-sm" style={{ color: '#181c31' }}>🌟</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Exclusive Benefits</h4>
                    <p style={{ color: 'rgba(245, 245, 245, 0.7)' }}>Access to exclusive events, training, and networking opportunities</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mr-4 mt-1" style={{ backgroundColor: '#f5f5f5' }}>
                    <span className="text-sm" style={{ color: '#181c31' }}>📈</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Growth Opportunities</h4>
                    <p style={{ color: 'rgba(245, 245, 245, 0.7)' }}>Build your personal brand while helping others grow</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-8 shadow-2xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div className="text-center mb-6">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold mb-4" style={{ backgroundColor: '#f5f5f5', color: '#181c31' }}>
                  🎉 LIMITED SPOTS AVAILABLE
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Join the Ambassador Program</h3>
                <p className="mb-8" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
                  Be part of an exclusive community that's shaping the future of professional mentorship. Apply now and start earning!
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
                  <span className="mr-3" style={{ color: '#f5f5f5' }}>✓</span>
                  <span>Comprehensive training program</span>
                </div>
                <div className="flex items-center" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
                  <span className="mr-3" style={{ color: '#f5f5f5' }}>✓</span>
                  <span>Marketing materials provided</span>
                </div>
                <div className="flex items-center" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
                  <span className="mr-3" style={{ color: '#f5f5f5' }}>✓</span>
                  <span>Dedicated support team</span>
                </div>
                <div className="flex items-center" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
                  <span className="mr-3" style={{ color: '#f5f5f5' }}>✓</span>
                  <span>Monthly performance bonuses</span>
                </div>
              </div>

              <Link
                href="/ambassador/apply"
                className="w-full block text-center px-8 py-4 font-bold rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ backgroundColor: '#f5f5f5', color: '#181c31' }}
              >
                Apply to Become Ambassador
              </Link>

              <p className="text-center text-sm mt-4" style={{ color: 'rgba(245, 245, 245, 0.6)' }}>
                ⏰ Applications reviewed within 48 hours
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }} className="text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="text-gray-300 max-w-2xl">
              Skill Development Company Helping College Students And Working Professional To Enhance Their Skill And Hunt The Correct Suitable Opportunity For Them In Their Professional Life.
            </p>
            <div className="mt-4">
              <p className="text-sm text-gray-400">contact</p>
              <p className="text-white">admin@skillprobe.co</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4 text-purple-400">INFO</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/" className="hover:text-white">Home</Link></li>
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/services" className="hover:text-white">Services</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contacts</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4 text-purple-400">PRODUCTS</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/proctoring" className="hover:text-white">Proctoring</Link></li>
                <li><Link href="/coding-interview" className="hover:text-white">Coding Interview Platform</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4 text-purple-400">APPLY</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/internships" className="hover:text-white">Internships</Link></li>
                <li><Link href="/jobs" className="hover:text-white">Jobs</Link></li>
                <li><Link href="/scholarships" className="hover:text-white">Scholarships</Link></li>
                <li><Link href="/ppo" className="hover:text-white">PPO Programmes</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4 text-purple-400">SOLUTIONS</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/staffing" className="hover:text-white">Staffing</Link></li>
                <li><Link href="/talent-engagement" className="hover:text-white">Talent Engagement</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4 text-purple-400">PARTICIPATE</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/quiz" className="hover:text-white">Quiz & Competition</Link></li>
                <li><Link href="/assessments" className="hover:text-white">Assessments</Link></li>
                <li><Link href="/workshop" className="hover:text-white">Workshop</Link></li>
                <li><Link href="/webinar" className="hover:text-white">Webinar</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4 text-purple-400">PRACTICE</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/interview-prep" className="hover:text-white">Interview Preparation</Link></li>
                <li><Link href="/coding-assessment" className="hover:text-white">Coding Assessment</Link></li>
                <li><Link href="/case-studies" className="hover:text-white">Case Studies</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-6 mb-4 md:mb-0">
                <span className="text-gray-300">English</span>
                <Link href="/privacy" className="text-gray-300 hover:text-white">Privacy Policy</Link>
                <Link href="/support" className="text-gray-300 hover:text-white">Support</Link>
              </div>
              <p className="text-gray-400 text-center">
                © 2025 Skillprobe. All rights reserved
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
<div className="py-24" style={{ backgroundColor: '#f5f5f5' }}>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-16">
      <h2 className="text-4xl font-bold mb-4" style={{ color: '#181c31' }}>
        The Future of<br />Career Growth
      </h2>
      <p className="text-xl max-w-3xl mx-auto" style={{ color: '#666' }}>
        SkillProbe bridges the gap between ambition and guidance by connecting candidates to paid mentorships from top industry experts.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <div>
        <div className="mb-8">
          <div className="flex items-start mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 mt-1" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)' }}>
              <span className="font-bold text-lg" style={{ color: '#3a8ebe' }}>01</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: '#181c31' }}>Personalized 1-on-1 Mentorship</h3>
              <p style={{ color: '#666' }}>
                Connect directly with mentors from your desired domain and get real guidance.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 mt-1" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)' }}>
              <span className="font-bold text-lg" style={{ color: '#3a8ebe' }}>02</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: '#181c31' }}>Paid & Valued Sessions</h3>
              <p style={{ color: '#666' }}>
                candidates invest in their future. Mentors earn by sharing their experience.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-8" style={{ background: 'linear-gradient(135deg, rgba(58, 142, 190, 0.1) 0%, rgba(24, 28, 49, 0.05) 100%)' }}>
        <h4 className="text-lg font-semibold mb-4" style={{ color: '#3a8ebe' }}>Empowering candidates Everywhere</h4>
        <h3 className="text-3xl font-bold mb-6" style={{ color: '#181c31' }}>
          All-in-One Platform for<br />Mentorship & Growth
        </h3>
        <p className="mb-6" style={{ color: '#666' }}>
          From career clarity to resume feedback and mock interviews, SkillProbe has everything candidates need to grow with confidence.
        </p>
        <Link
          href="/about"
          className="font-semibold hover:underline"
          style={{ color: '#3a8ebe' }}
        >
          Know More →
        </Link>
      </div>
    </div>
  </div>
</div>

{/* 6. All-in-One Platform Section with Slide Mode */ }
<div className="py-24 bg-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-16">
      <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)', color: '#3a8ebe' }}>
        🚀 ALL-IN-ONE PLATFORM
      </div>
      <h2 className="text-5xl font-bold mb-6 leading-tight" style={{ color: '#181c31' }}>
        Everything You Need in
        <span style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> One Place</span>
      </h2>
      <p className="text-xl max-w-3xl mx-auto" style={{ color: '#666' }}>
        Comprehensive tools and features designed to accelerate your learning journey and career growth.
      </p>
    </div>

    {/* Slide Content */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="text-center p-8 rounded-3xl transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: 'rgba(58, 142, 190, 0.05)' }}>
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
          <span className="font-bold text-2xl text-white">01</span>
        </div>
        <h3 className="text-2xl font-bold mb-4" style={{ color: '#181c31' }}>Real Industry Mentors</h3>
        <p className="mb-4" style={{ color: '#666' }}>
          Connect directly with experienced professionals from top companies. Gain real-world knowledge and insider insights to navigate your career path effectively.
        </p>
        <p style={{ color: '#666' }}>
          Skillprobe ensures every mentor is vetted and verified so you get authentic guidance tailored to your goals.
        </p>
      </div>

      <div className="text-center p-8 rounded-3xl transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: 'rgba(58, 142, 190, 0.05)' }}>
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3a8ebe 0%, #181c31 100%)' }}>
          <span className="font-bold text-2xl text-white">02</span>
        </div>
        <h3 className="text-2xl font-bold mb-4" style={{ color: '#181c31' }}>One-on-One Sessions</h3>
        <p className="mb-4" style={{ color: '#666' }}>
          Book personalized sessions with mentors for resume reviews, career planning, skill development, and mock interviews.
        </p>
        <p style={{ color: '#666' }}>
          No generic advice—just focused, practical guidance based on your unique situation and career aspirations.
        </p>
      </div>

      <div className="text-center p-8 rounded-3xl transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: 'rgba(58, 142, 190, 0.05)' }}>
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
          <span className="font-bold text-2xl text-white">03</span>
        </div>
        <h3 className="text-2xl font-bold mb-4" style={{ color: '#181c31' }}>Skill-Based Learning Paths</h3>
        <p className="mb-4" style={{ color: '#666' }}>
          Follow curated learning tracks designed by mentors based on in-demand industry skills—no fluff, only what matters.
        </p>
        <p style={{ color: '#666' }}>
          Combine self-paced learning with live mentor support to maximize your upskilling journey on Skillprobe.
        </p>
      </div>
    </div>
  </div>
</div>

{/* 7. Trusted by Mentors Section */ }
<div className="py-24" style={{ backgroundColor: '#f5f5f5' }}>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 className="text-4xl font-bold mb-8" style={{ color: '#181c31' }}>
      Trusted by Mentors and candidates around the Globe.
    </h2>
    <p className="text-xl max-w-4xl mx-auto" style={{ color: '#666' }}>
      Skillprobe has gained trust of various mentors and candidates, helping mentors to share their experience and earn side income and guiding candidates to grow their career.
    </p>
  </div>
</div>

{/* 8. Integrations Section */ }
<div className="py-24 bg-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)', color: '#3a8ebe' }}>
      🔗 INTEGRATIONS
    </div>
    <h2 className="text-4xl font-bold mb-6" style={{ color: '#181c31' }}>
      Seamless Tools to Manage Your Learning Journey Anytime, Anywhere.
    </h2>
    <p className="text-xl max-w-4xl mx-auto" style={{ color: '#666' }}>
      Skillprobe integrates essential tools like calendar scheduling, video conferencing, and real-time chat—so you can learn, connect, and grow without switching platforms.
    </p>
  </div>
</div>

{/* 9. Testimonials Section */ }
<div className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(58, 142, 190, 0.05) 0%, rgba(24, 28, 49, 0.02) 100%)' }}>
  {/* Background decorative elements */}
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute top-20 left-10 w-32 h-32 rounded-full blur-2xl opacity-10" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}></div>
    <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full blur-2xl opacity-10" style={{ background: 'linear-gradient(135deg, #3a8ebe 0%, #181c31 100%)' }}></div>
  </div>

  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-20">
      <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)', color: '#3a8ebe' }}>
        💬 TESTIMONIALS
      </div>
      <h2 className="text-5xl font-bold mb-6 leading-tight" style={{ color: '#181c31' }}>
        Mentor's
        <span style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> Testimonials</span>
      </h2>
      <p className="text-xl max-w-3xl mx-auto" style={{ color: '#666' }}>
        Mentors trust Skillprobe to connect with passionate learners, share their expertise, and grow their professional impact.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      <div className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:bg-white transition-all duration-500 transform hover:-translate-y-2" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
        <div className="flex items-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mr-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
              <span className="text-white font-bold text-lg">SJ</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center" style={{ backgroundColor: '#3a8ebe' }}>
              <span className="text-white text-xs">✓</span>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-lg" style={{ color: '#181c31' }}>Siddhant Jain</h4>
            <p className="text-sm" style={{ color: '#666' }}>Senior Software Developer @Skillprobe</p>
            <div className="flex items-center mt-1">
              <div className="flex" style={{ color: '#3a8ebe' }}>
                ★★★★★
              </div>
              <span className="text-xs ml-2" style={{ color: '#666' }}>5.0</span>
            </div>
          </div>
        </div>
        <blockquote className="text-lg leading-relaxed italic" style={{ color: '#666' }}>
          "Skillprobe gave me the platform to connect with aspiring developers. The process is smooth, and the dashboard makes mentoring truly effortless. I've helped 50+ students land their dream jobs!"
        </blockquote>
        <div className="mt-6 flex items-center text-sm" style={{ color: '#666' }}>
          <span className="mr-4">💼 50+ mentees</span>
          <span>⭐ 4.9 rating</span>
        </div>
      </div>

      <div className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:bg-white transition-all duration-500 transform hover:-translate-y-2" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
        <div className="flex items-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mr-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #3a8ebe 0%, #181c31 100%)' }}>
              <span className="text-white font-bold text-lg">AK</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center" style={{ backgroundColor: '#3a8ebe' }}>
              <span className="text-white text-xs">✓</span>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-lg" style={{ color: '#181c31' }}>Abdul Samad Kirmani</h4>
            <p className="text-sm" style={{ color: '#666' }}>Software Developer</p>
            <div className="flex items-center mt-1">
              <div className="flex" style={{ color: '#3a8ebe' }}>
                ★★★★★
              </div>
              <span className="text-xs ml-2" style={{ color: '#666' }}>5.0</span>
            </div>
          </div>
        </div>
        <blockquote className="text-lg leading-relaxed italic" style={{ color: '#666' }}>
          "The mentor tools on Skillprobe are exactly what professionals need. I can manage sessions, provide feedback, and track mentee progress easily. It's become my favorite side hustle!"
        </blockquote>
        <div className="mt-6 flex items-center text-sm" style={{ color: '#666' }}>
          <span className="mr-4">💼 30+ mentees</span>
          <span>⭐ 4.8 rating</span>
        </div>
      </div>
    </div>

    {/* Additional testimonials carousel indicators */}
    <div className="flex justify-center mt-12 space-x-2">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3a8ebe' }}></div>
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(58, 142, 190, 0.3)' }}></div>
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(58, 142, 190, 0.3)' }}></div>
    </div>
  </div>
</div>

{/* 10. Contact Us Section */ }
<div className="py-24 bg-white">
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-16">
      <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)', color: '#3a8ebe' }}>
        📧 CONTACT US
      </div>
      <h2 className="text-5xl font-bold mb-6" style={{ color: '#181c31' }}>
        Send Us a Message
      </h2>
      <p className="text-xl" style={{ color: '#666' }}>
        Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
      </p>
    </div>

    <div className="bg-white rounded-3xl p-8 shadow-xl" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#181c31' }}>
              First Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-colors"
              style={{ borderColor: 'rgba(58, 142, 190, 0.2)' }}
              placeholder="Enter your first name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#181c31' }}>
              Last Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-colors"
              style={{ borderColor: 'rgba(58, 142, 190, 0.2)' }}
              placeholder="Enter your last name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#181c31' }}>
            Email
          </label>
          <input
            type="email"
            className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-colors"
            style={{ borderColor: 'rgba(58, 142, 190, 0.2)' }}
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#181c31' }}>
            Subject
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-colors"
            style={{ borderColor: 'rgba(58, 142, 190, 0.2)' }}
            placeholder="What's this about?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#181c31' }}>
            Message
          </label>
          <textarea
            rows={6}
            className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-colors resize-none"
            style={{ borderColor: 'rgba(58, 142, 190, 0.2)' }}
            placeholder="Tell us more about your inquiry..."
          ></textarea>
        </div>

        <div className="text-center">
          <button
            type="submit"
            className="px-8 py-4 text-white font-semibold rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}
          >
            Send Message
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

{/* 11. FAQ Section */ }
<div className="py-24" style={{ backgroundColor: '#f5f5f5' }}>
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-16">
      <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)', color: '#3a8ebe' }}>
        ❓ OUR FAQS
      </div>
      <h2 className="text-4xl font-bold mb-4" style={{ color: '#181c31' }}>
        Frequently Asked<br />Questions
      </h2>
      <Link href="/help" className="font-semibold hover:underline" style={{ color: '#3a8ebe' }}>
        Know More →
      </Link>
    </div>

    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
        <h3 className="text-lg font-semibold mb-3" style={{ color: '#181c31' }}>How do I become a mentor?</h3>
        <p style={{ color: '#666' }}>
          To become a mentor, simply sign up as a mentor and complete your multi-step profile, including your professional background, skills, and availability. Once approved, your profile becomes visible to mentees seeking guidance.
        </p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
        <h3 className="text-lg font-semibold mb-3" style={{ color: '#181c31' }}>Is Skillprobe free to use?</h3>
        <p style={{ color: '#666' }}>
          Creating an account and browsing mentor or mentee profiles is free. Some advanced features, personalized services, or premium mentorship sessions may require a subscription or one-time payment.
        </p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
        <h3 className="text-lg font-semibold mb-3" style={{ color: '#181c31' }}>Can recruiters use Skillprobe?</h3>
        <p style={{ color: '#666' }}>
          Yes, recruiters can use Skillprobe to explore verified mentor and mentee profiles, view their skills and achievements, and connect with potential candidates for hiring or collaboration.
        </p>
      </div>
    </div>
  </div>
</div>

{/* 12. Footer */ }
<footer className="py-16" style={{ backgroundColor: '#181c31' }}>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="mb-12">
      <p className="max-w-2xl" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
        Skill Development Company Helping College Students And Working Professional To Enhance Their Skill And Hunt The Correct Suitable Opportunity For Them In Their Professional Life.
      </p>
      <div className="mt-4">
        <p className="text-sm" style={{ color: 'rgba(245, 245, 245, 0.6)' }}>contact</p>
        <p className="text-white">admin@skillprobe.co</p>
      </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
      <div>
        <h4 className="text-lg font-semibold mb-4" style={{ color: '#3a8ebe' }}>INFO</h4>
        <ul className="space-y-2" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
          <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
          <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
          <li><Link href="/services" className="hover:text-white transition-colors">Services</Link></li>
          <li><Link href="/contact" className="hover:text-white transition-colors">Contacts</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="text-lg font-semibold mb-4" style={{ color: '#3a8ebe' }}>PRODUCTS</h4>
        <ul className="space-y-2" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
          <li><Link href="/proctoring" className="hover:text-white transition-colors">Proctoring</Link></li>
          <li><Link href="/coding-interview" className="hover:text-white transition-colors">Coding Interview Platform</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="text-lg font-semibold mb-4" style={{ color: '#3a8ebe' }}>APPLY</h4>
        <ul className="space-y-2" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
          <li><Link href="/internships" className="hover:text-white transition-colors">Internships</Link></li>
          <li><Link href="/jobs" className="hover:text-white transition-colors">Jobs</Link></li>
          <li><Link href="/scholarships" className="hover:text-white transition-colors">Scholarships</Link></li>
          <li><Link href="/ppo" className="hover:text-white transition-colors">PPO Programmes</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="text-lg font-semibold mb-4" style={{ color: '#3a8ebe' }}>SOLUTIONS</h4>
        <ul className="space-y-2" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
          <li><Link href="/staffing" className="hover:text-white transition-colors">Staffing</Link></li>
          <li><Link href="/talent-engagement" className="hover:text-white transition-colors">Talent Engagement</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="text-lg font-semibold mb-4" style={{ color: '#3a8ebe' }}>PARTICIPATE</h4>
        <ul className="space-y-2" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
          <li><Link href="/quiz" className="hover:text-white transition-colors">Quiz & Competition</Link></li>
          <li><Link href="/assessments" className="hover:text-white transition-colors">Assessments</Link></li>
          <li><Link href="/workshop" className="hover:text-white transition-colors">Workshop</Link></li>
          <li><Link href="/webinar" className="hover:text-white transition-colors">Webinar</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="text-lg font-semibold mb-4" style={{ color: '#3a8ebe' }}>PRACTICE</h4>
        <ul className="space-y-2" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
          <li><Link href="/interview-prep" className="hover:text-white transition-colors">Interview Preparation</Link></li>
          <li><Link href="/coding-assessment" className="hover:text-white transition-colors">Coding Assessment</Link></li>
          <li><Link href="/case-studies" className="hover:text-white transition-colors">Case Studies</Link></li>
        </ul>
      </div>
    </div>

    <div className="border-t mt-12 pt-8" style={{ borderColor: 'rgba(58, 142, 190, 0.3)' }}>
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center space-x-6 mb-4 md:mb-0" style={{ color: 'rgba(245, 245, 245, 0.8)' }}>
          <span>English</span>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/support" className="hover:text-white transition-colors">Support</Link>
        </div>
        <p className="text-center" style={{ color: 'rgba(245, 245, 245, 0.6)' }}>
          © 2025 Skillprobe. All rights reserved
        </p>
      </div>
    </div>
  </div>
</footer>
