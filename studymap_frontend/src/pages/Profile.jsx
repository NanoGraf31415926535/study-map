import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCamera, FiAward, FiArrowLeft, FiSave } from 'react-icons/fi';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';
import '../styles/profile.css';

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
    <div className="profile-root relative min-h-screen bg-gray-950 text-gray-100">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 md:ml-64 p-4 md:p-8">
            <button onClick={() => navigate(-1)} className="ghost-btn flex items-center gap-2 px-3 py-2 rounded-xl text-sm mb-6 fade-up">
              <FiArrowLeft size={14} /> Back
            </button>

            <div className="max-w-2xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-100 mb-8 fade-up">Profile</h1>

              {message && (
                <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
                  {message.text}
                </div>
              )}

              <div className="profile-card rounded-2xl p-6 fade-up">
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative">
                    {formData.avatar_url ? (
                      <img
                        src={formData.avatar_url}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover border-2 border-white/10"
                      />
                    ) : (
                      <div className="avatar-placeholder w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold">
                        {formData.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="avatar-upload-btn absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
                    >
                      <FiCamera size={14} />
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
                      <h2 className="text-xl font-bold text-gray-100">{formData.username}</h2>
                      {user?.is_staff && (
                        <span className="admin-badge px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1">
                          <FiAward size={10} /> Admin
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm">{formData.email}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="input-field w-full px-4 py-3 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="input-field w-full px-4 py-3 rounded-xl opacity-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-600 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Tell us about yourself..."
                      className="input-field w-full px-4 py-3 rounded-xl resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-3 glow-sky text-sm font-semibold rounded-xl transition-all hover:-translate-y-px disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    <FiSave size={16} />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
