import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [identifierType, setIdentifierType] = useState('email'); // 'email' or 'mobile'
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    // Identifier validation (email or mobile)
    if (!formData.identifier.trim()) {
      newErrors.identifier = `${identifierType === 'email' ? 'Email' : 'Mobile number'} is required`;
    } else if (identifierType === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.identifier.trim())) {
        newErrors.identifier = 'Please enter a valid email address';
      }
    } else if (identifierType === 'mobile') {
      const mobileRegex = /^\d{10,15}$/;
      const cleanNumber = formData.identifier.replace(/\D/g, '');
      if (!mobileRegex.test(cleanNumber)) {
        newErrors.identifier = 'Please enter a valid mobile number (10-15 digits)';
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-detect identifier type
    if (name === 'identifier') {
      if (value.includes('@')) {
        setIdentifierType('email');
      } else if (/^\d+$/.test(value.replace(/\D/g, ''))) {
        setIdentifierType('mobile');
      }
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login(formData.identifier.trim(), formData.password);
      navigate('/'); // Redirect to home page on successful login
    } catch (error) {
      console.error("Failed to log in", error);

      // Check if error is due to unverified account
      if (error.message && error.message.includes('not verified')) {
        const errorData = error.response?.data;
        if (errorData && errorData.requiresVerification) {
          // Store verification data and redirect to verification page
          localStorage.setItem('pendingVerification', JSON.stringify({
            userId: errorData.userId,
            verifyWith: errorData.incomplete?.[0] || 'email',
            email: formData.identifier.includes('@') ? formData.identifier : undefined,
            contactNumber: !formData.identifier.includes('@') ? formData.identifier : undefined
          }));

          setErrors({
            general: 'Your account is not fully verified. Please complete verification to continue.',
            type: 'verification'
          });

          // Redirect to verification page after a short delay
          setTimeout(() => {
            navigate('/verify-registration', {
              state: {
                userId: errorData.userId,
                verifyWith: errorData.incomplete?.[0] || 'email',
                email: formData.identifier.includes('@') ? formData.identifier : undefined,
                contactNumber: !formData.identifier.includes('@') ? formData.identifier : undefined
              }
            });
          }, 2000);
          setIsSubmitting(false);
          return;
        }
      }

      setErrors({ general: error.message || 'Login failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm text-center">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identifier Field */}
        <div>
          <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
            {identifierType === 'email' ? 'Email Address *' : 'Mobile Number *'}
          </label>
          <input
            type={identifierType === 'email' ? 'email' : 'tel'}
            id="identifier"
            name="identifier"
            value={formData.identifier}
            onChange={handleInputChange}
            className={`mt-1 block w-full p-3 border rounded-md shadow-sm ${
              errors.identifier ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-green-500'
            }`}
            placeholder={identifierType === 'email' ? 'Enter your email address' : 'Enter your mobile number'}
          />
          {errors.identifier && <p className="mt-1 text-sm text-red-600">{errors.identifier}</p>}
          <p className="mt-1 text-xs text-gray-500">
            You can login with either your email address or mobile number
          </p>
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className={`mt-1 block w-full p-3 border rounded-md shadow-sm ${
              errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-green-500'
            }`}
            placeholder="Enter your password"
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>

        {/* Remember me and Forgot password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>
          <div className="text-sm">
            <Link to="/forgot-password" className="font-medium text-green-600 hover:text-green-500">
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      {/* Sign up link */}
      <div className="text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-green-600 hover:text-green-500">
          Sign up
        </Link>
      </div>
    </div>
  );
};

export default LoginForm;
