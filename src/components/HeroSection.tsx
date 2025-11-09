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
              <Link href="/mentor/signup">
                <button className="px-6 py-3 border-2 border-black text-black text-sm font-semibold rounded-lg hover:bg-gray-50 transition-all duration-300 w-full sm:w-auto">
                  Become Mentor
                </button>
              </Link>
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="relative">
            {/* Single Image Container */}
            <img
              src="/SkillProbe/HomePage/Hero/hero img.png"
              alt="Student learning"
              className="w-full h-auto object-cover rounded-3xl"
            />
            
            {/* Floating Icons */}
            {/* Idea Bulb - Top Center (slightly right) */}
            <div className="absolute top-8 left-[52%] transform -translate-x-1/2 w-14 h-14 opacity-80">
              <img
                src="/SkillProbe/HomePage/Hero/idea-bulb.png"
                alt="Idea"
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Hourglass - Left Side Middle (closer to lady) */}
            <div className="absolute top-[45%] left-[35%] transform -translate-y-1/2 w-12 h-12 opacity-80">
              <img
                src="/SkillProbe/HomePage/Hero/hourglass.png"
                alt="Time"
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* LinkedIn - Bottom Right (moved further right on mobile) */}
            <div className="absolute bottom-8 right-4 md:bottom-12 md:right-12 w-12 h-12 md:w-16 md:h-16 opacity-90">
              <img
                src="/SkillProbe/HomePage/Hero/linkedin.png"
                alt="LinkedIn"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
