import { useState, useEffect } from 'react';
import { FiList, FiBookOpen, FiTarget, FiAlertTriangle, FiTrendingUp, FiCheck, FiZap, FiDownload, FiCopy, FiHelpCircle, FiEdit, FiFileText, FiCode, FiFile, FiChevronDown, FiChevronUp, FiAlignLeft, FiTrash2, FiFilePlus } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { useSummaryStore } from '../../store/useSummaryStore';
import '../../styles/summary.css';

const SUMMARY_FORMATS = [
  {
    id: 'cornell',
    name: 'Cornell Notes',
    icon: FiList,
    description: 'Classic format with cues, notes, and synthesis.',
  },
  {
    id: 'study',
    name: 'Study Guide',
    icon: FiBookOpen,
    description: 'Sectioned notes with key terms and takeaways.',
  },
  {
    id: 'research',
    name: 'Research Summary',
    icon: FiTarget,
    description: 'Academic format with methods, findings, conclusions.',
  },
];

export default function SummaryTab({ projectId }) {
  const { summaries, currentSummary, isGenerating, isLoading, fetchSummaries, fetchSummary, generateSummary, setCurrentSummary, deleteSummary, exportSummary } = useSummaryStore();
  const [selectedFormat, setSelectedFormat] = useState('study');
  const [copied, setCopied] = useState(false);
  const [showList, setShowList] = useState(false);
  const [markdownMode, setMarkdownMode] = useState(false);

  const projectSummaries = summaries[projectId] || [];

  useEffect(() => {
    if (projectId) {
      setCurrentSummary(null);
      fetchSummaries(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    const currentIds = projectSummaries.map(s => s.id);
    if (projectSummaries.length > 0 && (!currentSummary || !currentSummary.id || !currentIds.includes(currentSummary.id))) {
      fetchSummary(projectId, projectSummaries[0].id);
    } else if (projectSummaries.length === 0) {
      setCurrentSummary(null);
    }
  }, [projectSummaries]);

  const handleSelectSummary = async (summary) => {
    await fetchSummary(projectId, summary.id);
    setShowList(false);
  };

  const handleGenerate = async () => {
    await generateSummary(projectId, selectedFormat);
    setShowList(true);
  };

  const handleDelete = async (summaryId) => {
    if (!window.confirm('Are you sure you want to delete this summary?')) return;
    await deleteSummary(projectId, summaryId);
    await fetchSummaries(projectId);
  };

  const handleCopy = () => {
    if (!currentSummary) return;
    const text = formatAsMarkdown(currentSummary);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!currentSummary) return;
    const text = formatAsMarkdown(currentSummary);
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${currentSummary.title || 'summary'}.md`;
    link.href = url;
    link.click();
  };

  const handleExportPDF = async () => {
    if (!currentSummary?.id) return;
    try {
      await exportSummary(projectId, currentSummary.id, 'pdf');
    } catch (error) {
      console.error('PDF export failed:', error);
    }
  };

  const handleExportMD = async () => {
    if (!currentSummary?.id) return;
    try {
      await exportSummary(projectId, currentSummary.id, 'md');
    } catch (error) {
      console.error('MD export failed:', error);
    }
  };

  const formatAsMarkdown = (summary) => {
    if (summary.type === 'cornell') {
      return `# ${summary.title}\n\n## Cue Questions\n${summary.cue_questions?.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\n## Main Notes\n${summary.main_notes}\n\n## Summary\n${summary.summary}`;
    }
    if (summary.type === 'study') {
      let md = `# ${summary.title}\n\n`;
      summary.sections?.forEach((section) => {
        md += `## ${section.heading}\n\n${section.content}\n\n`;
        md += `### Key Terms\n| Term | Definition |\n| ---- | ----------- |\n`;
        section.key_terms?.forEach((kt) => {
          md += `| ${kt.term} | ${kt.definition} |\n`;
        });
        md += `\n> **Remember:** ${section.remember_this}\n\n`;
      });
      md += `## Overall Summary\n${summary.overall_summary}`;
      return md;
    }
    if (summary.type === 'research') {
      return `# ${summary.title}\n\n## Abstract\n${summary.abstract}\n\n## Methodology\n${summary.methodology}\n\n## Key Findings\n${summary.key_findings?.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\n## Limitations\n${summary.limitations?.map((l, i) => `${i + 1}. ${l}`).join('\n')}\n\n## Conclusions\n${summary.conclusions}\n\n## Further Reading\n${summary.further_reading_topics?.map((t, i) => `- ${t}`).join('\n')}`;
    }
    return JSON.stringify(summary, null, 2);
  };

  const summaryMarkdown = currentSummary ? formatAsMarkdown(currentSummary) : '';

  const renderSummary = () => {
    if (!currentSummary) return null;

    if (currentSummary.type === 'cornell') {
      return (
        <div className="grid grid-cols-[1fr_3fr] gap-6">
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-text mb-4"><FiHelpCircle className="inline mr-1" /> Cue Questions</h3>
            <ol className="space-y-3">
              {currentSummary.cue_questions?.map((q, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-accent font-medium">{i + 1}.</span>
                  <span className="text-text">{q}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-text mb-4"><FiEdit className="inline mr-1" /> Main Notes</h3>
              <div className="prose prose-invert max-w-none text-text">
                <ReactMarkdown>{currentSummary.main_notes}</ReactMarkdown>
              </div>
            </div>
            <div className="bg-accent/10 rounded-xl p-6 border border-accent/30">
              <h3 className="text-lg font-semibold text-accent mb-2"><FiList className="inline mr-1" /> Summary</h3>
              <p className="text-accent/80">{currentSummary.summary}</p>
            </div>
          </div>
        </div>
      );
    }

    if (currentSummary.type === 'study') {
      return (
        <div className="space-y-6">
          {currentSummary.sections?.map((section, i) => (
            <div key={i} className="bg-card rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-text mb-4">{section.heading}</h3>
              <p className="text-muted mb-4 whitespace-pre-wrap">{section.content}</p>
              {section.key_terms?.length > 0 && (
                <table className="w-full mb-4 text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-muted">Term</th>
                      <th className="text-left py-2 text-muted">Definition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.key_terms.map((kt, j) => (
                      <tr key={j} className="border-b border-gray-800">
                        <td className="py-2 text-text font-medium">{kt.term}</td>
                        <td className="py-2 text-muted">{kt.definition}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="bg-success/10 rounded-lg p-3 border border-success/30">
                <span className="text-sm font-medium text-success"><FiZap className="inline mr-1" /> {section.remember_this}</span>
              </div>
            </div>
          ))}
          {currentSummary.overall_summary && (
            <div className="bg-accent/10 rounded-xl p-6 border border-accent/30">
              <h3 className="text-lg font-semibold text-accent mb-2"><FiList className="inline mr-1" /> Overall Summary</h3>
              <p className="text-accent/80">{currentSummary.overall_summary}</p>
            </div>
          )}
        </div>
      );
    }

    if (currentSummary.type === 'research') {
      return (
        <div className="space-y-6">
          <div className="bg-primary/20 rounded-xl p-6 border border-primary/50">
            <h3 className="text-lg font-semibold text-primary mb-2">Abstract</h3>
            <p className="text-text">{currentSummary.abstract}</p>
          </div>
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-text mb-4"><FiTarget className="inline mr-1" /> Methodology</h3>
            <p className="text-muted">{currentSummary.methodology || 'Not specified'}</p>
          </div>
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-text mb-4"><FiTrendingUp className="inline mr-1" /> Key Findings</h3>
            <ol className="space-y-2">
              {currentSummary.key_findings?.map((f, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-success font-medium">{i + 1}.</span>
                  <span className="text-text">{f}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="bg-warning/10 rounded-xl p-6 border border-warning/30">
            <h3 className="text-lg font-semibold text-warning mb-4"><FiAlertTriangle className="inline mr-1" /> Limitations</h3>
            <ol className="space-y-2">
              {currentSummary.limitations?.map((l, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-warning font-medium">{i + 1}.</span>
                  <span className="text-text">{l}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-text mb-2"><FiTarget className="inline mr-1" /> Conclusions</h3>
            <p className="text-text">{currentSummary.conclusions}</p>
          </div>
          {currentSummary.further_reading_topics?.length > 0 && (
            <div className="bg-surface rounded-xl p-6">
              <h3 className="text-lg font-semibold text-text mb-3"><FiBookOpen className="inline mr-1" /> Further Reading</h3>
              <div className="flex flex-wrap gap-2">
                {currentSummary.further_reading_topics.map((topic, i) => (
                  <span key={i} className="px-3 py-1.5 bg-card rounded-full text-sm text-muted">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return <pre className="bg-card p-6 rounded-xl text-text overflow-x-auto">{JSON.stringify(currentSummary, null, 2)}</pre>;
  };

return (
    <div className="summary-root tab-root overflow-hidden">
        <div className="relative z-10 w-full mx-auto lg:max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            
            {((projectSummaries.length > 0) || !isGenerating) && (
              <div className="w-full lg:w-80 shrink-0 space-y-4">
                <div className="flex items-center gap-2 mb-4 lg:mb-6">
                  <span className="block w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
                    Summaries
                  </span>
                </div>

                <div className="p-4 bg-card/50 rounded-xl border border-gray-800/50">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3 flex items-center gap-2">
                    <FiList size={12} /> Format
                  </p>
                  <div className="space-y-2">
                    {SUMMARY_FORMATS.map((format) => (
                      <button
                        key={format.id}
                        onClick={() => setSelectedFormat(format.id)}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          selectedFormat === format.id 
                            ? 'bg-violet-500/20 border border-violet-500/40' 
                            : 'bg-surface/50 border border-gray-800/50 hover:border-gray-700'
                        }`}
                      >
                        <format.icon className="text-lg mb-1 text-violet-400" />
                        <div className="font-medium text-gray-200 text-sm">{format.name}</div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full mt-4 glow-violet px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all hover:-translate-y-px disabled:opacity-40"
                  >
                    <FiZap size={14} />
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </button>
                </div>

                <button
                  onClick={() => setShowList(!showList)}
                  className="ghost-btn w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 flex items-center justify-center gap-2"
                >
                  <FiFileText size={14} /> {showList ? 'Hide' : 'Show'} List
                  {showList ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
                </button>

                {showList && projectSummaries.length > 0 && (
                  <div className="space-y-2">
                    {projectSummaries.map((summary) => (
                      <button
                        key={summary.id}
                        onClick={() => handleSelectSummary(summary)}
                        className={`w-full p-3 rounded-xl text-left transition-all ${
                          currentSummary?.title === summary.title 
                            ? 'bg-violet-500/20 border border-violet-500/40' 
                            : 'bg-surface/50 border border-gray-800/50 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {summary.type === 'cornell' ? <FiList className="text-violet-400" /> : 
                           summary.type === 'study' ? <FiBookOpen className="text-violet-400" /> : 
                           <FiTarget className="text-violet-400" />}
                          <span className="font-medium text-gray-200 text-sm truncate">{summary.title || summary.type}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1 ml-6">
                          {new Date(summary.generated_at).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 min-w-0">
              {currentSummary && (
                <>
                  <div className="flex flex-wrap items-center gap-2 mb-4 fade-up">
                    <button
                      onClick={() => setMarkdownMode(!markdownMode)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        markdownMode ? 'bg-violet-400 text-gray-950' : 'ghost-btn text-gray-400'
                      }`}
                    >
                      {markdownMode ? 'Standard' : 'Markdown'}
                    </button>
                    <button
                      onClick={handleCopy}
                      className="ghost-btn px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 flex items-center gap-1"
                    >
                      {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={handleExportMD}
                      disabled={!currentSummary?.id}
                      className="ghost-btn px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 flex items-center gap-1 disabled:opacity-30"
                    >
                      .md
                    </button>
                    <button
                      onClick={handleExportPDF}
                      disabled={!currentSummary?.id}
                      className="ghost-btn px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 flex items-center gap-1 disabled:opacity-30"
                    >
                      .pdf
                    </button>
                    <button
                      onClick={() => currentSummary?.id && handleDelete(currentSummary.id)}
                      disabled={!currentSummary?.id}
                      className="ghost-btn px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 flex items-center gap-1 hover:bg-red-500/20 disabled:opacity-30"
                    >
                      Delete
                    </button>
                  </div>
                  {markdownMode ? (
                    <div className="output-box rounded-2xl p-6 fade-up">
                      <pre className="font-mono-study text-sm text-gray-300 whitespace-pre-wrap">
                        {summaryMarkdown}
                      </pre>
                    </div>
                  ) : (
                    <div className="output-box rounded-2xl p-6 fade-up">
                      {renderSummary()}
                    </div>
                  )}
                </>
              )}

              {projectSummaries.length === 0 && !isGenerating && (
                <div className="text-center py-16 fade-up">
                  <FiFileText className="text-5xl mx-auto mb-2 text-gray-700" />
                  <p className="text-gray-500">No summaries yet. Generate one from your documents.</p>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}