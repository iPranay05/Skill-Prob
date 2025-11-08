'use client';

import { useEffect, useState } from 'react';
import { useWalletUpdates } from '../hooks/useSocket';

interface Transaction {
  id: string;
  type: 'credit' | 'debit' | 'conversion' | 'payout';
  amount: number;
  description: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
}

interface RealTimeWalletProps {
  initialBalance?: number;
  initialTransactions?: Transaction[];
  showTransactions?: boolean;
  compact?: boolean;
}

export function RealTimeWallet({ 
  initialBalance = 0, 
  initialTransactions = [], 
  showTransactions = true,
  compact = false 
}: RealTimeWalletProps) {
  const { balance, recentTransactions } = useWalletUpdates();
  const [displayBalance, setDisplayBalance] = useState(initialBalance);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [balanceAnimation, setBalanceAnimation] = useState(false);

  // Update balance with animation
  useEffect(() => {
    if (balance !== displayBalance) {
      setBalanceAnimation(true);
      setDisplayBalance(balance);
      
      const timer = setTimeout(() => {
        setBalanceAnimation(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [balance, displayBalance]);

  // Update transactions
  useEffect(() => {
    if (recentTransactions.length > 0) {
      setTransactions(prev => {
        const newTransactions = [...recentTransactions, ...prev];
        return newTransactions.slice(0, 10); // Keep only latest 10
      });
    }
  }, [recentTransactions]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return '💰';
      case 'debit':
        return '💸';
      case 'conversion':
        return '🔄';
      case 'payout':
        return '🏦';
      default:
        return '💳';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
        return 'text-secondary';
      case 'debit':
        return 'text-error';
      case 'conversion':
        return 'text-info';
      case 'payout':
        return 'text-primary';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs rounded-full';
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-secondary text-sm">💰</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Wallet Balance</p>
              <p className={`text-lg font-semibold ${balanceAnimation ? 'animate-pulse text-secondary' : 'text-gray-900'}`}>
                ₹{displayBalance.toLocaleString()}
              </p>
            </div>
          </div>
          {recentTransactions.length > 0 && (
            <div className="text-xs text-secondary bg-green-50 px-2 py-1 rounded-full">
              +{recentTransactions.length} new
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Balance Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Wallet Balance</h3>
            <p className={`text-3xl font-bold mt-2 ${balanceAnimation ? 'animate-pulse text-secondary' : 'text-gray-900'}`}>
              ₹{displayBalance.toLocaleString()}
            </p>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">💰</span>
          </div>
        </div>
        
        {balanceAnimation && (
          <div className="mt-2 text-sm text-secondary flex items-center">
            <span className="animate-bounce mr-1">📈</span>
            Balance updated!
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      {showTransactions && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">Recent Transactions</h4>
            {recentTransactions.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {recentTransactions.length} new
              </span>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">
                      {getTransactionIcon(transaction.type)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'credit' ? '+' : '-'}₹{Math.abs(transaction.amount).toLocaleString()}
                    </p>
                    <span className={getStatusBadge(transaction.status)}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {transactions.length > 0 && (
            <div className="mt-4 text-center">
              <button className="text-sm text-info hover:text-blue-800 font-medium">
                View all transactions
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}