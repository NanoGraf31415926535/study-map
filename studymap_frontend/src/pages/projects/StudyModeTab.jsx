import { useState, useEffect, useCallback } from 'react';
import {
  FiTarget, FiHelpCircle, FiArrowLeft, FiClock,
  FiCheck, FiChevronLeft, FiChevronRight, FiRotateCw,
} from 'react-icons/fi';
import FlipCard from '../../components/FlipCard';
import StudyTimer from '../../components/StudyTimer';
import { useGenerationStore } from '../../store/useGenerationStore';
import '../../styles/study.css';

/* ── Tiny reusable score ring (conic gradient needs CSS vars) ── */
function ScoreRing({ score }) {
  const color = score >= 70 ? '#68d391' : score >= 50 ? '#f6ad55' : '#fc8181';
  const deg   = `${(score / 100) * 360}deg`;
  return (
    <div
      className="score-ring relative flex items-center justify-center rounded-full mb-7"
      style={{ width: 160, height: 160, '--sc': color, '--deg': deg }}
    >
      {/* inner circle cutout */}
      <div className="absolute inset-2 rounded-full bg-gray-950" />
      <div className="relative z-10 flex flex-col items-center">
        <span className="font-mono-study text-4xl font-bold leading-none" style={{ color }}>{score}</span>
        <span className="text-xs text-gray-500 font-medium mt-1">/ 100</span>
      </div>
    </div>
  );
}

