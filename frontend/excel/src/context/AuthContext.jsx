import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token and verify user
    const token = localStorage.getItem('userToken');
    if (token) {
      // Optionally, verify token with backend
      // For now, assume token is valid if present
      // In a real app, you might decode the token or make a verify endpoint call
      setUser({ token }); // Store minimal user info
    }
    setLoading(false);
  }, []);

  const login = async (identifier, password) => {
    try {
      console.log('Attempting login for:', identifier);
      const response = await axios.post('/api/auth/login', { identifier, password });
      console.log('Login successful:', response.data);
      const { token, ...userData } = response.data;
      localStorage.setItem('userToken', token);
      setUser({ ...userData, token });
      return response.data;
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message === 'Network Error') {
        throw new Error('Unable to connect to server. Please check if the backend server is running.');
      } else {
        throw new Error('Login failed. Please try again.');
      }
    }
  };

  const register = async (name, username, email, contactNumber, password) => {
    try {
      console.log('Attempting registration for:', email);
      const response = await axios.post('/api/auth/register', {
        name,
        username,
        email,
        contactNumber,
        password
      });
      console.log('Registration successful:', response.data);
      // Registration successful, but requires mobile verification
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error.response?.data || error.message);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message === 'Network Error') {
        throw new Error('Unable to connect to server. Please check if the backend server is running.');
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    }
  };

  const sendOTP = async (identifier, type = 'mobile') => {
    try {
      console.log(`Sending ${type} OTP to:`, identifier);
      const endpoint = type === 'mobile' ? '/api/auth/otp/send-mobile' : '/api/auth/otp/send-email';
      const response = await axios.post(endpoint, { [type === 'mobile' ? 'contactNumber' : 'email']: identifier });
      console.log('OTP sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Send OTP failed:', error.response?.data || error.message);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message === 'Network Error') {
        throw new Error('Unable to connect to server. Please check if the backend server is running.');
      } else {
        throw new Error('Failed to send OTP. Please try again.');
      }
    }
  };

  const verifyOTP = async (identifier, otp, type = 'mobile', purpose = 'verification') => {
    try {
      console.log(`Verifying ${type} OTP for:`, identifier);
      let endpoint, payload;

      if (purpose === 'reset') {
        endpoint = '/api/auth/otp/verify-reset';
        payload = { identifier, otp, type };
      } else {
        endpoint = type === 'mobile' ? '/api/auth/otp/verify-mobile' : '/api/auth/otp/verify-email';
        payload = { [type === 'mobile' ? 'contactNumber' : 'email']: identifier, otp };
      }

      const response = await axios.post(endpoint, payload);
      console.log('OTP verified successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('OTP verification failed:', error.response?.data || error.message);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message === 'Network Error') {
        throw new Error('Unable to connect to server. Please check if the backend server is running.');
      } else {
        throw new Error('OTP verification failed. Please try again.');
      }
    }
  };

  const forgotPassword = async (identifier, type = 'email') => {
    try {
      console.log(`Sending password reset OTP to ${type}:`, identifier);
      const endpoint = type === 'mobile' ? '/api/auth/otp/send-mobile' : '/api/auth/otp/send-email';
      const response = await axios.post(endpoint, { [type === 'mobile' ? 'contactNumber' : 'email']: identifier });
      console.log('Password reset OTP sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('Forgot password failed:', error.response?.data || error.message);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message === 'Network Error') {
        throw new Error('Unable to connect to server. Please check if the backend server is running.');
      } else {
        throw new Error('Failed to send password reset OTP. Please try again.');
      }
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userToken');
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    sendOTP,
    verifyOTP,
    forgotPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};