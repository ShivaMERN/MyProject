import React from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';

const ForgotPasswordPage = () => {
    return (
        <AuthLayout
            title="Forgot Password"
            subtitle="No worries! Enter your email to reset it"
        >
            <ForgotPasswordForm />
        </AuthLayout>
    );
};

export default ForgotPasswordPage;