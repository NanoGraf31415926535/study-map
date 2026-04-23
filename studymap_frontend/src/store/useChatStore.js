import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

export const useChatStore = create(
  persist(
    (set, get) => ({
      sessions: {},
      messages: {},
      activeSession: null,
      isLoading: false,
      isSending: false,
      error: null,

      fetchSessions: async (projectId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get(`/projects/${projectId}/sessions/`);
          set((state) => ({
            sessions: { ...state.sessions, [projectId]: response.data },
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to fetch sessions', isLoading: false });
        }
      },

      createSession: async (projectId, mode) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post(`/projects/${projectId}/sessions/`, { mode });
          set((state) => ({
            sessions: {
              ...state.sessions,
              [projectId]: [response.data, ...(state.sessions[projectId] || [])],
            },
            activeSession: response.data,
            messages: { ...state.messages, [response.data.id]: [] },
            isLoading: false,
          }));
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to create session', isLoading: false });
          throw error;
        }
      },

      deleteSession: async (projectId, sessionId) => {
        set({ isLoading: true, error: null });
        try {
          await api.delete(`/projects/${projectId}/sessions/${sessionId}/`);
          set((state) => ({
            sessions: {
              ...state.sessions,
              [projectId]: (state.sessions[projectId] || []).filter((s) => s.id !== sessionId),
            },
            activeSession: state.activeSession?.id === sessionId ? null : state.activeSession,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to delete session', isLoading: false });
          throw error;
        }
      },

      setActiveSession: (session) => {
        set({ activeSession: session });
      },

      fetchMessages: async (projectId, sessionId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get(`/projects/${projectId}/sessions/${sessionId}/`);
          set((state) => ({
            messages: { ...state.messages, [sessionId]: response.data.messages || [] },
            isLoading: false,
          }));
        } catch (error) {
          if (error.response?.status === 404) {
            set({ activeSession: null, isLoading: false });
          } else {
            set({ error: error.response?.data?.detail || 'Failed to fetch messages', isLoading: false });
          }
        }
      },

      sendMessage: async (projectId, sessionId, content) => {
        set({ isSending: true, error: null });
        try {
          const response = await api.post(`/projects/${projectId}/sessions/${sessionId}/message/`, { content });
          set((state) => ({
            messages: {
              ...state.messages,
              [sessionId]: [
                ...(state.messages[sessionId] || []),
                response.data.user_message,
                response.data.assistant_message,
              ],
            },
            isSending: false,
          }));
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.error || 'Failed to send message', isSending: false });
          throw error;
        }
      },

      clearMessages: (sessionId) => {
        set((state) => ({
          messages: { ...state.messages, [sessionId]: [] },
        }));
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'studymap-chat',
      partialize: (state) => ({
        sessions: state.sessions,
        messages: state.messages,
        activeSession: state.activeSession,
      }),
    }
  )
);