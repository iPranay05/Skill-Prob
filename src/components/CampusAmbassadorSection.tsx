'use client';
import Link from 'next/link';

export default function CampusAmbassadorSection() {
  return (
    <section className="bg-gradient-to-br from-pink-200 to-purple-300 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Side - Content */}
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Earn Money Online While You Learn
              </h2>
              <p className="text-base text-gray-900 leading-relaxed">
                Become a Skill Probe Campus Ambassador. Earn up to ₹500 per referral, grow your network, and turn points into cash.
              </p>
            </div>

            {/* Learn More Link */}
            <Link
              href="/for-ambassadors"
              className="inline-flex items-center text-base font-semibold text-gray-900 hover:text-primary transition-colors"
            >
              Learn More
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Milestone Bonuses */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Milestone Bonuses</h3>
              
              <div className="space-y-4">
                <div className="border-b-2 border-gray-900 pb-3">
                  <p className="text-base text-gray-900">
                    <span className="font-bold">₹500</span> on 10 Successful Referrals
                  </p>
                </div>
                
                <div className="border-b-2 border-gray-900 pb-3">
                  <p className="text-base text-gray-900">
                    <span className="font-bold">₹1500</span> on 25 Successful Referrals
                  </p>
                </div>
                
                <div className="border-b-2 border-gray-900 pb-3">
                  <p className="text-base text-gray-900">
                    <span className="font-bold">₹5000</span> on 50 Successful Referrals
                  </p>
                </div>
                
                <div className="border-b-2 border-gray-900 pb-3">
                  <p className="text-base text-gray-900">
                    <span className="font-bold">₹15000</span> on 100 Successful Referrals
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Points & Rewards Card */}
          <div className="flex items-end">
            <div className="w-full bg-black rounded-3xl p-25 pt-15 text-white">
              <h3 className="text-xl font-bold mb-8">Points & Rewards System</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Card 1 */}
                <div className="bg-white text-black rounded-2xl p-6 text-center">
                  <p className="text-2xl font-bold mb-2">50 Points</p>
                  <p className="text-sm text-gray-600">Per Registration</p>
                </div>
                
                {/* Card 2 */}
                <div className="bg-white text-black rounded-2xl p-6 text-center">
                  <p className="text-2xl font-bold mb-2">100 Points</p>
                  <p className="text-sm text-gray-600">Per Course Purchase</p>
                </div>
                
                {/* Card 3 */}
                <div className="bg-white text-black rounded-2xl p-6 text-center">
                  <p className="text-2xl font-bold mb-2">₹100 + 10%</p>
                  <p className="text-sm text-gray-600">Ambassador Referral</p>
                </div>
                
                {/* Card 4 */}
                <div className="bg-white text-black rounded-2xl p-6 text-center">
                  <p className="text-2xl font-bold mb-2">100 = ₹100</p>
                  <p className="text-sm text-gray-600">Point Conversion</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
