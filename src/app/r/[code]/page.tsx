'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ReferralPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default function ReferralPage({ params }: ReferralPageProps) {
  const router = useRouter();
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params;
      setCode(resolvedParams.code);
    };
    
    initializeParams();
  }, [params]);

  useEffect(() => {
    // Track the referral click
    const trackReferralClick = async () => {
      try {
        const response = await fetch('/api/referrals/click', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            referralCode: code,
            metadata: {
              userAgent: navigator.userAgent,
              referrer: document.referrer
            }
          })
        });

        const result = await response.json();
        if (!result.success) {
          console.warn('Referral click tracking failed:', result.error);
          // Still proceed with registration even if tracking fails
        }
      } catch (error) {
        console.error('Failed to track referral click:', error);
        // Continue with registration flow even if tracking fails
      }
    };

    if (code && code.length > 0) {
      // Validate referral code format client-side
      if (!/^[A-Za-z0-9]{3,20}$/.test(code)) {
        router.push('/');
        return;
      }

      // Store referral code for registration
      localStorage.setItem('referralCode', code);
      
      // Track the click
      trackReferralClick();
      
      // Redirect to registration with referral code
      router.push(`/auth/register?ref=${encodeURIComponent(code)}`);
    } else if (code !== null) {
      // Invalid referral code, redirect to home
      router.push('/');
    }
  }, [code, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-white shadow-lg">
            <span className="text-3xl font-bold text-blue-600">SP</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Skill Probe!</h1>
          <p className="text-lg text-gray-600 mb-8">
            You&apos;ve been invited to join our learning community
          </p>
        </div>
        
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">
          Processing your invitation...
        </p>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>Referral Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{code}</span></p>
        </div>
      </div>
    </div>
  );
}