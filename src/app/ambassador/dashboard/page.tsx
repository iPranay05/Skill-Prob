'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AmbassadorDashboardData {
  ambassador: {
    id: string;
    referralCode: string;
    status: string;
    performance: {
      totalReferrals: number;
      successfulConversions: number;
      totalEarnings: number;
      currentPoints: number;
      lifetimePoints: number;
      kycVerified?: boolean;
      kycStatus?: string;
    };
    createdAt: string;
  };
  analytics: {
    totalReferrals: number;
    convertedReferrals: number;
    conversionRate: number;
    totalEarnings: number;
    monthlyReferrals: number;
    currentPoints: number;
    availableForPayout: number;
    lifetimeEarnings: number;
    weeklyReferrals: number[];
    monthlyEarnings: number[];
    conversionsByType: { [key: string]: number };
    topPerformingChannels: Array<{ channel: string; referrals: number; conversions: number }>;
    averageOrderValue: number;
    retentionRate: number;
  };
  wallet: {
    id: string;
    balance: {
      points: number;
      credits: number;
      currency: string;
    };
    totalEarned: number;
    totalWithdrawn: number;
  } | null;
  recentReferrals: Array<{
    id: string;
    studentEmail: string;
    registrationDate: string;
    status: string;
    conversionEvents: Array<{
      type: string;
      date: string;
      value: number;
      pointsEarned: number;
    }>;
    sourceChannel?: string;
  }>;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    points: number;
    description: string;
    createdAt: string;
  }>;
  payoutRequests: Array<{
    id: string;
    amount: number;
    pointsRedeemed: number;
    status: string;
    requestedAt: string;
    processedAt?: string;
  }>;
  invitations: Array<{
    id: string;
    email: string;
    status: 'sent' | 'accepted' | 'expired';
    sentAt: string;
    acceptedAt?: string;
  }>;
  resources: Array<{
    id: string;
    title: string;
    type: 'banner' | 'social_post' | 'email_template' | 'video' | 'guide';
    url: string;
    description: string;
    downloadCount: number;
    createdAt: string;
  }>;
}

interface InvitationForm {
  emails: string;
  message: string;
}

