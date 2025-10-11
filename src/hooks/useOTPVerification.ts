import { useState, useCallback } from 'react';

interface OTPState {
  loading: boolean;
  error: string | null;
  success: boolean;
  otpId: string | null;
  expiresIn: number;
  canResend: boolean;
  resendCooldown: number;
}

interface SendOTPOptions {
  email?: string;
  phone?: string;
  type: 'email' | 'phone';
  purpose?: 'registration' | 'login' | 'password_reset' | 'email_change' | 'phone_change';
}

interface VerifyOTPOptions {
  email?: string;
  phone?: string;
  code: string;
  type: 'email' | 'phone';
}

export function useOTPVerification() {
  const [state, setState] = useState<OTPState>({
    loading: false,
    error: null,
    success: false,
    otpId: null,
    expiresIn: 0,
    canResend: true,
    resendCooldown: 0,
  });

  const sendOTP = useCallback(async (options: SendOTPOptions) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      setState(prev => ({
        ...prev,
        loading: false,
        success: true,
        otpId: data.data.otpId,
        expiresIn: data.data.expiresIn * 60, // Convert minutes to seconds
        canResend: false,
        resendCooldown: 60, // 1 minute cooldown
      }));

      // Start countdown for resend cooldown
      const cooldownInterval = setInterval(() => {
        setState(prev => {
          if (prev.resendCooldown <= 1) {
            clearInterval(cooldownInterval);
            return { ...prev, resendCooldown: 0, canResend: true };
          }
          return { ...prev, resendCooldown: prev.resendCooldown - 1 };
        });
      }, 1000);

      return { success: true, data: data.data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        success: false,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const verifyOTP = useCallback(async (options: VerifyOTPOptions) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify OTP');
      }

      setState(prev => ({
        ...prev,
        loading: false,
        success: true,
        error: null,
      }));

      return { success: true, data: data.data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify OTP';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        success: false,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const resendOTP = useCallback(async (options: SendOTPOptions) => {
    if (!state.canResend) {
      return { success: false, error: 'Please wait before requesting another OTP' };
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'PUT', // Use PUT for resend
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      setState(prev => ({
        ...prev,
        loading: false,
        success: true,
        otpId: data.data.otpId,
        expiresIn: data.data.expiresIn * 60,
        canResend: false,
        resendCooldown: 60,
      }));

      // Start countdown for resend cooldown
      const cooldownInterval = setInterval(() => {
        setState(prev => {
          if (prev.resendCooldown <= 1) {
            clearInterval(cooldownInterval);
            return { ...prev, resendCooldown: 0, canResend: true };
          }
          return { ...prev, resendCooldown: prev.resendCooldown - 1 };
        });
      }, 1000);

      return { success: true, data: data.data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend OTP';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        success: false,
      }));
      return { success: false, error: errorMessage };
    }
  }, [state.canResend]);

  const resetState = useCallback(() => {
    setState({
      loading: false,
      error: null,
      success: false,
      otpId: null,
      expiresIn: 0,
      canResend: true,
      resendCooldown: 0,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    sendOTP,
    verifyOTP,
    resendOTP,
    resetState,
    clearError,
  };
}

export default useOTPVerification;