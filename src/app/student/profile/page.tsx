'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface StudentProfile {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
    education?: Array<{
      institution: string;
      degree: string;
      year: number;
    }>;
    skills?: string[];
    resume_url?: string;
    portfolio_url?: string;
    linkedin_url?: string;
    github_url?: string;
  };
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<StudentProfile>>({});
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/profile');
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data.profile);
      setFormData(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      setProfile(data.profile);
      setEditing(false);
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile || {});
    setEditing(false);
  };

  const addEducation = () => {
    const currentEducation = formData.profile?.education || [];
    setFormData({
      ...formData,
      profile: {
        ...formData.profile,
        education: [...currentEducation, { institution: '', degree: '', year: new Date().getFullYear() }]
      }
    });
  };

  const removeEducation = (index: number) => {
    const currentEducation = formData.profile?.education || [];
    setFormData({
      ...formData,
      profile: {
        ...formData.profile,
        education: currentEducation.filter((_, i) => i !== index)
      }
    });
  };

  const addSkill = (skill: string) => {
    if (!skill.trim()) return;
    const currentSkills = formData.profile?.skills || [];
    if (!currentSkills.includes(skill.trim())) {
      setFormData({
        ...formData,
        profile: {
          ...formData.profile,
          skills: [...currentSkills, skill.trim()]
        }
      });
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = formData.profile?.skills || [];
    setFormData({
      ...formData,
      profile: {
        ...formData.profile,
        skills: currentSkills.filter(skill => skill !== skillToRemove)
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-4">{error || 'Profile not found'}</p>
          <button
            onClick={fetchProfile}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="mt-2 text-gray-600">Manage your profile and career information</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/student/careers"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Browse Jobs
              </Link>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {editing ? (
          /* Edit Form */
          <form onSubmit={handleSave} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.profile?.firstName || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, firstName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.profile?.lastName || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, lastName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={formData.profile?.bio || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    profile: { ...formData.profile, bio: e.target.value }
                  })}
                  placeholder="Tell us about yourself..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Professional Links */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Links</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resume URL</label>
                  <input
                    type="url"
                    value={formData.profile?.resume_url || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, resume_url: e.target.value }
                    })}
                    placeholder="https://example.com/resume.pdf"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio URL</label>
                  <input
                    type="url"
                    value={formData.profile?.portfolio_url || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, portfolio_url: e.target.value }
                    })}
                    placeholder="https://example.com/portfolio"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={formData.profile?.linkedin_url || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, linkedin_url: e.target.value }
                    })}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
                  <input
                    type="url"
                    value={formData.profile?.github_url || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, github_url: e.target.value }
                    })}
                    placeholder="https://github.com/username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </form>
        ) : (
          /* View Mode */
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900">
                    {profile.profile.firstName} {profile.profile.lastName}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{profile.email}</p>
                </div>
              </div>

              {profile.profile.bio && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{profile.profile.bio}</p>
                </div>
              )}
            </div>

            {/* Professional Links */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Links</h2>
              
              <div className="space-y-3">
                {profile.profile.resume_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
                    <a
                      href={profile.profile.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
                    >
                      📄 View Resume
                    </a>
                  </div>
                )}

                {profile.profile.portfolio_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio</label>
                    <a
                      href={profile.profile.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
                    >
                      🔗 View Portfolio
                    </a>
                  </div>
                )}

                {profile.profile.linkedin_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                    <a
                      href={profile.profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
                    >
                      💼 View LinkedIn Profile
                    </a>
                  </div>
                )}

                {profile.profile.github_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                    <a
                      href={profile.profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
                    >
                      💻 View GitHub Profile
                    </a>
                  </div>
                )}

                {!profile.profile.resume_url && !profile.profile.portfolio_url && !profile.profile.linkedin_url && !profile.profile.github_url && (
                  <p className="text-gray-500 italic">No professional links added yet.</p>
                )}
              </div>
            </div>

            {/* Skills */}
            {profile.profile.skills && profile.profile.skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {profile.profile.education && profile.profile.education.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Education</h2>
                <div className="space-y-4">
                  {profile.profile.education.map((edu, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-medium text-gray-900">{edu.degree}</h3>
                      <p className="text-gray-600">{edu.institution}</p>
                      <p className="text-sm text-gray-500">{edu.year}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}