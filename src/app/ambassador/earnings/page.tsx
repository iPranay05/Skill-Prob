'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface EarningsData {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  currentBalance: number;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  type: 'referral' | 'bonus' | 'payout';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  created_at: string;
}

export default function AmbassadorEarningsPage() {
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    currentBalance: 0,
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/ambassadors/earnings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEarnings(data.data);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading earnings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Earnings</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Track your referral earnings and payouts</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-gray-600">Total Earnings</p>
              <span className="text-xl sm:text-2xl">💰</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(earnings.totalEarnings)}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-gray-600">Current Balance</p>
              <span className="text-xl sm:text-2xl">💵</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary">{formatCurrency(earnings.currentBalance)}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-gray-600">Pending</p>
              <span className="text-xl sm:text-2xl">⏳</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">{formatCurrency(earnings.pendingEarnings)}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-gray-600">Paid Out</p>
              <span className="text-xl sm:text-2xl">✅</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(earnings.paidEarnings)}</p>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Transaction History</h2>
          </div>

          <div className="overflow-x-auto">
            {earnings.transactions.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {earnings.transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {formatDate(transaction.created_at)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-900">
                        {transaction.description}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'referral' ? 'bg-blue-100 text-blue-800' :
                          transaction.type === 'bonus' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl sm:text-6xl mb-4">💰</div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
                <p className="text-sm sm:text-base text-gray-600">Start referring students to earn commissions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
