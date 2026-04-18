import { useState, useEffect, useCallback } from 'react';
import { FiAward, FiTarget } from 'react-icons/fi';
import FlipCard from '../../components/FlipCard';
import { useGenerationStore } from '../../store/useGenerationStore';

export default function FlashcardsTab({ projectId }) {
  const { decks, isGenerating, generateFlashcards, fetchDecks, reviewFlashcard } = useGenerationStore();
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewed, setReviewed] = useState(0);

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text">{selectedDeck.title}</h2>
            <p className="text-sm text-muted">
              Card {currentIndex + 1} of {totalCards} • Reviewed: {reviewed}
            </p>
          </div>
          <button
            onClick={() => { setSelectedDeck(null); setCurrentIndex(0); }}
            className="px-4 py-2 bg-surface hover:bg-gray-700 text-muted font-semibold rounded-xl"
          >
            Back to Decks
          </button>
        </div>

        <div className="flex justify-center">
          {currentCard ? (
            <FlipCard
              card={currentCard}
              onReview={handleReview}
              size="xl"
            />
          ) : (
            <div className="text-center py-12">
              <FiAward className="text-4xl mb-2" />
              <p className="text-text font-semibold">All cards reviewed!</p>
              <p className="text-muted mt-2">You've gone through all {totalCards} cards.</p>
              <button
                onClick={() => setCurrentIndex(0)}
                className="mt-4 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"
              >
                Review Again
              </button>
            </div>
          )}
        </div>

        {totalCards > 0 && (
          <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${((currentIndex) / totalCards) * 100}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3 mb-6">
        {[15, 30, 50].map((count) => (
          <button
            key={count}
            onClick={() => handleGenerate(count)}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
          >
            {isGenerating ? 'Generating...' : `Generate ${count} Cards`}
          </button>
        ))}
      </div>

      {projectDecks.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <FiTarget className="text-5xl mb-4" />
          <p className="text-lg">No flashcards yet.</p>
          <p className="text-sm mt-2">Generate some from your documents above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text">Your Flashcard Decks</h3>
          {projectDecks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => { setSelectedDeck(deck); setCurrentIndex(0); setReviewed(0); }}
              className="w-full p-4 bg-card rounded-xl flex items-center gap-4 border border-gray-800 hover:border-gray-700 transition-colors text-left"
            >
              <FiTarget className="text-3xl" />
              <div className="flex-1">
                <div className="font-medium text-text">{deck.title}</div>
                <div className="text-sm text-muted">{deck.card_count} cards</div>
              </div>
              <span className="text-sm text-muted">
                {new Date(deck.generated_at).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}