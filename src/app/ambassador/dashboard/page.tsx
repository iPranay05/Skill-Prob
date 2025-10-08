'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
}

export default function AmbassadorDashboard() {
  const [dashboardData, setDashboardData] = useState<AmbassadorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
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
      const referralLink = `${window.location.origin}/auth/register?ref=${dashboardData.ambassador.referralCode}`;
      navigator.clipboard.writeText(referralLink);
      alert('Referral link copied to clipboard!');
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

  const { ambassador, analytics, wallet, recentReferrals, recentTransactions, payoutRequests } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ambassador Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your performance overview.</p>
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
              <div className="flex items-center space-x-2">
                <code className="bg-gray-100 px-3 py-2 rounded text-lg font-mono flex-1">
                  {ambassador.referralCode}
                </code>
                <button
                  onClick={copyReferralLink}
                  className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                >
                  Copy Link
                </button>
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
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              referral.status === 'converted' ? 'bg-green-100 text-green-800' :
                              referral.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {referral.status}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Conversions: {referral.conversionEvents.length}</p>
                          <p className="text-sm font-medium">
                            Points: {referral.conversionEvents.reduce((sum, event) => sum + event.pointsEarned, 0)}
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
                          <p className={`font-medium ${
                            transaction.type.includes('bonus') || transaction.type === 'credit' 
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
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            request.status === 'processed' ? 'bg-green-100 text-green-800' :
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
    </div>
  );
}