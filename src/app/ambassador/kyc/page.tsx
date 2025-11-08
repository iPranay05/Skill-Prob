'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/clientAuth';
import KYCVerification from '@/components/KYCVerification';

export default function KYCPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }

        if (currentUser.role !== 'ambassador') {
          router.push('/');
          return;
        }

        setUser(currentUser);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">KYC Verification</h1>
          <p className="mt-2 text-gray-600">
            Complete your KYC verification to enable payout requests
          </p>
        </div>

        {/* KYC Form */}
        <KYCVerification />

        {/* Information Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Why do we need KYC verification?</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• To comply with financial regulations and prevent fraud</li>
            <li>• To ensure secure and accurate payout processing</li>
            <li>• To verify your identity and banking information</li>
            <li>• To protect both you and our platform from financial risks</li>
          </ul>
          
          <h3 className="text-lg font-medium text-blue-900 mb-2 mt-4">What documents do I need?</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Government-issued ID (PAN Card, Aadhar, Passport, or Driving License)</li>
            <li>• Bank account details (Account number, IFSC code, Account holder name)</li>
            <li>• Address proof (optional but recommended)</li>
            <li>• Bank statement (optional but recommended)</li>
          </ul>

          <h3 className="text-lg font-medium text-blue-900 mb-2 mt-4">How long does verification take?</h3>
          <p className="text-blue-800 text-sm">
            KYC verification typically takes 1-3 business days. You'll receive an email notification once your verification is complete.
          </p>
        </div>
      </div>
    </div>
  );
}
