import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    contactNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Contact number validation
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^[\d\s\-\+\(\)]{10,15}$/.test(formData.contactNumber.trim())) {
      newErrors.contactNumber = 'Please enter a valid contact number (10-15 digits)';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const response = await register(
        formData.name.trim(),
        formData.username.trim(),
        formData.email.trim().toLowerCase(),
        formData.contactNumber.trim(),
        formData.password
      );

      // Check if registration requires verification
      if (response.requiresVerification) {
        // Store registration data for OTP verification
        localStorage.setItem('pendingVerification', JSON.stringify({
          userId: response.userId,
          verifyWith: response.verifyWith,
          email: formData.email.trim().toLowerCase(),
          contactNumber: formData.contactNumber.trim()
        }));

        // Show success message and redirect to OTP verification
        setErrors({
          general: response.message + ' Please verify your account to complete registration.',
          type: 'success'
        });

        // Redirect to OTP verification page after a short delay
        setTimeout(() => {
          navigate('/verify-registration', {
            state: {
              userId: response.userId,
              verifyWith: response.verifyWith,
              email: formData.email.trim().toLowerCase(),
              contactNumber: formData.contactNumber.trim()
            }
          });
        }, 2000);
      } else {
        // Fallback to login page if no verification required
        navigate('/login');
      }
    } catch (err) {
      console.error("Failed to register", err);
      setErrors({ general: err.message || 'Registration failed. Please try again.' });
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
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`mt-1 block w-full p-3 border rounded-md shadow-sm ${
              errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-green-500'
            }`}
            placeholder="Enter your full name"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Username Field */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username *
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className={`mt-1 block w-full p-3 border rounded-md shadow-sm ${
              errors.username ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-green-500'
            }`}
            placeholder="Choose a unique username"
          />
          {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`mt-1 block w-full p-3 border rounded-md shadow-sm ${
              errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-green-500'
            }`}
            placeholder="Enter your email address"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        {/* Contact Number Field */}
        <div>
          <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
            Contact Number *
          </label>
          <input
            type="tel"
            id="contactNumber"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleInputChange}
            className={`mt-1 block w-full p-3 border rounded-md shadow-sm ${
              errors.contactNumber ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-green-500'
            }`}
            placeholder="Enter your contact number"
          />
          {errors.contactNumber && <p className="mt-1 text-sm text-red-600">{errors.contactNumber}</p>}
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
            placeholder="Create a strong password"
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password *
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className={`mt-1 block w-full p-3 border rounded-md shadow-sm ${
              errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-green-500'
            }`}
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <div className="text-center text-sm text-gray-500">
        Already have an account? <Link to="/login" className="font-medium text-green-600 hover:text-green-500">Sign in</Link>
      </div>
    </div>
  );
};

export default RegisterForm;
