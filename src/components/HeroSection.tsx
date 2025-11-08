'use client';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative bg-white overflow-hidden">
      {/* Main Hero Container */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Content */}
          <div className="space-y-6">
            {/* Main Heading */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-gray-900">
              Transform Your <br/>Skills, Transform<br />Your Future.
            </h1>

            {/* Description */}
            <p className="text-base md:text-lg text-gray-600 leading-relaxed">
              Master skills through live classes and expert<br/> mentorship. Get certified and land your dream job.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/auth/register">
                <button className="px-6 py-3 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all duration-300 w-full sm:w-auto">
                  Get started
                </button>
              </Link>
              <Link href="/courses">
                <button className="px-6 py-3 border-2 border-black text-black text-sm font-semibold rounded-lg hover:bg-gray-50 transition-all duration-300 w-full sm:w-auto">
                  Explore Courses
                </button>
              </Link>
            </div>
          </div>

          {/* Right Side - Image with Gradient Background */}
          <div className="relative">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-300 via-pink-400 to-pink-600 rounded-3xl transform rotate-3"></div>
            
            {/* Image Container */}
            <div className="relative rounded-3xl overflow-hidden">
              <img
                src="/SkillProbe/HomePage/Hero/hero img.png"
                alt="Student learning"
                className="w-full h-auto object-cover"
              />
              
              {/* Floating Icons */}
              {/* Idea Bulb - Top Center */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-16 flex items-center justify-center">
                <img
                  src="/SkillProbe/HomePage/Hero/idea-bulb.png"
                  alt="Idea"
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
              
              {/* Hourglass - Left Side */}
              <div className="absolute top-1/2 left-8 transform -translate-y-1/2 w-14 h-14 flex items-center justify-center">
                <img
                  src="/SkillProbe/HomePage/Hero/hourglass.png"
                  alt="Time"
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
              
              {/* LinkedIn - Bottom Right */}
              <div className="absolute bottom-8 right-8 w-16 h-16 flex items-center justify-center">
                <img
                  src="/SkillProbe/HomePage/Hero/linkedin.png"
                  alt="LinkedIn"
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges Section */}
      <div className="bg-gray-100 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Badge 1 */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">HSA and FSA accepted</p>
              </div>
            </div>

            {/* Badge 2 */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">4.9 rating on app store</p>
              </div>
            </div>

            {/* Badge 3 */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">HSA and FSA accepted</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
