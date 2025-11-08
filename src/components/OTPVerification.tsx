'use client';

import { useState, useEffect, useRef } from 'react';
import useOTPVerification from '../hooks/useOTPVerification';
import ResendOTP from './ResendOTP';

interface OTPVerificationProps {
  email?: string;
  phone?: string;
  type: 'email' | 'phone';
  purpose?: 'registration' | 'login' | 'password_reset' | 'email_change' | 'phone_change';
  onSuccess?: (data: { success: boolean; message: string; token?: string }) => void;
  onError?: (error: string) => void;
  autoSend?: boolean;
  className?: string;
}

export function OTPVerification({
  email,
  phone,
  type,
  purpose = 'registration',
  onSuccess,
  onError,
  autoSend = false,
  className = '',
}: OTPVerificationProps) {
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
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
  } = useOTPVerification();

  // Auto-send OTP on mount if enabled
  useEffect(() => {
    if (autoSend) {
      handleSendOTP();
    }
  }, [autoSend]);

  // Handle OTP expiry countdown
  useEffect(() => {
    if (expiresIn > 0) {
      setTimeLeft(expiresIn);
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [expiresIn]);

  // Handle success/error callbacks
  useEffect(() => {
    if (success && onSuccess) {
      onSuccess({ success: true, message: 'Verification successful' });
    }
  }, [success, onSuccess]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleSendOTP = async () => {
    clearError();
    const result = await sendOTP({
      email: type === 'email' ? email : undefined,
      phone: type === 'phone' ? phone : undefined,
      type,
      purpose,
    });

    if (result.success) {
      // Focus first input after sending OTP
      inputRefs.current[0]?.focus();
    }
  };

  const handleResendOTP = async () => {
    clearError();
    setOtpCode(['', '', '', '', '', '']);
    const result = await resendOTP({
      email: type === 'email' ? email : undefined,
      phone: type === 'phone' ? phone : undefined,
      type,
      purpose,
    });

    if (result.success) {
      inputRefs.current[0]?.focus();
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtpCode = [...otpCode];
    newOtpCode[index] = value;
    setOtpCode(newOtpCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newOtpCode.every(digit => digit !== '') && newOtpCode.join('').length === 6) {
      handleVerifyOTP(newOtpCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtpCode = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtpCode(newOtpCode);

    // Auto-verify if complete
    if (pastedData.length === 6) {
      handleVerifyOTP(pastedData);
    }
  };

  const handleVerifyOTP = async (code?: string) => {
    const codeToVerify = code || otpCode.join('');
    if (codeToVerify.length !== 6) return;

    clearError();
    await verifyOTP({
      email: type === 'email' ? email : undefined,
      phone: type === 'phone' ? phone : undefined,
      code: codeToVerify,
      type,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getContactDisplay = () => {
    if (type === 'email' && email) {
      return email;
    }
    if (type === 'phone' && phone) {
      return phone;
    }
    return type;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">{type === 'email' ? '📧' : '📱'}</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Verify Your {type === 'email' ? 'Email' : 'Phone'}
        </h2>
        <p className="text-gray-600">
          We&apos;ve sent a 6-digit verification code to{' '}
          <span className="font-medium text-gray-900">{getContactDisplay()}</span>
        </p>
      </div>

      {/* OTP Input */}
      <div className="space-y-4">
        <div className="flex justify-center space-x-3">
          {otpCode.map((digit, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={e => handleOTPChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error
                  ? 'border-red-300 focus:border-red-500'
                  : success
                  ? 'border-green-300 focus:border-green-500'
                  : 'border-gray-300 focus:border-blue-500'
              }`}
              disabled={loading}
            />
          ))}
        </div>

        {/* Timer */}
        {timeLeft > 0 && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Code expires in{' '}
              <span className="font-medium text-gray-900">{formatTime(timeLeft)}</span>
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-center">
            <p className="text-sm text-error bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="text-center">
            <p className="text-sm text-secondary bg-green-50 border border-green-200 rounded-lg p-3">
              ✅ Verification successful!
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-4">
        {/* Verify Button */}
        <button
          onClick={() => handleVerifyOTP()}
          disabled={loading || otpCode.join('').length !== 6}
          className="w-full px-4 py-3 bg-info text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Verifying...
            </div>
          ) : (
            'Verify Code'
          )}
        </button>

        {/* Resend Button */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Didn&apos;t receive the code?</p>
          <ResendOTP
            email={type === 'email' ? (email || '') : ''}
            type={type}
            onSuccess={() => {
              setOtpCode(['', '', '', '', '', '']);
              inputRefs.current[0]?.focus();
            }}
            onError={(error) => onError?.(error)}
          />
        </div>

        {/* Send OTP Button (if not auto-sent) */}
        {!autoSend && expiresIn === 0 && (
          <button
            onClick={handleSendOTP}
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
                Sending...
              </div>
            ) : (
              `Send Code to ${type === 'email' ? 'Email' : 'Phone'}`
            )}
          </button>
        )}
      </div>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Having trouble? Check your {type === 'email' ? 'email inbox and spam folder' : 'SMS messages'} or{' '}
          <button className="text-info hover:text-blue-800 underline">
            contact support
          </button>
        </p>
      </div>
    </div>
  );
}

export default OTPVerification;


