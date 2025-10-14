'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');

  useEffect(() => {
    // Track the referral if ref parameter exists
    if (ref) {
      // Store referral code in localStorage for the registration process
      localStorage.setItem('referralCode', ref);

      // Track the referral click
      fetch('/api/referrals/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referralCode: ref,
          action: 'click',
          metadata: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            source: 'referral_link'
          }
        })
      }).catch(error => {
        console.error('Failed to track referral:', error);
      });
    }

    // Redirect to registration page
    router.push('/auth/register');
  }, [ref, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">
          {ref ? 'Processing your referral...' : 'Redirecting to registration...'}
        </p>
      </div>
    </div>
  );
}