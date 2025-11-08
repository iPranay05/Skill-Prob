import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RealTimeWallet } from '../../components/RealTimeWallet';
import { useWalletUpdates } from '../../hooks/useSocket';

// Mock the useWalletUpdates hook
jest.mock('../../hooks/useSocket', () => ({
  useWalletUpdates: jest.fn(),
}));

const mockUseWalletUpdates = useWalletUpdates as jest.MockedFunction<typeof useWalletUpdates>;

describe('RealTimeWallet', () => {
  const mockTransactions = [
    {
      id: '1',
      type: 'credit' as const,
      amount: 1000,
      description: 'Referral bonus',
      timestamp: new Date('2024-01-01T10:00:00Z'),
      status: 'completed' as const,
    },
    {
      id: '2',
      type: 'debit' as const,
      amount: 500,
      description: 'Course purchase',
      timestamp: new Date('2024-01-01T09:00:00Z'),
      status: 'completed' as const,
    },
    {
      id: '3',
      type: 'payout' as const,
      amount: 2000,
      description: 'Payout request',
      timestamp: new Date('2024-01-01T08:00:00Z'),
      status: 'pending' as const,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWalletUpdates.mockReturnValue({
      balance: 5000,
      recentTransactions: [],
    });
  });

  it('renders wallet balance correctly', () => {
    render(<RealTimeWallet initialBalance={5000} />);
    
    expect(screen.getByText('Wallet Balance')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '₹5,000';
    })).toBeInTheDocument();
  });

  it('renders in compact mode', () => {
    render(<RealTimeWallet initialBalance={5000} compact={true} />);
    
    expect(screen.getByText('Wallet Balance')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '₹5,000';
    })).toBeInTheDocument();
    
    // Should not show transactions section in compact mode
    expect(screen.queryByText('Recent Transactions')).not.toBeInTheDocument();
  });

  it('displays recent transactions when showTransactions is true', () => {
    render(
      <RealTimeWallet 
        initialBalance={5000} 
        initialTransactions={mockTransactions}
        showTransactions={true}
      />
    );
    
    expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
    expect(screen.getByText('Referral bonus')).toBeInTheDocument();
    expect(screen.getByText('Course purchase')).toBeInTheDocument();
    expect(screen.getByText('Payout request')).toBeInTheDocument();
  });

  it('hides transactions when showTransactions is false', () => {
    render(
      <RealTimeWallet 
        initialBalance={5000} 
        initialTransactions={mockTransactions}
        showTransactions={false}
      />
    );
    
    expect(screen.queryByText('Recent Transactions')).not.toBeInTheDocument();
  });

  it('shows "No transactions yet" when there are no transactions', () => {
    render(<RealTimeWallet initialBalance={5000} initialTransactions={[]} />);
    
    expect(screen.getByText('No transactions yet')).toBeInTheDocument();
  });

  it('displays transaction amounts with correct signs', () => {
    render(
      <RealTimeWallet 
        initialBalance={5000} 
        initialTransactions={mockTransactions}
      />
    );
    
    // Credit should show positive
    expect(screen.getByText('+₹1,000')).toBeInTheDocument();
    
    // Debit should show negative
    expect(screen.getByText('-₹500')).toBeInTheDocument();
    
    // Payout should show negative
    expect(screen.getByText('-₹2,000')).toBeInTheDocument();
  });

  it('displays transaction status badges', () => {
    render(
      <RealTimeWallet 
        initialBalance={5000} 
        initialTransactions={mockTransactions}
      />
    );
    
    expect(screen.getAllByText('completed')).toHaveLength(2);
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('updates balance when real-time updates are received', () => {
    mockUseWalletUpdates.mockReturnValue({
      balance: 7000,
      recentTransactions: [],
    });

    const { rerender } = render(<RealTimeWallet initialBalance={5000} />);
    
    // After hook returns new balance, component should update
    rerender(<RealTimeWallet initialBalance={5000} />);
    
    // Should show updated balance
    expect(screen.getByText((content, element) => {
      return element?.textContent === '₹7,000';
    })).toBeInTheDocument();
  });

  it('shows new transaction indicator when recent transactions are received', () => {
    mockUseWalletUpdates.mockReturnValue({
      balance: 5000,
      recentTransactions: [mockTransactions[0]],
    });

    render(<RealTimeWallet initialBalance={5000} compact={true} />);
    
    expect(screen.getByText('+1 new')).toBeInTheDocument();
  });

  it('formats large numbers correctly', () => {
    mockUseWalletUpdates.mockReturnValue({
      balance: 1234567,
      recentTransactions: [],
    });

    render(<RealTimeWallet initialBalance={1234567} />);
    
    // Check that the number is formatted (could be 1,234,567 or 12,34,567 depending on locale)
    expect(screen.getByText((content, element) => {
      const text = element?.textContent;
      return text === '₹1,234,567' || text === '₹12,34,567';
    })).toBeInTheDocument();
  });

  it('applies correct CSS classes for transaction types', () => {
    render(
      <RealTimeWallet 
        initialBalance={5000} 
        initialTransactions={mockTransactions}
      />
    );
    
    const creditAmount = screen.getByText('+₹1,000');
    const debitAmount = screen.getByText('-₹500');
    
    expect(creditAmount).toHaveClass('text-secondary');
    expect(debitAmount).toHaveClass('text-error');
  });

  it('applies correct CSS classes for status badges', () => {
    render(
      <RealTimeWallet 
        initialBalance={5000} 
        initialTransactions={mockTransactions}
      />
    );
    
    const completedBadges = screen.getAllByText('completed');
    const pendingBadge = screen.getByText('pending');
    
    completedBadges.forEach(badge => {
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });
    
    expect(pendingBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('shows "View all transactions" link when there are transactions', () => {
    render(
      <RealTimeWallet 
        initialBalance={5000} 
        initialTransactions={mockTransactions}
      />
    );
    
    expect(screen.getByText('View all transactions')).toBeInTheDocument();
  });

  it('limits displayed transactions to 10', () => {
    const manyTransactions = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      type: 'credit' as const,
      amount: 100,
      description: `Transaction ${i + 1}`,
      timestamp: new Date(),
      status: 'completed' as const,
    }));

    render(
      <RealTimeWallet 
        initialBalance={5000} 
        initialTransactions={manyTransactions}
      />
    );
    
    // Should only show first 10 transactions
    expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    expect(screen.getByText('Transaction 10')).toBeInTheDocument();
    expect(screen.queryByText('Transaction 11')).not.toBeInTheDocument();
  });
});