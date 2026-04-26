import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';
import { useAuthStore } from './useAuthStore';

export const useSummaryStore = create(
  persist(
    (set, get) => ({
      summaries: {},
      currentSummary: null,
      isGenerating: false,
      isLoading: false,
      error: null,

      fetchSummaries: async (projectId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get(`/projects/${projectId}/summary/generate/`);
          set((state) => ({
            summaries: { ...state.summaries, [projectId]: response.data },
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to fetch summaries', isLoading: false });
        }
      },

      fetchSummary: async (projectId, summaryId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get(`/projects/${projectId}/summary/${summaryId}/`);
          set({ currentSummary: response.data, isLoading: false });
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to fetch summary', isLoading: false });
          throw error;
        }
      },

      generateSummary: async (projectId, type = 'study') => {
        set({ isGenerating: true, error: null });
        try {
          await api.post(`/projects/${projectId}/summary/generate/`, { type });
          const listResponse = await api.get(`/projects/${projectId}/summary/generate/`);
          const newSummaries = listResponse.data;
          const newSummary = newSummaries[0];
          set((state) => ({
            summaries: {
              ...state.summaries,
              [projectId]: newSummaries,
            },
            currentSummary: newSummary,
            isGenerating: false,
          }));
          return newSummary;
        } catch (error) {
          set({ error: error.response?.data?.error || 'Failed to generate summary', isGenerating: false });
          throw error;
        }
      },

      setCurrentSummary: (summary) => set({ currentSummary: summary }),

      clearSummary: () => set({ currentSummary: null }),

      clearError: () => set({ error: null }),

      deleteSummary: async (projectId, summaryId) => {
        set({ isLoading: true, error: null });
        try {
          await api.delete(`/projects/${projectId}/summary/${summaryId}/`);
          set((state) => {
            const projectSummaries = state.summaries[projectId]?.filter(s => s.id !== summaryId) || [];
            return {
              summaries: { ...state.summaries, [projectId]: projectSummaries },
              currentSummary: state.currentSummary?.id === summaryId ? null : state.currentSummary,
              isLoading: false,
            };
          });
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to delete summary', isLoading: false });
          throw error;
        }
      },

      exportSummary: async (projectId, summaryId, format) => {
        const { accessToken } = useAuthStore.getState();
        if (!accessToken) {
          throw new Error('Not authenticated');
        }
        const url = `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/summary/${summaryId}/export/?format=${format}`;
        try {
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Export failed: ${res.status}`);
          }
          const blob = await res.blob();
          const currentSummary = get().currentSummary;
          const filename = `${currentSummary?.title || 'summary'}.${format}`;
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename;
          a.click();
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
        } catch (err) {
          throw new Error(`Export failed: ${err.message}`);
        }
      },
    }),
    {
      name: 'studymap-summary',
      partialize: (state) => ({
        summaries: state.summaries,
        currentSummary: state.currentSummary,
      }),
    }
  )
);