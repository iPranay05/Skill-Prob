'use client';
import Footer from './Footer';
import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle, DollarSign, Users, BarChart3, Share2, Award, Gift, Target, TrendingUp, Star, MessageCircle, Smartphone, ChevronDown, ChevronUp } from 'lucide-react';

export default function ForAmbassadors() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
              <h1 className="text-4xl lg:text-5xl font-black leading-tight text-gray-700">
                <span className="block">Earn While You Learn</span>
                <span className="block" style={{ color: '#5e17eb' }}>Campus Ambassador</span>
              </h1>

              {/* Description */}
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-gray-700">What is the Campus Ambassador Program?</h2>
                <p className="text-xl leading-relaxed text-gray-600">
                  Earn money by promoting quality education in your network. Share courses, refer students, and earn rewards.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/ambassador/signup">
                  <button className="px-8 py-4 bg-primary text-white font-semibold text-lg rounded-xl hover:bg-primary-dark transition-all duration-300 w-full sm:w-auto">
                    Apply Now
                  </button>
                </Link>
                <Link href="/ambassador-guide">
                  <button className="px-8 py-4 border-2 border-primary text-primary font-semibold text-lg rounded-xl hover:bg-primary hover:text-white transition-all duration-300 w-full sm:w-auto">
                    Learn More
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Side - Hero Image */}
            <div className="relative">
              <div className="relative w-full h-96 rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&h=400&fit=crop"
                  alt="Campus ambassador networking and promoting education - representing student leadership and earning opportunities"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Become an Ambassador */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-gray-700">Why Become an Ambassador?</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyBecome.map((reason, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 text-center shadow-lg border-2 border-gray-100">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" className="bg-primary">
                  <div style={{ color: '#ffffff' }}>{reason.icon}</div>
                </div>
                <h3 className="text-xl font-black mb-4 text-gray-700">{reason.title}</h3>
                <p className="leading-relaxed text-gray-600">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-gray-700">How It Works</h2>
          </div>
          
          <div className="grid md:grid-cols-5 gap-8">
            {howItWorks.map((step, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 text-center shadow-lg border-2 border-gray-100">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" className="bg-primary">
                  <span className="text-2xl font-black" style={{ color: '#ffffff' }}>{idx + 1}</span>
                </div>
                <h3 className="text-lg font-black mb-4 text-gray-700">{step.step}</h3>
                <p className="leading-relaxed text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earning Structure */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-gray-700">Earning Structure</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-white rounded-xl p-4 text-center border border-gray-300 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" className="bg-primary">
                <Users className="w-5 h-5" style={{ color: '#ffffff' }} />
              </div>
              <h3 className="text-xl font-black mb-1 text-gray-700">50</h3>
              <p className="font-semibold text-xs text-gray-600">Registration Points</p>
            </div>

            <div className="bg-white rounded-xl p-4 text-center border border-gray-300 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" className="bg-primary">
                <DollarSign className="w-5 h-5" style={{ color: '#ffffff' }} />
              </div>
              <h3 className="text-xl font-black mb-1 text-gray-700">500</h3>
              <p className="font-semibold text-xs text-gray-600">Purchase Points</p>
            </div>

            <div className="bg-white rounded-xl p-4 text-center border border-gray-300 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" className="bg-primary">
                <Share2 className="w-5 h-5" style={{ color: '#ffffff' }} />
              </div>
              <h3 className="text-xl font-black mb-1 text-gray-700">₹100</h3>
              <p className="font-semibold text-xs text-gray-600">Ambassador Referral</p>
            </div>

            <div className="bg-white rounded-xl p-4 text-center border border-gray-300 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" className="bg-primary">
                <CheckCircle className="w-5 h-5" style={{ color: '#ffffff' }} />
              </div>
              <h3 className="text-xl font-black mb-1 text-gray-700">100 = ₹100</h3>
              <p className="font-semibold text-xs text-gray-600">Point Conversion</p>
            </div>
          </div>

          {/* Milestone Bonuses */}
          <div className="mb-16">
            <h3 className="text-3xl font-black text-center mb-12 text-gray-700">Milestone Bonuses</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {milestones.map((milestone, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 text-center border border-gray-300 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" className="bg-primary">
                    <span className="font-black text-base" style={{ color: '#ffffff' }}>{milestone.referrals}</span>
                  </div>
                  <h4 className="text-lg font-black mb-1 text-gray-700">{milestone.bonus}</h4>
                  <p className="font-semibold text-xs text-gray-600">{milestone.referrals} Successful Referrals</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ambassador Benefits */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-gray-700">Ambassador Benefits</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-4 p-6 bg-white rounded-xl border-2 border-gray-100">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1" className="bg-primary">
                  <CheckCircle className="w-4 h-4" style={{ color: '#ffffff' }} />
                </div>
                <p className="font-semibold text-gray-600">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ambassador Dashboard */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-gray-700">Ambassador Dashboard</h2>
            <p className="text-lg text-gray-600">Your personal command center includes:</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-black mb-4" style={{ color: '#5e17eb' }}>Performance Overview</h3>
              <div className="space-y-2">
                {[
                  'Total referrals (clicks, registrations, purchases)',
                  'Conversion rate analytics',
                  'Current points balance',
                  'Total earnings to date'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" className="bg-primary"></div>
                    <span className="text-sm text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-black mb-4" style={{ color: '#5e17eb' }}>Referral Management</h3>
              <div className="space-y-2">
                {[
                  'Generate custom referral links',
                  'Create QR codes for offline sharing',
                  'Download promotional materials',
                  'Track individual referral status'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" className="bg-primary"></div>
                    <span className="text-sm text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-black mb-4" style={{ color: '#5e17eb' }}>Earnings & Payouts</h3>
              <div className="space-y-2">
                {[
                  'Points ledger with transaction history',
                  'Request payout (minimum ₹500)',
                  'View payout history',
                  'Download payment receipts'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" className="bg-primary"></div>
                    <span className="text-sm text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-300 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-black mb-4" style={{ color: '#5e17eb' }}>Ambassador Tools</h3>
              <div className="space-y-2">
                {[
                  'Pre-designed social media posts',
                  'WhatsApp message templates',
                  'Email invitation templates',
                  'Promotional banners and graphics'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" className="bg-primary"></div>
                    <span className="text-sm text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Can Become an Ambassador */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          
          {/* Who Can Become an Ambassador */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black mb-4 text-gray-700">Who Can Become an Ambassador?</h2>
              <p className="text-lg text-gray-600">Join our community of passionate education advocates</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eligibility.map((item, idx) => (
                <div key={idx} className="group bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5e17eb] to-[#7c3aed] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-semibold text-gray-700 leading-relaxed pt-2">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Application Requirements */}
          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black mb-4 text-gray-700">Application Requirements</h2>
              <p className="text-lg text-gray-600">Simple criteria to get started</p>
            </div>
            <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 md:p-12 border border-gray-200 shadow-lg">
              <div className="grid md:grid-cols-2 gap-6">
                {requirements.map((requirement, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-gradient-to-r from-[#5e17eb]/5 to-transparent rounded-xl hover:from-[#5e17eb]/10 transition-colors duration-300">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-gray-700 font-medium leading-relaxed">{requirement}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-gray-700">Success Stories</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <p className="text-lg mb-6 leading-relaxed text-gray-600 italic">
                  "{testimonial.text}"
                </p>
                <p className="font-bold" style={{ color: '#5e17eb' }}>- {testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips for Success */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-gray-700">Tips for Success</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tips.map((tip, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 text-center shadow-lg border-2 border-gray-100">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" className="bg-primary">
                  <span className="text-2xl font-black" style={{ color: '#ffffff' }}>{idx + 1}</span>
                </div>
                <h3 className="text-xl font-black mb-4 text-gray-700">{tip.title}</h3>
                <p className="leading-relaxed text-gray-600">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-gray-700">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-gray-700">{faq.question}</h3>
                  <div className="flex-shrink-0 ml-4">
                    {openFaq === idx ? (
                      <ChevronUp className="w-5 h-5 text-primary" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>
                {openFaq === idx && (
                  <div className="px-8 pb-6">
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
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
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl p-12 shadow-lg border border-gray-200 text-center">
            <h2 className="text-4xl font-black mb-6 text-gray-700">Ready to Become an Ambassador?</h2>
            <p className="text-lg mb-12 max-w-3xl mx-auto text-gray-600">
              Join our Campus Ambassador Program and start earning money while you learn!
            </p>
            
            <div className="flex justify-center">
              <Link
                href="/ambassador/signup"
                className="px-10 py-4 font-bold text-lg rounded-xl transition-all duration-300 hover:shadow-lg bg-primary"
                style={{ color: '#ffffff' }}
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer></Footer>
    </div>
  );
}
