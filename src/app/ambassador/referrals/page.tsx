'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Referral {
  id: string;
  studentName: string;
  studentEmail: string;
  registrationDate: string;
  status: 'pending' | 'converted' | 'expired';
  pointsEarned: number;
  conversionValue?: number;
}

interface ReferralStats {
  totalReferrals: number;
  successfulConversions: number;
  conversionRate: number;
  totalPointsEarned: number;
  pendingReferrals: number;
}

export default function AmbassadorReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    successfulConversions: 0,
    conversionRate: 0,
    totalPointsEarned: 0,
    pendingReferrals: 0
  });
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Verify ambassador access
      const profileResponse = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.data.role !== 'ambassador') {
          router.push('/dashboard');
          return;
        }
      }

      // Fetch ambassador dashboard data
      const dashboardResponse = await fetch('/api/ambassadors/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        setReferralCode(dashboardData.data.referralCode);
        setStats(dashboardData.data.stats);
        setReferrals(dashboardData.data.recentReferrals || []);
      }

    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    alert('Referral code copied to clipboard!');
  };

  const shareReferralLink = (platform: string) => {
    const referralLink = `${window.location.origin}/r/${referralCode}`;
    const message = `Join Skill Probe LMS and start your learning journey! Use my referral code: ${referralCode}`;
    
    let shareUrl = '';
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(message + ' ' + referralLink)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(referralLink)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'converted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading referral data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Referral Management</h1>
          <p className="text-gray-600 mt-2">Track your referrals and grow your network</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Referrals</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalReferrals}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Conversions</p>
                <p className="text-3xl font-bold text-green-600">{stats.successfulConversions}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Conversion Rate</p>
                <p className="text-3xl font-bold text-purple-600">{stats.conversionRate}%</p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Points Earned</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.totalPointsEarned}</p>
              </div>
              <div className="text-4xl">⭐</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pendingReferrals}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'referrals', label: 'My Referrals', icon: '👥' },
                { id: 'share', label: 'Share & Promote', icon: '📢' },
                { id: 'analytics', label: 'Analytics', icon: '📈' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
                  <h2 className="text-2xl font-bold mb-4">Your Referral Code</h2>
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/20 rounded-xl px-6 py-4 flex-1">
                      <p className="text-3xl font-bold tracking-wider">{referralCode}</p>
                    </div>
                    <button
                      onClick={copyReferralCode}
                      className="bg-white text-purple-600 px-6 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                    >
                      Copy Code
                    </button>
                  </div>
                  <p className="mt-4 text-white/80">
                    Share this code with friends and earn points for every successful referral!
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">How It Works</h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                        <div>
                          <p className="font-medium">Share Your Code</p>
                          <p className="text-sm text-gray-600">Share your unique referral code with friends</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                        <div>
                          <p className="font-medium">They Register</p>
                          <p className="text-sm text-gray-600">Friends sign up using your referral code</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                        <div>
                          <p className="font-medium">Earn Points</p>
                          <p className="text-sm text-gray-600">Get points when they make their first purchase</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Earning Structure</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Registration Bonus</span>
                        <span className="font-semibold">50 points</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">First Purchase (10%)</span>
                        <span className="font-semibold">Variable</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Course Completion Bonus</span>
                        <span className="font-semibold">100 points</span>
                      </div>
                      <div className="flex justify-between border-t pt-3">
                        <span className="font-semibold">Minimum Payout</span>
                        <span className="font-semibold text-purple-600">1,000 points</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'referrals' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">My Referrals</h2>
                <div className="space-y-4">
                  {referrals.length > 0 ? (
                    referrals.map((referral) => (
                      <div key={referral.id} className="bg-gray-50 rounded-xl p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{referral.studentName}</h3>
                            <p className="text-gray-600 text-sm">{referral.studentEmail}</p>
                            <p className="text-gray-500 text-xs mt-1">Registered on {referral.registrationDate}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(referral.status)}`}>
                              {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                            </span>
                            <p className="text-sm text-gray-600 mt-2">
                              Points: <span className="font-semibold text-purple-600">{referral.pointsEarned}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🤝</div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">No Referrals Yet</h3>
                      <p className="text-gray-600 mb-6">Start sharing your referral code to see your referrals here!</p>
                      <button
                        onClick={() => setActiveTab('share')}
                        className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors"
                      >
                        Start Sharing
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'share' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Share & Promote</h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold mb-4">Share on Social Media</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => shareReferralLink('whatsapp')}
                          className="flex items-center justify-center space-x-2 bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 transition-colors"
                        >
                          <span>📱</span>
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={() => shareReferralLink('twitter')}
                          className="flex items-center justify-center space-x-2 bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-600 transition-colors"
                        >
                          <span>🐦</span>
                          <span>Twitter</span>
                        </button>
                        <button
                          onClick={() => shareReferralLink('linkedin')}
                          className="flex items-center justify-center space-x-2 bg-blue-700 text-white p-3 rounded-xl hover:bg-blue-800 transition-colors"
                        >
                          <span>💼</span>
                          <span>LinkedIn</span>
                        </button>
                        <button
                          onClick={() => shareReferralLink('facebook')}
                          className="flex items-center justify-center space-x-2 bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors"
                        >
                          <span>📘</span>
                          <span>Facebook</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold mb-4">Referral Link</h3>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={`${window.location.origin}/r/${referralCode}`}
                          readOnly
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-xl bg-white"
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/r/${referralCode}`)}
                          className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold mb-4">Marketing Materials</h3>
                      <div className="space-y-3">
                        <button className="w-full text-left p-3 bg-white rounded-xl hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Social Media Graphics</span>
                            <span className="text-purple-600">Download</span>
                          </div>
                        </button>
                        <button className="w-full text-left p-3 bg-white rounded-xl hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Email Templates</span>
                            <span className="text-purple-600">Download</span>
                          </div>
                        </button>
                        <button className="w-full text-left p-3 bg-white rounded-xl hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Course Information Sheets</span>
                            <span className="text-purple-600">Download</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold mb-4">Tips for Success</h3>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Share your personal learning experience</li>
                        <li>• Target students interested in tech careers</li>
                        <li>• Use social media and campus networks</li>
                        <li>• Follow up with potential referrals</li>
                        <li>• Highlight course benefits and outcomes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Referral Analytics</h2>
                
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Link Clicks</span>
                        <span className="font-semibold">245</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Registrations</span>
                        <span className="font-semibold">89</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '36%' }}></div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>First Purchase</span>
                        <span className="font-semibold">34</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '14%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Top Performing Channels</h3>
                    <div className="space-y-4">
                      {[
                        { channel: 'WhatsApp', referrals: 15, percentage: 45 },
                        { channel: 'Instagram', referrals: 12, percentage: 36 },
                        { channel: 'LinkedIn', referrals: 4, percentage: 12 },
                        { channel: 'Direct Link', referrals: 3, percentage: 9 }
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{item.channel}</p>
                            <p className="text-sm text-gray-600">{item.referrals} referrals</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{item.percentage}%</p>
                            <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-purple-600 h-2 rounded-full" 
                                style={{ width: `${item.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}