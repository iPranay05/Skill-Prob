'use client';

import { useState, useEffect } from 'react';
import { JobPosting, JobSearchQuery, JobType, ExperienceLevel, WorkMode } from '@/models/Job';

interface JobSearchResult {
  jobs: JobPosting[];
  total: number;
  page: number;
  limit: number;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<JobSearchQuery>({
    search: '',
    filters: {},
    page: 1,
    limit: 20
  });
  const [totalJobs, setTotalJobs] = useState(0);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchQuery.search) params.append('search', searchQuery.search);
      if (searchQuery.filters?.type) params.append('type', searchQuery.filters.type);
      if (searchQuery.filters?.experience_level) params.append('experience_level', searchQuery.filters.experience_level);
      if (searchQuery.filters?.work_mode) params.append('work_mode', searchQuery.filters.work_mode);
      if (searchQuery.filters?.location) params.append('location', searchQuery.filters.location);
      if (searchQuery.filters?.featured !== undefined) params.append('featured', searchQuery.filters.featured.toString());
      if (searchQuery.page) params.append('page', searchQuery.page.toString());
      if (searchQuery.limit) params.append('limit', searchQuery.limit.toString());

      const response = await fetch(`/api/jobs?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setJobs(data.data.jobs);
        setTotalJobs(data.data.total);
      } else {
        setError(data.error?.message || 'Failed to fetch jobs');
      }
    } catch (err) {
      setError('Failed to fetch jobs');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key: string, value: any) => {
    setSearchQuery(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value || undefined
      },
      page: 1
    }));
  };

  const formatSalary = (min?: number, max?: number, currency = 'INR') => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `${currency} ${min.toLocaleString()}+`;
    return `Up to ${currency} ${max?.toLocaleString()}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Job Board</h1>
          <p className="mt-2 text-gray-600">Find your next opportunity</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search jobs, companies, or keywords..."
                  value={searchQuery.search || ''}
                  onChange={(e) => setSearchQuery(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-info text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={searchQuery.filters?.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Job Types</option>
                <option value={JobType.INTERNSHIP}>Internship</option>
                <option value={JobType.FULL_TIME}>Full Time</option>
                <option value={JobType.PART_TIME}>Part Time</option>
                <option value={JobType.CONTRACT}>Contract</option>
                <option value={JobType.FREELANCE}>Freelance</option>
              </select>

              <select
                value={searchQuery.filters?.experience_level || ''}
                onChange={(e) => handleFilterChange('experience_level', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Experience Levels</option>
                <option value={ExperienceLevel.ENTRY}>Entry Level</option>
                <option value={ExperienceLevel.JUNIOR}>Junior</option>
                <option value={ExperienceLevel.MID}>Mid Level</option>
                <option value={ExperienceLevel.SENIOR}>Senior</option>
                <option value={ExperienceLevel.LEAD}>Lead</option>
              </select>

              <select
                value={searchQuery.filters?.work_mode || ''}
                onChange={(e) => handleFilterChange('work_mode', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Work Modes</option>
                <option value={WorkMode.REMOTE}>Remote</option>
                <option value={WorkMode.ONSITE}>On-site</option>
                <option value={WorkMode.HYBRID}>Hybrid</option>
              </select>

              <input
                type="text"
                placeholder="Location"
                value={searchQuery.filters?.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>
        </div>

        {/* Results */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <p className="text-gray-600">
            {totalJobs > 0 ? `${totalJobs} jobs found` : 'No jobs found'}
          </p>
        </div>

        {/* Job Listings */}
        <div className="space-y-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                    {job.featured && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-lg text-gray-700 mb-2">{job.company_name}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="capitalize">{job.type.replace('-', ' ')}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="capitalize">{job.experience_level}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="capitalize">{job.work_mode}</span>
                    </span>
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <span>{job.location}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {job.type === JobType.INTERNSHIP && job.stipend
                      ? `₹${job.stipend.toLocaleString()}/month`
                      : formatSalary(job.salary_min, job.salary_max, job.currency)
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    Posted {formatDate(job.created_at)}
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-4 line-clamp-2">
                {job.short_description || job.description.substring(0, 200) + '...'}
              </p>

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {job.requirements.skills.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.requirements.skills.length > 3 && (
                    <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full">
                      +{job.requirements.skills.length - 3} more
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-info border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                    View Details
                  </button>
                  <button className="px-4 py-2 bg-info text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Apply Now
                  </button>
                </div>
              </div>

              {job.application_deadline && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-accent">
                    Application deadline: {formatDate(job.application_deadline)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalJobs > (searchQuery.limit || 20) && (
          <div className="mt-8 flex justify-center">
            <div className="flex gap-2">
              <button
                onClick={() => setSearchQuery(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
                disabled={searchQuery.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-600">
                Page {searchQuery.page} of {Math.ceil(totalJobs / (searchQuery.limit || 20))}
              </span>
              <button
                onClick={() => setSearchQuery(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                disabled={searchQuery.page === Math.ceil(totalJobs / (searchQuery.limit || 20))}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {jobs.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or check back later for new opportunities.</p>
          </div>
        )}
      </div>
    </div>
  );
}