/* ── Stat chip ── */
function StatChip({ value, label, color }) {
  return (
    <div className="px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center">
      <div className="font-mono-study text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}

/* ── Progress bar ── */
function ProgressBar({ current, total, label }) {
  return (
    <div className="text-center mb-7">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2.5">{label}</p>
      <div className="w-full h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="progress-fill h-full rounded-full transition-all duration-500"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

/* ── Pick card (deck / quiz selector) ── */
function PickCard({ icon, iconClass, title, meta, onClick }) {
  return (
    <button
      onClick={onClick}
      className="pick-card relative w-full flex items-center gap-4 p-4 rounded-2xl
                 bg-white/[0.03] border border-white/[0.07] text-left overflow-hidden
                 transition-all duration-200 hover:border-sky-400/30 hover:-translate-y-px
                 hover:shadow-xl hover:shadow-black/40"
    >
      <div className={`flex items-center justify-center w-11 h-11 rounded-xl border text-lg flex-shrink-0 ${iconClass}`}>
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-100">{title}</div>
        <div className="text-xs text-gray-500 mt-0.5">{meta}</div>
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════════════════════════ */
export default function StudyModeTab({ projectId, onExit }) {
  const {
    decks, quizzes, fetchDecks, fetchQuizzes,
    fetchQuizDetail, reviewFlashcard, submitQuiz,
  } = useGenerationStore();

  const [mode,         setMode]         = useState('flashcards');
  const [isRunning,    setIsRunning]    = useState(false);
  const [elapsed,      setElapsed]      = useState(0);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers,      setAnswers]      = useState({});
  const [results,      setResults]      = useState(null);

  const projectDecks   = decks[projectId]   || [];
  const projectQuizzes = quizzes[projectId] || [];

  useEffect(() => {
    if (projectId) { fetchDecks(projectId); fetchQuizzes(projectId); }
  }, [projectId, fetchDecks, fetchQuizzes]);

  useEffect(() => {
    if (projectDecks.length > 0 && !selectedDeck && mode === 'flashcards')
      setSelectedDeck(projectDecks[0]);
  }, [projectDecks, selectedDeck, mode]);

  useEffect(() => {
    if (projectQuizzes.length > 0 && !selectedQuiz && mode === 'quiz')
      fetchQuizDetail(projectId, projectQuizzes[0].id).then(setSelectedQuiz);
  }, [projectQuizzes, selectedQuiz, mode, projectId]);

  const handleTick = useCallback((s) => setElapsed(s), []);

  const handleExit = () => {
    setIsRunning(false); setMode('flashcards');
    setSelectedDeck(null); setSelectedQuiz(null);
    setCurrentIndex(0); setAnswers({}); setResults(null);
    onExit?.();
  };

  const handleReview = async (cardId, quality) => {
    try {
      if (!isRunning) { setIsRunning(true); setElapsed(0); }
      await reviewFlashcard(cardId, quality);
      setCurrentIndex(p => p + 1);
    } catch (e) { console.error(e); }
  };

  const handleAnswer = (questionId, answer) => {
    if (!isRunning) { setIsRunning(true); setElapsed(0); }
    setAnswers(p => ({ ...p, [questionId]: answer }));
  };

  const handleQuizSubmit = async () => {
    if (!selectedQuiz) return;
    try {
      const res = await submitQuiz(projectId, selectedQuiz.id, answers);
      setResults(res); setIsRunning(false);
    } catch (e) { console.error(e); }
  };

  const currentCard = selectedDeck?.cards?.[currentIndex];
  const totalCards  = selectedDeck?.card_count || 0;
  const showTabs    = (selectedDeck && currentCard) || selectedQuiz?.questions;

  /* ── Results screen ── */
  if (results) {
    const wrong = results.total - results.correct;
    const label = results.score >= 70 ? '🏆 Excellent work!'
                : results.score >= 50 ? '📈 Good progress!'
                : '💪 Keep going!';
    return (
      <div className="study-root relative min-h-screen bg-gray-950 text-gray-100 -m-6 overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto px-6 py-16 flex flex-col items-center text-center fade-up">
          <ScoreRing score={results.score} />
          <h2 className="text-2xl font-bold text-gray-100 mb-2">{label}</h2>
          <p className="text-sm text-gray-500 mb-9">
            You answered {results.correct} of {results.total} questions correctly.
          </p>
          <div className="flex gap-5 mb-10">
            <StatChip value={results.correct} label="Correct" color="#68d391" />
            <StatChip value={wrong} label="Wrong" color="#fc8181" />
            <StatChip value={results.total} label="Total" color="#63b3ed" />
          </div>
          <button
            onClick={handleExit}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-sky-400 text-gray-950 font-bold text-sm tracking-wide transition-all duration-200 hover:bg-sky-300 hover:-translate-y-px shadow-lg shadow-sky-400/30 hover:shadow-sky-400/50"
          >
            <FiRotateCw size={14} /> Return to Study Mode
          </button>
        </div>
      </div>
    );
  }

  /* ── Main screen ── */
  return (
    <div className="study-root relative min-h-screen bg-gray-950 text-gray-100 -m-6 overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto px-6 pt-7 pb-16">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <span className="pulse-dot block w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-sky-400">
                Study Mode
              </span>
            </div>
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold
                         text-gray-500 bg-white/[0.04] border border-white/[0.08]
                         transition-all duration-200 hover:bg-white/[0.08] hover:text-gray-300
                         hover:border-white/[0.14]"
            >
              <FiArrowLeft size={12} /> Exit
            </button>
          </div>

          {/* ── Mode tabs + timer ── */}
          {showTabs && (
            <div className="flex items-center gap-3 mb-9 flex-wrap fade-up">
              <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                {[
                  { key: 'flashcards', label: 'Flashcards', Icon: FiTarget },
                  { key: 'quiz',       label: 'Quiz',       Icon: FiHelpCircle },
                ].map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    onClick={async () => {
                      if (mode === key) return;
                      if (key === 'flashcards') {
                        setMode('flashcards');
                        setSelectedDeck(projectDecks[0] || null);
                        setCurrentIndex(0);
                      } else if (projectQuizzes.length > 0) {
                        const detail = await fetchQuizDetail(projectId, projectQuizzes[0].id);
                        setMode('quiz'); setSelectedQuiz(detail); setCurrentIndex(0);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold
                                tracking-wide transition-all duration-200
                                ${mode === key
                                  ? 'bg-sky-400 text-gray-950 shadow-md shadow-sky-400/30'
                                  : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>

              {isRunning && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl
                                bg-emerald-400/[0.08] border border-emerald-400/20">
                  <FiClock size={12} className="text-emerald-400 opacity-70" />
                  <span className="font-mono-study text-sm font-medium text-emerald-400">
                    <StudyTimer isRunning={isRunning} onTick={handleTick} size="md" />
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ══ FLASHCARD MODE ══ */}
          {mode === 'flashcards' && selectedDeck && currentCard && (
            <div className="fade-up">
              <ProgressBar
                current={currentIndex + 1}
                total={totalCards}
                label={`Card ${currentIndex + 1} of ${totalCards}`}
              />
              <div className="flex flex-col items-center py-8">
                <FlipCard card={currentCard} onReview={handleReview} size="xl" />
                {currentIndex >= totalCards - 1 && (
                  <button
                    onClick={() => setCurrentIndex(0)}
                    className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold
                               text-gray-500 bg-white/[0.04] border border-white/[0.09]
                               transition-all duration-200 hover:bg-white/[0.08] hover:text-gray-300"
                  >
                    <FiRotateCw size={12} /> Review Again
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Flashcard — no deck */}
          {mode === 'flashcards' && !selectedDeck && (
            <div className="fade-up">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3.5">
                Choose a Deck
              </p>
              <div className="flex flex-col gap-2.5">
                {projectDecks.length === 0
                  ? <p className="text-sm text-gray-600">No flashcard decks yet.</p>
                  : projectDecks.map(d => (
                      <PickCard
                        key={d.id}
                        icon={<FiTarget />}
                        iconClass="bg-sky-400/10 border-sky-400/20 text-sky-400"
                        title={d.title}
                        meta={`${d.card_count} cards`}
                        onClick={() => { setSelectedDeck(d); setCurrentIndex(0); }}
                      />
                    ))}
              </div>
            </div>
          )}

          {/* ══ QUIZ MODE ══ */}
          {mode === 'quiz' && selectedQuiz?.questions && (() => {
            const q            = selectedQuiz.questions[currentIndex];
            if (!q) return null;
            const total        = selectedQuiz.questions.length;
            const answeredCount = Object.keys(answers).length;

            return (
              <div className="max-w-2xl mx-auto fade-up">
                <ProgressBar
                  current={currentIndex + 1}
                  total={total}
                  label={`Question ${currentIndex + 1} of ${total}`}
                />

                {/* Question card */}
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-8 mb-4
                                backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs font-bold uppercase tracking-widest text-sky-400">
                      Q{currentIndex + 1}
                    </span>
                    {q.bloom_level && (
                      <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1
                                       rounded-full bg-emerald-400/10 border border-emerald-400/20
                                       text-emerald-400">
                        {q.bloom_level}
                      </span>
                    )}
                  </div>
                  <p className="text-base font-medium text-gray-100 leading-relaxed">{q.question_text}</p>
                </div>

                {/* Options */}
                <div className="flex flex-col gap-2.5 mb-5">
                  {['option_a','option_b','option_c','option_d'].map((opt, i) => {
                    const letter     = ['a','b','c','d'][i];
                    const label      = ['A','B','C','D'][i];
                    const isSelected = answers[q.id] === letter;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(q.id, letter)}
                        className={`option-btn relative w-full flex items-start gap-3.5 px-5 py-3.5
                                    rounded-xl text-left overflow-hidden transition-all duration-200 border
                                    ${isSelected
                                      ? 'bg-sky-400/[0.1] border-sky-400/50 shadow-sky-400/10 shadow-md'
                                      : 'bg-white/[0.03] border-white/[0.07] hover:border-sky-400/30'}`}
                      >
                        <span
                          className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center
                                      text-xs font-bold transition-all duration-200
                                      ${isSelected
                                        ? 'bg-sky-400 text-gray-950'
                                        : 'bg-white/[0.06] border border-white/[0.1] text-gray-500'}`}
                        >
                          {label}
                        </span>
                        <span className={`text-sm leading-relaxed pt-0.5 transition-colors duration-150
                                          ${isSelected ? 'text-gray-100' : 'text-gray-400'}`}>
                          {q[opt]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold
                               text-gray-500 bg-white/[0.04] border border-white/[0.08]
                               transition-all duration-200 hover:bg-white/[0.08] hover:text-gray-300
                               disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft size={14} /> Previous
                  </button>

                  <span className="font-mono-study text-xs text-gray-600">
                    <span className="text-emerald-400">{answeredCount}</span> / {total}
                  </span>

                  {currentIndex < total - 1 ? (
                    <button
                      onClick={() => setCurrentIndex(p => p + 1)}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold
                                 bg-sky-400 text-gray-950 shadow-md shadow-sky-400/30
                                 transition-all duration-200 hover:bg-sky-300 hover:shadow-sky-400/50"
                    >
                      Next <FiChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={handleQuizSubmit}
                      disabled={answeredCount !== total}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold
                                 bg-emerald-400 text-gray-950 shadow-md shadow-emerald-400/30
                                 transition-all duration-200 hover:bg-emerald-300
                                 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FiCheck size={14} /> Submit
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Quiz — no quiz selected */}
          {mode === 'quiz' && !selectedQuiz && (
            <div className="fade-up">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3.5">
                Choose a Quiz
              </p>
              <div className="flex flex-col gap-2.5">
                {projectQuizzes.length === 0
                  ? <p className="text-sm text-gray-600">No quizzes yet.</p>
                  : projectQuizzes.map(q => (
                      <PickCard
                        key={q.id}
                        icon={<FiHelpCircle />}
                        iconClass="bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                        title={q.title}
                        meta={`${q.question_count} questions`}
                        onClick={async () => {
                          const detail = await fetchQuizDetail(projectId, q.id);
                          setSelectedQuiz(detail); setCurrentIndex(0); setAnswers({});
                        }}
                      />
                    ))}
              </div>
            </div>
          )}

          {/* ══ LANDING — both grids ══ */}
          {!selectedDeck && !selectedQuiz && !isRunning && (
            <div className="grid grid-cols-2 gap-6 fade-up">
              {[
                {
                  heading: 'Flashcard Decks',
                  Icon: FiTarget,
                  iconClass: 'bg-sky-400/10 border-sky-400/20 text-sky-400',
                  items: projectDecks,
                  empty: 'No decks yet.',
                  getMeta: d => `${d.card_count} cards`,
                  onSelect: d => { setMode('flashcards'); setSelectedDeck(d); setCurrentIndex(0); },
                },
                {
                  heading: 'Quizzes',
                  Icon: FiHelpCircle,
                  iconClass: 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400',
                  items: projectQuizzes,
                  empty: 'No quizzes yet.',
                  getMeta: q => `${q.question_count} questions`,
                  onSelect: async q => {
                    try {
                      const detail = await fetchQuizDetail(projectId, q.id);
                      setMode('quiz'); setSelectedQuiz(detail); setCurrentIndex(0); setAnswers({});
                    } catch (e) { console.error(e); }
                  },
                },
              ].map(({ heading, Icon, iconClass, items, empty, getMeta, onSelect }) => (
                <div key={heading}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3.5
                                flex items-center gap-2">
                    <Icon size={11} /> {heading}
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {items.length === 0
                      ? <p className="text-sm text-gray-600">{empty}</p>
                      : items.map(item => (
                          <PickCard
                            key={item.id}
                            icon={<Icon />}
                            iconClass={iconClass}
                            title={item.title}
                            meta={getMeta(item)}
                            onClick={() => onSelect(item)}
                          />
                        ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
  );
}