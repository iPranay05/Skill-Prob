'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { JobPosting } from '@/models/Job';

interface JobDetailsPageProps {
  params: Promise<{
    jobId: string;
  }>;
}

interface ApplicationFormData {
  resume_url?: string;
  cover_letter?: string;
  portfolio_url?: string;
}

export default function JobDetailsPage({ params }: JobDetailsPageProps) {
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState<ApplicationFormData>({});
  const [submitting, setSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params;
      setJobId(resolvedParams.jobId);
    };
    
    initializeParams();
  }, [params]);

  useEffect(() => {
    if (!jobId) return;
    fetchJobDetails();
    checkApplicationStatus();
  }, [jobId]);

  const fetchJobDetails = async () => {
    if (!jobId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/student/careers/jobs/${jobId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Job not found');
        }
        throw new Error('Failed to fetch job details');
      }

      const data = await response.json();
      setJob(data.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    if (!jobId) return;
    
    try {
      const response = await fetch(`/api/student/careers/jobs/${jobId}/application-status`);
      if (response.ok) {
        const data = await response.json();
        setHasApplied(data.hasApplied);
      }
    } catch (err) {
      console.error('Error checking application status:', err);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!job) return;

    try {
      setSubmitting(true);
      
      const response = await fetch(`/api/student/careers/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }

      setHasApplied(true);
      setShowApplicationForm(false);
      setApplicationData({});
      
      // Show success message or redirect
      alert('Application submitted successfully!');
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const formatSalary = (min?: number, max?: number, currency = 'INR', stipend?: number) => {
    if (stipend) {
      return `₹${stipend.toLocaleString()}/month`;
    }
    if (min && max) {
      return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
    }
    if (min) {
      return `₹${min.toLocaleString()}+`;
    }
    return 'Not specified';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Job</h2>
          <p className="text-gray-600 mb-4">{error || 'Job not found'}</p>
          <div className="space-x-4">
            <button
              onClick={fetchJobDetails}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
            <Link
              href="/student/careers"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/student/careers"
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
            >
              ← Back to Jobs
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                {job.featured && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                    Featured
                  </span>
                )}
                {job.remote_friendly && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    Remote Friendly
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-lg text-gray-600">
                <span className="font-medium">{job.company_name}</span>
                <span>•</span>
                <span className="capitalize">{job.type.replace('-', ' ')}</span>
                <span>•</span>
                <span className="capitalize">{job.work_mode}</span>
                {job.location && (
                  <>
                    <span>•</span>
                    <span>{job.location}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              {hasApplied ? (
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-md border border-green-200">
                  ✓ Applied
                </div>
              ) : (
                <button
                  onClick={() => setShowApplicationForm(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Apply Now
                </button>
              )}
              <button
                onClick={() => {
                  // TODO: Implement save job functionality
                  console.log('Save job:', job.id);
                }}
                className="text-gray-600 hover:text-gray-700 text-sm"
              >
                💾 Save Job
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>

            {/* Requirements */}
            {job.requirements && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
                
                {job.requirements.skills && job.requirements.skills.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.requirements.skills.map((skill, index) => (
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

                {job.requirements.qualifications && job.requirements.qualifications.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Qualifications</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {job.requirements.qualifications.map((qualification, index) => (
                        <li key={index} className="text-gray-700">{qualification}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {job.requirements.experience && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Experience</h3>
                    <p className="text-gray-700">{job.requirements.experience}</p>
                  </div>
                )}
              </div>
            )}

            {/* Application Instructions */}
            {job.application_instructions && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Instructions</h2>
                <div className="bg-blue-50 rounded-md p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{job.application_instructions}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Compensation</label>
                  <p className="text-gray-900">
                    {formatSalary(job.salary_min, job.salary_max, job.currency, job.stipend)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Experience Level</label>
                  <p className="text-gray-900 capitalize">{job.experience_level} Level</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Work Mode</label>
                  <p className="text-gray-900 capitalize">{job.work_mode}</p>
                </div>

                {job.location && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="text-gray-900">{job.location}</p>
                  </div>
                )}

                {job.published_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Posted On</label>
                    <p className="text-gray-900">{formatDate(job.published_at.toString())}</p>
                  </div>
                )}

                {job.application_deadline && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Application Deadline</label>
                    <p className="text-gray-900">{formatDate(job.application_deadline.toString())}</p>
                  </div>
                )}

                {job.max_applications && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Applications</label>
                    <p className="text-gray-900">
                      {job.current_applications} / {job.max_applications} received
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Company Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <p className="text-gray-900">{job.company_name}</p>
                </div>

                {job.company_website && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <a
                      href={job.company_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Visit Website
                    </a>
                  </div>
                )}

                {job.contact_email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact</label>
                    <a
                      href={`mailto:${job.contact_email}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {job.contact_email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Application Modal */}
        {showApplicationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Apply for {job.title}</h3>
                <button
                  onClick={() => setShowApplicationForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resume URL (optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/resume.pdf"
                    value={applicationData.resume_url || ''}
                    onChange={(e) => setApplicationData({ ...applicationData, resume_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portfolio URL (optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/portfolio"
                    value={applicationData.portfolio_url || ''}
                    onChange={(e) => setApplicationData({ ...applicationData, portfolio_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Letter (optional)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell us why you're interested in this position..."
                    value={applicationData.cover_letter || ''}
                    onChange={(e) => setApplicationData({ ...applicationData, cover_letter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApplicationForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}