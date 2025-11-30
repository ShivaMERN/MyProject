import React from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import RegisterForm from '../components/auth/RegisterForm';

const RegisterPage = () => {
  return (
    <AuthLayout
      title="Create an Account"
      subtitle="Sign up and start exploring our features"
    >
      <RegisterForm />
    </AuthLayout>
  );
};

export default RegisterPage;