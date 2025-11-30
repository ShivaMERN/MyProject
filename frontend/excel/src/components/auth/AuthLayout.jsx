import React from 'react';
import { LogoGrid } from '../../assets/logo';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-6xl mx-auto p-8">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          
          {/* Left Side: Logo and Welcome Text */}
          <div className="hidden md:flex flex-col items-center justify-center text-center">
            <LogoGrid />
            <h1 className="text-3xl font-bold text-gray-800 mt-6">{title}!</h1>
            <p className="text-gray-500 mt-2">{subtitle}</p>
          </div>

          {/* Right Side: Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="md:hidden text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
                <p className="text-gray-500 mt-2">{subtitle}</p>
            </div>
            {children}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthLayout;