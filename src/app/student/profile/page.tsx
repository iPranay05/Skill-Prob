'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface StudentProfile {
  id: string;
  email: string;
  profile?: {
    firstName?: string;
    lastName?: string;
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', 'avatar');

      const response = await fetch('/api/upload/profile-photo', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const data = await response.json();
      
      // Update form data with new avatar URL
      setFormData({
        ...formData,
        profile: {
          ...formData.profile,
          avatar: data.url
        }
      });

      // If not in editing mode, save immediately
      if (!editing) {
        const updateResponse = await fetch('/api/student/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            profile: {
              ...formData.profile,
              avatar: data.url
            }
          }),
        });

        if (updateResponse.ok) {
          const updatedData = await updateResponse.json();
          setProfile(updatedData.profile);
        }
      }

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#3a8ebe' }}></div>
          <p className="mt-4" style={{ color: '#666' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#181c31' }}>Error Loading Profile</h2>
          <p className="mb-4" style={{ color: '#666' }}>{error || 'Profile not found'}</p>
          <button
            onClick={fetchProfile}
            className="text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#181c31' }}>My Profile</h1>
              <p className="mt-2" style={{ color: '#666' }}>Manage your profile and career information</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/student/careers"
                className="px-4 py-2 rounded-xl font-medium transition-colors border-2"
                style={{ color: '#181c31', borderColor: '#3a8ebe' }}
              >
                Browse Jobs
              </Link>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-xl font-medium transition-colors"
                    style={{ backgroundColor: 'rgba(102, 102, 102, 0.1)', color: '#666' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}
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
            <div className="bg-white rounded-2xl shadow-lg p-6" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#181c31' }}>Basic Information</h2>

              {/* Profile Photo Section */}
              <div className="flex items-center space-x-6 mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)' }}>
                    {formData.profile?.avatar ? (
                      <img
                        src={formData.profile.avatar}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12" style={{ color: '#3a8ebe' }} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#181c31' }}>
                    Profile Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border-2 rounded-xl font-medium transition-colors hover:shadow-md disabled:opacity-50"
                    style={{ borderColor: '#3a8ebe', color: '#3a8ebe' }}
                  >
                    {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                  </label>
                  <p className="text-xs mt-1" style={{ color: '#666' }}>
                    JPG, PNG up to 5MB
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#181c31' }}>First Name</label>
                  <input
                    type="text"
                    value={formData.profile?.firstName || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, firstName: e.target.value }
                    })}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ borderColor: 'rgba(58, 142, 190, 0.3)', '--tw-ring-color': '#3a8ebe' } as any}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#181c31' }}>Last Name</label>
                  <input
                    type="text"
                    value={formData.profile?.lastName || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, lastName: e.target.value }
                    })}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ borderColor: 'rgba(58, 142, 190, 0.3)', '--tw-ring-color': '#3a8ebe' } as any}
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1" style={{ color: '#181c31' }}>Bio</label>
                <textarea
                  rows={4}
                  value={formData.profile?.bio || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    profile: { ...formData.profile, bio: e.target.value }
                  })}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                  style={{ borderColor: 'rgba(58, 142, 190, 0.3)', '--tw-ring-color': '#3a8ebe' } as any}
                />
              </div>
            </div>

            {/* Professional Links */}
            <div className="bg-white rounded-2xl shadow-lg p-6" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#181c31' }}>Professional Links</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#181c31' }}>Resume URL</label>
                  <input
                    type="url"
                    value={formData.profile?.resume_url || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, resume_url: e.target.value }
                    })}
                    placeholder="https://example.com/resume.pdf"
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ borderColor: 'rgba(58, 142, 190, 0.3)', '--tw-ring-color': '#3a8ebe' } as any}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#181c31' }}>Portfolio URL</label>
                  <input
                    type="url"
                    value={formData.profile?.portfolio_url || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, portfolio_url: e.target.value }
                    })}
                    placeholder="https://example.com/portfolio"
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ borderColor: 'rgba(58, 142, 190, 0.3)', '--tw-ring-color': '#3a8ebe' } as any}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#181c31' }}>LinkedIn URL</label>
                  <input
                    type="url"
                    value={formData.profile?.linkedin_url || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, linkedin_url: e.target.value }
                    })}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ borderColor: 'rgba(58, 142, 190, 0.3)', '--tw-ring-color': '#3a8ebe' } as any}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#181c31' }}>GitHub URL</label>
                  <input
                    type="url"
                    value={formData.profile?.github_url || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      profile: { ...formData.profile, github_url: e.target.value }
                    })}
                    placeholder="https://github.com/username"
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ borderColor: 'rgba(58, 142, 190, 0.3)', '--tw-ring-color': '#3a8ebe' } as any}
                  />
                </div>
              </div>
            </div>

            {/* Skills Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#181c31' }}>Skills</h2>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a skill (e.g., JavaScript, React, Python)"
                    className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ borderColor: 'rgba(58, 142, 190, 0.3)', '--tw-ring-color': '#3a8ebe' } as any}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        if (input.value.trim()) {
                          const currentSkills = formData.profile?.skills || [];
                          if (!currentSkills.includes(input.value.trim())) {
                            setFormData({
                              ...formData,
                              profile: {
                                ...formData.profile,
                                skills: [...currentSkills, input.value.trim()]
                              }
                            });
                          }
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                      if (input.value.trim()) {
                        const currentSkills = formData.profile?.skills || [];
                        if (!currentSkills.includes(input.value.trim())) {
                          setFormData({
                            ...formData,
                            profile: {
                              ...formData.profile,
                              skills: [...currentSkills, input.value.trim()]
                            }
                          });
                        }
                        input.value = '';
                      }
                    }}
                    className="text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                    style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(formData.profile?.skills || []).map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                      style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)', color: '#3a8ebe' }}
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:bg-red-100 rounded-full p-1 transition-colors"
                        style={{ color: '#666' }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </form>
        ) : (
          /* View Mode */
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#181c31' }}>Basic Information</h2>

              {/* Profile Photo Section */}
              <div className="flex items-center space-x-6 mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)' }}>
                    {profile.profile?.avatar ? (
                      <img
                        src={profile.profile.avatar}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12" style={{ color: '#3a8ebe' }} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: '#181c31' }}>
                    {profile.profile?.firstName || 'Not set'} {profile.profile?.lastName || ''}
                  </h3>
                  <p style={{ color: '#666' }}>{profile.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#666' }}>Name</label>
                  <p style={{ color: '#181c31' }}>
                    {profile.profile?.firstName || 'Not set'} {profile.profile?.lastName || ''}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#666' }}>Email</label>
                  <p style={{ color: '#181c31' }}>{profile.email}</p>
                </div>
              </div>

              {profile.profile?.bio && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#666' }}>Bio</label>
                  <p style={{ color: '#181c31' }} className="whitespace-pre-wrap">{profile.profile.bio}</p>
                </div>
              )}
            </div>

            {/* Professional Links */}
            <div className="bg-white rounded-2xl shadow-lg p-6" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#181c31' }}>Professional Links</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.profile?.resume_url && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#666' }}>Resume</label>
                    <a
                      href={profile.profile.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:underline"
                      style={{ color: '#3a8ebe' }}
                    >
                      📄 View Resume
                    </a>
                  </div>
                )}

                {profile.profile?.portfolio_url && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#666' }}>Portfolio</label>
                    <a
                      href={profile.profile.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:underline"
                      style={{ color: '#3a8ebe' }}
                    >
                      🔗 View Portfolio
                    </a>
                  </div>
                )}

                {profile.profile?.linkedin_url && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#666' }}>LinkedIn</label>
                    <a
                      href={profile.profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:underline"
                      style={{ color: '#3a8ebe' }}
                    >
                      💼 View LinkedIn Profile
                    </a>
                  </div>
                )}

                {profile.profile?.github_url && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#666' }}>GitHub</label>
                    <a
                      href={profile.profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:underline"
                      style={{ color: '#3a8ebe' }}
                    >
                      💻 View GitHub Profile
                    </a>
                  </div>
                )}
              </div>

              {!profile.profile?.resume_url && !profile.profile?.portfolio_url && !profile.profile?.linkedin_url && !profile.profile?.github_url && (
                <p style={{ color: '#666' }} className="italic">No professional links added yet.</p>
              )}
            </div>

            {/* Skills */}
            {profile.profile?.skills && profile.profile.skills.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#181c31' }}>Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ backgroundColor: 'rgba(58, 142, 190, 0.1)', color: '#3a8ebe' }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {profile.profile?.education && profile.profile.education.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6" style={{ border: '1px solid rgba(58, 142, 190, 0.1)' }}>
                <h2 className="text-xl font-semibold mb-4" style={{ color: '#181c31' }}>Education</h2>
                <div className="space-y-4">
                  {profile.profile.education.map((edu, index) => (
                    <div key={index} className="border-l-4 pl-4" style={{ borderColor: '#3a8ebe' }}>
                      <h3 className="font-medium" style={{ color: '#181c31' }}>{edu.degree}</h3>
                      <p style={{ color: '#666' }}>{edu.institution}</p>
                      <p className="text-sm" style={{ color: '#666' }}>{edu.year}</p>
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