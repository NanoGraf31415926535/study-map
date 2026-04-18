import { useState, useEffect } from 'react';
import { FiList, FiBookOpen, FiTarget, FiAlertTriangle, FiTrendingUp, FiCheck, FiZap, FiDownload, FiCopy, FiHelpCircle, FiEdit } from 'react-icons/fi';
import { useSummaryStore } from '../../store/useSummaryStore';

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
  const { summaries, currentSummary, isGenerating, fetchSummaries, fetchSummary, generateSummary, setCurrentSummary } = useSummaryStore();
  const [selectedFormat, setSelectedFormat] = useState('study');
  const [copied, setCopied] = useState(false);
  const [showList, setShowList] = useState(false);

  const projectSummaries = summaries[projectId] || [];

  useEffect(() => {
    if (projectId) {
      fetchSummaries(projectId);
    }
  }, [projectId, fetchSummaries]);

  useEffect(() => {
    if (projectSummaries.length > 0 && !currentSummary) {
      fetchSummary(projectId, projectSummaries[0].id);
    }
  }, [projectSummaries, currentSummary]);

  const handleSelectSummary = async (summary) => {
    await fetchSummary(projectId, summary.id);
    setShowList(false);
  };

  const handleGenerate = async () => {
    await generateSummary(projectId, selectedFormat);
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
        md += `\n> ${section.remember_this}\n\n`;
      });
      md += `## Overall Summary\n${summary.overall_summary}`;
      return md;
    }
    if (summary.type === 'research') {
      return `# ${summary.title}\n\n## Abstract\n${summary.abstract}\n\n## Methodology\n${summary.methodology}\n\n## Key Findings\n${summary.key_findings?.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\n## Limitations\n${summary.limitations?.map((l, i) => `${i + 1}. ${l}`).join('\n')}\n\n## Conclusions\n${summary.conclusions}\n\n## Further Reading\n${summary.further_reading_topics?.map((t, i) => `- ${t}`).join('\n')}`;
    }
    return JSON.stringify(summary, null, 2);
  };

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
            <div className="bg-card rounded-xl p-6 border border-gray-800 whitespace-pre-wrap">
              <h3 className="text-lg font-semibold text-text mb-4"><FiEdit className="inline mr-1" /> Main Notes</h3>
              <p className="text-text">{currentSummary.main_notes}</p>
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
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {SUMMARY_FORMATS.map((format) => (
          <button
            key={format.id}
            onClick={() => setSelectedFormat(format.id)}
            className={`p-4 rounded-xl text-left transition-all border ${
              selectedFormat === format.id
                ? 'bg-primary/20 border-primary'
                : 'bg-card border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className="text-2xl mb-2">{format.icon}</div>
            <div className="font-semibold text-text">{format.name}</div>
            <p className="text-sm text-muted mt-1">{format.description}</p>
          </button>
        ))}
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
      >
        {isGenerating ? 'Generating...' : 'Generate Summary'}
      </button>

      {projectSummaries.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-text">Your Summaries</h3>
          {projectSummaries.map((summary) => (
            <button
              key={summary.id}
              onClick={() => handleSelectSummary(summary)}
              className={`w-full p-4 rounded-xl flex items-center gap-4 border transition-colors text-left ${
                currentSummary?.title === summary.title
                  ? 'bg-primary/20 border-primary'
                  : 'bg-card border-gray-800 hover:border-gray-700'
              }`}
            >
              <span className="text-2xl">
                {summary.type === 'cornell' ? <FiList /> : summary.type === 'study' ? <FiBookOpen /> : <FiTarget />}
              </span>
              <div className="flex-1">
                <div className="font-medium text-text">{summary.title || summary.type}</div>
                <div className="text-sm text-muted">
                  {new Date(summary.generated_at).toLocaleDateString()}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {currentSummary && (
        <>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-surface hover:bg-gray-700 text-muted font-semibold rounded-xl"
            >
              {copied ? (
                <>
                  <FiCheck className="inline mr-1" />Copied!
                </>
              ) : (
                <>
                  <FiCopy className="inline mr-1" />Copy as Markdown
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-surface hover:bg-gray-700 text-muted font-semibold rounded-xl"
            >
              <FiDownload className="inline mr-1" /> Download .md
            </button>
          </div>
          {renderSummary()}
        </>
      )}
    </div>
  );
}