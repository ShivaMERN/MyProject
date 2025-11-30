import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-xl font-bold">
          <Link to="/">Excel to Chart</Link>
        </div>
        <nav>
          {!user ? (
            <>
              <Link to="/register" className="mr-4 hover:text-blue-600">Sign up</Link>
              <Link to="/login" className="hover:text-blue-600">Login</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="mr-4 hover:text-blue-600">Dashboard</Link>
              {(user.role === 'admin' || user.role === 'superadmin') && (
                <Link to="/admin" className="mr-4 hover:text-red-600 font-semibold">Admin</Link>
              )}
              <button onClick={handleLogout} className="hover:text-blue-600">Logout</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
