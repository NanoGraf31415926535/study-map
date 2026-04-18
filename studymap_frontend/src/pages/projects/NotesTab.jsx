import { useState, useEffect, useCallback } from 'react';
import { FiEdit, FiZap } from 'react-icons/fi';
import api from '../../api/axios';
import { useGenerationStore } from '../../store/useGenerationStore';
import ReactMarkdown from 'react-markdown';

export default function NotesTab({ projectId, notes: initialNotes, onRefresh }) {
  const [notes, setNotes] = useState(initialNotes || []);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [enhanceLoading, setEnhanceLoading] = useState(null);
  const { enhanceNote: enhanceNoteAction } = useGenerationStore();

  useEffect(() => {
    setNotes(initialNotes || []);
  }, [initialNotes]);

  const createNote = useCallback(async () => {
    if (!newTitle.trim() && !newContent.trim()) return;
    try {
      const res = await api.post(`/projects/${projectId}/notes/`, {
        title: newTitle || 'Untitled Note',
        content: newContent,
      });
      setNotes(prev => [res.data, ...prev]);
      setIsCreating(false);
      setNewTitle('');
      setNewContent('');
      onRefresh?.();
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  }, [projectId, newTitle, newContent, onRefresh]);

  const updateNote = useCallback(async (noteId) => {
    try {
      const res = await api.patch(`/projects/${projectId}/notes/${noteId}/`, {
        title: editTitle,
        content: editContent,
      });
      setNotes(prev => prev.map(n => n.id === noteId ? res.data : n));
      setEditingId(null);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  }, [projectId, editTitle, editContent, onRefresh]);

  const deleteNote = useCallback(async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.delete(`/projects/${projectId}/notes/${noteId}/`);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      onRefresh?.();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }, [projectId, onRefresh]);

  const enhanceNote = useCallback(async (noteId) => {
    setEnhanceLoading(noteId);
    try {
      const res = await api.post(`/projects/${projectId}/notes/${noteId}/ai-enhance/`);
      setEditContent(res.data.enhanced);
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: res.data.enhanced } : n));
      await api.patch(`/projects/${projectId}/notes/${noteId}/`, { content: res.data.enhanced });
    } catch (error) {
      console.error('Failed to enhance note:', error);
    } finally {
      setEnhanceLoading(null);
    }
  }, [projectId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text">Notes</h2>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors"
          >
            + New Note
          </button>
        )}
      </div>

      {isCreating && (
        <div className="bg-card rounded-xl p-6 border border-gray-700 space-y-4">
          <input
            type="text"
            placeholder="Note title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-surface border border-gray-700 rounded-lg px-4 py-2 text-text placeholder-muted focus:outline-none focus:border-primary"
          />
          <textarea
            placeholder="Note content"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={6}
            className="w-full bg-surface border border-gray-700 rounded-lg px-4 py-2 text-text placeholder-muted focus:outline-none focus:border-primary resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={createNote}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => { setIsCreating(false); setNewTitle(''); setNewContent(''); }}
              className="px-4 py-2 bg-surface hover:bg-gray-700 text-muted font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-card rounded-xl p-5 border border-gray-800">
              {editingId === note.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-surface border border-gray-700 rounded-lg px-4 py-2 text-text focus:outline-none focus:border-primary"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={8}
                    className="w-full bg-surface border border-gray-700 rounded-lg px-4 py-2 text-text focus:outline-none focus:border-primary resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateNote(note.id)}
                      className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 bg-surface hover:bg-gray-700 text-muted text-sm font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-text">{note.title || 'Untitled'}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => enhanceNote(note.id)}
                        disabled={enhanceLoading === note.id}
                        className="px-2 py-1 text-xs text-accent hover:text-accent/80 disabled:opacity-50"
                      >
                        {enhanceLoading === note.id ? 'Enhancing...' : <><FiZap className="inline" /> Enhance</>}
                      </button>
                      <button
                        onClick={() => { setEditingId(note.id); setEditTitle(note.title); setEditContent(note.content); }}
                        className="px-2 py-1 text-xs text-muted hover:text-text"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="px-2 py-1 text-xs text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none text-text">
                    <ReactMarkdown>{note.content}</ReactMarkdown>
                  </div>
                  <p className="text-xs text-muted mt-3">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !isCreating && (
          <div className="text-center py-12 text-muted">
            <FiEdit className="text-4xl mb-2" />
            <p>No notes yet. Create one to get started.</p>
          </div>
        )
      )}
    </div>
  );
}