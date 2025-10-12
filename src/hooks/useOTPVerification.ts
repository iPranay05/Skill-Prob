'use client';

import { useState, useCallback } from 'react';

interface OTPRequest {
  email?: string;
  phone?: string;
  type: 'email' | 'phone';
  purpose?: string;
}

interface VerifyOTPRequest {
  email?: string;
  phone?: string;
  code: string;
  type: 'email' | 'phone';
}

interface OTPResponse {
  success: boolean;
  message?: string;
  expiresIn?: number;
  error?: string;
}

export default function useOTPVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [expiresIn, setExpiresIn] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);

  const clearError = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  const sendOTP = useCallback(async (request: OTPRequest): Promise<OTPResponse> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setExpiresIn(data.expiresIn || 300); // 5 minutes default
      setCanResend(false);
      setResendCooldown(60); // 1 minute cooldown

      // Start cooldown timer
      const cooldownTimer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(cooldownTimer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return { success: true, message: data.message, expiresIn: data.expiresIn };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (request: VerifyOTPRequest): Promise<OTPResponse> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/verify-otp-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: request.email,
          phone: request.phone,
          emailOTP: request.type === 'email' ? request.code : undefined,
          phoneOTP: request.type === 'phone' ? request.code : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid or expired OTP code');
      }

      setSuccess(true);
      setExpiresIn(0);
      return { success: true, message: data.message };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const resendOTP = useCallback(async (request: OTPRequest): Promise<OTPResponse> => {
    if (!canResend) {
      const errorMessage = `Please wait ${resendCooldown} seconds before resending`;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    return sendOTP(request);
  }, [canResend, resendCooldown, sendOTP]);

  return {
    loading,
    error,
    success,
    expiresIn,
    canResend,
    resendCooldown,
    sendOTP,
    verifyOTP,
    resendOTP,
    clearError,
  };
}