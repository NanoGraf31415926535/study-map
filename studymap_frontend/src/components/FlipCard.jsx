import { useState, useEffect, useRef, useCallback } from 'react';

export default function FlipCard({ card, onReview, showControls = true, size = 'md' }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    setIsFlipped(false);
  }, [card?.id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const sizeClasses = {
    sm: 'w-64 h-40 text-sm md:w-80 md:h-52 md:text-base',
    md: 'w-64 h-40 text-sm md:w-80 md:h-52 md:text-base lg:w-96 lg:h-64 lg:text-lg',
    lg: 'w-64 h-40 text-sm md:w-80 md:h-52 md:text-base lg:w-96 lg:h-64 lg:text-lg',
    xl: 'w-[90vw] h-56 text-base md:w-[500px] md:h-80 md:text-xl',
  };

  const handleReview = (quality) => {
    onReview?.(card.id, quality);
    setIsFlipped(false);
  };

  if (!card) return null;

  return (
    <div className="perspective-1000">
      <div
        ref={cardRef}
        className={`${sizeClasses[size]} relative cursor-pointer transition-transform duration-500 preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={handleFlip}
        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        <div
          className="absolute inset-0 rounded-2xl p-6 flex items-center justify-center text-center backface-hidden shadow-xl theme-card-front"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div>
            <div className="text-xs uppercase tracking-wider mb-2 theme-card-label">Question</div>
            <p className="font-medium theme-card-text">{card.front}</p>
          </div>
        </div>

        <div
          className="absolute inset-0 rounded-2xl p-6 flex items-center justify-center text-center shadow-xl rotate-y-180 theme-card-back"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div>
            <div className="text-xs uppercase tracking-wider mb-2 theme-card-label">Answer</div>
            <p className="font-medium theme-card-text">{card.back}</p>
          </div>
        </div>
      </div>

      {showControls && isFlipped && (
        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={(e) => { e.stopPropagation(); handleReview(0); }}
            className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl font-semibold transition-colors"
          >
            Again
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleReview(3); }}
            className="px-4 py-2 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-xl font-semibold transition-colors"
          >
            Hard
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleReview(4); }}
            className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-xl font-semibold transition-colors"
          >
            Good
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleReview(5); }}
            className="px-4 py-2 bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 rounded-xl font-semibold transition-colors"
          >
            Easy
          </button>
        </div>
      )}

      {!isFlipped && (
        <p className="text-center text-xs mt-3 theme-card-hint">Click or press Space to flip</p>
      )}
    </div>
  );
}