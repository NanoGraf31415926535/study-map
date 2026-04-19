import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAward, FiBarChart2, FiUsers, FiFolder, FiTrendingUp, FiActivity, FiShield, FiShieldOff } from 'react-icons/fi';
import { useAuthStore } from '../store/useAuthStore';
import Navbar from '../components/Navbar';
import api from '../api/axios';

export default function Admin() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [apiLogs, setApiLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');
  const [message, setMessage] = useState(null);
  const [logsOffset, setLogsOffset] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (!user?.is_staff) {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'api-logs') {
      fetchApiLogs();
    }
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, usersRes] = await Promise.all([
        api.get('/auth/admin/analytics/'),
        api.get('/auth/admin/users/'),
      ]);
      setAnalytics(analyticsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApiLogs = async (offset = 0) => {
    if (activeTab !== 'api-logs' && offset > 0) return;
    setLogsLoading(true);
    try {
      const res = await api.get(`/auth/admin/api-logs/?limit=50&offset=${offset}`);
      if (offset === 0) {
        setApiLogs(res.data.logs);
      } else {
        setApiLogs(prev => [...prev, ...res.data.logs]);
      }
      setLogsTotal(res.data.total);
      setLogsOffset(offset);
    } catch (error) {
      console.error('Failed to fetch API logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const toggleAdminStatus = async (userId, currentStatus) => {
    try {
      await api.patch(`/auth/admin/users/${userId}/`, { is_staff: !currentStatus });
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_staff: !currentStatus } : u
      ));
      setMessage({ type: 'success', text: 'User updated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update user' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const toggleBlockStatus = async (userId, currentBlocked) => {
    try {
      await api.patch(`/auth/admin/users/${userId}/`, { is_blocked: !currentBlocked });
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_blocked: !currentBlocked } : u
      ));
      setMessage({ type: 'success', text: `User ${!currentBlocked ? 'blocked' : 'unblocked'} successfully` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update user status' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (user?.is_staff !== true) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface flex">
      <Navbar />
      <div className="flex-1 ml-64 p-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted hover:text-text mb-6 transition-colors">
          <span>←</span> Back
        </button>

        <div className="flex items-center gap-4 mb-8">
          <FiAward className="text-3xl" />
          <h1 className="text-3xl font-bold text-text">Admin Panel</h1>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-success/20 text-success' : 'bg-red-500/20 text-red-400'}`}>
            {message.text}
          </div>
        )}

        <div className="flex gap-4 mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${activeTab === 'analytics' ? 'text-primary border-primary' : 'text-muted border-transparent hover:text-text'}`}
          >
            <FiBarChart2 className="inline mr-1" /> Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${activeTab === 'users' ? 'text-primary border-primary' : 'text-muted border-transparent hover:text-text'}`}
          >
            <FiUsers className="inline mr-1" /> Users
          </button>
          <button
            onClick={() => setActiveTab('api-logs')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${activeTab === 'api-logs' ? 'text-primary border-primary' : 'text-muted border-transparent hover:text-text'}`}
          >
            <FiActivity className="inline mr-1" /> API Logs
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {activeTab === 'analytics' && analytics && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FiUsers className="text-3xl" />
                    <div>
                      <div className="text-3xl font-bold text-text">{analytics.total_users}</div>
                      <div className="text-sm text-muted">Total Users</div>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FiFolder className="text-3xl" />
                    <div>
                      <div className="text-3xl font-bold text-text">{analytics.total_projects}</div>
                      <div className="text-sm text-muted">Total Projects</div>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FiTrendingUp className="text-3xl" />
                    <div>
                      <div className="text-3xl font-bold text-success">+{analytics.new_users_week}</div>
                      <div className="text-sm text-muted">New Users (7 days)</div>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FiAward className="text-3xl" />
                    <div>
                      <div className="text-3xl font-bold text-warning">{analytics.admin_count}</div>
                      <div className="text-sm text-muted">Admins</div>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 lg:col-span-4 bg-card rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-text mb-4">Growth Overview</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface rounded-xl p-4">
                      <div className="text-2xl font-bold text-primary">{analytics.new_users_week}</div>
                      <div className="text-sm text-muted">New users this week</div>
                    </div>
                    <div className="bg-surface rounded-xl p-4">
                      <div className="text-2xl font-bold text-success">{analytics.new_users_month}</div>
                      <div className="text-sm text-muted">New users this month</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-card rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-surface">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted">User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Projects</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Joined</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-surface/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                              {u.username?.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-text">{u.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted">{u.email}</td>
                        <td className="px-6 py-4 text-muted">{u.project_count}</td>
                        <td className="px-6 py-4 text-muted">{u.date_joined_formatted}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {u.is_staff ? (
                              <span className="px-2 py-1 bg-warning/20 text-warning text-xs font-medium rounded-full w-fit">Admin</span>
                            ) : (
                              <span className="px-2 py-1 bg-surface text-muted text-xs font-medium rounded-full w-fit">User</span>
                            )}
                            {u.is_blocked && (
                              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full w-fit">Blocked</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {u.id !== user?.id && (
                              <>
                                <button
                                  onClick={() => toggleAdminStatus(u.id, u.is_staff)}
                                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                    u.is_staff
                                      ? 'bg-surface hover:bg-gray-700 text-muted'
                                      : 'bg-warning/20 hover:bg-warning/30 text-warning'
                                  }`}
                                >
                                  {u.is_staff ? 'Remove Admin' : 'Make Admin'}
                                </button>
                                <button
                                  onClick={() => toggleBlockStatus(u.id, u.is_blocked)}
                                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                    u.is_blocked
                                      ? 'bg-success/20 hover:bg-success/30 text-success'
                                      : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                                  }`}
                                >
                                  {u.is_blocked ? 'Unblock' : 'Block'}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'api-logs' && (
              <div className="bg-card rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                  <span className="text-muted text-sm">Showing {apiLogs.length} of {logsTotal} logs</span>
                </div>
                <table className="w-full">
                  <thead className="bg-surface">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Timestamp</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted">User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Method</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Endpoint</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Time (ms)</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {apiLogs.map((log, idx) => (
                      <tr key={`${log.id}-${idx}`} className="hover:bg-surface/50">
                        <td className="px-6 py-4 text-muted text-sm whitespace-nowrap">{formatTime(log.timestamp)}</td>
                        <td className="px-6 py-4 text-text">{log.username || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            log.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                            log.method === 'POST' ? 'bg-green-500/20 text-green-400' :
                            log.method === 'PATCH' ? 'bg-yellow-500/20 text-yellow-400' :
                            log.method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {log.method}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted text-sm max-w-xs truncate">{log.endpoint}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            log.status_code < 300 ? 'bg-green-500/20 text-green-400' :
                            log.status_code < 400 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {log.status_code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted">{log.response_time}ms</td>
                        <td className="px-6 py-4 text-muted text-sm">{log.ip_address || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {apiLogs.length < logsTotal && (
                  <div className="p-4 border-t border-gray-800">
                    <button
                      onClick={() => fetchApiLogs(logsOffset + 50)}
                      disabled={logsLoading}
                      className="w-full py-2 bg-surface hover:bg-gray-700 text-muted rounded-lg transition-colors disabled:opacity-50"
                    >
                      {logsLoading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}