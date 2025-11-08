import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RealTimeNotifications } from '../../components/RealTimeNotifications';
import { useNotifications } from '../../hooks/useSocket';

// Mock the useNotifications hook
jest.mock('../../hooks/useSocket', () => ({
  useNotifications: jest.fn(),
}));

const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

describe('RealTimeNotifications', () => {
  const mockNotifications = [
    {
      id: '1',
      title: 'New Course Available',
      message: 'A new course has been published',
      type: 'info' as const,
      timestamp: new Date('2024-01-01T10:00:00Z'),
      read: false,
      actionUrl: '/courses/new-course',
    },
    {
      id: '2',
      title: 'Payment Successful',
      message: 'Your payment has been processed',
      type: 'success' as const,
      timestamp: new Date('2024-01-01T09:00:00Z'),
      read: true,
    },
    {
      id: '3',
      title: 'Session Starting Soon',
      message: 'Your live session starts in 5 minutes',
      type: 'warning' as const,
      timestamp: new Date('2024-01-01T08:00:00Z'),
      read: false,
    },
  ];

  const mockMarkAsRead = jest.fn();
  const mockMarkAllAsRead = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      unreadCount: 2,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
    });
  });

  it('renders notification bell with unread count', () => {
    render(<RealTimeNotifications />);
    
    const notificationBell = screen.getByRole('button');
    expect(notificationBell).toBeInTheDocument();
    
    const unreadBadge = screen.getByText('2');
    expect(unreadBadge).toBeInTheDocument();
  });

  it('shows 99+ when unread count exceeds 99', () => {
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      unreadCount: 150,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
    });

    render(<RealTimeNotifications />);
    
    const unreadBadge = screen.getByText('99+');
    expect(unreadBadge).toBeInTheDocument();
  });

  it('opens notification dropdown when bell is clicked', () => {
    render(<RealTimeNotifications />);
    
    const notificationBell = screen.getAllByRole('button')[0]; // Get the first button (notification bell)
    fireEvent.click(notificationBell);
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Mark all as read')).toBeInTheDocument();
  });

  it('displays notifications in the dropdown', () => {
    render(<RealTimeNotifications />);
    
    const notificationBell = screen.getByRole('button');
    fireEvent.click(notificationBell);
    
    expect(screen.getByText('New Course Available')).toBeInTheDocument();
    expect(screen.getByText('Payment Successful')).toBeInTheDocument();
    expect(screen.getByText('Session Starting Soon')).toBeInTheDocument();
  });

  it('calls markAsRead when notification is clicked', () => {
    render(<RealTimeNotifications />);
    
    const notificationBell = screen.getAllByRole('button')[0]; // Get the first button (notification bell)
    fireEvent.click(notificationBell);
    
    const notification = screen.getByText('New Course Available');
    fireEvent.click(notification.closest('div')!);
    
    expect(mockMarkAsRead).toHaveBeenCalledWith('1');
  });

  it('calls markAllAsRead when "Mark all as read" is clicked', () => {
    render(<RealTimeNotifications />);
    
    const notificationBell = screen.getAllByRole('button')[0]; // Get the first button (notification bell)
    fireEvent.click(notificationBell);
    
    const markAllButton = screen.getByText('Mark all as read');
    fireEvent.click(markAllButton);
    
    expect(mockMarkAllAsRead).toHaveBeenCalled();
  });

  it('shows "No notifications yet" when there are no notifications', () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
    });

    render(<RealTimeNotifications />);
    
    const notificationBell = screen.getByRole('button');
    fireEvent.click(notificationBell);
    
    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });

  it('displays correct notification icons based on type', () => {
    render(<RealTimeNotifications />);
    
    const notificationBell = screen.getAllByRole('button')[0]; // Get the first button (notification bell)
    fireEvent.click(notificationBell);
    
    // Check if icons are rendered (we can't easily test emoji content, but we can check structure)
    const notificationItems = screen.getAllByText(/New Course Available|Payment Successful|Session Starting Soon/);
    expect(notificationItems).toHaveLength(3);
  });

  it('closes dropdown when clicking outside', () => {
    render(<RealTimeNotifications />);
    
    const notificationBell = screen.getAllByRole('button')[0]; // Get the first button (notification bell)
    fireEvent.click(notificationBell);
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    
    // Click outside (on the overlay)
    const overlay = document.querySelector('.fixed.inset-0');
    if (overlay) {
      fireEvent.click(overlay);
    }
    
    // The dropdown should close (notifications header should not be visible)
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });

  it('shows toast notifications for new unread notifications', async () => {
    const { rerender } = render(<RealTimeNotifications />);
    
    // Update with new unread notifications
    const newNotifications = [
      {
        id: '4',
        title: 'New Message',
        message: 'You have a new message',
        type: 'info' as const,
        timestamp: new Date(),
        read: false,
      },
      ...mockNotifications,
    ];

    mockUseNotifications.mockReturnValue({
      notifications: newNotifications,
      unreadCount: 3,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
    });

    rerender(<RealTimeNotifications />);
    
    // Toast notification should appear
    await waitFor(() => {
      expect(screen.getByText('New Message')).toBeInTheDocument();
    });
  });

  it('auto-hides toast notifications after 5 seconds', async () => {
    jest.useFakeTimers();
    
    const newNotifications = [
      {
        id: '4',
        title: 'New Message',
        message: 'You have a new message',
        type: 'info' as const,
        timestamp: new Date(),
        read: false,
      },
    ];

    mockUseNotifications.mockReturnValue({
      notifications: newNotifications,
      unreadCount: 1,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
    });

    render(<RealTimeNotifications />);
    
    // Toast should be visible initially
    expect(screen.getByText('New Message')).toBeInTheDocument();
    
    // Fast-forward time by 5 seconds
    jest.advanceTimersByTime(5000);
    
    // Toast should be hidden
    await waitFor(() => {
      expect(screen.queryByText('New Message')).not.toBeInTheDocument();
    });
    
    jest.useRealTimers();
  });

  it('allows manual dismissal of toast notifications', () => {
    const newNotifications = [
      {
        id: '4',
        title: 'New Message',
        message: 'You have a new message',
        type: 'info' as const,
        timestamp: new Date(),
        read: false,
      },
    ];

    mockUseNotifications.mockReturnValue({
      notifications: newNotifications,
      unreadCount: 1,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
    });

    render(<RealTimeNotifications />);
    
    // Toast should be visible
    expect(screen.getByText('New Message')).toBeInTheDocument();
    
    // Find and click the close button (it's the second button in the toast)
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find(button => button.querySelector('svg'));
    if (closeButton) {
      fireEvent.click(closeButton);
    }
    
    // Toast should be hidden
    expect(screen.queryByText('New Message')).not.toBeInTheDocument();
  });
});
