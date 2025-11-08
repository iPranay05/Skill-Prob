'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/clientAuth';

interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
  updatedAt: string;
}

interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  rolloutPercentage: number;
}

export default function SystemConfigPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [activeTab, setActiveTab] = useState<'configs' | 'features'>('configs');
  const [systemStatus, setSystemStatus] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    fetchSystemConfigs();
    fetchFeatureFlags();
    fetchSystemStatus();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser || currentUser.role !== 'super_admin') {
        router.push('/admin/dashboard');
        return;
      }
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemConfigs = async () => {
    try {
      const response = await fetch('/api/admin/system/config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setConfigs(result.data.map((config: any) => ({
          id: config.id,
          key: config.key,
          value: config.value,
          description: config.description,
          category: config.category,
          updatedAt: config.updated_at
        })));
      } else {
        console.error('Failed to fetch system configs');
      }
    } catch (error) {
      console.error('Failed to fetch system configs:', error);
    }
  };

  const fetchFeatureFlags = async () => {
    try {
      const response = await fetch('/api/admin/system/features', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setFeatureFlags(result.data.map((flag: any) => ({
          id: flag.id,
          name: flag.name,
          enabled: flag.enabled,
          description: flag.description,
          rolloutPercentage: flag.rollout_percentage
        })));
      } else {
        console.error('Failed to fetch feature flags');
      }
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
    }
  };

  const updateConfig = async (configId: string, newValue: string) => {
    try {
      const response = await fetch('/api/admin/system/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ configId, value: newValue })
      });
      
      if (response.ok) {
        const result = await response.json();
        setConfigs(prev => prev.map(config => 
          config.id === configId 
            ? { ...config, value: newValue, updatedAt: result.data.updated_at }
            : config
        ));
      } else {
        console.error('Failed to update config');
      }
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  };

  const toggleFeatureFlag = async (flagId: string) => {
    try {
      const currentFlag = featureFlags.find(f => f.id === flagId);
      if (!currentFlag) return;

      const response = await fetch('/api/admin/system/features', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ flagId, enabled: !currentFlag.enabled })
      });
      
      if (response.ok) {
        setFeatureFlags(prev => prev.map(flag => 
          flag.id === flagId 
            ? { ...flag, enabled: !flag.enabled }
            : flag
        ));
      } else {
        console.error('Failed to toggle feature flag');
      }
    } catch (error) {
      console.error('Failed to toggle feature flag:', error);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/admin/system/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setSystemStatus(result.data);
      } else {
        console.error('Failed to fetch system status');
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  };

  const updateRolloutPercentage = async (flagId: string, percentage: number) => {
    try {
      const response = await fetch('/api/admin/system/features', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ flagId, rolloutPercentage: percentage })
      });
      
      if (response.ok) {
        setFeatureFlags(prev => prev.map(flag => 
          flag.id === flagId 
            ? { ...flag, rolloutPercentage: percentage }
            : flag
        ));
      } else {
        console.error('Failed to update rollout percentage');
      }
    } catch (error) {
      console.error('Failed to update rollout percentage:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
          <p className="mt-2 text-gray-600">Manage system settings and feature flags</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('configs')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'configs'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                System Configs
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'features'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Feature Flags
              </button>
            </nav>
          </div>
        </div>

        {/* System Configs Tab */}
        {activeTab === 'configs' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">System Configuration Settings</h2>
              <p className="text-sm text-gray-500">Manage core system parameters and limits</p>
            </div>
            <div className="divide-y divide-gray-200">
              {configs.map((config) => (
                <div key={config.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900">{config.key}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {config.category}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{config.description}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        Last updated: {new Date(config.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="text"
                        value={config.value}
                        onChange={(e) => updateConfig(config.id, e.target.value)}
                        className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Flags Tab */}
        {activeTab === 'features' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Feature Flags</h2>
              <p className="text-sm text-gray-500">Control feature rollouts and experimental functionality</p>
            </div>
            <div className="divide-y divide-gray-200">
              {featureFlags.map((flag) => (
                <div key={flag.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900">{flag.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          flag.enabled 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {flag.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{flag.description}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        Rollout: {flag.rolloutPercentage}% of users
                      </p>
                    </div>
                    <div className="ml-4 flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{flag.rolloutPercentage}%</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={flag.rolloutPercentage}
                          onChange={(e) => {
                            const newPercentage = parseInt(e.target.value);
                            updateRolloutPercentage(flag.id, newPercentage);
                          }}
                          className="w-20"
                        />
                      </div>
                      <button
                        onClick={() => toggleFeatureFlag(flag.id)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                          flag.enabled ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            flag.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Status */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">System Status</h2>
          </div>
          <div className="p-6">
            {systemStatus ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{systemStatus.uptime}</div>
                  <div className="text-sm text-gray-500">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-info">{systemStatus.avgResponseTime}</div>
                  <div className="text-sm text-gray-500">Avg Response Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{systemStatus.storageUsed}</div>
                  <div className="text-sm text-gray-500">Storage Used</div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
