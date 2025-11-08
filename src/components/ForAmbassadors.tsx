'use client';
import Footer from './Footer';
import CampusAmbassadorSection from './CampusAmbassadorSection';
import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle, DollarSign, Users, Share2, Award, Target, TrendingUp, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

export default function ForAmbassadors() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const benefits = [
    'Minimum Payout: ₹500 (very achievable!)',
    'Fast Payouts: Weekly or monthly processing',
    'No Limits: Unlimited earning potential',
    'Free Courses: Get 2 free courses per semester',
    'Exclusive Events: Attend ambassador meetups and webinars',
    'Certificates: Recognition certificate for your CV',
    'Merchandise: Exclusive Skill Probe swag for top performers',
    'Priority Support: Dedicated ambassador support team'
  ];

  const whyBecome = [
    {
      title: 'Earn Substantial Income',
      description: 'Earn ₹500 for every successful student enrollment through your referral. No limits on earnings—the more you refer, the more you earn!',
      icon: <DollarSign className="w-8 h-8" />
    },
    {
      title: 'Flexible Work',
      description: 'Work on your own schedule. Share referrals through social media, WhatsApp, or direct conversations. No fixed hours or commitments.',
      icon: <Target className="w-8 h-8" />
    },
    {
      title: 'Build Your Network',
      description: 'Connect with like-minded students, professionals, and mentors. Expand your network while helping others discover quality education.',
      icon: <Users className="w-8 h-8" />
    },
    {
      title: 'Develop Skills',
      description: 'Gain experience in marketing, communication, networking, and sales. These skills are valuable for any career path.',
      icon: <TrendingUp className="w-8 h-8" />
    },
    {
      title: 'Recognition & Perks',
      description: 'Top performers get featured on our website, receive exclusive swag, and get priority access to new courses and features.',
      icon: <Award className="w-8 h-8" />
    }
  ];

  const howItWorks = [
    {
      step: 'Become an Ambassador',
      description: 'Apply directly or get referred by existing ambassadors for faster approval.'
    },
    {
      step: 'Get Your Unique Code',
      description: 'Receive your personalized referral code and access to ambassador dashboard.'
    },
    {
      step: 'Share & Promote',
      description: 'Share across WhatsApp, social media, and college communities with our materials.'
    },
    {
      step: 'Track Your Referrals',
      description: 'Monitor clicks, registrations, purchases, and earnings in real-time.'
    },
    {
      step: 'Earn & Get Paid',
      description: 'Convert points to cash and request payouts directly to your bank account.'
    }
  ];

  const milestones = [
    { referrals: '10', bonus: '₹500' },
    { referrals: '25', bonus: '₹1,500' },
    { referrals: '50', bonus: '₹5,000' },
    { referrals: '100', bonus: '₹15,000' }
  ];

  const eligibility = [
    'College Students across all streams',
    'Recent Graduates looking for income',
    'Young Professionals with strong networks',
    'Content Creators with social media presence',
    'Community Leaders in colleges or groups',
    'Anyone passionate about education and helping others'
  ];

  const requirements = [
    'Must be 18+ years old',
    'Active social media presence OR strong college network',
    'Good communication skills',
    'Genuine interest in promoting quality education',
    'Indian resident with valid bank account'
  ];

  const testimonials = [
    {
      text: 'I\'ve earned ₹45,000 in 6 months as a campus ambassador while completing my engineering degree. It\'s the best part-time opportunity!',
      author: 'R. Mehta, IIT Delhi'
    },
    {
      text: 'Started with 5 referrals in my first month. Now I consistently earn ₹8,000-12,000 monthly. Highly recommend!',
      author: 'A. Gupta, Mumbai University'
    },
    {
      text: 'The ambassador program helped me develop marketing skills while earning. It\'s now a key highlight on my resume!',
      author: 'K. Reddy, Christ University'
    }
  ];

  const tips = [
    {
      title: 'Be Authentic',
      description: 'Share your genuine experience with Skill Probe courses. Authenticity builds trust.'
    },
    {
      title: 'Target the Right Audience',
      description: 'Focus on students and professionals genuinely interested in upskilling.'
    },
    {
      title: 'Use Multiple Channels',
      description: 'Don\'t rely on just one platform. Share across WhatsApp, Instagram, Facebook, LinkedIn, and email.'
    },
    {
      title: 'Provide Value',
      description: 'Help people choose the right courses. Be a consultant, not just a promoter.'
    },
    {
      title: 'Follow Up',
      description: 'Check in with people who clicked your link but haven\'t enrolled yet.'
    },
    {
      title: 'Join Ambassador Community',
      description: 'Connect with other ambassadors, share strategies, and learn from top performers.'
    }
  ];

  const faqs = [
    {
      question: 'How long does approval take?',
      answer: 'Direct applications: 5-7 business days. Referral-based: 24-48 hours.'
    },
    {
      question: 'Is there any fee to join?',
      answer: 'No! The program is completely free. No hidden charges ever.'
    },
    {
      question: 'When can I request my first payout?',
      answer: 'Once you reach minimum ₹500 in your wallet, you can request payout anytime.'
    }
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
      
      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-visible bg-white">
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Side - Text Content */}
            <div className="space-y-6">
              {/* Main Heading */}
              <h1 className="text-4xl lg:text-5xl font-semibold leading-tight text-gray-700">
                <span className="block" style={{color:'#000000ff'}}>Earn While You Learn –</span>
                <span className="block" style={{ color: '#000000ff' }}>Become a Skill Probe<br/>Ambassador<span className='text-primary'>.</span></span>
              </h1>

              {/* Description */}
              <div className="space-y-4">
                <h2 className="text-2xl font-extrabold italic text-[#dd36bfff]">What is the Campus Ambassador Program?</h2>
                <p className="text-xl leading-relaxed text-gray-600">
                  The Skill Probe Campus Ambassador Program lets<br/>students and young professionals earn by promoting<br/>education, sharing courses, referring students, and<br/>building skills.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/ambassador-guide">
                  <button className="px-8 py-4 bg-[#1A1A1A] border-2 text-white font-semibold text-lg rounded-xl hover:bg-primary hover:text-white transition-all duration-300 w-full sm:w-auto">
                    Learn More
                  </button>
                </Link>
                <Link href="/ambassador/signup">
                  <button className="flex items-center justify-center gap-2 px-8 py-4 border-2 text-black font-semibold text-lg rounded-xl hover:bg-blue-100 transition-all duration-300 w-full sm:w-auto">
                    <span>Become an Ambassador</span>
                    <ArrowRight className='w-4 h-4'/>
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Side - Hero Image */}
            <div className="relative">
              <div className="relative w-full h-96 rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/SkillProbe/Ambassadors/Hero/SAbannerwebsite.jpg"
                  alt="Campus ambassador networking and promoting education - representing student leadership and earning opportunities"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Become an Ambassador */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-semibold mb-4 text-black">Why Become an Ambassador<span className='text-primary'>?</span></h2>
            <p className="text-xl text-gray-600">
              Grow, earn, and connect with purpose.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {/* Card 1 - Earn Substantial Income */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="mb-4">
                <img
                  src="/SkillProbe/Ambassadors/Hero/SAbannerwebsite.jpg"
                  alt="Earn Substantial Income"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-bold mb-3 text-black">Earn Substantial Income</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Earn ₹500 per student referral—no limit on how much you can earn!
              </p>
            </div>

            {/* Card 2 - Flexible Work */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="mb-4">
                <img
                  src="/SkillProbe/Ambassadors/Hero/SAbannerwebsite.jpg"
                  alt="Flexible Work"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-bold mb-3 text-black">Flexible Work</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Work anytime, anywhere. Share referrals via social media or chats—no fixed hours.
              </p>
            </div>

            {/* Card 3 - Build Your Network */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="mb-4">
                <img
                  src="/SkillProbe/Ambassadors/Hero/SAbannerwebsite.jpg"
                  alt="Build Your Network"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-bold mb-3 text-black">Build Your Network</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Connect with students, mentors, and professionals while promoting quality education.
              </p>
            </div>

            {/* Card 4 - Develop Skills */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="mb-4">
                <img
                  src="/SkillProbe/Ambassadors/Hero/SAbannerwebsite.jpg"
                  alt="Develop Skills"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-bold mb-3 text-black">Develop Skills</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Gain marketing, communication, and sales experience valuable for any career.
              </p>
            </div>

            {/* Card 5 - Recognition & Perks */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="mb-4">
                <img
                  src="/SkillProbe/Ambassadors/Hero/SAbannerwebsite.jpg"
                  alt="Recognition & Perks"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-bold mb-3 text-black">Recognition & Perks</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Top performers get featured, exclusive swag, and priority access to new features.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Steps */}
            <div className="space-y-8">
              {howItWorks.map((step, idx) => (
                <div key={idx} className="flex gap-6 items-start">
                  {/* Number Circle */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: '#c4b5fd', color: '#000' }}>
                      {idx + 1}
                    </div>
                    {/* Vertical Line - only show if not last item */}
                    {idx < howItWorks.length - 1 && (
                      <div className="w-0.5 h-16 bg-gray-300 mx-auto mt-2"></div>
                    )}
                  </div>
                  
                  {/* Step Content */}
                  <div className="flex-1 pt-3">
                    <h3 className="text-xl font-bold mb-2 text-black">{step.step}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Side - Image with Purple Banner */}
            <div className="relative pt-16">
              {/* Purple Banner - positioned to overlap */}
              <div className="absolute top-0 left-6 right-6 z-10 bg-[#c4b5fd] px-8 py-6 rounded-lg shadow-lg">
                <p className="text-white text-lg font-semibold leading-relaxed">
                  Guide learners, grow your reach, and earn doing what you love.
                </p>
              </div>
              
              {/* Image Container */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="/SkillProbe/Ambassadors/How it works Section/Who-can-become-a-Student-Ambassador-01-2.jpg"
                  alt="Ambassador guiding learners"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing */}
      <div className="py-10"></div>

      {/* Earning Structure */}
      <CampusAmbassadorSection />

      {/* Spacing between sections */}
      <div className="py-20 bg-white"></div>

      {/* Ambassador Benefits */}
      <section className="relative py-20 px-6 overflow-visible" style={{ backgroundColor: '#7c3aed' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Side - Text Content */}
            <div className="text-white pt-8">
              <h2 className="text-4xl font-bold mb-6">Ambassador Benefits<span className='text-white'>.</span></h2>
              <p className="text-lg mb-8 leading-relaxed">
                From payouts and recognition to networking and learning opportunities, our ambassadors enjoy benefits that fuel both personal and professional growth.
              </p>
              <Link href="/ambassador/signup">
                <button className="px-8 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition-all duration-300">
                  Become a Ambassador
                </button>
              </Link>
            </div>

            {/* Right Side - Feature Cards Grid */}
            <div className="grid grid-cols-2 gap-4 relative -mb-32">
              {/* Card 1 - Integrated Payment System */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 mb-4">
                  <img 
                    src="/SkillProbe/Mentors/What You Get As a Mentor Section/credit-card.png" 
                    alt="Payment System"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-base font-bold mb-2 text-black">Integrated Payment System</h3>
                <p className="text-sm text-gray-600">Direct payouts to your account</p>
              </div>

              {/* Card 2 - Student Analytics */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 mb-4">
                  <img 
                    src="/SkillProbe/Mentors/What You Get As a Mentor Section/pie-chart.png" 
                    alt="Student Analytics"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-base font-bold mb-2 text-black">Student Analytics</h3>
                <p className="text-sm text-gray-600">Track enrollments, engagement, and revenue</p>
              </div>

              {/* Card 3 - Marketing Support */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 mb-4">
                  <img 
                    src="/SkillProbe/Mentors/What You Get As a Mentor Section/social-media (1).png" 
                    alt="Marketing Support"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-base font-bold mb-2 text-black">Marketing Support</h3>
                <p className="text-sm text-gray-600">Feature your courses on the homepage</p>
              </div>

              {/* Card 4 - Technical Support */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 mb-4">
                  <img 
                    src="/SkillProbe/Mentors/What You Get As a Mentor Section/customer-service (1).png" 
                    alt="Technical Support"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-base font-bold mb-2 text-black">Technical Support</h3>
                <p className="text-sm text-gray-600">Live chat and email assistance</p>
              </div>

              {/* Card 5 - Zero Setup Costs */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 mb-4">
                  <img 
                    src="/SkillProbe/Mentors/What You Get As a Mentor Section/calculator.png" 
                    alt="Zero Setup Costs"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-base font-bold mb-2 text-black">Zero Setup Costs</h3>
                <p className="text-sm text-gray-600">Start teaching immediately</p>
              </div>

              {/* Card 6 - Course Dashboard */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 mb-4">
                  <img 
                    src="/SkillProbe/Mentors/What You Get As a Mentor Section/dashboard.png" 
                    alt="Course Dashboard"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-base font-bold mb-2 text-black">Course Dashboard</h3>
                <p className="text-sm text-gray-600">Manage courses with ease</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing between sections */}
      <div className="py-20 bg-white"></div>

      {/* Support & Resources */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-semibold mb-4 text-black">Support & Resources<span className='text-primary'>.</span></h2>
            <p className="text-xl text-gray-600">Everything You Need to Succeed as a Ambassador.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Mentor Training */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img 
                    src="/SkillProbe/Mentors/Support & Resources/online-class.png" 
                    alt="Mentor Training"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-3 text-center text-black">Mentor Training</h3>
              <ul className="space-y-1.5 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Create engaging content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Learn live teaching tips</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Boost student engagement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Market your courses</span>
                </li>
              </ul>
            </div>

            {/* Marketing Assistance */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img 
                    src="/SkillProbe/Mentors/Support & Resources/headphone.png" 
                    alt="Marketing Assistance"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-3 text-center text-black">Marketing Assistance</h3>
              <ul className="space-y-1.5 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Homepage feature</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Social media promo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Email outreach</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>SEO support</span>
                </li>
              </ul>
            </div>

            {/* Technical Support */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img 
                    src="/SkillProbe/Mentors/Support & Resources/customer-chat.png" 
                    alt="Technical Support"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-3 text-center text-black">Technical Support</h3>
              <ul className="space-y-1.5 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Live chat (business hours)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>24/7 email help</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Docs & guides</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Webinars & training</span>
                </li>
              </ul>
            </div>

            {/* Technical Support (duplicate in screenshot) */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img 
                    src="/SkillProbe/Mentors/Support & Resources/customer-chat.png" 
                    alt="Technical Support"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-3 text-center text-black">Technical Support</h3>
              <ul className="space-y-1.5 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Live chat (business hours)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>24/7 email help</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Docs & guides</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>Webinars & training</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

        {/* Ambassador Requirements */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-semibold mb-4 text-black">Ambassador Requirements<span className='text-primary'>.</span></h2>
            <p className="text-xl text-gray-600">Real ambassadors. Real impact. Real growth.</p>
          </div>

          {/* Image with Overlay Cards */}
          <div className="relative rounded-3xl overflow-hidden shadow-xl">
            {/* Background Image */}
            <img
              src="/SkillProbe/Ambassadors/Ambassador Requirements Section/39677550202_da6ff7c610_b.jpg"
              alt="Ambassador Requirements"
              className="w-full h-[450px] object-cover"
            />
            
            {/* Overlay Cards */}
            <div className="absolute inset-0 flex items-center justify-start px-12">
              <div className="grid grid-cols-1 gap-3 max-w-md w-full">
                {requirements.slice(0, 4).map((requirement, idx) => (
                  <div key={idx} className="bg-white rounded-lg px-5 py-3 shadow-lg flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">{requirement}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Success Stories */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-semibold mb-4 text-black">Success Stories<span className='text-primary'>.</span></h2>
            <p className="text-xl text-gray-600">Real ambassadors. Real impact. Real growth.</p>
          </div>

          {/* Testimonials Carousel */}
          <div className="relative">
            <div className="flex items-center gap-6">
              {/* Left Arrow */}
              <button 
                onClick={() => setCurrentTestimonial(currentTestimonial > 0 ? currentTestimonial - 1 : testimonials.length - 1)}
                className="flex-shrink-0 w-12 h-12 rounded-full bg-black flex items-center justify-center hover:bg-gray-800 transition-colors"
              >
                <svg className="w-6 h-6 text-white rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Testimonial Cards */}
              <div className="flex-1 grid md:grid-cols-2 gap-6">
                {[testimonials[currentTestimonial], testimonials[(currentTestimonial + 1) % testimonials.length]].map((testimonial, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                    {/* Quote Icon */}
                    <div className="mb-4">
                      <svg className="w-10 h-10 text-primary" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
                      </svg>
                    </div>
                    
                    {/* Testimonial Text */}
                    <p className="text-base mb-6 leading-relaxed text-gray-700">
                      "{testimonial.text}"
                    </p>
                    
                    {/* Author Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: '#ec4899' }}>
                        {testimonial.author.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-black">{testimonial.author.split(',')[0]}</p>
                        <p className="text-sm text-gray-500">{testimonial.author.split(',')[1]}</p>
                      </div>
                    </div>
                    
                    {/* Star Rating */}
                    <div className="flex gap-1 mt-4">
                      {[1, 2, 3, 4].map((star) => (
                        <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Arrow */}
              <button 
                onClick={() => setCurrentTestimonial((currentTestimonial + 1) % testimonials.length)}
                className="flex-shrink-0 w-12 h-12 rounded-full bg-black flex items-center justify-center hover:bg-gray-800 transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Tips for Success */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl font-semibold text-black">Tips for Success<span className='text-primary'>.</span></h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentTip(currentTip > 0 ? currentTip - 3 : Math.max(0, tips.length - 3))}
                className="w-12 h-12 rounded-full bg-black flex items-center justify-center hover:bg-gray-800 transition-colors"
              >
                <svg className="w-6 h-6 text-white rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button 
                onClick={() => setCurrentTip((currentTip + 3) % tips.length)}
                className="w-12 h-12 rounded-full bg-black flex items-center justify-center hover:bg-gray-800 transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {/* Purple Info Card */}
            <div className="bg-primary rounded-2xl p-8 text-white flex items-center min-h-[320px]">
              <p className="text-base leading-relaxed">
                Small actions can make a big difference in achieving your goals. Follow these proven tips to grow your impact and influence effectively.
              </p>
            </div>

            {/* Tip Cards */}
            {tips.slice(currentTip, currentTip + 3).map((tip, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm min-h-[320px] flex flex-col">
                <div className="text-6xl font-bold text-primary mb-6">
                  {String(currentTip + idx + 1).padStart(2, '0')}
                </div>
                <h3 className="text-xl font-bold mb-4 text-black">{tip.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-semibold mb-4 text-black">Frequently Asked Questions<span className='text-primary'>.</span></h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-300 overflow-hidden">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                >
                  <h3 className="text-base font-semibold text-black">{faq.question}</h3>
                  <div className="flex-shrink-0 ml-4">
                    {openFaq === idx ? (
                      <span className="text-2xl text-gray-600">−</span>
                    ) : (
                      <span className="text-2xl text-gray-600">+</span>
                    )}
                  </div>
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5">
                    <div className="pt-2">
                      <p className="text-gray-600 leading-relaxed text-sm">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    

      {/* CTA Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6 text-black">
            Ready to Become an Ambassador<span className='text-primary'>?</span>
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Join our Campus Ambassador Program<br/>
            and start earning money while you learn!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/ambassador/signup">
              <button className="px-10 py-4 bg-black text-white font-semibold text-lg rounded-xl hover:bg-gray-800 transition-all duration-300 w-full sm:w-auto">
                Apply Now
              </button>
            </Link>
            <Link href="/contact">
              <button className="flex items-center justify-center gap-2 px-10 py-4 border-2 border-black text-black font-semibold text-lg rounded-xl hover:bg-gray-50 transition-all duration-300 w-full sm:w-auto">
                <span>Contact Us</span>
                <ArrowRight className='w-5 h-5'/>
              </button>
            </Link>
          </div>
        </div>
      </section>
      
      <Footer></Footer>
    </div>
  );
}


