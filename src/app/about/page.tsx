'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Mail, GraduationCap, Monitor, Users, FileCheck, Handshake, Target, BookOpen, Compass, Network, Briefcase } from 'lucide-react';
import Image from 'next/image';
import Footer from '@/components/Footer';


export default function AboutPage() {
  const [advantageIndex, setAdvantageIndex] = useState(0);
  const [differentiatorIndex, setDifferentiatorIndex] = useState(0);

  const advantages = [
    {
      title: 'Live Interactive Learning',
      description: 'Real-time classes with industry experts.',
      image: '/SkillProbe/AboutUs/The Skill Probe Advantage Section/Live Learning.jpg'
    },
    {
      title: 'Flexible Scheduling',
      description: 'Learn at your pace with recorded content.',
      image: '/SkillProbe/AboutUs/The Skill Probe Advantage Section/Flexible Learning.jpg'
    },
    {
      title: 'Expert Mentorship',
      description: 'Get guidance from industry professionals.',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop'
    }
  ];

  const differentiators = [
    {
      icon: BookOpen,
      title: 'Hybrid Learning Approach.',
      description: 'Unlike traditional online course platforms, we offer both live mentor-led classes and comprehensive recorded sessions, giving you the flexibility to choose what works best for your learning style.'
    },
    {
      icon: Compass,
      title: 'Personalized Career Guidance.',
      description: 'Our dedicated career coaches work with you one-on-one to create customized learning paths aligned with your career goals.'
    },
    {
      icon: Network,
      title: 'Industry Connections.',
      description: 'Direct access to hiring partners and networking opportunities with professionals from top companies.'
    },
    {
      icon: Briefcase,
      title: 'Job Placement Support.',
      description: 'From resume building to interview prep, we support you throughout your job search journey.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Hero Section - About Us */}
      <section className="relative h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/SkillProbe/AboutUs/Hero/heroimg.jpg"
            alt="Team collaboration"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-purple-500 opacity-55"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center items-center text-center">
          {/* <div className="text-sm text-white mb-6 font-medium">Home &gt; About Us</div> */}
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-10">About Us.</h1>
          <div className="mt-10 flex gap-4">
            <button className="bg-[#1A1A1A] bg-opacity-40 text-white px-12 py-4 rounded-md  text-base hover:bg-opacity-50 transition-colors backdrop-blur-sm">
              Learn More
            </button>
            <button className="bg-white text-black px-12 py-4 rounded-md  text-base hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-md">
              Contact Us
              <Mail className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Impact Section */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-purple-300 text-black px-5 py-2 rounded-md font-semibold text-sm mb-6">
              Our Impact.
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-black">
              Building careers, one learner at a time.
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <GraduationCap className="w-14 h-14 text-black" strokeWidth={1.5} />
              </div>
              <div className="text-3xl font-bold text-black mb-2">50,000+</div>
              <div className="text-gray-600 text-sm">Active Learners</div>
            </div>
            <div className="bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 rounded-xl p-8 text-center shadow-md">
              <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
                <Monitor className="w-8 h-8 text-purple-600" strokeWidth={2} />
              </div>
              <div className="text-3xl font-bold text-white mb-2">500+</div>
              <div className="text-white text-sm">Skill Development Courses</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="w-14 h-14 text-black" strokeWidth={1.5} />
              </div>
              <div className="text-3xl font-bold text-black mb-2">200+</div>
              <div className="text-gray-600 text-sm">Expert Mentors</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileCheck className="w-14 h-14 text-black" strokeWidth={1.5} />
              </div>
              <div className="text-3xl font-bold text-black mb-2">5,000+</div>
              <div className="text-gray-600 text-sm">Certifications Issued</div>
            </div>
            <div className="bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 rounded-xl p-8 text-center shadow-md">
              <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
                <Handshake className="w-8 h-8 text-purple-600" strokeWidth={2} />
              </div>
              <div className="text-3xl font-bold text-white mb-2">1,000+</div>
              <div className="text-white text-sm">Internship Placements</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Target className="w-14 h-14 text-black" strokeWidth={1.5} />
              </div>
              <div className="text-3xl font-bold text-black mb-2">300+</div>
              <div className="text-gray-600 text-sm">Active Campus Ambassadors</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Differentiators Section */}
      <section className="py-20 bg-purple-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block bg-purple-400 text-black px-5 py-2 rounded-md font-semibold text-sm mb-4">
              What Makes Us Different.
            </div>
          </div>

          <div className="relative py-8">
            <button
              onClick={() => setDifferentiatorIndex(Math.max(0, differentiatorIndex - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black rounded-full hover:bg-gray-800 transition-colors"
              disabled={differentiatorIndex === 0}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            <div className="text-center px-20">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-md">
                {(() => {
                  const IconComponent = differentiators[differentiatorIndex].icon;
                  return <IconComponent className="w-16 h-16 text-black" strokeWidth={1.5} />;
                })()}
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-black mb-6">
                {differentiators[differentiatorIndex].title}
              </h3>
              <p className="text-gray-900 text-base leading-relaxed max-w-2xl mx-auto">
                {differentiators[differentiatorIndex].description}
              </p>
            </div>

            <button
              onClick={() => setDifferentiatorIndex(Math.min(differentiators.length - 1, differentiatorIndex + 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black rounded-full hover:bg-gray-800 transition-colors"
              disabled={differentiatorIndex >= differentiators.length - 1}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>

            <div className="text-center mt-8">
              <span className="bg-white px-4 py-1.5 rounded-full text-sm font-semibold">
                {differentiatorIndex + 1}/{differentiators.length}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1 w-full max-w-md">
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6 w-4/5">
                  <h3 className="text-lg font-bold text-black">Accessibility.</h3>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6 w-4/5 ml-auto">
                  <h3 className="text-lg font-bold text-black">Excellence.</h3>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6 w-4/5">
                  <h3 className="text-lg font-bold text-black">Innovation.</h3>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6 w-4/5 ml-auto">
                  <h3 className="text-lg font-bold text-black">Integrity.</h3>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="inline-block bg-purple-300 text-black px-5 py-2 rounded-md font-semibold text-sm mb-6">
                Our Values.
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
                The Pillars That Drive Us.
              </h2>
              <p className="text-gray-700 text-xl mb-8 leading-relaxed">
                Built on integrity, powered by innovation, and <br/>committed to excellence — our values guide <br/>every step we take. They shape how we learn,<br/> grow, and collaborate to create accessible,<br/> meaningful opportunities for every learner and<br/> partner in our community.
              </p>
              <button className="bg-black text-white px-8 py-3 rounded-md font-semibold text-sm hover:bg-gray-800 transition-colors">
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Advantage Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
              The Skill Probe Advantage.
            </h2>
            <p className="text-gray-600 text-[19px]">
              Discover what makes Skill Probe the smarter way to learn.
            </p>
          </div>

          <div className="relative">
            <div className="flex items-center justify-center gap-8">
              {advantages.slice(advantageIndex, advantageIndex + 2).map((advantage, idx) => (
                <div key={idx} className="flex-1 max-w-md">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex items-center">
                    <div className="relative w-60 h-42 flex-shrink-0">
                      <Image
                        src={advantage.image}
                        alt={advantage.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-5 flex-1">
                      <h3 className="text-lg font-bold text-black mb-2">
                        {advantage.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {advantage.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center items-center gap-4 mt-12">
              <button
                onClick={() => setAdvantageIndex(Math.max(0, advantageIndex - 1))}
                className="p-3 bg-black rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50"
                disabled={advantageIndex === 0}
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <span className="text-gray-700 font-semibold text-base">
                {advantageIndex + 1}/{advantages.length}
              </span>
              <button
                onClick={() => setAdvantageIndex(Math.min(advantages.length - 2, advantageIndex + 1))}
                className="p-3 bg-black rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50"
                disabled={advantageIndex >= advantages.length - 2}
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Statement Section */}
      <section className="py-16 bg-purple-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-800 text-[15px] md:text-xl leading-relaxed font-semibold">
              We're building more than just a learning platform; we're creating an ecosystem where skill development, mentorship, and career opportunities converge. Our goal is to become India's most trusted partner for professional skill development, helping millions of learners achieve their career aspirations.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <div className="inline-block bg-purple-400 text-black px-4 py-2 rounded-md font-semibold text-sm mb-4">
                Our Mission.
              </div>
              <h2 className="text-4xl md:text-4xl font-bold text-black mb-4">
                Join Our Journey.
              </h2>
              <p className="text-gray-700 text-xl mb-6 leading-relaxed">
                Whether you're a learner seeking to upskill, a professional wanting to mentor, or a company looking for skilled talent, Skill Probe is your partner in growth.
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="bg-[#1A1A1A] text-white px-5 py-2.5 rounded-md  text-sm hover:bg-gray-800 transition-colors">
                  Explore Courses
                </button>
                <button className="bg-[#1A1A1A] text-white px-5 py-2.5 rounded-md  text-sm hover:bg-gray-800 transition-colors">
                  Become a Mentor
                </button>
                <button className="bg-white border-2 border-black text-black px-5 py-2.5 rounded-md  text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                  Hire Talent
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
             <Image src="/images/image.png" width={400} height={400} alt="Mission" className="w-full h-auto" />
            </div>
          </div>
        </div>
      </section>
      <Footer/>
    </div>
  );
}
