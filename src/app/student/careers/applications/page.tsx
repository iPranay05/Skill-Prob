'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { JobApplication, ApplicationStatus } from '@/models/Job';

interface ApplicationStats {
  total_applications: number;
  pending: number;
  reviewed: number;
  shortlisted: number;
  interview_scheduled: number;
  rejected: number;
  selected: number;
  withdrawn: number;
}

interface ApplicationWithJobDetails extends JobApplication {
  job_posting?: {
    id: string;
    title: string;
    company_name: string;
    type: string;
    work_mode: string;
    location?: string;
    salary_min?: number;
    salary_max?: number;
    currency: string;
    stipend?: number;
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

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithJobDetails[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | 'all'>('all');
  const router = useRouter();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/applications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.applications || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      shortlisted: 'bg-green-100 text-green-800',
      interview_scheduled: 'bg-purple-100 text-purple-800',
      rejected: 'bg-red-100 text-red-800',
      selected: 'bg-emerald-100 text-emerald-800',
      withdrawn: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
      month: 'short',
      day: 'numeric'
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

  const filteredApplications = applications.filter(app => 
    selectedStatus === 'all' || app.status === selectedStatus
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-error text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Applications</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchApplications}
            className="bg-info text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
              <p className="mt-2 text-gray-600">Track your internship and job applications</p>
            </div>
            <Link
              href="/student/careers"
              className="bg-info text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-gray-900">{stats.total_applications}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-info">{stats.reviewed}</div>
              <div className="text-sm text-gray-600">Reviewed</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-secondary">{stats.shortlisted}</div>
              <div className="text-sm text-gray-600">Shortlisted</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-primary">{stats.interview_scheduled}</div>
              <div className="text-sm text-gray-600">Interviews</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-error">{stats.rejected}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-emerald-600">{stats.selected}</div>
              <div className="text-sm text-gray-600">Selected</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-gray-600">{stats.withdrawn}</div>
              <div className="text-sm text-gray-600">Withdrawn</div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'All Applications', count: stats?.total_applications || 0 },
                { key: 'pending', label: 'Pending', count: stats?.pending || 0 },
                { key: 'reviewed', label: 'Under Review', count: stats?.reviewed || 0 },
                { key: 'shortlisted', label: 'Shortlisted', count: stats?.shortlisted || 0 },
                { key: 'interview_scheduled', label: 'Interviews', count: stats?.interview_scheduled || 0 },
                { key: 'selected', label: 'Selected', count: stats?.selected || 0 }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedStatus(tab.key as ApplicationStatus | 'all')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedStatus === tab.key
                      ? 'border-blue-500 text-info'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedStatus === 'all' ? 'No applications yet' : `No ${selectedStatus} applications`}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedStatus === 'all' 
                ? 'Start applying to internships and jobs to see them here.'
                : `You don't have any applications with ${selectedStatus} status.`
              }
            </p>
            {selectedStatus === 'all' && (
              <Link
                href="/student/careers"
                className="bg-info text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Browse Opportunities
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <div key={application.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {application.job_posting?.title || 'Job Title Not Available'}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {getStatusText(application.status)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="font-medium">{application.job_posting?.company_name}</span>
                      <span>•</span>
                      <span className="capitalize">{application.job_posting?.type}</span>
                      <span>•</span>
                      <span className="capitalize">{application.job_posting?.work_mode}</span>
                      {application.job_posting?.location && (
                        <>
                          <span>•</span>
                          <span>{application.job_posting.location}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span>Applied: {formatDate(application.applied_at.toString())}</span>
                      <span>•</span>
                      <span>
                        Salary: {formatSalary(
                          application.job_posting?.salary_min,
                          application.job_posting?.salary_max,
                          application.job_posting?.currency,
                          application.job_posting?.stipend
                        )}
                      </span>
                    </div>

                    {application.interview_scheduled_at && (
                      <div className="bg-purple-50 border border-purple-200 rounded-md p-3 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-primary">📅</span>
                          <span className="font-medium text-purple-900">Interview Scheduled</span>
                        </div>
                        <div className="text-sm text-primary-dark mt-1">
                          {new Date(application.interview_scheduled_at).toLocaleString()}
                          {application.interview_location && (
                            <span className="ml-2">at {application.interview_location}</span>
                          )}
                        </div>
                        {application.interview_notes && (
                          <div className="text-sm text-primary-dark mt-2">
                            <strong>Notes:</strong> {application.interview_notes}
                          </div>
                        )}
                      </div>
                    )}

                    {application.feedback && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-info">💬</span>
                          <span className="font-medium text-blue-900">Feedback</span>
                        </div>
                        <div className="text-sm text-blue-700">{application.feedback}</div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Link
                      href={`/student/careers/applications/${application.id}`}
                      className="text-info hover:text-blue-700 text-sm font-medium"
                    >
                      View Details
                    </Link>
                    {application.status === ApplicationStatus.PENDING && (
                      <button
                        onClick={() => {
                          // TODO: Implement withdraw application
                          console.log('Withdraw application:', application.id);
                        }}
                        className="text-error hover:text-red-700 text-sm font-medium"
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 