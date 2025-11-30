import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const OTPVerification = ({
  type = 'mobile', // 'mobile' or 'email'
  identifier, // email or mobile number
  onSuccess,
  onCancel,
  purpose = 'verification' // 'verification' or 'reset'
}) => {
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const { sendOTP, verifyOTP } = useAuth();

  // Countdown timer for resend functionality
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const validateOTP = () => {
    const newErrors = {};

    if (!otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (!/^\d{6}$/.test(otp.trim())) {
      newErrors.otp = 'OTP must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
      if (errors.otp) {
        setErrors(prev => ({ ...prev, otp: '' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateOTP()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await verifyOTP(identifier, otp.trim(), type, purpose);
      if (result.verified) {
        onSuccess(result);
      } else {
        setErrors({ otp: result.message || 'Invalid OTP' });
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
      setErrors({ otp: error.message || 'OTP verification failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsSubmitting(true);
    try {
      await sendOTP(identifier, type);
      setCountdown(60); // 60 seconds countdown
      setCanResend(false);
      setOtp('');
      setErrors({});
    } catch (error) {
      console.error('Resend OTP failed:', error);
      setErrors({ general: error.message || 'Failed to resend OTP. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {purpose === 'reset' ? 'Reset Password' : 'Verify'} {type === 'mobile' ? 'Mobile Number' : 'Email'}
        </h2>
        <p className="text-gray-600">
          We've sent a 6-digit code to{' '}
          <span className="font-medium text-gray-900">{identifier}</span>
        </p>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800 text-sm text-center">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* OTP Input */}
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
            Enter 6-digit OTP *
          </label>
          <input
            type="text"
            id="otp"
            value={otp}
            onChange={handleOTPChange}
            className={`w-full px-4 py-3 text-center text-2xl font-mono border rounded-md shadow-sm tracking-widest ${
              errors.otp ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-green-500'
            }`}
            placeholder="000000"
            maxLength="6"
            autoFocus
          />
          {errors.otp && <p className="mt-1 text-sm text-red-600">{errors.otp}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || otp.length !== 6}
          className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Verifying...' : 'Verify OTP'}
        </button>
      </form>

      {/* Resend OTP */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 mb-2">
          Didn't receive the code?
        </p>
        <button
          onClick={handleResendOTP}
          disabled={!canResend || isSubmitting}
          className="text-sm font-medium text-green-600 hover:text-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {canResend ? 'Resend OTP' : `Resend in ${formatCountdown(countdown)}`}
        </button>
      </div>

      {/* Cancel Button */}
      {onCancel && (
        <div className="mt-4 text-center">
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default OTPVerification;
