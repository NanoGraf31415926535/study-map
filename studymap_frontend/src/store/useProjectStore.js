import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

export const useProjectStore = create(
  persist(
    (set, get) => ({
      projects: [],
      selectedProject: null,
      documents: {},
      notes: {},
      isLoading: false,
      error: null,

      fetchProjects: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get('/projects/');
          set({ projects: response.data, isLoading: false });
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to fetch projects', isLoading: false });
        }
      },

      createProject: async (projectData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/projects/', projectData);
          set((state) => ({
            projects: [response.data, ...state.projects],
            isLoading: false,
          }));
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to create project', isLoading: false });
          throw error;
        }
      },

      updateProject: async (projectId, projectData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.patch(`/projects/${projectId}/`, projectData);
          set((state) => ({
            projects: state.projects.map((p) => (p.id === projectId ? response.data : p)),
            selectedProject: state.selectedProject?.id === projectId ? response.data : state.selectedProject,
            isLoading: false,
          }));
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to update project', isLoading: false });
          throw error;
        }
      },

      deleteProject: async (projectId) => {
        set({ isLoading: true, error: null });
        try {
          await api.delete(`/projects/${projectId}/`);
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== projectId),
            selectedProject: state.selectedProject?.id === projectId ? null : state.selectedProject,
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to delete project', isLoading: false });
          throw error;
        }
      },

      setSelectedProject: (project) => {
        set({ selectedProject: project });
      },

      fetchDocuments: async (projectId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get(`/projects/${projectId}/documents/`);
          set((state) => ({
            documents: { ...state.documents, [projectId]: response.data },
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to fetch documents', isLoading: false });
        }
      },

      deleteDocument: async (projectId, documentId) => {
        set({ isLoading: true, error: null });
        try {
          await api.delete(`/projects/${projectId}/documents/${documentId}/`);
          set((state) => ({
            documents: {
              ...state.documents,
              [projectId]: (state.documents[projectId] || []).filter((d) => d.id !== documentId),
            },
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to delete document', isLoading: false });
          throw error;
        }
      },

      fetchNotes: async (projectId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get(`/projects/${projectId}/notes/`);
          set((state) => ({
            notes: { ...state.notes, [projectId]: response.data },
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to fetch notes', isLoading: false });
        }
      },

      createNote: async (projectId, noteData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post(`/projects/${projectId}/notes/`, noteData);
          set((state) => ({
            notes: {
              ...state.notes,
              [projectId]: [response.data, ...(state.notes[projectId] || [])],
            },
            isLoading: false,
          }));
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to create note', isLoading: false });
          throw error;
        }
      },

      updateNote: async (projectId, noteId, noteData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.patch(`/projects/${projectId}/notes/${noteId}/`, noteData);
          set((state) => ({
            notes: {
              ...state.notes,
              [projectId]: (state.notes[projectId] || []).map((n) => (n.id === noteId ? response.data : n)),
            },
            isLoading: false,
          }));
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to update note', isLoading: false });
          throw error;
        }
      },

      deleteNote: async (projectId, noteId) => {
        set({ isLoading: true, error: null });
        try {
          await api.delete(`/projects/${projectId}/notes/${noteId}/`);
          set((state) => ({
            notes: {
              ...state.notes,
              [projectId]: (state.notes[projectId] || []).filter((n) => n.id !== noteId),
            },
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to delete note', isLoading: false });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'studymap-projects',
      partialize: (state) => ({
        projects: state.projects,
        selectedProject: state.selectedProject,
      }),
    }
  )
);