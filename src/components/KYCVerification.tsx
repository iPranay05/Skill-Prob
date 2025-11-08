'use client';

import { useState, useEffect } from 'react';

interface KYCData {
    fullName: string;
    dateOfBirth: string;
    address: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    panNumber?: string;
    aadharNumber?: string;
    passportNumber?: string;
    drivingLicense?: string;
    bankAccount: {
        accountNumber: string;
        routingNumber: string;
        bankName: string;
        accountHolderName: string;
        accountType: 'savings' | 'checking' | 'current';
    };
    documents: {
        panCard?: string;
        aadharCard?: string;
        passport?: string;
        bankStatement?: string;
        addressProof?: string;
    };
}

interface KYCStatus {
    status: string;
    verified: boolean;
    submittedAt?: string;
    verifiedAt?: string;
    rejectionReason?: string;
    hasPersonalInfo: boolean;
    hasBankDetails: boolean;
    hasDocuments: boolean;
}

export default function KYCVerification() {
    const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [formData, setFormData] = useState<KYCData>({
        fullName: '',
        dateOfBirth: '',
        address: {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'India'
        },
        panNumber: '',
        aadharNumber: '',
        passportNumber: '',
        drivingLicense: '',
        bankAccount: {
            accountNumber: '',
            routingNumber: '',
            bankName: '',
            accountHolderName: '',
            accountType: 'savings'
        },
        documents: {}
    });

    useEffect(() => {
        fetchKYCStatus();
    }, []);

    const fetchKYCStatus = async () => {
        try {
            const response = await fetch('/api/ambassadors/kyc', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                setKycStatus(result.data);
            }
        } catch (error) {
            console.error('Error fetching KYC status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string, nested?: string) => {
        if (nested) {
            setFormData(prev => ({
                ...prev,
                [nested]: {
                    ...prev[nested as keyof KYCData] as any,
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleFileUpload = async (field: string, file: File) => {
        // TODO: Implement file upload to your storage service (S3, etc.)
        // For now, we'll just store the file name
        const fileName = `${Date.now()}_${file.name}`;

        setFormData(prev => ({
            ...prev,
            documents: {
                ...prev.documents,
                [field]: fileName
            }
        }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch('/api/ambassadors/kyc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'KYC verification submitted successfully!' });
                fetchKYCStatus(); // Refresh status
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to submit KYC verification' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred while submitting KYC verification' });
        } finally {
            setSubmitting(false);
        }
    };

    const validateStep = (step: number) => {
        switch (step) {
            case 1:
                return formData.fullName && formData.dateOfBirth &&
                    formData.address.street && formData.address.city &&
                    formData.address.state && formData.address.postalCode;
            case 2:
                return formData.panNumber || formData.aadharNumber ||
                    formData.passportNumber || formData.drivingLicense;
            case 3:
                return formData.bankAccount.accountNumber && formData.bankAccount.routingNumber &&
                    formData.bankAccount.bankName && formData.bankAccount.accountHolderName;
            default:
                return true;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (kycStatus?.verified) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center">
                    <svg className="h-6 w-6 text-secondary mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h3 className="text-lg font-medium text-green-800">KYC Verified</h3>
                        <p className="text-green-700">Your KYC verification is complete. You can now request payouts.</p>
                        {kycStatus.verifiedAt && (
                            <p className="text-sm text-secondary mt-1">
                                Verified on: {new Date(kycStatus.verifiedAt).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (kycStatus?.status === 'pending_verification') {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center">
                    <svg className="h-6 w-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h3 className="text-lg font-medium text-yellow-800">KYC Under Review</h3>
                        <p className="text-yellow-700">Your KYC verification is being reviewed by our team.</p>
                        {kycStatus.submittedAt && (
                            <p className="text-sm text-yellow-600 mt-1">
                                Submitted on: {new Date(kycStatus.submittedAt).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (kycStatus?.status === 'rejected') {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <div className="flex items-center">
                    <svg className="h-6 w-6 text-error mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h3 className="text-lg font-medium text-red-800">KYC Rejected</h3>
                        <p className="text-red-700">Your KYC verification was rejected. Please resubmit with correct information.</p>
                        {kycStatus.rejectionReason && (
                            <p className="text-sm text-error mt-1">
                                Reason: {kycStatus.rejectionReason}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">KYC Verification</h2>

            {message && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center">
                    {[1, 2, 3, 4].map((step) => (
                        <div key={step} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= step
                                ? 'bg-info text-white'
                                : 'bg-gray-200 text-gray-600'
                                }`}>
                                {step}
                            </div>
                            {step < 4 && (
                                <div className={`w-16 h-1 ${currentStep > step ? 'bg-info' : 'bg-gray-200'
                                    }`}></div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>Personal Info</span>
                    <span>Identity</span>
                    <span>Bank Details</span>
                    <span>Documents</span>
                </div>
            </div>

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                            <input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                        <input
                            type="text"
                            value={formData.address.street}
                            onChange={(e) => handleInputChange('street', e.target.value, 'address')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your street address"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                                type="text"
                                value={formData.address.city}
                                onChange={(e) => handleInputChange('city', e.target.value, 'address')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="City"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                            <input
                                type="text"
                                value={formData.address.state}
                                onChange={(e) => handleInputChange('state', e.target.value, 'address')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="State"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                            <input
                                type="text"
                                value={formData.address.postalCode}
                                onChange={(e) => handleInputChange('postalCode', e.target.value, 'address')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Postal Code"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Identity Documents */}
            {currentStep === 2 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Identity Documents</h3>
                    <p className="text-sm text-gray-600">Provide at least one identity document</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number (India)</label>
                            <input
                                type="text"
                                value={formData.panNumber}
                                onChange={(e) => handleInputChange('panNumber', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="ABCDE1234F"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number (India)</label>
                            <input
                                type="text"
                                value={formData.aadharNumber}
                                onChange={(e) => handleInputChange('aadharNumber', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="1234 5678 9012"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                            <input
                                type="text"
                                value={formData.passportNumber}
                                onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="A1234567"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Driving License</label>
                            <input
                                type="text"
                                value={formData.drivingLicense}
                                onChange={(e) => handleInputChange('drivingLicense', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="DL1234567890"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Bank Details */}
            {currentStep === 3 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Bank Account Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                            <input
                                type="text"
                                value={formData.bankAccount.accountHolderName}
                                onChange={(e) => handleInputChange('accountHolderName', e.target.value, 'bankAccount')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Account holder name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                            <input
                                type="text"
                                value={formData.bankAccount.bankName}
                                onChange={(e) => handleInputChange('bankName', e.target.value, 'bankAccount')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Bank name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                            <input
                                type="text"
                                value={formData.bankAccount.accountNumber}
                                onChange={(e) => handleInputChange('accountNumber', e.target.value, 'bankAccount')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Account number"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code / Routing Number</label>
                            <input
                                type="text"
                                value={formData.bankAccount.routingNumber}
                                onChange={(e) => handleInputChange('routingNumber', e.target.value, 'bankAccount')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="IFSC code or routing number"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                            <select
                                value={formData.bankAccount.accountType}
                                onChange={(e) => handleInputChange('accountType', e.target.value, 'bankAccount')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="savings">Savings</option>
                                <option value="checking">Checking</option>
                                <option value="current">Current</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 4: Document Upload */}
            {currentStep === 4 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Document Upload</h3>
                    <p className="text-sm text-gray-600">Upload supporting documents (optional but recommended)</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { key: 'panCard', label: 'PAN Card' },
                            { key: 'aadharCard', label: 'Aadhar Card' },
                            { key: 'passport', label: 'Passport' },
                            { key: 'bankStatement', label: 'Bank Statement' },
                            { key: 'addressProof', label: 'Address Proof' }
                        ].map(({ key, label }) => (
                            <div key={key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(key, file);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {formData.documents[key as keyof typeof formData.documents] && (
                                    <p className="text-sm text-secondary mt-1">✓ File uploaded</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
                <button
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>

                {currentStep < 4 ? (
                    <button
                        onClick={() => setCurrentStep(currentStep + 1)}
                        disabled={!validateStep(currentStep)}
                        className="px-4 py-2 bg-info text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !validateStep(currentStep)}
                        className="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Submitting...' : 'Submit KYC'}
                    </button>
                )}
            </div>
        </div>
    );
}
