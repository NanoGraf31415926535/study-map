import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAward, FiBarChart2, FiUsers, FiFolder, FiTrendingUp, FiActivity, FiArrowLeft, FiChevronDown } from 'react-icons/fi';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';
import '../styles/admin.css';

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
    <div className="admin-root relative min-h-screen bg-gray-950 text-gray-100">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 md:ml-64 p-4 md:p-8">
            <button onClick={() => navigate(-1)} className="ghost-btn flex items-center gap-2 px-3 py-2 rounded-xl text-sm mb-6 fade-up">
              <FiArrowLeft size={14} /> Back
            </button>

            <div className="flex items-center gap-4 mb-8 fade-up">
              <FiAward className="text-3xl text-amber-400" />
              <h1 className="text-2xl font-bold text-gray-100">Admin Panel</h1>
            </div>

            {message && (
              <div className={`mb-6 p-4 rounded-xl text-sm ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
                {message.text}
              </div>
            )}

            <div className="flex gap-4 mb-8 border-b border-white/[0.07] fade-up overflow-x-auto">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`tab-btn px-4 py-3 font-medium transition-colors ${activeTab === 'analytics' ? 'active' : ''}`}
              >
                <FiBarChart2 className="inline mr-1.5" size={14} /> Analytics
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`tab-btn px-4 py-3 font-medium transition-colors ${activeTab === 'users' ? 'active' : ''}`}
              >
                <FiUsers className="inline mr-1.5" size={14} /> Users
              </button>
              <button
                onClick={() => setActiveTab('api-logs')}
                className={`tab-btn px-4 py-3 font-medium transition-colors ${activeTab === 'api-logs' ? 'active' : ''}`}
              >
                <FiActivity className="inline mr-1.5" size={14} /> API Logs
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
              </div>
            ) : (
              <>
                {activeTab === 'analytics' && analytics && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-up overflow-x-auto">
                    <div className="admin-card rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="stat-icon users">
                          <FiUsers size={18} />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-100">{analytics.total_users}</div>
                          <div className="text-xs text-gray-500">Total Users</div>
                        </div>
                      </div>
                    </div>

                    <div className="admin-card rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="stat-icon projects">
                          <FiFolder size={18} />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-100">{analytics.total_projects}</div>
                          <div className="text-xs text-gray-500">Total Projects</div>
                        </div>
                      </div>
                    </div>

                    <div className="admin-card rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="stat-icon growth">
                          <FiTrendingUp size={18} />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-emerald-400">+{analytics.new_users_week}</div>
                          <div className="text-xs text-gray-500">New Users (7 days)</div>
                        </div>
                      </div>
                    </div>

                    <div className="admin-card rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="stat-icon admins">
                          <FiAward size={18} />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-amber-400">{analytics.admin_count}</div>
                          <div className="text-xs text-gray-500">Admins</div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 lg:col-span-4 admin-card rounded-2xl p-5 fade-up">
                      <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Growth Overview</h3>
                      <div className="grid grid-cols-2 gap-4 overflow-x-auto">
                        <div className="bg-white/[0.03] rounded-xl p-4">
                          <div className="text-xl font-bold text-sky-400 font-mono">{analytics.new_users_week}</div>
                          <div className="text-xs text-gray-500 mt-1">New users this week</div>
                        </div>
                        <div className="bg-white/[0.03] rounded-xl p-4">
                          <div className="text-xl font-bold text-emerald-400 font-mono">{analytics.new_users_month}</div>
                          <div className="text-xs text-gray-500 mt-1">New users this month</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'users' && (
                  <div className="admin-card rounded-2xl overflow-hidden fade-up">
                    <table className="w-full">
                      <thead className="table-head">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Projects</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06]">
                        {users.map((u) => (
                          <tr key={u.id} className="table-row hover:bg-white/[0.03]">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="avatar w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold">
                                  {u.username?.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-gray-200">{u.username}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-gray-400 text-sm">{u.email}</td>
                            <td className="px-5 py-4 text-gray-400 font-mono text-sm">{u.project_count}</td>
                            <td className="px-5 py-4 text-gray-400 text-sm">{u.date_joined_formatted}</td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-1.5">
                                {u.is_staff ? (
                                  <span className="badge-admin px-2 py-1 text-xs font-medium rounded-lg w-fit">Admin</span>
                                ) : (
                                  <span className="badge-user px-2 py-1 text-xs font-medium rounded-lg w-fit">User</span>
                                )}
                                {u.is_blocked && (
                                  <span className="badge-blocked px-2 py-1 text-xs font-medium rounded-lg w-fit">Blocked</span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex gap-2">
                                {u.id !== user?.id && (
                                  <>
                                    <button
                                      onClick={() => toggleAdminStatus(u.id, u.is_staff)}
                                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                        u.is_staff
                                          ? 'ghost-btn hover:text-gray-300'
                                          : 'badge-admin hover:brightness-110'
                                      }`}
                                    >
                                      {u.is_staff ? 'Remove Admin' : 'Make Admin'}
                                    </button>
                                    <button
                                      onClick={() => toggleBlockStatus(u.id, u.is_blocked)}
                                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                        u.is_blocked
                                          ? 'badge-admin text-emerald-400 hover:brightness-110'
                                          : 'badge-blocked hover:brightness-110'
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
                  <div className="admin-card rounded-2xl overflow-hidden fade-up">
                    <div className="p-4 border-b border-white/[0.07]">
                      <span className="text-gray-500 text-xs">Showing {apiLogs.length} of {logsTotal} logs</span>
                    </div>
                    <table className="w-full">
                      <thead className="table-head">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Endpoint</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ms</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06]">
                        {apiLogs.map((log, idx) => (
                          <tr key={`${log.id}-${idx}`} className="table-row hover:bg-white/[0.03]">
                            <td className="px-4 py-3 text-gray-500 text-xs font-mono whitespace-nowrap">{formatTime(log.timestamp)}</td>
                            <td className="px-4 py-3 text-gray-300 text-sm">{log.username || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`method-badge ${
                                log.method === 'GET' ? 'method-get' :
                                log.method === 'POST' ? 'method-post' :
                                log.method === 'PATCH' ? 'method-patch' :
                                log.method === 'DELETE' ? 'method-delete' :
                                'method-default'
                              }`}>
                                {log.method}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs font-mono max-w-[200px] truncate">{log.endpoint}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-mono font-medium ${
                                log.status_code < 300 ? 'status-2xx' :
                                log.status_code < 400 ? 'status-3xx' :
                                log.status_code < 500 ? 'status-4xx' :
                                'status-5xx'
                              }`}>
                                {log.status_code}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.response_time}ms</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{log.ip_address || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {apiLogs.length < logsTotal && (
                      <div className="p-4 border-t border-white/[0.07]">
                        <button
                          onClick={() => fetchApiLogs(logsOffset + 50)}
                          disabled={logsLoading}
                          className="w-full py-2 ghost-btn text-sm rounded-lg disabled:opacity-40"
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
      </div>
  );
}