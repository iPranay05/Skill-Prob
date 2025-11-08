'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Ambassador {
  id: string;
  userId: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
  };
  referralCode: string;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  application: {
    motivation: string;
    experience: string;
    socialMedia: Array<{
      platform: string;
      handle: string;
      followers: number;
    }>;
    expectedReferrals?: number;
    marketingStrategy?: string;
  };
  performance: {
    totalReferrals: number;
    successfulConversions: number;
    totalEarnings: number;
    currentPoints: number;
    lifetimePoints: number;
  };
  payoutDetails: {
    verified: boolean;
  };
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: string;
}

export default function AdminAmbassadors() {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAmbassador, setSelectedAmbassador] = useState<Ambassador | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchAmbassadors();
  }, [selectedStatus]);

  const fetchAmbassadors = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }

      const response = await fetch(`/api/admin/ambassadors?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch ambassadors');
      }

      const result = await response.json();
      setAmbassadors(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (ambassadorId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/ambassadors/${ambassadorId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ notes: reviewNotes })
      });

      if (!response.ok) {
        throw new Error('Failed to approve ambassador');
      }

      alert('Ambassador approved successfully!');
      setShowModal(false);
      setReviewNotes('');
      fetchAmbassadors();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (ambassadorId: string) => {
    if (!reviewNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/ambassadors/${ambassadorId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ reason: reviewNotes })
      });

      if (!response.ok) {
        throw new Error('Failed to reject ambassador');
      }

      alert('Ambassador rejected successfully!');
      setShowModal(false);
      setReviewNotes('');
      fetchAmbassadors();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (ambassador: Ambassador) => {
    setSelectedAmbassador(ambassador);
    setReviewNotes(ambassador.reviewNotes || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAmbassador(null);
    setReviewNotes('');
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      rejected: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[status as keyof typeof statusClasses]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ambassadors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-error mb-4">{error}</p>
          <button 
            onClick={fetchAmbassadors}
            className="bg-info text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
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
          <h1 className="text-3xl font-bold text-gray-900">Ambassador Management</h1>
          <p className="text-gray-600 mt-2">Review and manage ambassador applications and performance.</p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Ambassadors Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ambassador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referral Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ambassadors.map((ambassador) => (
                  <tr key={ambassador.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {ambassador.profile.firstName} {ambassador.profile.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{ambassador.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {ambassador.referralCode}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(ambassador.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>Referrals: {ambassador.performance.totalReferrals}</div>
                      <div>Conversions: {ambassador.performance.successfulConversions}</div>
                      <div>Points: {ambassador.performance.currentPoints}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ambassador.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openModal(ambassador)}
                        className="text-info hover:text-blue-900 mr-4"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {ambassadors.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No ambassadors found</p>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {showModal && selectedAmbassador && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Review Ambassador Application
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Ambassador Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Ambassador Information</h4>
                    <div className="bg-gray-50 p-3 rounded">
                      <p><strong>Name:</strong> {selectedAmbassador.profile.firstName} {selectedAmbassador.profile.lastName}</p>
                      <p><strong>Email:</strong> {selectedAmbassador.email}</p>
                      <p><strong>Status:</strong> {getStatusBadge(selectedAmbassador.status)}</p>
                      <p><strong>Applied:</strong> {new Date(selectedAmbassador.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Application Details */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Application Details</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Motivation:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {selectedAmbassador.application.motivation}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Experience:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {selectedAmbassador.application.experience}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Social Media:</p>
                        <div className="bg-gray-50 p-2 rounded">
                          {selectedAmbassador.application.socialMedia.map((social, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              {social.platform}: {social.handle} ({social.followers.toLocaleString()} followers)
                            </div>
                          ))}
                        </div>
                      </div>
                      {selectedAmbassador.application.expectedReferrals && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Expected Monthly Referrals:</p>
                          <p className="text-sm text-gray-600">{selectedAmbassador.application.expectedReferrals}</p>
                        </div>
                      )}
                      {selectedAmbassador.application.marketingStrategy && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Marketing Strategy:</p>
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {selectedAmbassador.application.marketingStrategy}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Performance */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
                    <div className="bg-gray-50 p-3 rounded grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Referrals</p>
                        <p className="font-medium">{selectedAmbassador.performance.totalReferrals}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Conversions</p>
                        <p className="font-medium">{selectedAmbassador.performance.successfulConversions}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Current Points</p>
                        <p className="font-medium">{selectedAmbassador.performance.currentPoints}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Earnings</p>
                        <p className="font-medium">₹{selectedAmbassador.performance.totalEarnings}</p>
                      </div>
                    </div>
                  </div>

                  {/* Review Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Notes
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add notes about your decision..."
                    />
                  </div>
                </div>

                {/* Actions */}
                {selectedAmbassador.status === 'pending' && (
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => handleReject(selectedAmbassador.id)}
                      disabled={actionLoading}
                      className="bg-error text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
                    >
                      {actionLoading ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleApprove(selectedAmbassador.id)}
                      disabled={actionLoading}
                      className="bg-secondary text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {actionLoading ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


