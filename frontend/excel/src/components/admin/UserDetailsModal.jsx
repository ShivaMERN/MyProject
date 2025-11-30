import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';

const UserDetailsModal = ({ user, onClose }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [userActivities, setUserActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) {
      fetchUserDetails();
      fetchUserActivities();
    }
  }, [user]);

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get(`/api/admin/users/${user.userId || user._id}`);
      setUserDetails(response.data.data);
    } catch (err) {
      console.error('Error fetching user details:', err);
    }
  };

  const fetchUserActivities = async () => {
    try {
      const response = await axios.get('/api/activities', {
        params: {
          user: user.userId || user._id,
          limit: 10
        }
      });
      setUserActivities(response.data.data);
    } catch (err) {
      console.error('Error fetching user activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionIcon = (action) => {
    const icons = {
      login: '🔐',
      logout: '🚪',
      file_upload: '📁',
      chart_created: '📊',
      chart_exported: '📤',
      page_visit: '👁️',
      profile_updated: '✏️',
      password_changed: '🔒',
      settings_changed: '⚙️',
      admin_action: '👨‍💼'
    };
    return icons[action] || '📝';
  };

  const getActionColor = (action) => {
    const colors = {
      login: 'bg-green-100 text-green-800',
      logout: 'bg-gray-100 text-gray-800',
      file_upload: 'bg-blue-100 text-blue-800',
      chart_created: 'bg-purple-100 text-purple-800',
      chart_exported: 'bg-indigo-100 text-indigo-800',
      page_visit: 'bg-yellow-100 text-yellow-800',
      profile_updated: 'bg-orange-100 text-orange-800',
      password_changed: 'bg-red-100 text-red-800',
      settings_changed: 'bg-gray-100 text-gray-800',
      admin_action: 'bg-pink-100 text-pink-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12">
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-lg font-medium text-white">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                {user.username || 'Unknown User'}
              </h3>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-8 border-b border-gray-200 mt-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'activities'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Recent Activities
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            User Details
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">User Role</h4>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {userDetails?.role || user.role || 'user'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Last Login</h4>
                <p className="text-lg font-semibold text-gray-900">
                  {userDetails?.lastLogin ? formatDate(userDetails.lastLogin) : 'Never'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Account Status</h4>
                <p className="text-lg font-semibold text-gray-900">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    userDetails?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {userDetails?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Total Activities</h4>
                <p className="text-lg font-semibold text-gray-900">
                  {userActivities.length}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Member Since</h4>
                <p className="text-lg font-semibold text-gray-900">
                  {userDetails?.createdAt ? formatDate(userDetails.createdAt) : 'Unknown'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Last Activity</h4>
                <p className="text-lg font-semibold text-gray-900">
                  {userActivities.length > 0 ? formatDate(userActivities[0].timestamp) : 'No recent activity'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : userActivities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No activities found for this user.</p>
                </div>
              ) : (
                userActivities.map((activity) => (
                  <div key={activity._id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-lg mr-3">{getActionIcon(activity.action)}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {activity.action.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}>
                          {activity.action}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">Additional Details:</p>
                        <div className="mt-1 text-xs text-gray-600">
                          {Object.entries(activity.metadata).map(([key, value]) => (
                            <span key={key} className="inline-block bg-gray-200 rounded px-2 py-1 mr-2 mb-1">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Basic Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500">Username</label>
                      <p className="text-sm font-medium text-gray-900">{userDetails?.username || user.username || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Email</label>
                      <p className="text-sm font-medium text-gray-900">{userDetails?.email || user.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Role</label>
                      <p className="text-sm font-medium text-gray-900 capitalize">{userDetails?.role || user.role || 'user'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Status</label>
                      <p className="text-sm font-medium text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          userDetails?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {userDetails?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Account Statistics</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500">Member Since</label>
                      <p className="text-sm font-medium text-gray-900">
                        {userDetails?.createdAt ? formatDate(userDetails.createdAt) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Last Login</label>
                      <p className="text-sm font-medium text-gray-900">
                        {userDetails?.lastLogin ? formatDate(userDetails.lastLogin) : 'Never'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Total Activities</label>
                      <p className="text-sm font-medium text-gray-900">{userActivities.length}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Account ID</label>
                      <p className="text-sm font-medium text-gray-900">{userDetails?._id || user._id || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-200 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
