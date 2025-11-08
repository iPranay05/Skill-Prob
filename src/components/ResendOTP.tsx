'use client';

import { useState } from 'react';


interface ResendOTPProps {
  email: string;
  type: 'email' | 'phone';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function ResendOTP({ email, type, onSuccess, onError }: ResendOTPProps) {
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);


  const handleResend = async () => {
    if (isResending || cooldown > 0) return;

    setIsResending(true);
    
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, type }),
      });

      const data = await response.json();

      if (response.ok) {
        // Both email and phone OTP are now sent server-side
        onSuccess?.();
        startCooldown();
      } else {
        onError?.(data.error?.message || 'Failed to resend OTP');
      }
    } catch (error) {
      onError?.('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const startCooldown = () => {
    setCooldown(60); // 60 seconds cooldown
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const isDisabled = isResending || cooldown > 0;

  return (
    <button
      onClick={handleResend}
      disabled={isDisabled}
      className={`text-sm font-medium transition-colors ${
        isDisabled
          ? 'text-gray-400 cursor-not-allowed'
          : 'text-primary hover:text-primary-dark cursor-pointer'
      }`}
    >
      {isResending ? (
        <span className="flex items-center">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
          {type === 'email' ? 'Sending Email...' : 'Sending SMS...'}
        </span>
      ) : cooldown > 0 ? (
        `Resend in ${cooldown}s`
      ) : (
        `Resend ${type === 'email' ? 'Email' : 'SMS'}`
      )}
    </button>
  );
}