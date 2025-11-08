'use client';

import { useState, useEffect } from 'react';
import { RealTimeWallet } from './RealTimeWallet';
import { RealTimeAnalytics } from './RealTimeAnalytics';
import { RealTimeNotifications } from './RealTimeNotifications';

interface ReferralStats {
  totalReferrals: number;
  successfulConversions: number;
  pendingReferrals: number;
  totalEarnings: number;
  currentPoints: number;
  conversionRate: number;
}

interface Referral {
  id: string;
  studentName: string;
  studentEmail: string;
  registrationDate: Date;
  status: 'pending' | 'converted' | 'inactive';
  pointsEarned: number;
  coursePurchased?: string;
}

interface PayoutRequest {
  id: string;
  amount: number;
  requestDate: Date;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  processedDate?: Date;
  transactionId?: string;
}

interface AmbassadorDashboardProps {
  ambassadorId: string;
  ambassadorProfile: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    referralCode: string;
  };
}

export function AmbassadorDashboard({ ambassadorId, ambassadorProfile }: AmbassadorDashboardProps) {
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    successfulConversions: 0,
    pendingReferrals: 0,
    totalEarnings: 0,
    currentPoints: 0,
    conversionRate: 0,
  });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'payouts' | 'analytics'>('overview');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  useEffect(() => {
    fetchAmbassadorData();
  }, []);

  const fetchAmbassadorData = async () => {
    try {
      const [statsRes, referralsRes, payoutsRes] = await Promise.all([
        fetch(`/api/ambassadors/${ambassadorId}/stats`),
        fetch(`/api/ambassadors/${ambassadorId}/referrals`),
        fetch(`/api/ambassadors/${ambassadorId}/payouts`)
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || stats);
      }

      if (referralsRes.ok) {
        const referralsData = await referralsRes.json();
        setReferrals(referralsData.referrals || []);
      }

      if (payoutsRes.ok) {
        const payoutsData = await payoutsRes.json();
        setPayoutRequests(payoutsData.payouts || []);
      }
    } catch (error) {
      console.error('Error fetching ambassador data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) return;

    try {
      const response = await fetch('/api/ambassadors/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ambassadorId,
          amount: parseFloat(payoutAmount),
        }),
      });

      if (response.ok) {
        setShowPayoutModal(false);
        setPayoutAmount('');
        fetchAmbassadorData(); // Refresh data
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/r/${ambassadorProfile.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    // You could add a toast notification here
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'converted':
      case 'approved':
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const ReferralCard = ({ referral }: { referral: Referral }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{referral.studentName}</h4>
          <p className="text-sm text-gray-600">{referral.studentEmail}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(referral.status)}`}>
          {referral.status}
        </span>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Registered:</span>
          <span>{new Date(referral.registrationDate).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Points Earned:</span>
          <span className="font-medium text-secondary">{referral.pointsEarned}</span>
        </div>
        {referral.coursePurchased && (
          <div className="flex justify-between">
            <span>Course:</span>
            <span className="font-medium">{referral.coursePurchased}</span>
          </div>
        )}
      </div>
    </div>
  );

  const PayoutCard = ({ payout }: { payout: PayoutRequest }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">₹{payout.amount.toLocaleString()}</h4>
          <p className="text-sm text-gray-600">
            Requested on {new Date(payout.requestDate).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payout.status)}`}>
          {payout.status}
        </span>
      </div>
      
      {payout.processedDate && (
        <div className="text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Processed:</span>
            <span>{new Date(payout.processedDate).toLocaleDateString()}</span>
          </div>
          {payout.transactionId && (
            <div className="flex justify-between mt-1">
              <span>Transaction ID:</span>
              <span className="font-mono text-xs">{payout.transactionId}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Referrals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-info text-xl">👥</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.successfulConversions}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-secondary text-xl">✅</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-primary text-xl">📈</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalEarnings.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-accent text-xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Link</h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1 p-3 bg-gray-50 rounded-lg border">
            <code className="text-sm text-gray-700">
              {window.location.origin}/r/{ambassadorProfile.referralCode}
            </code>
          </div>
          <button
            onClick={copyReferralLink}
            className="px-4 py-2 bg-info text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Copy Link
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Share this link to earn points when students register and purchase courses
        </p>
      </div>

      {/* Wallet */}
      <RealTimeWallet 
        initialBalance={stats.currentPoints}
        showTransactions={true}
      />

      {/* Recent Referrals */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Referrals</h3>
          <button
            onClick={() => setActiveTab('referrals')}
            className="text-sm text-info hover:text-blue-800"
          >
            View All
          </button>
        </div>
        
        {referrals.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔗</span>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No referrals yet</h4>
            <p className="text-gray-600">Start sharing your referral link to earn points</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {referrals.slice(0, 6).map(referral => (
              <ReferralCard key={referral.id} referral={referral} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const ReferralsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">All Referrals</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Total: {referrals.length} | Converted: {stats.successfulConversions}
          </div>
        </div>
      </div>
      
      {referrals.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔗</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No referrals yet</h3>
          <p className="text-gray-600">Start sharing your referral link to earn points</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {referrals.map(referral => (
            <ReferralCard key={referral.id} referral={referral} />
          ))}
        </div>
      )}
    </div>
  );

  const PayoutsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Payout History</h2>
        <button
          onClick={() => setShowPayoutModal(true)}
          className="px-4 py-2 bg-info text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={stats.currentPoints < 1000} // Minimum payout threshold
        >
          Request Payout
        </button>
      </div>
      
      {payoutRequests.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💰</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payout requests</h3>
          <p className="text-gray-600 mb-4">Request your first payout when you have enough points</p>
          <p className="text-sm text-gray-500">Minimum payout: ₹1,000</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payoutRequests.map(payout => (
            <PayoutCard key={payout.id} payout={payout} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Ambassador Dashboard 🤝
              </h1>
              <p className="text-gray-600 mt-1">Welcome back, {ambassadorProfile.firstName}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <RealTimeNotifications />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'referrals', label: 'Referrals', icon: '🔗' },
            { id: 'payouts', label: 'Payouts', icon: '💰' },
            { id: 'analytics', label: 'Analytics', icon: '📈' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-info text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'referrals' && <ReferralsTab />}
            {activeTab === 'payouts' && <PayoutsTab />}
            {activeTab === 'analytics' && (
              <RealTimeAnalytics userRole="ambassador" />
            )}
          </>
        )}
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Payout</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Available Points: {stats.currentPoints.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Current Value: ₹{(stats.currentPoints * 0.1).toLocaleString()} {/* Assuming 1 point = ₹0.1 */}
              </p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payout Amount (₹)
              </label>
              <input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="Enter amount"
                min="1000"
                max={stats.currentPoints * 0.1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum payout: ₹1,000
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestPayout}
                className="flex-1 px-4 py-2 bg-info text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={!payoutAmount || parseFloat(payoutAmount) < 1000}
              >
                Request Payout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
