import { useState, useEffect, useCallback } from 'react';
import { FiAward, FiTarget, FiDownload, FiFileText, FiFile, FiLayers, FiZap } from 'react-icons/fi';
import FlipCard from '../../components/FlipCard';
import { useGenerationStore } from '../../store/useGenerationStore';
import { useAuthStore } from '../../store/useAuthStore';
import '../../styles/flashcards.css';

export default function FlashcardsTab({ projectId }) {
  const { decks, isGenerating, generateFlashcards, fetchDecks, reviewFlashcard } = useGenerationStore();
  const { token } = useAuthStore();
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [showExport, setShowExport] = useState(false);

  const handleExport = async (format) => {
    if (!selectedDeck) return;
    const url = `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/flashcards/${selectedDeck.id}/export/?format=${format}`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('Export error:', res.status, errText);
        throw new Error(`Export failed: ${res.status}`);
      }
      const blob = await res.blob();
      const ext = format === 'anki' ? 'csv' : format;
      const filename = `${selectedDeck.title}.${ext}`;
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.click();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export. Please try again.');
    }
    setShowExport(false);
  };

  const projectDecks = decks[projectId] || [];

  useEffect(() => {
    if (projectId) {
      fetchDecks(projectId);
    }
  }, [projectId, fetchDecks]);

  useEffect(() => {
    if (projectDecks.length > 0 && !selectedDeck) {
      setSelectedDeck(projectDecks[0]);
    }
  }, [projectDecks, selectedDeck]);

  const handleGenerate = async (count) => {
    try {
      const deck = await generateFlashcards(projectId, count);
      setSelectedDeck(deck);
      setCurrentIndex(0);
      setReviewed(0);
    } catch (error) {
      console.error('Failed to generate:', error);
    }
  };

  const handleReview = async (cardId, quality) => {
    try {
      await reviewFlashcard(cardId, quality);
      setReviewed(prev => prev + 1);
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error('Failed to review:', error);
    }
  };

  const currentCard = selectedDeck?.cards?.[currentIndex];
  const totalCards = selectedDeck?.card_count || 0;

  if (selectedDeck && selectedDeck.cards?.length > 0) {
    return (
      <div className="flashcards-root tab-root overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4 md:mb-7">
              <div>
                <h2 className="text-lg font-bold">{selectedDeck.title}</h2>
                <p className="font-mono-study text-xs mt-1">
                  Card {currentIndex + 1} of {totalCards} • <span className="text-emerald-400">{reviewed}</span> reviewed
                </p>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowExport(!showExport)}
                    className="ghost-btn px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2"
                  >
                    <FiDownload size={13} /> Export
                  </button>
                  {showExport && (
                    <div className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-20 export-dropdown">
                      <button
                        onClick={() => handleExport('pdf')}
                        className="w-full px-4 py-2.5 text-left text-xs flex items-center gap-2 export-item"
                      >
                        <FiFile size={12} /> PDF
                      </button>
                      <button
                        onClick={() => handleExport('md')}
                        className="w-full px-4 py-2.5 text-left text-xs flex items-center gap-2 export-item"
                      >
                        <FiFileText size={12} /> Markdown
                      </button>
                      <button
                        onClick={() => handleExport('anki')}
                        className="w-full px-4 py-2.5 text-left text-xs flex items-center gap-2 export-item"
                      >
                        <FiLayers size={12} /> Anki
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center py-8">
              {currentCard ? (
                <FlipCard card={currentCard} onReview={handleReview} size="xl" />
              ) : (
                <div className="text-center py-12 fade-up">
                  <FiAward className="text-5xl mx-auto mb-3 text-emerald-400/60" />
                  <p className="text-gray-100 font-semibold">All cards reviewed!</p>
                  <p className="text-gray-500 text-sm mt-2">You've gone through all {totalCards} cards.</p>
                  <button
                    onClick={() => setCurrentIndex(0)}
                    className="glow-sky mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px"
                  >
                    <FiZap size={14} className="inline mr-1" /> Review Again
                  </button>
                </div>
              )}
            </div>

            {totalCards > 0 && (
              <div className="w-full h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="progress-fill h-full rounded-full transition-all duration-500"
                  style={{ width: `${((currentIndex) / totalCards) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
    );
  }

  return (
    <div className="flashcards-root tab-root overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4 md:mb-7">
            <div className="flex items-center gap-2">
              <span className="block w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-sky-400">
                Flashcards
              </span>
            </div>
          </div>

          <div className="flex gap-2.5 mb-7 fade-up">
            {[15, 30, 50].map((count) => (
              <button
                key={count}
                onClick={() => handleGenerate(count)}
                disabled={isGenerating}
                className="glow-sky flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:-translate-y-px disabled:opacity-40"
              >
                {isGenerating ? <><FiZap size={12} className="inline mr-1" /> Generating...</> : `Generate ${count} Cards`}
              </button>
            ))}
          </div>

          {projectDecks.length === 0 ? (
            <div className="text-center py-20 fade-up">
              <div className="deck-icon w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center">
                <FiTarget size={28} />
              </div>
              <p className="text-gray-100 font-medium">No flashcards yet.</p>
              <p className="text-gray-500 text-sm mt-2">Generate some from your documents above.</p>
            </div>
          ) : (
            <div className="fade-up">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3.5 flex items-center gap-2">
                <FiTarget size={12} /> Your Decks
              </p>
              <div className="flex flex-col gap-2.5">
                {projectDecks.map((deck) => (
                  <button
                    key={deck.id}
                    onClick={() => { setSelectedDeck(deck); setCurrentIndex(0); setReviewed(0); }}
                    className="deck-btn w-full flex items-center gap-4 p-4 rounded-2xl text-left"
                  >
                    <div className="deck-icon w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FiTarget size={18} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-100">{deck.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{deck.card_count} cards</div>
                    </div>
                    <span className="text-xs text-gray-600">
                      {new Date(deck.generated_at).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
  );
}