import React from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import RegistrationOTPVerification from '../components/auth/RegistrationOTPVerification';

const VerifyRegistrationPage = () => {
  return (
    <AuthLayout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <RegistrationOTPVerification />
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerifyRegistrationPage;
