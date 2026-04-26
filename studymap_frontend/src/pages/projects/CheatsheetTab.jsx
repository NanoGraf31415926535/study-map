import { useState, useEffect } from 'react'
import { FiZap, FiPlus, FiEdit2, FiTrash2, FiCopy, FiCheck, FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { useGenerationStore } from '../../store/useGenerationStore'
import '../../styles/cheatsheet.css'

export default function CheatsheetTab({ projectId }) {
  const [view, setView] = useState('list')
  const [selectedCheatsheet, setSelectedCheatsheet] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [expandedSections, setExpandedSections] = useState({})
  const [showEditForm, setShowEditForm] = useState(false)
  const [newCheatsheet, setNewCheatsheet] = useState({ title: '', content: { type: 'cheatsheet', title: '', sections: [], quick_ref: [], formula_sheet: [] } })
  const [copied, setCopied] = useState(false)

  const {
    cheatsheets,
    isGenerating,
    error,
    fetchCheatsheets,
    createCheatsheet,
    updateCheatsheet,
    deleteCheatsheet,
    generateCheatsheet: generateCheatsheetApi,
    clearError
  } = useGenerationStore()

  const projectCheatsheets = cheatsheets[projectId] || []

  useEffect(() => {
    fetchCheatsheets(projectId)
  }, [projectId, fetchCheatsheets])

  const handleGenerate = async () => {
    clearError()
    await generateCheatsheetApi(projectId)
    fetchCheatsheets(projectId)
  }

  const handleCreate = async () => {
    if (!newCheatsheet.content.title && !newCheatsheet.title) {
      return
    }
    const cheatsheetData = {
      title: newCheatsheet.title || newCheatsheet.content.title || '',
      content: newCheatsheet.content
    }
    await createCheatsheet(projectId, cheatsheetData)
    setNewCheatsheet({ title: '', content: { type: 'cheatsheet', title: '', sections: [], quick_ref: [], formula_sheet: [] } })
    setShowEditForm(false)
    fetchCheatsheets(projectId)
  }

  const handleEdit = (cheatsheet) => {
    setSelectedCheatsheet(cheatsheet)
    setEditContent(cheatsheet.content)
    setEditTitle(cheatsheet.title)
    setEditMode(true)
    setView('edit')
    const allExpanded = {}
    if (cheatsheet.content?.sections) {
      cheatsheet.content.sections.forEach((_, i) => { allExpanded[i] = true })
    }
    setExpandedSections(allExpanded)
  }

  const handleUpdate = async () => {
    if (!selectedCheatsheet) return
    await updateCheatsheet(projectId, selectedCheatsheet.id, {
      title: editTitle,
      content: editContent
    })
    setEditMode(false)
    fetchCheatsheets(projectId)
  }

  const handleDelete = async (cheatsheetId) => {
    if (!window.confirm('Are you sure you want to delete this cheatsheet?')) return
    await deleteCheatsheet(projectId, cheatsheetId)
    setView('list')
    setSelectedCheatsheet(null)
    fetchCheatsheets(projectId)
  }

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderCheatsheetContent = (content) => {
    if (!content || !content.sections) return null

    return (
      <div className="cheatsheet-content">
        {content.quick_ref?.length > 0 && (
          <div className="mb-6">
            <h3 className="cheatsheet-section-title">Quick Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {content.quick_ref.map((item, i) => (
                <div key={i} className="cheatsheet-quick-ref">
                  <span className="text-amber-500">★</span>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {content.formula_sheet?.length > 0 && (
          <div className="mb-6">
            <h3 className="cheatsheet-section-title">Formula Sheet</h3>
            <div className="overflow-x-auto">
              <table className="cheatsheet-formula-table">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Formula</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {content.formula_sheet.map((formula, i) => (
                    <tr key={i}>
                      <td className="font-medium">{formula.label}</td>
                      <td className="cheatsheet-formula-formula">{formula.formula}</td>
                      <td className="opacity-70">{formula.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {content.sections?.length > 0 && (
          <div>
            <h3 className="cheatsheet-section-title">Sections</h3>
            {content.sections.map((section, i) => (
              <div key={i} className="cheatsheet-section mb-3">
                <button
                  onClick={() => toggleSection(i)}
                  className="cheatsheet-section-btn"
                >
                  <span className="font-medium">{section.heading}</span>
                  {expandedSections[i] ? <FiChevronDown size={18} /> : <FiChevronRight size={18} />}
                </button>
                {expandedSections[i] && (
                  <div className="cheatsheet-section-content">
                    {section.facts?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium opacity-60 mb-2">Facts</h4>
                        <ul>
                          {section.facts.map((fact, j) => (
                            <li key={j} className="cheatsheet-fact text-sm">
                              <span>•</span>
                              <span>{fact}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {section.key_terms?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium opacity-60 mb-2">Key Terms</h4>
                        <div className="space-y-1">
                          {section.key_terms.map((term, j) => (
                            <div key={j} className="cheatsheet-term text-sm">
                              <span className="cheatsheet-term-term">{term.term}:</span>
                              <span className="opacity-70 ml-1">{term.definition}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.watch_out && (
                      <div className="cheatsheet-warning">
                        <span className="cheatsheet-warning-text">⚠️ {section.watch_out}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderJsonEditor = (content, setContentFn) => {
    const handleChange = (path, value) => {
      const newContent = JSON.parse(JSON.stringify(content))
      const keys = path.split('.')
      let obj = newContent
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]]
      }
      obj[keys[keys.length - 1]] = value
      setContentFn(newContent)
    }

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 opacity-70">Title</label>
          <input
            type="text"
            value={content.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            className="edit-form-input"
            placeholder="Cheatsheet title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 opacity-70">Quick Reference (one per line)</label>
          <textarea
            value={content.quick_ref?.join('\n') || ''}
            onChange={(e) => handleChange('quick_ref', e.target.value.split('\n').filter(Boolean))}
            className="edit-form-input h-24 font-mono text-sm"
            placeholder="Enter one item per line"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 opacity-70">Sections</label>
          {content.sections?.map((section, i) => (
            <div key={i} className="p-3 cheatsheet-section mb-2">
              <input
                type="text"
                value={section.heading || ''}
                onChange={(e) => {
                  const newSections = [...content.sections]
                  newSections[i] = { ...section, heading: e.target.value }
                  handleChange('sections', newSections)
                }}
                className="edit-form-input mb-2"
                placeholder="Section heading"
              />
              <textarea
                value={section.facts?.join('\n') || ''}
                onChange={(e) => {
                  const newSections = [...content.sections]
                  newSections[i] = { ...section, facts: e.target.value.split('\n').filter(Boolean) }
                  handleChange('sections', newSections)
                }}
                className="edit-form-input h-20 font-mono text-sm mb-2"
                placeholder="Facts (one per line)"
              />
              <input
                type="text"
                value={section.watch_out || ''}
                onChange={(e) => {
                  const newSections = [...content.sections]
                  newSections[i] = { ...section, watch_out: e.target.value }
                  handleChange('sections', newSections)
                }}
                className="edit-form-input"
                placeholder="Watch out (warning)"
              />
            </div>
          ))}
          <button
            onClick={() => handleChange('sections', [...(content.sections || []), { heading: '', facts: [], key_terms: [], watch_out: '' }])}
            className="add-section-btn text-sm"
          >
            + Add Section
          </button>
        </div>
      </div>
    )
  }

  if (view === 'detail' && selectedCheatsheet) {
    return (
      <div className="cheatsheet-root tab-root">
        <div className="relative z-10 p-3 md:p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { setView('list'); setSelectedCheatsheet(null); }} className="back-btn">
              <FiChevronRight className="rotate-180" size={18} />
              <span>Back</span>
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(selectedCheatsheet)}
                className="px-3 py-2 rounded-lg border border-white/10 flex items-center gap-2 hover:bg-white/5 transition-all"
              >
                <FiEdit2 size={16} />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={() => {
                  copyToClipboard(JSON.stringify(selectedCheatsheet.content, null, 2))
                }}
                className="px-3 py-2 rounded-lg border border-white/10 flex items-center gap-2 hover:bg-white/5 transition-all"
              >
                {copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={() => handleDelete(selectedCheatsheet.id)}
                className="px-3 py-2 rounded-lg delete-btn flex items-center gap-2"
              >
                <FiTrash2 size={16} />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-2">{selectedCheatsheet.title}</h2>
          <p className="text-sm opacity-50 mb-4">
            {selectedCheatsheet.is_auto_generated ? 'Auto-generated' : 'Manual'} • {formatDate(selectedCheatsheet.created_at)}
          </p>

          {renderCheatsheetContent(selectedCheatsheet.content)}
        </div>
      </div>
    )
  }

  if (view === 'edit' && editMode) {
    return (
      <div className="cheatsheet-root tab-root">
        <div className="relative z-10 p-3 md:p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setView('list')} className="back-btn">
              <FiChevronRight className="rotate-180" size={18} />
              <span>Back</span>
            </button>
            <button onClick={handleUpdate} className="px-4 py-2 save-btn rounded-lg">
              Save Changes
            </button>
          </div>
          <h2 className="text-xl font-bold mb-4">{editTitle}</h2>
          {renderJsonEditor(editContent, setEditContent)}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Preview</h3>
            {renderCheatsheetContent(editContent)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cheatsheet-root tab-root">
      <div className="relative z-10 p-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl font-bold">Cheatsheets</h2>
            <p className="text-sm opacity-50">Study aids generated from your documents</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="generate-btn px-4 py-2 rounded-xl font-medium flex items-center gap-2"
            >
              <FiZap size={18} />
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
            <button
              onClick={() => setShowEditForm(true)}
              className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 flex items-center gap-2 transition-all"
            >
              <FiPlus size={18} />
              <span className="hidden sm:inline">Add Manual</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {showEditForm && (
          <div className="mb-6 p-4 cheatsheet-section rounded-xl">
            <h3 className="font-semibold mb-3">Create New Cheatsheet</h3>
            {renderJsonEditor(newCheatsheet.content, (c) => setNewCheatsheet({ ...newCheatsheet, content: c }))}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreate}
                className="px-4 py-2 save-btn rounded-lg"
              >
                Create
              </button>
              <button
                onClick={() => setShowEditForm(false)}
                className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {projectCheatsheets.length === 0 && !showEditForm ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FiZap size={48} className="empty-state-icon mb-4 opacity-30" />
            <p className="opacity-60">No cheatsheets yet.</p>
            <p className="text-sm opacity-40">Generate one from your documents or create manually.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {projectCheatsheets.map((cheatsheet) => (
              <div
                key={cheatsheet.id}
                className="cheatsheet-card p-4 rounded-xl cursor-pointer"
                onClick={() => {
                  const allExpanded = {}
                  if (cheatsheet.content?.sections) {
                    cheatsheet.content.sections.forEach((_, i) => { allExpanded[i] = true })
                  }
                  setExpandedSections(allExpanded)
                  setSelectedCheatsheet(cheatsheet)
                  setView('detail')
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold truncate">{cheatsheet.title}</h3>
                  <span className="text-xs px-2 py-1 rounded shrink-0 opacity-60">
                    {cheatsheet.is_auto_generated ? 'Auto' : 'Manual'}
                  </span>
                </div>
                <p className="text-sm opacity-40 mb-3">
                  {formatDate(cheatsheet.created_at)}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(cheatsheet)
                    }}
                    className="text-sm text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    <FiEdit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(cheatsheet.id)
                    }}
                    className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <FiTrash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}