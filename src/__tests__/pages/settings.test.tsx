import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsPage from '../../app/settings/page';

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the auth function
jest.mock('../../lib/clientAuth', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({
    id: '1',
    email: 'test@example.com',
    role: 'student'
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('SettingsPage', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should render loading state initially', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Loading settings...')).toBeInTheDocument();
  });

  it('should handle undefined settings gracefully', async () => {
    // Mock fetch to return empty settings
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {} // Empty settings object
      }),
    });

    render(<SettingsPage />);
    
    // Wait for loading to complete
    await screen.findByText('Settings');
    
    // Should not throw errors and should render with default values
    expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });

  it('should handle partial settings data', async () => {
    // Mock fetch to return partial settings
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          notifications: {
            email: true
            // Missing other notification properties
          }
          // Missing privacy and preferences
        }
      }),
    });

    render(<SettingsPage />);
    
    // Wait for loading to complete
    await screen.findByText('Settings');
    
    // Should not throw errors and should render with merged default values
    expect(screen.getByText('Email Notifications')).toBeInTheDocument();
    expect(screen.getByText('Profile Visibility')).toBeInTheDocument();
  });
});
