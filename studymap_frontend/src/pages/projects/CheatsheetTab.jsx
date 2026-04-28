import { useState, useEffect, useRef } from 'react'
import { FiZap, FiPlus, FiEdit2, FiTrash2, FiCopy, FiCheck, FiChevronDown, FiChevronRight, FiDownload, FiFile, FiAlertTriangle } from 'react-icons/fi'
import { jsPDF } from 'jspdf'
import { useGenerationStore } from '../../store/useGenerationStore'
import '../../styles/cheatsheet.css'

export default function CheatsheetTab({ projectId }) {
  const contentRef = useRef(null)
  const [view, setView] = useState('list')
  const [selectedCheatsheet, setSelectedCheatsheet] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [expandedSections, setExpandedSections] = useState({})
  const [showEditForm, setShowEditForm] = useState(false)
  const [newCheatsheet, setNewCheatsheet] = useState({ title: '', content: { type: 'cheatsheet', title: '', sections: [], quick_ref: [], formula_sheet: [] } })
  const [copied, setCopied] = useState(false)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)

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

  const handleDownload = () => {
    if (!selectedCheatsheet) return
    const text = formatAsMarkdown(selectedCheatsheet)
    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `${selectedCheatsheet.title || 'cheatsheet'}.md`
    link.href = url
    link.click()
  }

  const handleDownloadPDF = () => {
    if (!selectedCheatsheet) return
    const content = selectedCheatsheet.content

    const sanitizeText = (text) => {
      if (!text) return ''
      return String(text)
        .replace(/[•øþ]/g, (c) => ({ '•': '*', 'ø': 'o', 'þ': 'p' }[c] || c))
        .replace(/[×]/g, 'x')
        .replace(/[α]/g, 'alpha')
        .replace(/[β]/g, 'beta')
        .replace(/[γ]/g, 'gamma')
        .replace(/[ΣΔ]/g, (c) => c === 'Σ' ? 'Sigma' : 'Delta')
        .replace(/[→]/g, '->')
        .replace(/[≤≥]/g, (c) => c === '≤' ? '<=' : '>=')
        .replace(/[≠]/g, '!=')
        .replace(/[±]/g, '+/-')
        .replace(/[%]/g, '')
        .replace(/[Ƒ]/g, 'F')
        .replace(/[Ɣ]/g, '/')
        .replace(/\s+/g, ' ')
    }

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const maxWidth = pageWidth - margin * 2
    let y = margin

    doc.setFontSize(18)
    doc.text(sanitizeText(selectedCheatsheet.title || 'Cheatsheet'), margin, y)
    y += 10

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(sanitizeText(`${selectedCheatsheet.is_auto_generated ? 'Auto-generated' : 'Manual'} cheatsheet`), margin, y)
    doc.text(`Created: ${new Date(selectedCheatsheet.created_at).toLocaleDateString()}`, pageWidth - margin - doc.getTextWidth(`Created: ${new Date(selectedCheatsheet.created_at).toLocaleDateString()}`), y)
    y += 10
    doc.setTextColor(0)

    if (content.quick_ref?.length > 0) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(sanitizeText('Quick Reference'), margin, y)
      y += 8

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      content.quick_ref.forEach((item) => {
        if (y > pageHeight - 20) { doc.addPage(); y = margin }
        const lines = doc.splitTextToSize('* ' + sanitizeText(item), maxWidth)
        doc.text(lines, margin, y)
        y += lines.length * 5 + 2
      })
      y += 5
    }

    if (content.formula_sheet?.length > 0) {
      if (y > pageHeight - 40) { doc.addPage(); y = margin }
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Formula Sheet', margin, y)
      y += 8

      doc.setFontSize(9)
      const colWidths = [40, 60, 60]
      const cols = ['Label', 'Formula', 'Note']
      doc.setFont('helvetica', 'bold')
      let x = margin
      cols.forEach((col, i) => {
        doc.text(sanitizeText(col), x, y)
        x += colWidths[i]
      })
      y += 5

      doc.setFont('helvetica', 'normal')
      content.formula_sheet.forEach((f) => {
        if (y > pageHeight - 15) { doc.addPage(); y = margin }
        x = margin
        const row = [f.label, f.formula, f.note]
        row.forEach((cell, i) => {
          const lines = doc.splitTextToSize(sanitizeText(cell || ''), colWidths[i] - 2)
          doc.text(lines[0] || '', x, y)
          x += colWidths[i]
        })
y += 6
      })
      y += 5
    }

    if (content.sections?.length > 0) {
      content.sections.forEach((section) => {
        if (y > pageHeight - 30) { doc.addPage(); y = margin }
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text(sanitizeText(section.heading), margin, y)
        y += 8

        if (section.facts?.length > 0) {
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.text('Facts', margin, y)
          y += 5

          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          section.facts.forEach((fact) => {
            if (y > pageHeight - 10) { doc.addPage(); y = margin }
            const lines = doc.splitTextToSize('* ' + sanitizeText(fact), maxWidth)
            doc.text(lines, margin, y)
            y += lines.length * 4 + 1
          })
          y += 3
        }

        if (section.key_terms?.length > 0) {
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.text('Key Terms', margin, y)
          y += 5

          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          section.key_terms.forEach((kt) => {
            if (y > pageHeight - 10) { doc.addPage(); y = margin }
            const lines = doc.splitTextToSize(sanitizeText(`${kt.term}: ${kt.definition}`), maxWidth)
            doc.text(lines, margin, y)
            y += lines.length * 4 + 1
          })
          y += 3
        }

        if (section.watch_out) {
          doc.setFontSize(9)
          doc.setTextColor(200, 0, 0)
          const lines = doc.splitTextToSize(`WARNING: ${sanitizeText(section.watch_out)}`, maxWidth)
          doc.text(lines, margin, y)
          doc.setTextColor(0)
          y += lines.length * 4 + 3
        }

        y += 5
      })
    }

    doc.save(`${selectedCheatsheet.title || 'cheatsheet'}.pdf`)
  }

  const formatAsMarkdown = (cheatsheet) => {
    if (!cheatsheet?.content) return ''
    const { content, title, is_auto_generated, created_at } = cheatsheet
    let md = `# ${title || cheatsheet.title}\n\n`
    md += `*${is_auto_generated ? 'Auto-generated' : 'Manual'} cheatsheet*\n`
    md += `*Created: ${new Date(created_at).toLocaleDateString()}*\n\n`
    md += `---\n\n`

    if (content.quick_ref?.length > 0) {
      md += `## Quick Reference\n\n`
      content.quick_ref.forEach((item) => {
        md += `- ${item}\n`
      })
      md += `\n`
    }

    if (content.formula_sheet?.length > 0) {
      md += `## Formula Sheet\n\n`
      md += `| Label | Formula | Note |\n`
      md += `|-------|----------|------|\n`
      content.formula_sheet.forEach((f) => {
        md += `| ${f.label} | ${f.formula} | ${f.note} |\n`
      })
      md += `\n`
    }

    if (content.sections?.length > 0) {
      content.sections.forEach((section) => {
        md += `## ${section.heading}\n\n`
        if (section.facts?.length > 0) {
          md += `### Facts\n\n`
          section.facts.forEach((fact) => {
            md += `- ${fact}\n`
          })
          md += `\n`
        }
        if (section.key_terms?.length > 0) {
          md += `### Key Terms\n\n`
          md += `| Term | Definition |\n`
          md += `| ---- | ----------- |\n`
          section.key_terms.forEach((kt) => {
            md += `| ${kt.term} | ${kt.definition} |\n`
          })
          md += `\n`
        }
        if (section.watch_out) {
          md += `> ⚠️ **Warning:** ${section.watch_out}\n\n`
        }
      })
    }

    return md
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
                      <div className="cheatsheet-warning flex items-center gap-2">
                        <FiAlertTriangle className="text-amber-500 flex-shrink-0" />
                        <span className="cheatsheet-warning-text">{section.watch_out}</span>
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
              <div className="relative">
                <button
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  className="px-3 py-2 rounded-lg border border-white/10 flex items-center gap-2 hover:bg-white/5 transition-all"
                >
                  <FiDownload size={16} />
                  <span className="hidden sm:inline">Download</span>
                </button>
                {showDownloadMenu && (
                  <div className="absolute right-0 top-full mt-1 rounded-lg overflow-hidden z-20 bg-gray-800 border border-white/10">
                    <button
                      onClick={() => { handleDownload(); setShowDownloadMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/5"
                    >
                      <FiFile size={14} /> Markdown (.md)
                    </button>
                    <button
                      onClick={() => { handleDownloadPDF(); setShowDownloadMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/5"
                    >
                      <FiFile size={14} /> PDF (.pdf)
                    </button>
                  </div>
                )}
              </div>
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

          <div ref={contentRef}>
            {renderCheatsheetContent(selectedCheatsheet.content)}
          </div>
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