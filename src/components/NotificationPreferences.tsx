'use client';

import { useState, useEffect } from 'react';
import { UserNotificationPreferences, NotificationChannel } from '@/lib/notifications';

interface NotificationPreferencesProps {
  token: string;
}

export default function NotificationPreferences({ token }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notification types with descriptions
  const notificationTypes = [
    {
      key: 'course_updates',
      label: 'Course Updates',
      description: 'New content, announcements, and course changes'
    },
    {
      key: 'enrollment_confirmations',
      label: 'Enrollment Confirmations',
      description: 'Course enrollment and payment confirmations'
    },
    {
      key: 'payment_notifications',
      label: 'Payment Notifications',
      description: 'Payment receipts, refunds, and billing updates'
    },
    {
      key: 'live_session_reminders',
      label: 'Live Session Reminders',
      description: 'Upcoming live classes and session notifications'
    },
    {
      key: 'ambassador_updates',
      label: 'Ambassador Updates',
      description: 'Referral earnings, payouts, and ambassador program updates'
    },
    {
      key: 'job_applications',
      label: 'Job Applications',
      description: 'Application status updates and new job opportunities'
    },
    {
      key: 'system_announcements',
      label: 'System Announcements',
      description: 'Platform updates, maintenance, and important notices'
    }
  ];

  const channels: { key: NotificationChannel; label: string; icon: string }[] = [
    { key: 'email', label: 'Email', icon: '📧' },
    { key: 'sms', label: 'SMS', icon: '📱' },
    { key: 'push', label: 'Push', icon: '🔔' },
    { key: 'in_app', label: 'In-App', icon: '💬' }
  ];

  // Fetch preferences
  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setPreferences(result.data);
      } else {
        setMessage({ type: 'error', text: 'Failed to load preferences' });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setMessage({ type: 'error', text: 'Failed to load preferences' });
    } finally {
      setLoading(false);
    }
  };

  // Save preferences
  const savePreferences = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Preferences saved successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save preferences' });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  // Update global channel preference
  const updateChannelPreference = (channel: NotificationChannel, enabled: boolean) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      [`${channel}_enabled`]: enabled
    } as UserNotificationPreferences);
  };

  // Update specific notification type preference
  const updateTypePreference = (type: string, channel: NotificationChannel, enabled: boolean) => {
    if (!preferences) return;

    const updatedPreferences = {
      ...preferences,
      preferences: {
        ...preferences.preferences,
        [type]: {
          ...preferences.preferences[type],
          [channel]: enabled
        }
      }
    };

    setPreferences(updatedPreferences);
  };

  // Update quiet hours
  const updateQuietHours = (field: string, value: any) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      [field]: value
    } as UserNotificationPreferences);
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Failed to load notification preferences</p>
        <button
          onClick={fetchPreferences}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
          <p className="text-gray-600 mt-2">
            Manage how and when you receive notifications from Skill Probe LMS
          </p>
        </div>

        {message && (
          <div className={`p-4 border-b border-gray-200 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="p-6">
          {/* Global Channel Settings */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Global Channel Settings</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {channels.map((channel) => (
                <div key={channel.key} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={`global-${channel.key}`}
                    checked={preferences[`${channel.key}_enabled` as keyof UserNotificationPreferences] as boolean}
                    onChange={(e) => updateChannelPreference(channel.key, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`global-${channel.key}`} className="flex items-center space-x-2">
                    <span>{channel.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{channel.label}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Notification Type Settings */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Types</h3>
            <div className="space-y-6">
              {notificationTypes.map((type) => (
                <div key={type.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-3">
                    <h4 className="text-md font-medium text-gray-900">{type.label}</h4>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {channels.map((channel) => (
                      <div key={channel.key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`${type.key}-${channel.key}`}
                          checked={preferences.preferences[type.key]?.[channel.key] || false}
                          onChange={(e) => updateTypePreference(type.key, channel.key, e.target.checked)}
                          disabled={!(preferences[`${channel.key}_enabled` as keyof UserNotificationPreferences] as boolean)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <label
                          htmlFor={`${type.key}-${channel.key}`}
                          className={`text-sm ${
                            preferences[`${channel.key}_enabled` as keyof UserNotificationPreferences]
                              ? 'text-gray-700'
                              : 'text-gray-400'
                          }`}
                        >
                          {channel.icon} {channel.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiet Hours</h3>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  id="quiet-hours-enabled"
                  checked={preferences.quiet_hours_enabled}
                  onChange={(e) => updateQuietHours('quiet_hours_enabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="quiet-hours-enabled" className="text-sm font-medium text-gray-700">
                  Enable quiet hours (no SMS or email notifications during this time)
                </label>
              </div>

              {preferences.quiet_hours_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={preferences.quiet_hours_start}
                      onChange={(e) => updateQuietHours('quiet_hours_start', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={preferences.quiet_hours_end}
                      onChange={(e) => updateQuietHours('quiet_hours_end', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <select
                      value={preferences.timezone}
                      onChange={(e) => updateQuietHours('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={savePreferences}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}