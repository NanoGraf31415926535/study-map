import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Navbar from '../components/Navbar';
import api from '../api/axios';

export default function Settings() {
  const { user } = useAuthStore();
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
    <div className="min-h-screen bg-surface flex">
      <Navbar />
      <div className="flex-1 ml-64 p-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted hover:text-text mb-6 transition-colors">
          <span>←</span> Back
        </button>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-text mb-8">Settings</h1>

          <div className="space-y-8">
            <div className="bg-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-text mb-4">Account</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div>
                    <div className="font-medium text-text">Email</div>
                    <div className="text-sm text-muted">{user?.email}</div>
                  </div>
                  <span className="text-xs text-muted bg-surface px-2 py-1 rounded">Verified</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div>
                    <div className="font-medium text-text">Username</div>
                    <div className="text-sm text-muted">{user?.username}</div>
                  </div>
                  <button onClick={() => navigate('/profile')} className="text-sm text-primary hover:underline">
                    Edit
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-text mb-4">Change Password</h2>
              {passwordMessage && (
                <div className={`mb-4 p-3 rounded-xl text-sm ${passwordMessage.type === 'success' ? 'bg-success/20 text-success' : 'bg-red-500/20 text-red-400'}`}>
                  {passwordMessage.text}
                </div>
              )}
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.old_password}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, old_password: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface border border-gray-700 rounded-xl text-text focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface border border-gray-700 rounded-xl text-text focus:outline-none focus:border-primary"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted mt-1">Minimum 8 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.new_password2}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, new_password2: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface border border-gray-700 rounded-xl text-text focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
                >
                  {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-red-500/30">
              <h2 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h2>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-text">Delete Account</div>
                  <div className="text-sm text-muted">Permanently delete your account and all data</div>
                </div>
                <button className="px-4 py-2 border border-red-500 text-red-400 rounded-xl hover:bg-red-500/10 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
