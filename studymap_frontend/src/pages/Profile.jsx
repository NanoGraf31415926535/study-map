import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCamera, FiAward } from 'react-icons/fi';
import { useAuthStore } from '../store/useAuthStore';
import Navbar from '../components/Navbar';
import api from '../api/axios';

export default function Profile() {
  const { user, refreshUser } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    avatar: null,
    avatar_url: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        avatar: null,
        avatar_url: user.avatar_url || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        avatar: file,
        avatar_url: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const data = new FormData();
      data.append('username', formData.username);
      data.append('bio', formData.bio);
      if (formData.avatar) {
        data.append('avatar', formData.avatar);
      }

      const response = await api.patch('/auth/profile/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await refreshUser();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setFormData(prev => ({
        ...prev,
        avatar_url: response.data.avatar_url || prev.avatar_url,
      }));
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
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
          <h1 className="text-3xl font-bold text-text mb-8">Profile</h1>

          {message && (
            <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-success/20 text-success' : 'bg-red-500/20 text-red-400'}`}>
              {message.text}
            </div>
          )}

          <div className="bg-card rounded-2xl p-6">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                {formData.avatar_url ? (
                  <img
                    src={formData.avatar_url}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
                    {formData.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-surface rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <FiCamera />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-text">{formData.username}</h2>
                  {user?.is_staff && (
                    <span className="px-2 py-0.5 bg-warning/20 text-warning text-xs font-medium rounded-full flex items-center gap-1">
                      <FiAward /> Admin
                    </span>
                  )}
                </div>
                <p className="text-muted text-sm">{formData.email}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface border border-gray-700 rounded-xl text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 bg-surface/50 border border-gray-700 rounded-xl text-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-3 bg-surface border border-gray-700 rounded-xl text-text focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
