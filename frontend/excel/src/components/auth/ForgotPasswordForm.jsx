import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1); // 1 for email input, 2 for code and new password
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await axios.post('/api/auth/forgotpassword', { email });
      setMessage(`We sent a 6-digit code to ${email}`);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code');
    }
  };
  
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await axios.put(`/api/auth/resetpassword/${code}`, { password });
      setMessage('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000); // Redirect to login after 2s
    } catch (err) {
       setError(err.response?.data?.message || 'Failed to reset password. Code may be invalid or expired.');
    }
  };

  if (step === 2) {
    return (
       <div className="space-y-6 text-center">
        <h2 className="text-2xl font-bold">Fill in the Code</h2>
        {message && <p className="text-green-600 text-sm">{message}</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <form onSubmit={handleResetPassword} className="space-y-4 text-left">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">6-Digit Code</label>
            <input type="text" name="code" value={code} onChange={(e) => setCode(e.target.value)} required className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm" />
          </div>
           <div>
            <label htmlFor="password"className="block text-sm font-medium text-gray-700">New Password</label>
            <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <button type="submit" className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">Reset Password</button>
        </form>
         <div className="text-sm">
            <button onClick={() => setStep(1)} className="font-medium text-green-600 hover:text-green-500">&larr; Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <form onSubmit={handleRequestCode} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Enter Your Email</label>
          <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm" />
        </div>
        <button type="submit" className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">Send Reset Code</button>
      </form>
       <div className="text-center text-sm text-gray-500">
        <Link to="/login" className="font-medium text-green-600 hover:text-green-500">Back to Login</Link>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;