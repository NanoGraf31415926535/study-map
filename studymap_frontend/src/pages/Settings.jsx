import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../context/ThemeContext';
import { FiArrowLeft, FiCheck, FiAlertTriangle, FiMoon, FiSun } from 'react-icons/fi';
import api from '../api/axios';
import '../styles/settings.css';

export default function Settings() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password2: '',
  });
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordMessage(null);

    try {
      await api.post('/auth/profile/password/', passwordData);
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ old_password: '', new_password: '', new_password2: '' });
    } catch (error) {
      const errors = error.response?.data;
      let errorMsg = 'Failed to change password';
      if (errors) {
        if (errors.old_password) errorMsg = errors.old_password[0];
        else if (errors.new_password) errorMsg = errors.new_password[0];
        else if (errors.new_password2) errorMsg = errors.new_password2[0];
        else if (errors.non_field_errors) errorMsg = errors.non_field_errors[0];
      }
      setPasswordMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="settings-root relative min-h-screen">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 md:ml-64 p-4 md:p-8">
            <button onClick={() => navigate(-1)} className="ghost-btn flex items-center gap-2 px-3 py-2 rounded-xl text-sm mb-6 fade-up">
              <FiArrowLeft size={14} /> Back
            </button>

            <div className="max-w-2xl mx-auto">
              <h1 className="text-2xl font-bold mb-8 fade-up">Settings</h1>

              <div className="space-y-6">
                <div className="settings-card rounded-2xl p-6 fade-up">
                  <h2 className="text-lg font-bold mb-4">Appearance</h2>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? <FiMoon size={20} /> : <FiSun size={20} />}
                      <div>
                        <div className="font-medium">Theme</div>
                        <div className="text-sm opacity-60">Currently using {theme} mode</div>
                      </div>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="theme-toggle px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    >
                      Switch to {theme === 'dark' ? 'Light' : 'Dark'}
                    </button>
                  </div>
                </div>

                <div className="settings-card rounded-2xl p-6 fade-up">
                  <h2 className="text-lg font-bold text-gray-100 mb-4">Account</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-white/[0.07]">
                      <div>
                        <div className="font-medium text-gray-300">Email</div>
                        <div className="text-sm text-gray-500">{user?.email}</div>
                      </div>
                      <span className="text-xs verified-badge px-2.5 py-1 rounded-lg">Verified</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-white/[0.07]">
                      <div>
                        <div className="font-medium text-gray-300">Username</div>
                        <div className="text-sm text-gray-500">{user?.username}</div>
                      </div>
                      <button onClick={() => navigate('/profile')} className="text-sm text-sky-400 hover:underline">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>

                <div className="settings-card rounded-2xl p-6 fade-up">
                  <h2 className="text-lg font-bold text-gray-100 mb-4">Change Password</h2>
                  {passwordMessage && (
                    <div className={`mb-4 p-3 rounded-xl text-sm ${passwordMessage.type === 'success' ? 'message-success' : 'message-error'}`}>
                      {passwordMessage.text}
                    </div>
                  )}
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                      <input
                        type="password"
                        value={passwordData.old_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, old_password: e.target.value }))}
                        className="input-field w-full px-4 py-3 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                      <input
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                        className="input-field w-full px-4 py-3 rounded-xl"
                        required
                        minLength={8}
                      />
                      <p className="text-xs text-gray-600 mt-1">Minimum 8 characters</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.new_password2}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, new_password2: e.target.value }))}
                        className="input-field w-full px-4 py-3 rounded-xl"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="w-full py-3 glow-sky text-sm font-semibold rounded-xl transition-all hover:-translate-y-px disabled:opacity-40"
                    >
                      {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                    </button>
                  </form>
                </div>

                <div className="danger-card rounded-2xl p-6 fade-up">
                  <h2 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                    <FiAlertTriangle size={18} /> Danger Zone
                  </h2>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-300">Delete Account</div>
                      <div className="text-sm text-gray-500">Permanently delete your account and all data</div>
                    </div>
                    <button className="danger-btn px-4 py-2 text-sm font-medium rounded-xl">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
