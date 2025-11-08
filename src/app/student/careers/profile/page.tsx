'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface StudentProfile {
  id?: string;
  user_id: string;
  resume_url?: string;
  portfolio_url?: string;
  skills: string[];
  experience_level: string;
  preferred_job_types: string[];
  preferred_locations: string[];
  preferred_work_modes: string[];
  salary_expectations?: {
    min: number;
    max: number;
    currency: string;
  };
  availability_date?: string;
  bio?: string;
  education: Array<{
    institution: string;
    degree: string;
    field_of_study: string;
    start_date: string;
    end_date?: string;
    grade?: string;
  }>;
  work_experience: Array<{
    company: string;
    position: string;
    start_date: string;
    end_date?: string;
    description: string;
    skills_used: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    github_url?: string;
    start_date: string;
    end_date?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issue_date: string;
    expiry_date?: string;
    credential_id?: string;
    credential_url?: string;
  }>;
  profile_completion_percentage?: number;
  is_profile_public?: boolean;
  is_available_for_hire?: boolean;
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeSection, setActiveSection] = useState('basic');
  const [resumeUploading, setResumeUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/student/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.data?.profile || {
          user_id: '',
          skills: [],
          experience_level: 'entry',
          preferred_job_types: [],
          preferred_locations: [],
          preferred_work_modes: [],
          education: [],
          work_experience: [],
          projects: [],
          certifications: [],
          is_profile_public: false,
          is_available_for_hire: true
        });
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.data.profile);
        // Show success message
      } else {
        setError('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setResumeUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'resume');

      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/upload/resume', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, resume_url: data.data.url } : null);
      } else {
        setError('Failed to upload resume');
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      setError('Failed to upload resume');
    } finally {
      setResumeUploading(false);
    }
  };

  const addEducation = () => {
    if (!profile) return;
    setProfile({
      ...profile,
      education: [
        ...profile.education,
        {
          institution: '',
          degree: '',
          field_of_study: '',
          start_date: '',
          end_date: '',
          grade: ''
        }
      ]
    });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    if (!profile) return;
    const updatedEducation = [...profile.education];
    updatedEducation[index] = { ...updatedEducation[index], [field]: value };
    setProfile({ ...profile, education: updatedEducation });
  };

  const removeEducation = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      education: profile.education.filter((_, i) => i !== index)
    });
  };

  const addWorkExperience = () => {
    if (!profile) return;
    setProfile({
      ...profile,
      work_experience: [
        ...profile.work_experience,
        {
          company: '',
          position: '',
          start_date: '',
          end_date: '',
          description: '',
          skills_used: []
        }
      ]
    });
  };

  const updateWorkExperience = (index: number, field: string, value: any) => {
    if (!profile) return;
    const updatedExperience = [...profile.work_experience];
    updatedExperience[index] = { ...updatedExperience[index], [field]: value };
    setProfile({ ...profile, work_experience: updatedExperience });
  };

  const removeWorkExperience = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      work_experience: profile.work_experience.filter((_, i) => i !== index)
    });
  };

  const addProject = () => {
    if (!profile) return;
    setProfile({
      ...profile,
      projects: [
        ...profile.projects,
        {
          name: '',
          description: '',
          technologies: [],
          url: '',
          github_url: '',
          start_date: '',
          end_date: ''
        }
      ]
    });
  };

  const updateProject = (index: number, field: string, value: any) => {
    if (!profile) return;
    const updatedProjects = [...profile.projects];
    updatedProjects[index] = { ...updatedProjects[index], [field]: value };
    setProfile({ ...profile, projects: updatedProjects });
  };

  const removeProject = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      projects: profile.projects.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-gray-200 rounded-full animate-spin mx-auto" style={{ className="border-t-primary" }}></div>
          <p className="mt-6 text-xl font-semibold text-black">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load profile</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <Link href="/student/dashboard" className="hover:text-indigo-600">Dashboard</Link>
                <span>›</span>
                <Link href="/student/careers" className="hover:text-indigo-600">Career Portal</Link>
                <span>›</span>
                <span>Profile</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Career Profile</h1>
              <p className="text-gray-600">Build your professional profile to attract employers</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Profile Completion</div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-secondary-light h-2 rounded-full"
                      style={{ width: `${profile.profile_completion_percentage || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{profile.profile_completion_percentage || 0}%</span>
                </div>
              </div>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-white rounded-lg shadow-sm border p-6">
            <nav className="space-y-2">
              {[
                { id: 'basic', label: 'Basic Information', icon: '👤' },
                { id: 'resume', label: 'Resume & Documents', icon: '📄' },
                { id: 'education', label: 'Education', icon: '🎓' },
                { id: 'experience', label: 'Work Experience', icon: '💼' },
                { id: 'projects', label: 'Projects', icon: '🚀' },
                { id: 'skills', label: 'Skills & Preferences', icon: '⚡' },
                { id: 'settings', label: 'Privacy Settings', icon: '⚙️' }
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{section.icon}</span>
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              {/* Basic Information */}
              {activeSection === 'basic' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio / Professional Summary
                      </label>
                      <textarea
                        value={profile.bio || ''}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Write a brief professional summary..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Portfolio URL
                      </label>
                      <input
                        type="url"
                        value={profile.portfolio_url || ''}
                        onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="https://your-portfolio.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience Level
                      </label>
                      <select
                        value={profile.experience_level}
                        onChange={(e) => setProfile({ ...profile, experience_level: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="entry">Entry Level</option>
                        <option value="junior">Junior (1-2 years)</option>
                        <option value="mid">Mid Level (3-5 years)</option>
                        <option value="senior">Senior (5+ years)</option>
                        <option value="lead">Lead/Manager</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available From
                      </label>
                      <input
                        type="date"
                        value={profile.availability_date || ''}
                        onChange={(e) => setProfile({ ...profile, availability_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salary Expectations
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        type="number"
                        placeholder="Min salary"
                        value={profile.salary_expectations?.min || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          salary_expectations: {
                            ...profile.salary_expectations,
                            min: parseInt(e.target.value) || 0,
                            max: profile.salary_expectations?.max || 0,
                            currency: profile.salary_expectations?.currency || 'INR'
                          }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <input
                        type="number"
                        placeholder="Max salary"
                        value={profile.salary_expectations?.max || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          salary_expectations: {
                            ...profile.salary_expectations,
                            min: profile.salary_expectations?.min || 0,
                            max: parseInt(e.target.value) || 0,
                            currency: profile.salary_expectations?.currency || 'INR'
                          }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <select
                        value={profile.salary_expectations?.currency || 'INR'}
                        onChange={(e) => setProfile({
                          ...profile,
                          salary_expectations: {
                            ...profile.salary_expectations,
                            min: profile.salary_expectations?.min || 0,
                            max: profile.salary_expectations?.max || 0,
                            currency: e.target.value
                          }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Resume & Documents */}
              {activeSection === 'resume' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Resume & Documents</h2>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <div className="text-4xl mb-4">📄</div>
                      {profile.resume_url ? (
                        <div>
                          <p className="text-sm text-gray-600 mb-4">Current Resume</p>
                          <div className="flex items-center justify-center space-x-4">
                            <a
                              href={profile.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-info text-white rounded-md hover:bg-blue-700"
                            >
                              View Resume
                            </a>
                            <label className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 cursor-pointer">
                              {resumeUploading ? 'Uploading...' : 'Update Resume'}
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleResumeUpload}
                                className="hidden"
                                disabled={resumeUploading}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-600 mb-4">Upload your resume</p>
                          <label className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer">
                            {resumeUploading ? 'Uploading...' : 'Choose File'}
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleResumeUpload}
                              className="hidden"
                              disabled={resumeUploading}
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-2">PDF, DOC, or DOCX (max 5MB)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Education */}
              {activeSection === 'education' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Education</h2>
                    <button
                      onClick={addEducation}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Add Education
                    </button>
                  </div>

                  {profile.education.map((edu, index) => (
                    <div key={index} className="border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Education #{index + 1}</h3>
                        <button
                          onClick={() => removeEducation(index)}
                          className="text-error hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
                          <input
                            type="text"
                            value={edu.field_of_study}
                            onChange={(e) => updateEducation(index, 'field_of_study', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Grade/GPA</label>
                          <input
                            type="text"
                            value={edu.grade || ''}
                            onChange={(e) => updateEducation(index, 'grade', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={edu.start_date}
                            onChange={(e) => updateEducation(index, 'start_date', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                          <input
                            type="date"
                            value={edu.end_date || ''}
                            onChange={(e) => updateEducation(index, 'end_date', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {profile.education.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-6xl mb-4">🎓</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No education added</h3>
                      <p className="text-gray-600 mb-4">Add your educational background</p>
                      <button
                        onClick={addEducation}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Add Education
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Work Experience */}
              {activeSection === 'experience' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Work Experience</h2>
                    <button
                      onClick={addWorkExperience}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Add Experience
                    </button>
                  </div>

                  {profile.work_experience.map((exp, index) => (
                    <div key={index} className="border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Experience #{index + 1}</h3>
                        <button
                          onClick={() => removeWorkExperience(index)}
                          className="text-error hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                          <input
                            type="text"
                            value={exp.position}
                            onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={exp.start_date}
                            onChange={(e) => updateWorkExperience(index, 'start_date', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                          <input
                            type="date"
                            value={exp.end_date || ''}
                            onChange={(e) => updateWorkExperience(index, 'end_date', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={exp.description}
                          onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skills Used</label>
                        <input
                          type="text"
                          value={exp.skills_used.join(', ')}
                          onChange={(e) => updateWorkExperience(index, 'skills_used', e.target.value.split(', ').filter(s => s.trim()))}
                          placeholder="JavaScript, React, Node.js"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  ))}

                  {profile.work_experience.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-6xl mb-4">💼</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No work experience added</h3>
                      <p className="text-gray-600 mb-4">Add your professional experience</p>
                      <button
                        onClick={addWorkExperience}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Add Experience
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Projects */}
              {activeSection === 'projects' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
                    <button
                      onClick={addProject}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Add Project
                    </button>
                  </div>

                  {profile.projects.map((project, index) => (
                    <div key={index} className="border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Project #{index + 1}</h3>
                        <button
                          onClick={() => removeProject(index)}
                          className="text-error hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                          <input
                            type="text"
                            value={project.name}
                            onChange={(e) => updateProject(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Technologies</label>
                          <input
                            type="text"
                            value={project.technologies.join(', ')}
                            onChange={(e) => updateProject(index, 'technologies', e.target.value.split(', ').filter(s => s.trim()))}
                            placeholder="React, Node.js, MongoDB"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Project URL</label>
                          <input
                            type="url"
                            value={project.url || ''}
                            onChange={(e) => updateProject(index, 'url', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
                          <input
                            type="url"
                            value={project.github_url || ''}
                            onChange={(e) => updateProject(index, 'github_url', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={project.start_date}
                            onChange={(e) => updateProject(index, 'start_date', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                          <input
                            type="date"
                            value={project.end_date || ''}
                            onChange={(e) => updateProject(index, 'end_date', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={project.description}
                          onChange={(e) => updateProject(index, 'description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  ))}

                  {profile.projects.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-6xl mb-4">🚀</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects added</h3>
                      <p className="text-gray-600 mb-4">Showcase your projects and work</p>
                      <button
                        onClick={addProject}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Add Project
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Skills & Preferences */}
              {activeSection === 'skills' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Skills & Job Preferences</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                      <input
                        type="text"
                        value={profile.skills.join(', ')}
                        onChange={(e) => setProfile({ ...profile, skills: e.target.value.split(', ').filter(s => s.trim()) })}
                        placeholder="JavaScript, React, Python, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Job Types</label>
                      <div className="space-y-2">
                        {['internship', 'full-time', 'part-time', 'contract', 'freelance'].map((type) => (
                          <label key={type} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={profile.preferred_job_types.includes(type)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setProfile({
                                    ...profile,
                                    preferred_job_types: [...profile.preferred_job_types, type]
                                  });
                                } else {
                                  setProfile({
                                    ...profile,
                                    preferred_job_types: profile.preferred_job_types.filter(t => t !== type)
                                  });
                                }
                              }}
                              className="mr-2"
                            />
                            <span className="capitalize">{type.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Work Modes</label>
                      <div className="space-y-2">
                        {['remote', 'onsite', 'hybrid'].map((mode) => (
                          <label key={mode} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={profile.preferred_work_modes.includes(mode)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setProfile({
                                    ...profile,
                                    preferred_work_modes: [...profile.preferred_work_modes, mode]
                                  });
                                } else {
                                  setProfile({
                                    ...profile,
                                    preferred_work_modes: profile.preferred_work_modes.filter(m => m !== mode)
                                  });
                                }
                              }}
                              className="mr-2"
                            />
                            <span className="capitalize">{mode}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Locations</label>
                      <input
                        type="text"
                        value={profile.preferred_locations.join(', ')}
                        onChange={(e) => setProfile({ ...profile, preferred_locations: e.target.value.split(', ').filter(s => s.trim()) })}
                        placeholder="Bangalore, Mumbai, Remote, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Settings */}
              {activeSection === 'settings' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Privacy Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Public Profile</h3>
                        <p className="text-sm text-gray-600">Make your profile visible to employers</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile.is_profile_public || false}
                          onChange={(e) => setProfile({ ...profile, is_profile_public: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-info"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Available for Hire</h3>
                        <p className="text-sm text-gray-600">Show that you're open to new opportunities</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile.is_available_for_hire || false}
                          onChange={(e) => setProfile({ ...profile, is_available_for_hire: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-info"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}