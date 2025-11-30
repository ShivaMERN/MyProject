import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [showUserDetails, setShowUserDetails] = useState(null);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      fetchUsers();
      fetchStats();
      fetchFiles();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users');
      setUsers(response.data.data);
    } catch (error) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', error);
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await axios.get('/api/files');
      setFiles(response.data.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      await axios.put(`/api/admin/users/${userId}`, updates);
      fetchUsers();
      fetchStats();
    } catch (error) {
      setError('Failed to update user');
      console.error('Error updating user:', error);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/admin/users/${userId}`);
        fetchUsers();
        fetchStats();
      } catch (error) {
        setError('Failed to delete user');
        console.error('Error deleting user:', error);
      }
    }
  };

  const createAdmin = async () => {
    const username = prompt('Enter username:');
    const email = prompt('Enter email:');
    const password = prompt('Enter password:');

    if (username && email && password) {
      try {
        await axios.post('/api/admin/create-admin', { username, email, password });
        fetchUsers();
        fetchStats();
        alert('Admin user created successfully!');
      } catch (error) {
        setError('Failed to create admin user');
        console.error('Error creating admin:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Access denied. Admin privileges required.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Welcome, {user.username} ({user.role})</p>
        </div>

        {error && (
          <div className="bg-red-600 text-white p-4 rounded mb-6">
            {error}
            <button
              onClick={() => setError('')}
              className="float-right text-red-200 hover:text-white"
            >
              ×
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-blue-400">{stats.totalUsers || 0}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Active Users</h3>
            <p className="text-3xl font-bold text-green-400">{stats.activeUsers || 0}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Admin Users</h3>
            <p className="text-3xl font-bold text-purple-400">{stats.adminUsers || 0}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Total Files</h3>
            <p className="text-3xl font-bold text-yellow-400">{stats.totalFiles || 0}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Recent Files</h3>
            <p className="text-3xl font-bold text-orange-400">{stats.recentFiles || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-4 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-2 px-4 ${activeTab === 'users' ? 'border-b-2 border-blue-400 text-blue-400' : 'text-gray-400'}`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`pb-2 px-4 ${activeTab === 'files' ? 'border-b-2 border-blue-400 text-blue-400' : 'text-gray-400'}`}
            >
              Files
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`pb-2 px-4 ${activeTab === 'stats' ? 'border-b-2 border-blue-400 text-blue-400' : 'text-gray-400'}`}
            >
              Statistics
            </button>
          </div>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">User Management</h2>
              {user.role === 'superadmin' && (
                <button
                  onClick={createAdmin}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
                >
                  Create Admin
                </button>
              )}
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left">Username</th>
                      <th className="px-6 py-3 text-left">Email</th>
                      <th className="px-6 py-3 text-left">Role</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Last Login</th>
                      <th className="px-6 py-3 text-left">Login Count</th>
                      <th className="px-6 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-t border-gray-700">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setShowUserDetails(user)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            {user.username}
                          </button>
                        </td>
                        <td className="px-6 py-4">{user.email}</td>
                        <td className="px-6 py-4">
                          <select
                            value={user.role}
                            onChange={(e) => updateUser(user._id, { role: e.target.value })}
                            className="bg-gray-700 text-white px-2 py-1 rounded"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="superadmin">Super Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => updateUser(user._id, { isActive: !user.isActive })}
                            className={`px-2 py-1 rounded text-sm ${
                              user.isActive ? 'bg-green-600' : 'bg-red-600'
                            }`}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                        </td>
                        <td className="px-6 py-4">{user.loginCount || 0}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => deleteUser(user._id)}
                            className="text-red-400 hover:text-red-300"
                            disabled={user._id === user._id}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">File Management</h2>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left">File Name</th>
                      <th className="px-6 py-3 text-left">User</th>
                      <th className="px-6 py-3 text-left">Size</th>
                      <th className="px-6 py-3 text-left">Type</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Upload Date</th>
                      <th className="px-6 py-3 text-left">Rows</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file) => (
                      <tr key={file._id} className="border-t border-gray-700">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium">{file.originalName}</div>
                            <div className="text-sm text-gray-400">{file.fileName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium">{file.user?.username}</div>
                            <div className="text-sm text-gray-400">{file.user?.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{formatFileSize(file.fileSize)}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-600 rounded text-xs">
                            {file.fileType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            file.status === 'processed' ? 'bg-green-600' :
                            file.status === 'failed' ? 'bg-red-600' : 'bg-yellow-600'
                          }`}>
                            {file.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">{formatDate(file.createdAt)}</td>
                        <td className="px-6 py-4">{file.processingResult?.rowCount || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Detailed Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">User Distribution</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Regular Users:</span>
                    <span className="text-blue-400">{stats.totalUsers - stats.adminUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Admin Users:</span>
                    <span className="text-purple-400">{stats.adminUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inactive Users:</span>
                    <span className="text-red-400">{stats.inactiveUsers}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">File Statistics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Files:</span>
                    <span className="text-green-400">{stats.totalFiles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recent Files (30 days):</span>
                    <span className="text-yellow-400">{stats.recentFiles}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">User Details: {showUserDetails.username}</h3>
              <button
                onClick={() => setShowUserDetails(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-3">Account Information</h4>
                <div className="space-y-2">
                  <div><strong>Username:</strong> {showUserDetails.username}</div>
                  <div><strong>Email:</strong> {showUserDetails.email}</div>
                  <div><strong>Role:</strong> {showUserDetails.role}</div>
                  <div><strong>Status:</strong> {showUserDetails.isActive ? 'Active' : 'Inactive'}</div>
                  <div><strong>Created:</strong> {formatDate(showUserDetails.createdAt)}</div>
                  <div><strong>Last Login:</strong> {showUserDetails.lastLogin ? formatDate(showUserDetails.lastLogin) : 'Never'}</div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-3">Security Information</h4>
                <div className="space-y-2">
                  <div><strong>Has Password:</strong> {showUserDetails.hasPassword ? 'Yes' : 'No'}</div>
                  <div><strong>Total Logins:</strong> {showUserDetails.loginCount || 0}</div>
                  <div><strong>Account Age:</strong> {Math.floor((Date.now() - new Date(showUserDetails.createdAt)) / (1000 * 60 * 60 * 24))} days</div>
                </div>
              </div>
            </div>

            {showUserDetails.recentLogins && showUserDetails.recentLogins.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3">Recent Login History</h4>
                <div className="space-y-2">
                  {showUserDetails.recentLogins.map((login, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded">
                      <div className="flex justify-between">
                        <span>{formatDate(login.timestamp)}</span>
                        <span className={login.success ? 'text-green-400' : 'text-red-400'}>
                          {login.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        IP: {login.ipAddress} | {login.userAgent}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
