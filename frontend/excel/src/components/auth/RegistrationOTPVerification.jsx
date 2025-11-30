import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from '../../api/axios';

const RegistrationOTPVerification = () => {
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Get verification data from navigation state or localStorage
  const verificationData = location.state || JSON.parse(localStorage.getItem('pendingVerification') || '{}');

  useEffect(() => {
    // Redirect if no verification data
    if (!verificationData.userId) {
      navigate('/register');
      return;
    }

    // Start countdown timer (5 minutes = 300 seconds)
    setCountdown(300);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [verificationData.userId, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setOtp(value);
      if (errors.otp) {
        setErrors(prev => ({ ...prev, otp: '' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setErrors({ otp: 'Please enter a valid 6-digit OTP' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post('/auth/verify-otp', {
        userId: verificationData.userId,
        type: verificationData.verifyWith,
        otp: otp
      });

      if (response.data.success) {
        // Check if auto-login is enabled
        if (response.data.autoLoggedIn) {
          // Auto-login successful
          await login(verificationData.email || verificationData.contactNumber, 'dummy_password');
          navigate('/dashboard');
        } else {
          // Verification successful, redirect to login
          setErrors({
            general: 'Account verified successfully! Please log in with your credentials.',
            type: 'success'
          });

          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      const errorMessage = err.response?.data?.message || 'Verification failed. Please try again.';

      if (err.response?.data?.remainingAttempts !== undefined) {
        setErrors({
          otp: `${errorMessage} (${err.response.data.remainingAttempts} attempts remaining)`
        });
      } else {
        setErrors({ otp: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsResending(true);
    try {
      const response = await axios.post('/auth/resend-otp', {
        userId: verificationData.userId,
        type: verificationData.verifyWith
      });

      if (response.data.success) {
        setErrors({
          general: response.data.message,
          type: 'success'
        });

        // Reset countdown
        setCountdown(300);
        setCanResend(false);
        setOtp('');

        // Restart countdown timer
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              setCanResend(true);
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setErrors({
        general: err.response?.data?.message || 'Failed to resend OTP. Please try again.'
      });
    } finally {
      setIsResending(false);
    }
  };

  const getVerificationText = () => {
    const method = verificationData.verifyWith;
    const contact = method === 'mobile' ? verificationData.contactNumber : verificationData.email;

    return {
      title: `Verify Your ${method.charAt(0).toUpperCase() + method.slice(1)}`,
      message: `We've sent a 6-digit verification code to ${contact}. Please enter it below to complete your registration.`,
      resendMessage: `Didn't receive the code? You can request a new one in ${formatTime(countdown)}.`
    };
  };

  const verificationText = getVerificationText();

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {verificationText.title}
          </h2>
          <p className="text-gray-600 text-sm">
            {verificationText.message}
          </p>
        </div>

        {errors.general && (
          <div className={`mb-4 p-4 rounded-md ${
            errors.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm text-center ${
              errors.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {errors.general}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
              Enter Verification Code
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={handleOtpChange}
              className={`w-full px-4 py-3 text-center text-2xl font-mono border rounded-md shadow-sm tracking-widest ${
                errors.otp
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-green-500'
              }`}
              placeholder="000000"
              maxLength="6"
              autoComplete="one-time-code"
            />
            {errors.otp && (
              <p className="mt-2 text-sm text-red-600">{errors.otp}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || otp.length !== 6}
            className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Verifying...' : 'Verify & Complete Registration'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">
            {verificationText.resendMessage}
          </p>

          <button
            onClick={handleResendOTP}
            disabled={!canResend || isResending}
            className={`text-sm font-medium ${
              canResend && !isResending
                ? 'text-green-600 hover:text-green-500'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            {isResending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/register')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Registration
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationOTPVerification;
