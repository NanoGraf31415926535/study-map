import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';
import { useAuthStore } from './useAuthStore';

export const useGenerationStore = create(
  persist(
    (set, get) => ({
      decks: {},
      quizzes: {},
      notes: {},
      cheatsheets: {},
      isGenerating: false,
      error: null,

      fetchDecks: async (projectId) => {
        try {
          const response = await api.get(`/projects/${projectId}/flashcard-decks/`);
          set((state) => ({ decks: { ...state.decks, [projectId]: response.data } }));
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to fetch decks' });
        }
      },

      generateFlashcards: async (projectId, count) => {
        set({ isGenerating: true, error: null });
        try {
          const response = await api.post(`/projects/${projectId}/generate/flashcards/`, { count });
          set((state) => ({
            decks: { ...state.decks, [projectId]: [response.data, ...(state.decks[projectId] || [])] },
            isGenerating: false,
          }));
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.error || 'Failed to generate flashcards', isGenerating: false });
          throw error;
        }
      },

      fetchQuizzes: async (projectId) => {
        try {
          const response = await api.get(`/projects/${projectId}/quizzes/`);
          set((state) => ({ quizzes: { ...state.quizzes, [projectId]: response.data } }));
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to fetch quizzes' });
        }
      },

      generateQuiz: async (projectId, count) => {
        set({ isGenerating: true, error: null });
        try {
          const response = await api.post(`/projects/${projectId}/generate/quiz/`, { count });
          set((state) => ({
            quizzes: { ...state.quizzes, [projectId]: [response.data, ...(state.quizzes[projectId] || [])] },
            isGenerating: false,
          }));
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.error || 'Failed to generate quiz', isGenerating: false });
          throw error;
        }
      },

      fetchQuizDetail: async (projectId, quizId) => {
        try {
          const response = await api.get(`/projects/${projectId}/quizzes/${quizId}/`);
          return response.data;
        } catch (error) {
          throw error;
        }
      },

      submitQuiz: async (projectId, quizId, answers) => {
        set({ isGenerating: true, error: null });
        try {
          const response = await api.post(`/projects/${projectId}/quiz/${quizId}/submit/`, { answers });
          set({ isGenerating: false });
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to submit quiz', isGenerating: false });
          throw error;
        }
      },

      reviewFlashcard: async (cardId, quality) => {
        try {
          const response = await api.post(`/flashcards/${cardId}/review/`, { quality });
          return response.data;
        } catch (error) {
          throw error;
        }
      },

      fetchNotes: async (projectId) => {
        try {
          const response = await api.get(`/projects/${projectId}/notes/`);
          set((state) => ({ notes: { ...state.notes, [projectId]: response.data } }));
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to fetch notes' });
        }
      },

      createNote: async (projectId, noteData) => {
        try {
          const response = await api.post(`/projects/${projectId}/notes/`, noteData);
          set((state) => ({
            notes: { ...state.notes, [projectId]: [response.data, ...(state.notes[projectId] || [])] },
          }));
          return response.data;
        } catch (error) {
          throw error;
        }
      },

      updateNote: async (projectId, noteId, noteData) => {
        try {
          const response = await api.patch(`/projects/${projectId}/notes/${noteId}/`, noteData);
          set((state) => ({
            notes: {
              ...state.notes,
              [projectId]: (state.notes[projectId] || []).map((n) => (n.id === noteId ? response.data : n)),
            },
          }));
          return response.data;
        } catch (error) {
          throw error;
        }
      },

      deleteNote: async (projectId, noteId) => {
        try {
          await api.delete(`/projects/${projectId}/notes/${noteId}/`);
          set((state) => ({
            notes: {
              ...state.notes,
              [projectId]: (state.notes[projectId] || []).filter((n) => n.id !== noteId),
            },
          }));
        } catch (error) {
          throw error;
        }
      },

      enhanceNote: async (projectId, noteId) => {
        try {
          const response = await api.post(`/projects/${projectId}/notes/${noteId}/ai-enhance/`);
          return response.data;
        } catch (error) {
          throw error;
        }
      },

      exportQuiz: async (projectId, quizId, format) => {
        const token = useAuthStore.getState().accessToken;
        const url = `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/quiz/${quizId}/export/?format=${format}`;
        try {
          const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `quiz-${quizId}.${format === 'notion' ? 'md' : format}`;
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
        } catch (e) {
          console.error('Export failed:', e);
        }
      },

      exportFlashcards: async (projectId, deckId, format) => {
        const token = useAuthStore.getState().accessToken;
        const url = `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/flashcards/${deckId}/export/?format=${format}`;
        try {
          const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `flashcards-${deckId}.csv`;
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
        } catch (e) {
          console.error('Export failed:', e);
        }
      },

      clearError: () => set({ error: null }),

      fetchCheatsheets: async (projectId) => {
        try {
          const response = await api.get(`/projects/${projectId}/cheatsheets/`);
          set((state) => ({ cheatsheets: { ...state.cheatsheets, [projectId]: response.data } }));
        } catch (error) {
          set({ error: error.response?.data?.detail || 'Failed to fetch cheatsheets' });
        }
      },

      generateCheatsheet: async (projectId) => {
        set({ isGenerating: true, error: null });
        try {
          const response = await api.post(`/projects/${projectId}/cheatsheets/generate/`);
          set((state) => ({
            cheatsheets: { ...state.cheatsheets, [projectId]: [response.data, ...(state.cheatsheets[projectId] || [])] },
            isGenerating: false,
          }));
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.error || 'Failed to generate cheatsheet', isGenerating: false });
          throw error;
        }
      },

      createCheatsheet: async (projectId, data) => {
        try {
          const response = await api.post(`/projects/${projectId}/cheatsheets/`, data);
          set((state) => ({
            cheatsheets: { ...state.cheatsheets, [projectId]: [response.data, ...(state.cheatsheets[projectId] || [])] },
          }));
          return response.data;
        } catch (error) {
          throw error;
        }
      },

      updateCheatsheet: async (projectId, cheatsheetId, data) => {
        try {
          const response = await api.patch(`/projects/${projectId}/cheatsheets/${cheatsheetId}/`, data);
          set((state) => ({
            cheatsheets: {
              ...state.cheatsheets,
              [projectId]: (state.cheatsheets[projectId] || []).map((c) => (c.id === cheatsheetId ? response.data : c)),
            },
          }));
          return response.data;
        } catch (error) {
          throw error;
        }
      },

      deleteCheatsheet: async (projectId, cheatsheetId) => {
        try {
          await api.delete(`/projects/${projectId}/cheatsheets/${cheatsheetId}/`);
          set((state) => ({
            cheatsheets: {
              ...state.cheatsheets,
              [projectId]: (state.cheatsheets[projectId] || []).filter((c) => c.id !== cheatsheetId),
            },
          }));
        } catch (error) {
          throw error;
        }
      },
    }),
    {
      name: 'studymap-generation',
    }
  )
);