export default function AmbassadorDashboard() {
  const [dashboardData, setDashboardData] = useState<AmbassadorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'invitations' | 'resources'>('overview');
  const [invitationForm, setInvitationForm] = useState<InvitationForm>({ emails: '', message: '' });
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/ambassadors/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      setDashboardData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutRequest = async () => {
    if (!payoutAmount || parseInt(payoutAmount) < 100) {
      alert('Minimum payout is 100 points');
      return;
    }

    setPayoutLoading(true);
    try {
      const response = await fetch('/api/ambassadors/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          pointsToRedeem: parseInt(payoutAmount),
          conversionRate: 1 // 1 point = 1 INR
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Payout request failed');
      }

      alert('Payout request submitted successfully!');
      setPayoutAmount('');
      fetchDashboardData(); // Refresh data
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Payout request failed');
    } finally {
      setPayoutLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (dashboardData?.ambassador.referralCode) {
      const referralLink = `${window.location.origin}/r/${dashboardData.ambassador.referralCode}`;
      navigator.clipboard.writeText(referralLink);
      alert('Referral link copied to clipboard!');
    }
  };

  const handleSendInvitations = async () => {
    if (!invitationForm.emails.trim()) {
      alert('Please enter at least one email address');
      return;
    }

    setInvitationLoading(true);
    try {
      const response = await fetch('/api/ambassadors/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          emails: invitationForm.emails.split(',').map(email => email.trim()).filter(email => email),
          message: invitationForm.message
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invitations');
      }

      const result = await response.json();
      alert(`Successfully sent ${result.data.sent} invitations!`);
      setInvitationForm({ emails: '', message: '' });
      fetchDashboardData(); // Refresh data
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send invitations');
    } finally {
      setInvitationLoading(false);
    }
  };

  const handleDownloadResource = async (resourceId: string, title: string) => {
    try {
      const response = await fetch(`/api/ambassadors/resources/${resourceId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download resource');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = title;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Refresh data to update download count
      fetchDashboardData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to download resource');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No dashboard data available</p>
      </div>
    );
  }

  const { ambassador, analytics, wallet, recentReferrals, recentTransactions, payoutRequests, invitations, resources } = dashboardData;

  // Chart data preparation
  const weeklyReferralsData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Referrals',
        data: analytics.weeklyReferrals || [0, 0, 0, 0],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const monthlyEarningsData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Earnings (₹)',
        data: analytics.monthlyEarnings || [0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
    ],
  };

  const conversionTypeData = {
    labels: Object.keys(analytics.conversionsByType || {}),
    datasets: [
      {
        data: Object.values(analytics.conversionsByType || {}),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ambassador Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your performance overview.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'analytics', label: 'Analytics' },
              { key: 'invitations', label: 'Invitations' },
              { key: 'resources', label: 'Resources' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Status Alert */}
        {ambassador.status !== 'active' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Account Status: {ambassador.status.charAt(0).toUpperCase() + ambassador.status.slice(1)}
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {ambassador.status === 'pending' && 'Your application is under review.'}
                  {ambassador.status === 'suspended' && 'Your account has been suspended. Contact support for assistance.'}
                  {ambassador.status === 'rejected' && 'Your application was not approved. You can reapply after 30 days.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KYC Status Alert */}
        {ambassador.status === 'active' && (
          <div className="mb-6">
            {!wallet || !wallet.balance || wallet.balance.points < 100 ? null : (
              <>
                {/* Show KYC status only if user has points to withdraw */}
                {(!ambassador.performance?.kycVerified && !ambassador.performance?.kycStatus) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">Complete KYC Verification</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            Complete your KYC verification to enable payout requests and withdraw your earnings.
                          </p>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => window.location.href = '/ambassador/kyc'}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                        >
                          Start KYC
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {ambassador.performance?.kycStatus === 'pending_verification' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">KYC Under Review</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          Your KYC verification is being reviewed. You'll be notified once it's approved.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {ambassador.performance?.kycStatus === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">KYC Rejected</h3>
                          <p className="text-sm text-red-700 mt-1">
                            Your KYC verification was rejected. Please resubmit with correct information.
                          </p>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => window.location.href = '/ambassador/kyc'}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
                        >
                          Resubmit KYC
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Referrals</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.totalReferrals}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.conversionRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Current Points</p>
                    <p className="text-2xl font-semibold text-gray-900">{wallet?.balance.points || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                    <p className="text-2xl font-semibold text-gray-900">₹{analytics.totalEarnings.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Referral Code & Payout */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Your Referral Code</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code</label>
                      <code className="bg-gray-100 px-3 py-2 rounded text-lg font-mono block w-full text-gray-900">
                        {ambassador.referralCode}
                      </code>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Referral Link</label>
                      <div className="flex items-center space-x-2">
                        <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono flex-1 truncate text-gray-900">
                          {typeof window !== 'undefined' ? `${window.location.origin}/r/${ambassador.referralCode}` : `https://skillprobe.com/r/${ambassador.referralCode}`}
                        </code>
                        <button
                          onClick={copyReferralLink}
                          className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 whitespace-nowrap"
                        >
                          Copy Link
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payout Request */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Request Payout</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Points to Redeem (Min: 100)
                      </label>
                      <input
                        type="number"
                        min="100"
                        max={wallet?.balance.points || 0}
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Enter points amount"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Available: {wallet?.balance.points || 0} points
                      </p>
                    </div>
                    <button
                      onClick={handlePayoutRequest}
                      disabled={payoutLoading || !payoutAmount || parseInt(payoutAmount) < 100}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {payoutLoading ? 'Processing...' : 'Request Payout'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="lg:col-span-2 space-y-6">
                {/* Recent Referrals */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Recent Referrals</h3>
                  </div>
                  <div className="p-6">
                    {recentReferrals.length > 0 ? (
                      <div className="space-y-4">
                        {recentReferrals.map((referral) => (
                          <div key={referral.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{referral.studentEmail}</p>
                              <p className="text-sm text-gray-500">
                                Registered: {new Date(referral.registrationDate).toLocaleDateString()}
                              </p>
                              <p className="text-sm">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${referral.status === 'converted' ? 'bg-green-100 text-green-800' :
                                    referral.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                  }`}>
                                  {referral.status}
                                </span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Conversions: {referral.conversionEvents?.length || 0}</p>
                              <p className="text-sm font-medium">
                                Points: {referral.conversionEvents?.reduce((sum, event) => sum + (event.pointsEarned || 0), 0) || 0}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No referrals yet</p>
                    )}
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
                  </div>
                  <div className="p-6">
                    {recentTransactions.length > 0 ? (
                      <div className="space-y-4">
                        {recentTransactions.map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{transaction.description}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(transaction.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium ${transaction.type.includes('bonus') || transaction.type === 'credit'
                                  ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {transaction.type.includes('bonus') || transaction.type === 'credit' ? '+' : '-'}
                                {transaction.points} points
                              </p>
                              {transaction.amount > 0 && (
                                <p className="text-sm text-gray-500">₹{transaction.amount}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No transactions yet</p>
                    )}
                  </div>
                </div>

                {/* Payout Requests */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Payout Requests</h3>
                  </div>
                  <div className="p-6">
                    {payoutRequests.length > 0 ? (
                      <div className="space-y-4">
                        {payoutRequests.map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">₹{request.amount}</p>
                              <p className="text-sm text-gray-500">
                                {request.pointsRedeemed} points • {new Date(request.requestedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${request.status === 'processed' ? 'bg-green-100 text-green-800' :
                                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    request.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                      'bg-red-100 text-red-800'
                                }`}>
                                {request.status}
                              </span>
                              {request.processedAt && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Processed: {new Date(request.processedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No payout requests yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Advanced Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
                    <p className="text-2xl font-semibold text-gray-900">₹{analytics.averageOrderValue?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Retention Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.retentionRate?.toFixed(1) || '0.0'}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">This Month</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.monthlyReferrals}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Lifetime Points</p>
                    <p className="text-2xl font-semibold text-gray-900">{ambassador.performance.lifetimePoints}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Weekly Referrals Trend */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Referrals Trend</h3>
                <div className="h-64">
                  <Line data={weeklyReferralsData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              {/* Monthly Earnings */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Earnings</h3>
                <div className="h-64">
                  <Bar data={monthlyEarningsData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              {/* Conversion Types */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Conversion Types</h3>
                <div className="h-64">
                  <Doughnut data={conversionTypeData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              {/* Top Performing Channels */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Channels</h3>
                <div className="space-y-4">
                  {analytics.topPerformingChannels?.map((channel, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{channel.channel}</p>
                        <p className="text-sm text-gray-500">{channel.referrals} referrals</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{channel.conversions} conversions</p>
                        <p className="text-sm text-gray-500">
                          {channel.referrals > 0 ? ((channel.conversions / channel.referrals) * 100).toFixed(1) : 0}% rate
                        </p>
                      </div>
                    </div>
                  )) || (
                      <p className="text-gray-500 text-center py-8">No channel data available</p>
                    )}
                </div>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{analytics.totalReferrals}</div>
                  <div className="text-sm text-gray-500">Total Referrals</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {analytics.monthlyReferrals > 0 ? '+' : ''}{analytics.monthlyReferrals} this month
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{analytics.conversionRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-500">Conversion Rate</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {analytics.conversionRate > 15 ? 'Excellent' : analytics.conversionRate > 10 ? 'Good' : 'Needs improvement'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">₹{analytics.totalEarnings.toFixed(0)}</div>
                  <div className="text-sm text-gray-500">Total Earnings</div>
                  <div className="text-xs text-gray-400 mt-1">
                    ₹{(analytics.totalEarnings / Math.max(analytics.totalReferrals, 1)).toFixed(0)} per referral
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="space-y-8">
            {/* Send Invitations */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invite New Ambassadors</h3>
              <p className="text-gray-600 mb-6">
                Grow your network by inviting others to become ambassadors. You'll earn bonus points for successful referrals.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Addresses (comma-separated)
                  </label>
                  <textarea
                    value={invitationForm.emails}
                    onChange={(e) => setInvitationForm({ ...invitationForm, emails: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
                    placeholder="email1@example.com, email2@example.com, email3@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personal Message (Optional)
                  </label>
                  <textarea
                    value={invitationForm.message}
                    onChange={(e) => setInvitationForm({ ...invitationForm, message: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
                    placeholder="Add a personal message to your invitation..."
                  />
                </div>

                <button
                  onClick={handleSendInvitations}
                  disabled={invitationLoading || !invitationForm.emails.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {invitationLoading ? 'Sending...' : 'Send Invitations'}
                </button>
              </div>
            </div>

            {/* Invitation History */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Invitation History</h3>
              </div>
              <div className="p-6">
                {invitations && invitations.length > 0 ? (
                  <div className="space-y-4">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{invitation.email}</p>
                          <p className="text-sm text-gray-500">
                            Sent: {new Date(invitation.sentAt).toLocaleDateString()}
                          </p>
                          {invitation.acceptedAt && (
                            <p className="text-sm text-green-600">
                              Accepted: {new Date(invitation.acceptedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${invitation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              invitation.status === 'expired' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                            {invitation.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No invitations sent yet</p>
                )}
              </div>
            </div>

            {/* Invitation Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Invitations Sent</p>
                    <p className="text-2xl font-semibold text-gray-900">{invitations?.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Accepted</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {invitations?.filter(inv => inv.status === 'accepted').length || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Acceptance Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {invitations && invitations.length > 0
                        ? ((invitations.filter(inv => inv.status === 'accepted').length / invitations.length) * 100).toFixed(1)
                        : '0.0'
                      }%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-8">
            {/* Resource Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">Banners & Graphics</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  High-quality banners and graphics for social media and websites
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {resources?.filter(r => r.type === 'banner').length || 0}
                </p>
                <p className="text-sm text-gray-500">Available resources</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">Social Media Posts</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Ready-to-use social media content and templates
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {resources?.filter(r => r.type === 'social_post').length || 0}
                </p>
                <p className="text-sm text-gray-500">Available resources</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">Email Templates</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Professional email templates for outreach
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {resources?.filter(r => r.type === 'email_template').length || 0}
                </p>
                <p className="text-sm text-gray-500">Available resources</p>
              </div>
            </div>

            {/* Resource Library */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Resource Library</h3>
              </div>
              <div className="p-6">
                {resources && resources.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resources.map((resource) => (
                      <div key={resource.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{resource.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${resource.type === 'banner' ? 'bg-blue-100 text-blue-800' :
                                  resource.type === 'social_post' ? 'bg-green-100 text-green-800' :
                                    resource.type === 'email_template' ? 'bg-purple-100 text-purple-800' :
                                      resource.type === 'video' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                }`}>
                                {resource.type.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-500">
                                {resource.downloadCount} downloads
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Added {new Date(resource.createdAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => handleDownloadResource(resource.id, resource.title)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No resources available</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Resources will be added by the admin team to help you promote the platform.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Usage Guidelines */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Guidelines</h3>
              <div className="prose prose-sm text-gray-600">
                <ul className="space-y-2">
                  <li>• All promotional materials must be used as-is without modifications</li>
                  <li>• Include your referral code when sharing any content</li>
                  <li>• Respect platform guidelines and avoid spam or misleading content</li>
                  <li>• Track your performance using the analytics dashboard</li>
                  <li>• Contact support if you need custom materials or have questions</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}