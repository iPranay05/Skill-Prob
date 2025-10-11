'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { JobPosting, JobType, ExperienceLevel, WorkMode } from '@/models/Job';

interface JobSearchFilters {
  search?: string;
  type?: JobType;
  experience_level?: ExperienceLevel;
  work_mode?: WorkMode;
  location?: string;
  salary_min?: number;
  featured?: boolean;
  remote_friendly?: boolean;
}

interface JobSearchResponse {
  jobs: JobPosting[];
  total: number;
  page: number;
  limit: number;
}

export default function StudentCareersPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<JobSearchFilters>({});
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });
  const [showFilters, setShowFilters] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    // Initialize filters from URL params
    const initialFilters: JobSearchFilters = {};
    const search = searchParams.get('search');
    const type = searchParams.get('type') as JobType;
    const experience = searchParams.get('experience') as ExperienceLevel;
    const workMode = searchParams.get('work_mode') as WorkMode;
    const location = searchParams.get('location');
    const salaryMin = searchParams.get('salary_min');
    const featured = searchParams.get('featured');
    const remote = searchParams.get('remote_friendly');

    if (search) {
      setSearchQuery(search);
      initialFilters.search = search;
    }
    if (type) initialFilters.type = type;
    if (experience) initialFilters.experience_level = experience;
    if (workMode) initialFilters.work_mode = workMode;
    if (location) initialFilters.location = location;
    if (salaryMin) initialFilters.salary_min = parseInt(salaryMin);
    if (featured) initialFilters.featured = featured === 'true';
    if (remote) initialFilters.remote_friendly = remote === 'true';

    setFilters(initialFilters);
    fetchJobs(initialFilters);
  }, [searchParams]);

  const fetchJobs = async (searchFilters: JobSearchFilters = filters, page = 1) => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (searchFilters.search) queryParams.set('search', searchFilters.search);
      if (searchFilters.type) queryParams.set('type', searchFilters.type);
      if (searchFilters.experience_level) queryParams.set('experience_level', searchFilters.experience_level);
      if (searchFilters.work_mode) queryParams.set('work_mode', searchFilters.work_mode);
      if (searchFilters.location) queryParams.set('location', searchFilters.location);
      if (searchFilters.salary_min) queryParams.set('salary_min', searchFilters.salary_min.toString());
      if (searchFilters.featured !== undefined) queryParams.set('featured', searchFilters.featured.toString());
      if (searchFilters.remote_friendly !== undefined) queryParams.set('remote_friendly', searchFilters.remote_friendly.toString());
      queryParams.set('page', page.toString());
      queryParams.set('limit', '20');

      // Get the access token from localStorage
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/student/careers/jobs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login if unauthorized
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      
      if (data.success) {
        setJobs(data.jobs || []);
        setPagination({ page: data.page || 1, total: data.total || 0, limit: data.limit || 20 });
      } else {
        throw new Error(data.error || 'Failed to fetch jobs');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newFilters = { ...filters, search: searchQuery };
    setFilters(newFilters);
    updateURL(newFilters);
    fetchJobs(newFilters, 1);
  };

  const handleFilterChange = (key: keyof JobSearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateURL(newFilters);
    fetchJobs(newFilters, 1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({});
    router.push('/student/careers');
    fetchJobs({}, 1);
  };

  const updateURL = (newFilters: JobSearchFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString());
      }
    });
    router.push(`/student/careers?${params.toString()}`);
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
      month: 'short',
      day: 'numeric'
    });
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Career Opportunities</h1>
              <p className="mt-2 text-gray-600">Discover internships and jobs that match your skills</p>
            </div>
            <Link
              href="/student/careers/applications"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              My Applications
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search jobs by title, company, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Filters
              </button>
            </div>
          </form>

          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                  <select
                    value={filters.type || ''}
                    onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="internship">Internship</option>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                  <select
                    value={filters.experience_level || ''}
                    onChange={(e) => handleFilterChange('experience_level', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Levels</option>
                    <option value="entry">Entry Level</option>
                    <option value="junior">Junior</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
                  <select
                    value={filters.work_mode || ''}
                    onChange={(e) => handleFilterChange('work_mode', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Modes</option>
                    <option value="remote">Remote</option>
                    <option value="onsite">On-site</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="Enter location"
                    value={filters.location || ''}
                    onChange={(e) => handleFilterChange('location', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary (₹)</label>
                  <input
                    type="number"
                    placeholder="Minimum salary"
                    value={filters.salary_min || ''}
                    onChange={(e) => handleFilterChange('salary_min', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.featured || false}
                      onChange={(e) => handleFilterChange('featured', e.target.checked || undefined)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Featured Only</span>
                  </label>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.remote_friendly || false}
                      onChange={(e) => handleFilterChange('remote_friendly', e.target.checked || undefined)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remote Friendly</span>
                  </label>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {loading ? 'Loading...' : `${pagination.total} opportunities found`}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading opportunities...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 text-xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Jobs</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchJobs()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters.</p>
            <button
              onClick={clearFilters}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Job Listings */}
            <div className="space-y-4 mb-8">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          <Link
                            href={`/student/careers/jobs/${job.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {job.title}
                          </Link>
                        </h3>
                        {job.featured && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            Featured
                          </span>
                        )}
                        {job.remote_friendly && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Remote Friendly
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
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

                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {job.short_description || job.description.substring(0, 200) + '...'}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          Salary: {formatSalary(job.salary_min, job.salary_max, job.currency, job.stipend)}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{job.experience_level} Level</span>
                        {job.published_at && (
                          <>
                            <span>•</span>
                            <span>Posted {formatDate(job.published_at.toString())}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Link
                        href={`/student/careers/jobs/${job.id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-center"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => {
                          // TODO: Implement save job functionality
                          console.log('Save job:', job.id);
                        }}
                        className="text-gray-600 hover:text-gray-700 text-sm"
                      >
                        💾 Save
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => fetchJobs(filters, pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + Math.max(1, pagination.page - 2);
                  if (page > totalPages) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => fetchJobs(filters, page)}
                      className={`px-3 py-2 border rounded-md ${
                        page === pagination.page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => fetchJobs(filters, pagination.page + 1)}
                  disabled={pagination.page === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}