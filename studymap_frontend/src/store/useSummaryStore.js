import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

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
          const response = await api.post(`/projects/${projectId}/summary/generate/`, { type });
          set((state) => ({
            summaries: {
              ...state.summaries,
              [projectId]: [response.data, ...(state.summaries[projectId] || [])],
            },
            currentSummary: response.data,
            isGenerating: false,
          }));
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.error || 'Failed to generate summary', isGenerating: false });
          throw error;
        }
      },

      setCurrentSummary: (summary) => set({ currentSummary: summary }),

      clearSummary: () => set({ currentSummary: null }),

      clearError: () => set({ error: null }),
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