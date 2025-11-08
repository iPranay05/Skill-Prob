'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/clientAuth';

interface KYCSubmission {
  id: string;
  userId: string;
  email: string;
  profile: any;
  kycStatus: string;
  verified: boolean;
  submittedAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
  kycData?: {
    fullName: string;
    dateOfBirth: string;
    address: any;
    panNumber?: string;
    aadharNumber?: string;
    passportNumber?: string;
    bankAccount: any;
    documents: any;
  };
}

export default function AdminKYCPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }

        if (!['admin', 'super_admin'].includes(currentUser.role)) {
          router.push('/');
          return;
        }

        setUser(currentUser);
        fetchSubmissions();
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router, filter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      console.log('Fetching KYC submissions with filter:', filter);
      
      const response = await fetch(`/api/admin/kyc?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('KYC submissions result:', result);
        setSubmissions(result.data);
      } else {
        const errorData = await response.json();
        console.error('API error:', errorData);
      }
    } catch (error) {
      console.error('Error fetching KYC submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedSubmission || !reviewAction) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/admin/kyc', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          ambassadorId: selectedSubmission.id,
          action: reviewAction,
          rejectionReason: reviewAction === 'reject' ? rejectionReason : undefined
        })
      });

      if (response.ok) {
        alert(`KYC ${reviewAction}d successfully!`);
        setSelectedSubmission(null);
        setReviewAction(null);
        setRejectionReason('');
        fetchSubmissions();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      alert('An error occurred while processing the review');
    } finally {
      setProcessing(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">KYC Management</h1>
          <p className="mt-2 text-gray-600">Review and manage ambassador KYC verifications</p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex space-x-4">
            {[
              { key: 'all', label: 'All Submissions' },
              { key: 'pending_verification', label: 'Pending Review' },
              { key: 'verified', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === key
                    ? 'bg-info text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              KYC Submissions ({submissions.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No KYC submissions found for the selected filter.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {submissions.map((submission) => (
                <div key={submission.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          {submission.kycData?.fullName || 'N/A'}
                        </h3>
                        <span className={`ml-3 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          submission.kycStatus === 'verified' 
                            ? 'bg-green-100 text-green-800'
                            : submission.kycStatus === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {submission.kycStatus.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{submission.email}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                      {submission.rejectionReason && (
                        <p className="text-sm text-error mt-1">
                          Rejection reason: {submission.rejectionReason}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedSubmission(submission)}
                        className="bg-info text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                      >
                        Review Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    KYC Review - {selectedSubmission.kycData?.fullName}
                  </h2>
                  <button
                    onClick={() => {
                      setSelectedSubmission(null);
                      setReviewAction(null);
                      setRejectionReason('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Full Name:</span>
                      <p className="text-gray-900">{selectedSubmission.kycData?.fullName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Date of Birth:</span>
                      <p className="text-gray-900">{selectedSubmission.kycData?.dateOfBirth}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">Address:</span>
                      <p className="text-gray-900">
                        {selectedSubmission.kycData?.address?.street}, {selectedSubmission.kycData?.address?.city}, {selectedSubmission.kycData?.address?.state} {selectedSubmission.kycData?.address?.postalCode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Identity Documents */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Identity Documents</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedSubmission.kycData?.panNumber && (
                      <div>
                        <span className="font-medium text-gray-700">PAN Number:</span>
                        <p className="text-gray-900">{selectedSubmission.kycData.panNumber}</p>
                      </div>
                    )}
                    {selectedSubmission.kycData?.aadharNumber && (
                      <div>
                        <span className="font-medium text-gray-700">Aadhar Number:</span>
                        <p className="text-gray-900">{selectedSubmission.kycData.aadharNumber}</p>
                      </div>
                    )}
                    {selectedSubmission.kycData?.passportNumber && (
                      <div>
                        <span className="font-medium text-gray-700">Passport Number:</span>
                        <p className="text-gray-900">{selectedSubmission.kycData.passportNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bank Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Bank Account Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Account Holder:</span>
                      <p className="text-gray-900">{selectedSubmission.kycData?.bankAccount?.accountHolderName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Bank Name:</span>
                      <p className="text-gray-900">{selectedSubmission.kycData?.bankAccount?.bankName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Account Number:</span>
                      <p className="text-gray-900">{selectedSubmission.kycData?.bankAccount?.accountNumber}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">IFSC/Routing:</span>
                      <p className="text-gray-900">{selectedSubmission.kycData?.bankAccount?.routingNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                {selectedSubmission.kycData?.documents && Object.keys(selectedSubmission.kycData.documents).length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Uploaded Documents</h3>
                    <div className="space-y-2 text-sm">
                      {Object.entries(selectedSubmission.kycData.documents).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-info">{value as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Actions */}
                {selectedSubmission.kycStatus === 'pending_verification' && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Review Action</h3>
                    
                    <div className="space-y-4">
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setReviewAction('approve')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            reviewAction === 'approve'
                              ? 'bg-secondary text-white'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          Approve KYC
                        </button>
                        <button
                          onClick={() => setReviewAction('reject')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            reviewAction === 'reject'
                              ? 'bg-error text-white'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          Reject KYC
                        </button>
                      </div>

                      {reviewAction === 'reject' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rejection Reason
                          </label>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Please provide a reason for rejection..."
                          />
                        </div>
                      )}

                      {reviewAction && (
                        <div className="flex space-x-3">
                          <button
                            onClick={handleReview}
                            disabled={processing || (reviewAction === 'reject' && !rejectionReason.trim())}
                            className="bg-info text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing ? 'Processing...' : `Confirm ${reviewAction === 'approve' ? 'Approval' : 'Rejection'}`}
                          </button>
                          <button
                            onClick={() => {
                              setReviewAction(null);
                              setRejectionReason('');
                            }}
                            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
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
