import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

export const useMindMapStore = create(
  persist(
    (set, get) => ({
      mindmaps: {},
      currentMindmap: null,
      isGenerating: false,
      isLoading: false,
      error: null,

      fetchMindmaps: async (projectId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get(`/projects/${projectId}/mindmap/`);
          set((state) => ({
            mindmaps: { ...state.mindmaps, [projectId]: response.data },
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to fetch mindmaps', isLoading: false });
        }
      },

      fetchMindmap: async (projectId, mindmapId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get(`/projects/${projectId}/mindmap/${mindmapId}/`);
          set({ currentMindmap: response.data, isLoading: false });
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to fetch mindmap', isLoading: false });
          throw error;
        }
      },

      generateMindmap: async (projectId) => {
        set({ isGenerating: true, error: null });
        try {
          const response = await api.post(`/projects/${projectId}/mindmap/generate/`);
          set((state) => ({
            mindmaps: {
              ...state.mindmaps,
              [projectId]: [response.data, ...(state.mindmaps[projectId] || [])],
            },
            currentMindmap: response.data,
            isGenerating: false,
          }));
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.error || 'Failed to generate mindmap', isGenerating: false });
          throw error;
        }
      },

      setCurrentMindmap: (mindmap) => {
        set({ currentMindmap: mindmap });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'studymap-mindmap',
      partialize: (state) => ({
        mindmaps: state.mindmaps,
        currentMindmap: state.currentMindmap,
      }),
    }
  )
);