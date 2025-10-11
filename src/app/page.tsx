'use client';

import Link from 'next/link';

export default function HomePage() {

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-purple-600">
                SkillProbe
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium">
                Sign In
              </Link>
              <Link href="/business" className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700">
                Business
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">SkillProbe - Mentorships, Internships, Jobs</p>

            <h1 className="text-5xl lg:text-6xl font-bold text-black mb-8 leading-tight">
              Grow your skills, define your future
            </h1>

            <p className="text-xl text-gray-700 mb-8 leading-relaxed max-w-4xl mx-auto">
              Skillprobe empowers learners to unlock their true potential by connecting them with experienced mentors,
              showcasing real-world skills, and enabling meaningful career opportunities. Our mission is to bridge the gap
              between ambition and achievement through personalized guidance, verified capabilities, and a trusted ecosystem
              where skills matter. We envision a future where every learner thrives with the right mentorship, opportunities,
              and recognition—beyond traditional credentials.
            </p>

            <div className="mb-12">
              <Link
                href="/auth/register"
                className="px-8 py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors duration-200 text-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Free Interview Prep Section */}
      <div className="py-20 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-black mb-6">
              Ace Your Dream Job Interview with Expert Help – For FREE!
            </h2>
            <p className="text-xl text-gray-700 mb-8">
              Struggling with interviews? Nervous about placements or switching jobs? Skill Probe brings you a FREE 1-on-1 Interview Prep Session — curated for students & professionals like YOU.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-black mb-6">Why This Is a Game-Changer</h3>
              <ul className="space-y-4 text-lg text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-600 mr-3">•</span>
                  1-on-1 mock interview with an expert mentor
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-3">•</span>
                  Instant resume feedback
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-3">•</span>
                  Personalized tips to ace your next interview
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-3">•</span>
                  Flexible timing — you choose your slot
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-black mb-4">Limited-Time Free Offer!</h3>
              <p className="text-gray-700 mb-6">
                No group sessions. No fluff. Just real, personalized guidance. Book your session now – slots are filling fast!
              </p>
              <Link
                href="/auth/register"
                className="w-full block text-center px-8 py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                Book Free Session
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Core Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm text-purple-600 font-semibold mb-4">SKILLPROBE FEATURES</p>
            <h2 className="text-4xl font-bold text-black mb-4">Core Features of Skillprobe</h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Explore mentorship like never before. SkillProbe connects candidates with vetted industry mentors for paid sessions
              that offer insights, networking, and career growth. Get advice, learn the ropes, and invest in your future — one session at a time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 mb-6 rounded-full flex items-center justify-center bg-purple-100">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Expert Mentor Matching</h3>
              <p className="text-gray-600">
                Get paired with industry professionals tailored to your career goals and interests.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 mb-6 rounded-full flex items-center justify-center bg-purple-100">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Mentorship Opportunities</h3>
              <p className="text-gray-600">
                Mentors earn for their time while students invest in real, hands-on learning experiences.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 mb-6 rounded-full flex items-center justify-center bg-purple-100">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Psychometric and behavioral assessments</h3>
              <p className="text-gray-600">
                Enable you to identify the right candidates and help your people develop their potential.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 mb-6 rounded-full flex items-center justify-center bg-purple-100">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">1-on-1 Sessions</h3>
              <p className="text-gray-600">
                Book private, personalized mentorship calls for career advice, skill-building, or portfolio reviews.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 mb-6 rounded-full flex items-center justify-center bg-purple-100">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Progress Tracking</h3>
              <p className="text-gray-600">
                Monitor your growth, session history, and goals through an intuitive dashboard experience.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 mb-6 rounded-full flex items-center justify-center bg-purple-100">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Flexible Scheduling</h3>
              <p className="text-gray-600">
                Choose time slots that work for you and connect with mentors across different time zones.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Find Your Mentor Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm text-purple-600 font-semibold mb-4">MENTORS</p>
            <h2 className="text-4xl font-bold text-black mb-4">Find Your Mentor</h2>
            <p className="text-xl text-gray-600">
              Over 100 mentors trust Skillprobe to connect with passionate learners, share their expertise, and grow their professional impact.
            </p>
          </div>

          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-800 mb-8">Learn from Real-World Mentors</p>
            <Link
              href="/mentors"
              className="px-8 py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors duration-200"
            >
              Browse Mentors
            </Link>
          </div>
        </div>
      </div>

      {/* The Future of Career Growth Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4">
              The Future of<br />Career Growth
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              SkillProbe bridges the gap between ambition and guidance by connecting candidates to paid mentorships from top industry experts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-8">
                <div className="flex items-start mb-6">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4 mt-1">
                    <span className="text-purple-600 font-bold text-lg">01</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-black mb-3">Personalized 1-on-1 Mentorship</h3>
                    <p className="text-gray-600">
                      Connect directly with mentors from your desired domain and get real guidance.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4 mt-1">
                    <span className="text-purple-600 font-bold text-lg">02</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-black mb-3">Paid & Valued Sessions</h3>
                    <p className="text-gray-600">
                      candidates invest in their future. Mentors earn by sharing their experience.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8">
              <h4 className="text-lg font-semibold text-purple-600 mb-4">Empowering candidates Everywhere</h4>
              <h3 className="text-3xl font-bold text-black mb-6">
                All-in-One Platform for<br />Mentorship & Growth
              </h3>
              <p className="text-gray-700 mb-6">
                From career clarity to resume feedback and mock interviews, SkillProbe has everything candidates need to grow with confidence.
              </p>
              <Link
                href="/about"
                className="text-purple-600 font-semibold hover:text-purple-700"
              >
                Know More →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Three Column Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 font-bold text-2xl">01</span>
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Real Industry Mentors</h3>
              <p className="text-gray-600 mb-4">
                Connect directly with experienced professionals from top companies. Gain real-world knowledge and insider insights to navigate your career path effectively.
              </p>
              <p className="text-gray-600">
                Skillprobe ensures every mentor is vetted and verified so you get authentic guidance tailored to your goals.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 font-bold text-2xl">02</span>
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">One-on-One Sessions</h3>
              <p className="text-gray-600 mb-4">
                Book personalized sessions with mentors for resume reviews, career planning, skill development, and mock interviews.
              </p>
              <p className="text-gray-600">
                No generic advice—just focused, practical guidance based on your unique situation and career aspirations.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 font-bold text-2xl">03</span>
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Skill-Based Learning Paths</h3>
              <p className="text-gray-600 mb-4">
                Follow curated learning tracks designed by mentors based on in-demand industry skills—no fluff, only what matters.
              </p>
              <p className="text-gray-600">
                Combine self-paced learning with live mentor support to maximize your upskilling journey on Skillprobe.
              </p>
            </div>
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
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-purple-600 font-semibold mb-4">INTEGRATIONS</p>
          <h2 className="text-4xl font-bold text-black mb-6">
            Seamless Tools to Manage Your Learning Journey Anytime, Anywhere.
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Skillprobe integrates essential tools like calendar scheduling, video conferencing, and real-time chat—so you can learn, connect, and grow without switching platforms.
          </p>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm text-purple-600 font-semibold mb-4">TESTIMONIALS</p>
            <h2 className="text-4xl font-bold text-black mb-4">Mentor's Testimonials</h2>
            <p className="text-xl text-gray-600">
              Mentors trust Skillprobe to connect with passionate learners, share their expertise, and grow their professional impact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                  <span className="text-purple-600 font-bold">SJ</span>
                </div>
                <div>
                  <h4 className="font-bold text-black">Siddhant Jain</h4>
                  <p className="text-gray-600 text-sm">Senior Software Developer @Skillprobe</p>
                </div>
              </div>
              <p className="text-gray-700">
                "Skillprobe gave me the platform to connect with aspiring developers. The process is smooth, and the dashboard makes mentoring truly effortless."
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                  <span className="text-purple-600 font-bold">AK</span>
                </div>
                <div>
                  <h4 className="font-bold text-black">Abdul Samad Kirmani</h4>
                  <p className="text-gray-600 text-sm">Software Developer</p>
                </div>
              </div>
              <p className="text-gray-700">
                "The mentor tools on Skillprobe are exactly what professionals need. I can manage sessions, provide feedback, and track mentee progress easily."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm text-purple-600 font-semibold mb-4">OUR FAQS</p>
            <h2 className="text-4xl font-bold text-black mb-4">
              Frequently Asked<br />Questions
            </h2>
            <Link href="/help" className="text-purple-600 font-semibold hover:text-purple-700">
              Know More →
            </Link>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-black mb-3">How do I become a mentor?</h3>
              <p className="text-gray-600">
                To become a mentor, simply sign up as a mentor and complete your multi-step profile, including your professional background, skills, and availability. Once approved, your profile becomes visible to mentees seeking guidance.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-black mb-3">Is Skillprobe free to use?</h3>
              <p className="text-gray-600">
                Creating an account and browsing mentor or mentee profiles is free. Some advanced features, personalized services, or premium mentorship sessions may require a subscription or one-time payment.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-black mb-3">Can recruiters use Skillprobe?</h3>
              <p className="text-gray-600">
                Yes, recruiters can use Skillprobe to explore verified mentor and mentee profiles, view their skills and achievements, and connect with potential candidates for hiring or collaboration.
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
              className="px-10 py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors duration-200 text-lg"
            >
              Start Learning Today
            </Link>
            <Link
              href="/courses"
              className="px-10 py-4 text-purple-600 font-semibold rounded-lg border-2 border-purple-600 hover:bg-purple-50 transition-colors duration-200 text-lg"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
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