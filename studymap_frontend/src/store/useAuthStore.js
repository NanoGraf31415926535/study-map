import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (tokens, user) => {
        set({
          accessToken: tokens.access,
          refreshToken: tokens.refresh,
          user: user,
          isAuthenticated: true,
        });
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },

      setUser: (user) => {
        set({ user });
      },

      refreshUser: async () => {
        try {
          const response = await api.get('/auth/profile/');
          set({ user: response.data });
          return response.data;
        } catch (error) {
          console.error('Failed to refresh user:', error);
          return null;
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'studymap-auth',
    }
  )
);