import { useState, useEffect, useCallback } from 'react';
import { FiEdit, FiZap, FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../../api/axios';
import { useGenerationStore } from '../../store/useGenerationStore';
import ReactMarkdown from 'react-markdown';
import '../../styles/notes.css';

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
    <div className="notes-root tab-root overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4 md:mb-7">
            <h2 className="text-lg md:text-xl font-bold">Notes</h2>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="glow-btn flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px"
              >
                <FiPlus size={14} /> <span className="hide-mobile">New Note</span>
              </button>
            )}
          </div>

          {isCreating && (
            <div className="note-card rounded-2xl p-5 mb-5 fade-up">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Note title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input-field w-full rounded-xl px-4 py-2.5 text-sm placeholder-muted"
                />
                <textarea
                  placeholder="Note content"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={6}
                  className="input-field w-full rounded-xl px-4 py-2.5 text-sm placeholder-muted resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={createNote}
                    className="glow-btn px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setIsCreating(false); setNewTitle(''); setNewContent(''); }}
                    className="note-btn px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="note-card rounded-2xl p-5 fade-up">
                  {editingId === note.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="input-field w-full rounded-xl px-4 py-2.5 text-sm"
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={8}
                        className="input-field w-full rounded-xl px-4 py-2.5 text-sm resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateNote(note.id)}
                          className="glow-btn px-3 py-2 rounded-lg text-sm font-semibold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="note-btn px-3 py-2 rounded-lg text-sm font-medium text-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-100">{note.title || 'Untitled'}</h3>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => enhanceNote(note.id)}
                            disabled={enhanceLoading === note.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-sky-400 hover:bg-sky-400/10 transition-colors disabled:opacity-50"
                          >
                            {enhanceLoading === note.id ? 'Enhancing...' : <><FiZap size={11} /> Enhance</>}
                          </button>
                          <button
                            onClick={() => { setEditingId(note.id); setEditTitle(note.title); setEditContent(note.content); }}
                            className="note-btn px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-300"
                          >
                            <FiEdit size={11} />
                          </button>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="note-btn px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:border-red-400/30"
                          >
                            <FiTrash2 size={11} />
                          </button>
                        </div>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                        <ReactMarkdown>{note.content}</ReactMarkdown>
                      </div>
                      <p className="text-xs text-gray-600 mt-3">
                        {new Date(note.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            !isCreating && (
              <div className="text-center py-16 fade-up">
                <FiEdit className="text-5xl mx-auto mb-3 text-gray-700" />
                <p className="text-gray-500 text-sm">No notes yet. Create one to get started.</p>
              </div>
            )
          )}
        </div>
      </div>
  );
}