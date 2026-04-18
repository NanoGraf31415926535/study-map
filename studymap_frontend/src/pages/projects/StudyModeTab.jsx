import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FiTarget, FiHelpCircle } from 'react-icons/fi';
import FlipCard from '../../components/FlipCard';
import StudyTimer from '../../components/StudyTimer';
import { useGenerationStore } from '../../store/useGenerationStore';

export default function StudyModeTab({ projectId, onExit }) {
  const { decks, quizzes, fetchDecks, fetchQuizzes, fetchQuizDetail, reviewFlashcard, submitQuiz } = useGenerationStore();
  const [mode, setMode] = useState('flashcards');
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);

  const projectDecks = decks[projectId] || [];
  const projectQuizzes = quizzes[projectId] || [];

  useEffect(() => {
    if (projectId) {
      fetchDecks(projectId);
      fetchQuizzes(projectId);
    }
  }, [projectId, fetchDecks, fetchQuizzes]);

  useEffect(() => {
    if (projectDecks.length > 0 && !selectedDeck && mode === 'flashcards') {
      setSelectedDeck(projectDecks[0]);
    }
  }, [projectDecks, selectedDeck, mode]);

  useEffect(() => {
    if (projectQuizzes.length > 0 && !selectedQuiz && mode === 'quiz') {
      fetchQuizDetail(projectId, projectQuizzes[0].id).then(setSelectedQuiz);
    }
  }, [projectQuizzes, selectedQuiz, mode, projectId]);

  const handleTick = useCallback((seconds) => {
    setElapsed(seconds);
  }, []);

  const handleStart = () => {
    setIsRunning(true);
    setElapsed(0);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleExit = () => {
    setIsRunning(false);
    setMode('flashcards');
    setSelectedDeck(null);
    setSelectedQuiz(null);
    setCurrentIndex(0);
    setAnswers({});
    setResults(null);
    if (onExit) {
      onExit();
    }
  };

  const handleReview = async (cardId, quality) => {
    try {
      await reviewFlashcard(cardId, quality);
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error('Failed to review:', error);
    }
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleQuizSubmit = async () => {
    if (!selectedQuiz) return;
    try {
      const res = await submitQuiz(projectId, selectedQuiz.id, answers);
      setResults(res);
      setIsRunning(false);
    } catch (error) {
      console.error('Failed to submit:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentCard = selectedDeck?.cards?.[currentIndex];
  const totalCards = selectedDeck?.card_count || 0;

  if (results) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className={`text-6xl font-bold mb-4 ${results.score >= 70 ? 'text-success' : results.score >= 50 ? 'text-warning' : 'text-red-400'}`}>
            {results.score}%
          </div>
          <h2 className="text-2xl font-bold text-text">
            {results.score >= 70 ? 'Great job!' : 'Keep practicing!'}
          </h2>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={handleExit}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"
          >
            Return to Study Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface -m-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-text">StudyMap Study Mode</h1>
          <StudyTimer isRunning={isRunning} onTick={handleTick} size="lg" />
        </div>
        <button
          onClick={handleExit}
          className="px-4 py-2 bg-surface hover:bg-gray-700 text-muted font-semibold rounded-xl"
        >
          Exit
        </button>
      </div>

      {(selectedDeck && currentCard) || (selectedQuiz && selectedQuiz.questions) ? (
        <div className="flex justify-center mb-6">
          <div className="flex bg-card rounded-xl p-1">
            <button
              onClick={() => { setMode('flashcards'); setSelectedDeck(null); setCurrentIndex(0); setAnswers({}); setResults(null); }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                mode === 'flashcards' ? 'bg-primary text-white' : 'text-muted'
              }`}
>
               <FiTarget className="inline mr-1" /> Flashcards
             </button>
            <button
              onClick={() => { setMode('quiz'); setSelectedQuiz(null); setCurrentIndex(0); setAnswers({}); setResults(null); }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                mode === 'quiz' ? 'bg-primary text-white' : 'text-muted'
              }`}
>
               <FiHelpCircle className="inline mr-1" /> Quiz
             </button>
          </div>
        </div>
      ) : null}

      {mode === 'flashcards' && selectedDeck && currentCard && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 text-center">
            <p className="text-muted">Card {currentIndex + 1} of {totalCards}</p>
            <div className="w-64 bg-surface rounded-full h-2 mt-2">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
              />
            </div>
          </div>
          <FlipCard
            card={currentCard}
            onReview={handleReview}
            size="xl"
          />
          {currentIndex >= totalCards - 1 && (
            <button
              onClick={() => setCurrentIndex(0)}
              className="mt-6 px-4 py-2 bg-surface hover:bg-gray-700 text-muted font-semibold rounded-xl"
            >
              Review Again
            </button>
          )}
        </div>
      )}

      {mode === 'flashcards' && !selectedDeck && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text mb-4">Select a Deck</h2>
          {projectDecks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => { setSelectedDeck(deck); setCurrentIndex(0); }}
              className="w-full p-4 bg-card rounded-xl flex items-center gap-4 border border-gray-800 hover:border-gray-700"
            >
              <FiTarget className="text-2xl" />
              <div className="flex-1 text-left">
                <div className="font-medium text-text">{deck.title}</div>
                <div className="text-sm text-muted">{deck.card_count} cards</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {mode === 'quiz' && selectedQuiz && selectedQuiz.questions && (
        <div className="space-y-6 max-w-2xl mx-auto">
          {(() => {
            const q = selectedQuiz.questions[currentIndex];
            if (!q) return null;
            return (
              <>
                <div className="text-center">
                  <p className="text-muted">Question {currentIndex + 1} of {selectedQuiz.questions.length}</p>
                </div>
                <div className="bg-card rounded-xl p-6 border border-gray-800">
                  <p className="text-lg font-medium text-text mb-6">{q.question_text}</p>
                  <div className="space-y-3">
                    {['option_a', 'option_b', 'option_c', 'option_d'].map((opt, i) => (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(q.id, ['a', 'b', 'c', 'd'][i])}
                        className={`w-full p-4 rounded-xl text-left transition-all border ${
                          answers[q.id] === ['a', 'b', 'c', 'd'][i]
                            ? 'bg-primary/20 border-primary'
                            : 'bg-surface border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <span className="font-semibold text-muted mr-3">{['A', 'B', 'C', 'D'][i]}</span>
                        <span className="text-text">{q[opt]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 bg-surface disabled:opacity-50 text-muted rounded-xl"
                  >
                    Previous
                  </button>
                  {currentIndex < selectedQuiz.questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIndex(prev => prev + 1)}
                      className="px-4 py-2 bg-primary text-white rounded-xl"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(answers).length !== selectedQuiz.questions.length}
                      className="px-4 py-2 bg-success disabled:opacity-50 text-white rounded-xl"
                    >
                      Submit
                    </button>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {mode === 'quiz' && !selectedQuiz && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text mb-4">Select a Quiz</h2>
          {projectQuizzes.map((quiz) => (
            <button
              key={quiz.id}
              onClick={async () => {
                const detail = await fetchQuizDetail(projectId, quiz.id);
                setSelectedQuiz(detail);
                setCurrentIndex(0);
                setAnswers({});
              }}
              className="w-full p-4 bg-card rounded-xl flex items-center gap-4 border border-gray-800 hover:border-gray-700"
            >
              <FiHelpCircle className="text-2xl" />
              <div className="flex-1 text-left">
                <div className="font-medium text-text">{quiz.title}</div>
                <div className="text-sm text-muted">{quiz.question_count} questions</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!selectedDeck && !selectedQuiz && !isRunning && (
        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div>
            <h2 className="text-lg font-semibold text-text mb-4">Flashcards</h2>
            {projectDecks.length === 0 ? (
              <p className="text-muted">No flashcard decks</p>
            ) : (
              projectDecks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => { setMode('flashcards'); setSelectedDeck(deck); setCurrentIndex(0); }}
                  className="w-full p-4 bg-card rounded-xl flex items-center gap-4 border border-gray-800 hover:border-gray-700 mb-2"
                >
                  <FiTarget className="text-2xl" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-text">{deck.title}</div>
                    <div className="text-sm text-muted">{deck.card_count} cards</div>
                  </div>
                </button>
              ))
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text mb-4">Quizzes</h2>
            {projectQuizzes.length === 0 ? (
              <p className="text-muted">No quizzes</p>
            ) : (
              projectQuizzes.map((quiz) => (
                <button
                  key={quiz.id}
                  onClick={async () => {
                    try {
                      const detail = await fetchQuizDetail(projectId, quiz.id);
                      setMode('quiz');
                      setSelectedQuiz(detail);
                      setCurrentIndex(0);
                      setAnswers({});
                    } catch (err) {
                      console.error('Failed to load quiz:', err);
                    }
                  }}
                  className="w-full p-4 bg-card rounded-xl flex items-center gap-4 border border-gray-800 hover:border-gray-700 mb-2"
                >
<FiHelpCircle className="text-2xl" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-text">{quiz.title}</div>
                    <div className="text-sm text-muted">{quiz.question_count} questions</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {isRunning && (
        <div className="text-center py-4">
          <button
            onClick={handleStop}
            className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl"
          >
            Stop
          </button>
        </div>
      )}
    </div>
  );
}