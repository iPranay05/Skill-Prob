'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { JobApplication, ApplicationStatus } from '@/models/Job';

interface ApplicationWithDetails extends JobApplication {
  job_posting?: {
    id: string;
    title: string;
    description: string;
    company_name: string;
    company_logo?: string;
    company_website?: string;
    type: string;
    work_mode: string;
    location?: string;
    salary_min?: number;
    salary_max?: number;
    currency: string;
    stipend?: number;
    requirements: {
      skills: string[];
      qualifications: string[];
      experience: string;
    };
    contact_email?: string;
    application_instructions?: string;
  };
  status_history?: Array<{
    id: string;
    previous_status?: string;
    new_status: string;
    changed_by?: string;
    notes?: string;
    created_at: string;
  }>;
}

interface ApplicationDetailsPageProps {
  params: Promise<{
    applicationId: string;
  }>;
}

export default function ApplicationDetailsPage({ params }: ApplicationDetailsPageProps) {
  const [application, setApplication] = useState<ApplicationWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params;
      setApplicationId(resolvedParams.applicationId);
    };
    
    initializeParams();
  }, [params]);

  useEffect(() => {
    if (!applicationId) return;
    fetchApplicationDetails();
  }, [applicationId]);

  const fetchApplicationDetails = async () => {
    if (!applicationId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/student/applications/${applicationId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Application not found');
        }
        throw new Error('Failed to fetch application details');
      }

      const data = await response.json();
      setApplication(data.application);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
      shortlisted: 'bg-green-100 text-green-800 border-green-200',
      interview_scheduled: 'bg-purple-100 text-purple-800 border-purple-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      selected: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      withdrawn: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = (status: ApplicationStatus) => {
    const statusTexts = {
      pending: 'Pending Review',
      reviewed: 'Under Review',
      shortlisted: 'Shortlisted',
      interview_scheduled: 'Interview Scheduled',
      rejected: 'Not Selected',
      selected: 'Selected',
      withdrawn: 'Withdrawn'
    };
    return statusTexts[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Application</h2>
          <p className="text-gray-600 mb-4">{error || 'Application not found'}</p>
          <div className="space-x-4">
            <button
              onClick={fetchApplicationDetails}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
            <Link
              href="/student/careers/applications"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Back to Applications
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
              href="/student/careers/applications"
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
            >
              ← Back to Applications
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {application.job_posting?.title || 'Job Title Not Available'}
              </h1>
              <div className="flex items-center gap-4 text-lg text-gray-600">
                <span className="font-medium">{application.job_posting?.company_name}</span>
                <span>•</span>
                <span className="capitalize">{application.job_posting?.type}</span>
                <span>•</span>
                <span className="capitalize">{application.job_posting?.work_mode}</span>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg border ${getStatusColor(application.status)}`}>
              <span className="font-medium">{getStatusText(application.status)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Applied On</label>
                  <p className="text-gray-900">{formatDate(application.applied_at.toString())}</p>
                </div>

                {application.resume_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
                    <a
                      href={application.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
                    >
                      📄 View Resume
                    </a>
                  </div>
                )}

                {application.portfolio_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio</label>
                    <a
                      href={application.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
                    >
                      🔗 View Portfolio
                    </a>
                  </div>
                )}

                {application.cover_letter && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter</label>
                    <div className="bg-gray-50 rounded-md p-4">
                      <p className="text-gray-900 whitespace-pre-wrap">{application.cover_letter}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Interview Details */}
            {application.interview_scheduled_at && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Interview Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date & Time</label>
                    <p className="text-gray-900">{formatDate(application.interview_scheduled_at.toString())}</p>
                  </div>

                  {application.interview_location && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <p className="text-gray-900">{application.interview_location}</p>
                    </div>
                  )}

                  {application.interview_notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                      <div className="bg-gray-50 rounded-md p-4">
                        <p className="text-gray-900 whitespace-pre-wrap">{application.interview_notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Feedback */}
            {application.feedback && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Feedback</h2>
                <div className="bg-blue-50 rounded-md p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{application.feedback}</p>
                </div>
              </div>
            )}

            {/* Status History */}
            {application.status_history && application.status_history.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Timeline</h2>
                
                <div className="space-y-4">
                  {application.status_history.map((history, index) => (
                    <div key={history.id} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            Status changed to {getStatusText(history.new_status as ApplicationStatus)}
                          </span>
                          {history.previous_status && (
                            <span className="text-sm text-gray-500">
                              (from {getStatusText(history.previous_status as ApplicationStatus)})
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{formatDate(history.created_at)}</p>
                        {history.notes && (
                          <p className="text-sm text-gray-700 mt-1">{history.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
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
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="text-gray-900">{application.job_posting?.location || 'Not specified'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Compensation</label>
                  <p className="text-gray-900">
                    {formatSalary(
                      application.job_posting?.salary_min,
                      application.job_posting?.salary_max,
                      application.job_posting?.currency,
                      application.job_posting?.stipend
                    )}
                  </p>
                </div>

                {application.job_posting?.contact_email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact</label>
                    <a
                      href={`mailto:${application.job_posting.contact_email}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {application.job_posting.contact_email}
                    </a>
                  </div>
                )}

                {application.job_posting?.company_website && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Website</label>
                    <a
                      href={application.job_posting.company_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Required Skills */}
            {application.job_posting?.requirements?.skills && application.job_posting.requirements.skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {application.job_posting.requirements.skills.map((skill, index) => (
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

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              
              <div className="space-y-3">
                <Link
                  href={`/student/careers/jobs/${application.job_posting?.id}`}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-center block"
                >
                  View Job Details
                </Link>

                {application.status === ApplicationStatus.PENDING && (
                  <button
                    onClick={() => {
                      // TODO: Implement withdraw application
                      console.log('Withdraw application:', application.id);
                    }}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Withdraw Application
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}