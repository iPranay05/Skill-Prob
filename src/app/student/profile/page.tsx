'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/clientAuth';

interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
  };
  verification: {
    emailVerified: boolean;
    phoneVerified: boolean;
  };
  createdAt: string;
}

export default function StudentProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: ''
  });

  useEffect(() => {
    checkAuth();
    fetchProfile();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/auth/login');
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(result.data);
        setFormData({
          firstName: result.data.profile.firstName || '',
          lastName: result.data.profile.lastName || '',
          phone: result.data.phone || '',
          bio: result.data.profile.bio || ''
        });
      } else {
        console.error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          phone: formData.phone,
          profile: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            bio: formData.bio
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(result.data);
        setEditing(false);
      } else {
        console.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#5e17eb]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Profile</h1>
          <p className="text-gray-600 mb-4">Failed to fetch profile</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#5e17eb] text-white px-4 py-2 rounded-lg hover:bg-[#4a12c4] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">Manage your account information and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
              <button
                onClick={() => editing ? updateProfile() : setEditing(true)}
                className="bg-[#5e17eb] text-white px-4 py-2 rounded-lg hover:bg-[#4a12c4] transition-colors"
              >
                {editing ? 'Save Changes' : 'Edit Profile'}
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Avatar Section */}
              <div className="md:col-span-2 flex items-center space-x-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-2xl font-semibold">
                  {profile.profile.firstName?.[0]}{profile.profile.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {profile.profile.firstName} {profile.profile.lastName}
                  </h3>
                  <p className="text-gray-500">{profile.email}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profile.verification.emailVerified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {profile.verification.emailVerified ? 'Email Verified' : 'Email Not Verified'}
                    </span>
                    {profile.phone && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profile.verification.phoneVerified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {profile.verification.phoneVerified ? 'Phone Verified' : 'Phone Not Verified'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5e17eb] focus:border-[#5e17eb]"
                  />
                ) : (
                  <p className="text-gray-900">{profile.profile.firstName || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5e17eb] focus:border-[#5e17eb]"
                  />
                ) : (
                  <p className="text-gray-900">{profile.profile.lastName || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <p className="text-gray-900">{profile.email}</p>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5e17eb] focus:border-[#5e17eb]"
                  />
                ) : (
                  <p className="text-gray-900">{profile.phone || 'Not provided'}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                {editing ? (
                  <textarea
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5e17eb] focus:border-[#5e17eb]"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-gray-900">{profile.profile.bio || 'No bio provided'}</p>
                )}
              </div>
            </div>

            {editing && (
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      firstName: profile.profile.firstName || '',
                      lastName: profile.profile.lastName || '',
                      phone: profile.phone || '',
                      bio: profile.profile.bio || ''
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateProfile}
                  className="px-4 py-2 bg-[#5e17eb] text-white rounded-md hover:bg-[#4a12c4] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                <p className="text-gray-900 capitalize">{user?.role || 'Student'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Since
                </label>
                <p className="text-gray-900">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}