import { useState, useEffect, useRef, useCallback } from 'react';
import { FiDownload, FiMap, FiZap, FiChevronLeft, FiEye } from 'react-icons/fi';
import { useMindMapStore } from '../../store/useMindMapStore';
import MindMapViewer from '../../components/MindMapViewer';
import { toPng } from 'html-to-image';
import '../../styles/mindmap.css';

export default function MindMapTab({ projectId }) {
  const { mindmaps, currentMindmap, isGenerating, fetchMindmaps, generateMindmap, fetchMindmap } = useMindMapStore();
  const [showViewer, setShowViewer] = useState(false);
  const viewerRef = useRef(null);

  const projectMindmaps = mindmaps[projectId] || [];

  useEffect(() => {
    if (projectId) {
      fetchMindmaps(projectId);
    }
  }, [projectId, fetchMindmaps]);

  useEffect(() => {
    if (projectMindmaps.length > 0 && !currentMindmap) {
      fetchMindmap(projectId, projectMindmaps[0].id);
    }
  }, [projectMindmaps, currentMindmap]);

  const handleGenerate = async () => {
    try {
      const mindmap = await generateMindmap(projectId);
      setShowViewer(true);
    } catch (error) {
      console.error('Failed to generate:', error);
    }
  };

  const handleExport = useCallback(async () => {
    if (!viewerRef.current) return;
    try {
      const dataUrl = await toPng(viewerRef.current, {
        backgroundColor: '#1E1E2E',
        quality: 1,
      });
      const link = document.createElement('a');
      link.download = `${currentMindmap?.title || 'mindmap'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [currentMindmap]);

  if (showViewer && currentMindmap) {
    return (
      <div className="mindmap-root tab-root overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{currentMindmap.title}</h2>
                <p className="text-xs mt-1">
                  Generated: {new Date(currentMindmap.generated_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="glow-violet px-4 py-2.5 text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-all hover:-translate-y-px"
                >
                  <FiDownload size={14} /> Export PNG
                </button>
                <button
                  onClick={() => { setShowViewer(false); }}
                  className="ghost-btn px-4 py-2.5 text-sm font-medium rounded-xl flex items-center gap-1.5"
                >
                  <FiChevronLeft size={14} /> Back
                </button>
              </div>
            </div>

            <div ref={viewerRef} className="h-[calc(100vh-12rem)] rounded-2xl overflow-hidden border border-white/[0.07]">
              <MindMapViewer data={currentMindmap.data} />
            </div>
          </div>
        </div>
  );
  }

  return (
    <div className="mindmap-root tab-root overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <span className="block w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
              Mind Maps
            </span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full glow-violet px-5 py-3 text-sm font-semibold rounded-xl transition-all hover:-translate-y-px disabled:opacity-40 flex items-center justify-center gap-1.5 mb-6 fade-up"
          >
            <FiZap size={16} />
            {isGenerating ? 'Generating...' : 'Generate Mind Map'}
          </button>

          {projectMindmaps.length === 0 ? (
            <div className="text-center py-20 fade-up">
              <div className="mindmap-icon w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center">
                <FiMap size={28} />
              </div>
              <p className="text-gray-200 font-medium">No mind maps yet.</p>
              <p className="text-gray-500 text-sm mt-2">Generate one from your documents.</p>
            </div>
          ) : (
            <div className="fade-up">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2 section-header">
                <FiMap size={12} /> Your Mind Maps
              </p>
              <div className="space-y-2.5">
                {projectMindmaps.map((mm) => (
                  <div
                    key={mm.id}
                    onClick={async () => {
                      await fetchMindmap(projectId, mm.id);
                      setShowViewer(true);
                    }}
                    className="mindmap-card w-full p-4 rounded-2xl flex items-center gap-4 cursor-pointer"
                  >
                    <div className="mindmap-icon w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FiMap size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-100">{mm.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(mm.generated_at).toLocaleString()}
                      </div>
                    </div>
                    <span
                      onClick={async (e) => {
                        e.stopPropagation();
                        await fetchMindmap(projectId, mm.id);
                        setShowViewer(true);
                      }}
                      className="ghost-btn px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <FiEye size={12} /> View
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
  );
}