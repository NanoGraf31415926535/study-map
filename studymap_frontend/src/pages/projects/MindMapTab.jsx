import { useState, useEffect, useRef, useCallback } from 'react';
import { FiDownload, FiMap } from 'react-icons/fi';
import { useMindMapStore } from '../../store/useMindMapStore';
import MindMapViewer from '../../components/MindMapViewer';
import { toPng } from 'html-to-image';

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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text">{currentMindmap.title}</h2>
            <p className="text-sm text-muted">
              Generated: {new Date(currentMindmap.generated_at).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"
            >
              <FiDownload className="inline mr-1" /> Export PNG
            </button>
            <button
              onClick={() => { setShowViewer(false); }}
              className="px-4 py-2 bg-surface hover:bg-gray-700 text-muted font-semibold rounded-xl"
            >
              Back
            </button>
          </div>
        </div>

        <div ref={viewerRef} className="h-[calc(100vh-12rem)] bg-surface rounded-xl overflow-hidden">
          <MindMapViewer data={currentMindmap.data} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
      >
        {isGenerating ? 'Generating...' : (
            <>
              <FiMap className="inline mr-1" /> Generate Mind Map
            </>
          )}
      </button>

      {projectMindmaps.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <FiMap className="text-5xl mb-4" />
          <p className="text-lg">No mind maps yet.</p>
          <p className="text-sm mt-2">Generate one from your documents.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text">Your Mind Maps</h3>
          {projectMindmaps.map((mm) => (
            <button
              key={mm.id}
              onClick={async () => {
                await fetchMindmap(projectId, mm.id);
                setShowViewer(true);
              }}
              className="w-full p-4 bg-card rounded-xl flex items-center gap-4 border border-gray-800 hover:border-gray-700 transition-colors text-left"
            >
              <FiMap className="text-3xl" />
              <div className="flex-1">
                <div className="font-medium text-text">{mm.title}</div>
                <div className="text-sm text-muted">
                  {new Date(mm.generated_at).toLocaleString()}
                </div>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await fetchMindmap(projectId, mm.id);
                  setShowViewer(true);
                }}
                className="px-3 py-1.5 bg-primary/20 text-primary text-sm font-semibold rounded-lg"
              >
                View
              </button>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}