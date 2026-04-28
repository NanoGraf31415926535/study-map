import { useState, useEffect, useCallback } from 'react';
import {
  FiTarget, FiHelpCircle, FiArrowLeft, FiClock,
  FiCheck, FiChevronLeft, FiChevronRight, FiRotateCw,
  FiBookOpen, FiAlertCircle, FiChevronDown, FiChevronUp, FiX,
  FiAward, FiBarChart2, FiCheckCircle
} from 'react-icons/fi';
import FlipCard from '../../components/FlipCard';
import StudyTimer from '../../components/StudyTimer';
import { useGenerationStore } from '../../store/useGenerationStore';
import '../../styles/study.css';

// ─── Bloom level metadata (mirrors QuizTab) ──────────────────────────────────
const BLOOM_META = {
  remember:   { label: 'Remember',   color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.2)',  desc: 'Recall of facts' },
  understand: { label: 'Understand', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',   border: 'rgba(56,189,248,0.2)',   desc: 'Explain ideas' },
  apply:      { label: 'Apply',      color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.2)',   desc: 'Use in new situations' },
  analyze:    { label: 'Analyze',    color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.2)',   desc: 'Break down information' },
  evaluate:   { label: 'Evaluate',   color: '#fb923c', bg: 'rgba(251,146,60,0.1)',   border: 'rgba(251,146,60,0.2)',   desc: 'Justify decisions' },
  create:     { label: 'Create',     color: '#fb7185', bg: 'rgba(251,113,133,0.1)',  border: 'rgba(251,113,133,0.2)', desc: 'Produce new work' },
};

const REFLECTION_PROMPTS = [
  'Did you misread the question, or was the concept genuinely unclear?',
  'What did you think the answer was, and why?',
  'Can you explain the correct answer in your own words now?',
];

// ─── SVG Score ring ───────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#34d399' : score >= 50 ? '#fb923c' : '#f87171';
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" className="score-ring-track" strokeWidth="10" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono-study text-3xl font-bold" style={{ color }}>{score}%</span>
        <span className="text-xs text-muted mt-0.5">score</span>
      </div>
    </div>
  );
}

// ─── Stat chip ────────────────────────────────────────────────────────────────
function StatChip({ value, label, color }) {
  return (
    <div className="px-6 py-3 rounded-xl stats-card text-center min-w-[80px]">
      <div className="font-mono-study text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs stats-label uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total, label }) {
  return (
    <div className="text-center mb-7">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2.5">{label}</p>
      <div className="w-full h-0.5 bloom-bar-bg rounded-full overflow-hidden">
        <div className="progress-fill h-full rounded-full transition-all duration-500"
          style={{ width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  );
}

// ─── Bloom breakdown (results) ────────────────────────────────────────────────
function BloomBreakdown({ questions }) {
  const stats = {};
  for (const q of questions) {
    const level = q.bloom_level || 'remember';
    if (!stats[level]) stats[level] = { correct: 0, total: 0 };
    stats[level].total += 1;
    if (q.is_correct) stats[level].correct += 1;
  }
  const entries = Object.entries(stats).sort((a, b) =>
    Object.keys(BLOOM_META).indexOf(a[0]) - Object.keys(BLOOM_META).indexOf(b[0])
  );
  if (!entries.length) return null;
  return (
    <div className="w-full rounded-2xl bg-theme-subtle border border-theme-subtle p-5 mb-5 fade-up">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
        <FiTarget size={12} /> Skills Breakdown
      </h3>
      <div className="space-y-3">
        {entries.map(([level, { correct, total }]) => {
          const meta = BLOOM_META[level] || BLOOM_META.remember;
          const pct = Math.round((correct / total) * 100);
          return (
            <div key={level}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold bloom-label" style={{ color: meta.color }}>{meta.label}</span>
                  <span className="text-xs bloom-desc">{meta.desc}</span>
                </div>
                <span className="font-mono-study text-xs font-bold bloom-count" style={{ color: meta.color }}>{correct}/{total}</span>
              </div>
              <div className="w-full h-1.5 bloom-bar-bg rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: meta.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── What to review ───────────────────────────────────────────────────────────
function WhatToReview({ questions }) {
  const wrongByBloom = {};
  for (const q of questions) {
    if (!q.is_correct) {
      const level = q.bloom_level || 'remember';
      if (!wrongByBloom[level]) wrongByBloom[level] = [];
      wrongByBloom[level].push(q);
    }
  }
  const entries = Object.entries(wrongByBloom);
  if (!entries.length) return null;
  return (
    <div className="w-full rounded-2xl bg-theme-subtle border border-theme-subtle p-5 mb-5 fade-up">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
        <FiBookOpen size={12} /> What to Review
      </h3>
      <div className="space-y-2.5">
        {entries.map(([level, qs]) => {
          const meta = BLOOM_META[level] || BLOOM_META.remember;
          return (
            <div key={level} className="flex items-start gap-3 px-3.5 py-3 rounded-xl"
              style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
              <div className="flex-1">
                <span className="text-xs font-bold" style={{ color: meta.color }}>{meta.label}</span>
                <ul className="mt-1.5 space-y-1">
                  {qs.map(q => (
                    <li key={q.id} className="text-xs text-muted leading-snug">
                      • {q.question_text.length > 80 ? q.question_text.slice(0, 80) + '…' : q.question_text}
                    </li>
                  ))}
                </ul>
              </div>
              <span className="font-mono-study text-xs font-bold flex-shrink-0" style={{ color: meta.color }}>
                {qs.length} missed
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Reflection card (wrong answer expandable) ────────────────────────────────
function ReflectionCard({ q, index }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const meta = BLOOM_META[q.bloom_level] || {};

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
      q.is_correct
        ? 'bg-emerald-400/5 border-emerald-400/20'
        : 'bg-red-400/5 border-red-400/20'
    }`}>
      <button
        className="w-full flex items-start gap-3 p-4 text-left"
        onClick={() => !q.is_correct && setOpen(o => !o)}
        style={{ cursor: q.is_correct ? 'default' : 'pointer' }}
      >
        <span className={`mt-0.5 flex-shrink-0 text-lg ${q.is_correct ? 'text-emerald-400' : 'text-red-400'}`}>
          {q.is_correct ? <FiCheck /> : <FiX />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text text-sm leading-snug">
            Q{index + 1}: {q.question_text}
          </p>
          <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted">
            <span>Your answer: <span className={`font-semibold ${q.is_correct ? 'text-emerald-400' : 'text-red-400'}`}>
              {q.user_answer?.toUpperCase() ?? '—'}
            </span></span>
            {!q.is_correct && (
              <span>Correct: <span className="text-emerald-400 font-semibold">{q.correct_option?.toUpperCase()}</span></span>
            )}
            {meta.label && (
              <span className="font-medium" style={{ color: meta.color }}>{meta.label}</span>
            )}
          </div>
        </div>
        {!q.is_correct && (
          <span className="flex-shrink-0 mt-0.5 reflection-number">
            {open ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </span>
        )}
      </button>

      {!q.is_correct && open && (
        <div className="px-4 pb-4 space-y-4 border-t border-red-400/10 pt-4 fade-up">
          {q.explanation && (
            <div className="flex gap-2.5">
              <FiBookOpen size={13} className="text-sky-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted leading-relaxed">{q.explanation}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {['a','b','c','d'].map(letter => {
              const text = q[`option_${letter}`];
              if (!text) return null;
              const isCorrect = letter === q.correct_option;
              const wasChosen = letter === q.user_answer;
              return (
                <div key={letter} className={`flex items-start gap-2 px-3 py-2 rounded-xl border text-xs reflection-option ${isCorrect ? 'correct' : wasChosen ? 'incorrect' : 'default'}`}>
                  <span className="font-bold flex-shrink-0">{letter.toUpperCase()}.</span>
                  <span className="leading-snug">{text}</span>
                  {isCorrect && <FiCheck size={11} className="ml-auto flex-shrink-0 mt-0.5" style={{ color: '#34d399' }} />}
                  {wasChosen && !isCorrect && <FiX size={11} className="ml-auto flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />}
                </div>
              );
            })}
          </div>
          <div className="rounded-xl reflection-panel p-3">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5"
              style={{ color: '#fbbf24' }}>
              <FiAlertCircle size={11} /> Self-Reflection
            </p>
            <ul className="space-y-1.5">
              {REFLECTION_PROMPTS.map((prompt, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted">
                  <span className="reflection-number flex-shrink-0 font-mono-study">{i + 1}.</span>
                  {prompt}
                </li>
              ))}
            </ul>
            <textarea
              placeholder="Jot your thoughts here…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="mt-3 w-full reflection-textarea rounded-lg px-3 py-2 text-xs resize-none focus:outline-none transition-colors"
              style={{ borderColor: notes ? 'rgba(251,191,36,0.3)' : undefined }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pick card ────────────────────────────────────────────────────────────────
function PickCard({ icon, iconClass, title, meta, badge, onClick }) {
  return (
    <button onClick={onClick}
      className="pick-card relative w-full flex items-center gap-4 p-4 rounded-2xl
                 bg-theme-subtle border border-theme-subtle text-left overflow-hidden
                 transition-all duration-200 hover:border-sky-400/30 hover:-translate-y-px
                 hover:shadow-xl hover:shadow-black/40"
    >
      <div className={`flex items-center justify-center w-11 h-11 rounded-xl border text-lg flex-shrink-0 ${iconClass}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-text truncate">{title}</div>
        <div className="text-xs text-muted mt-0.5">{meta}</div>
      </div>
      {badge && <span className="text-[10px] font-semibold uppercase tracking-widest flex-shrink-0" style={{ color: badge.color }}>{badge.label}</span>}
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
    const label = results.score >= 70 ? <><FiAward className="inline mr-2" /> Excellent work!</>
                : results.score >= 50 ? <><FiBarChart2 className="inline mr-2" /> Good progress!</>
                : <><FiCheckCircle className="inline mr-2" /> Keep going!</>;

    return (
      <div className="study-root relative min-h-screen bg-gray-950 text-text overflow-x-hidden" style={{ minHeight: '100vh', touchAction: 'pan-y' }}>
        <div className="relative z-10 max-w-2xl mx-auto px-6 py-12 flex flex-col items-center fade-up">

          {/* Score + headline */}
          <ScoreRing score={results.score} />
          <h2 className="text-2xl font-bold text-text mt-5 mb-1 text-center flex items-center justify-center gap-2">{label}</h2>
          <p className="text-sm text-muted mb-7 text-center">
            {results.correct} of {results.total} questions correct
            {elapsed > 0 && <span className="ml-2 text-muted">· {Math.floor(elapsed / 60)}m {elapsed % 60}s</span>}
          </p>

          {/* Stat chips */}
          <div className="flex gap-4 mb-8 w-full justify-center">
            <StatChip value={results.correct} label="Correct" color="#34d399" />
            <StatChip value={wrong}           label="Wrong"   color="#f87171" />
            <StatChip value={results.total}   label="Total"   color="#38bdf8" />
          </div>

          {/* Bloom breakdown */}
          {results.questions && <BloomBreakdown questions={results.questions} />}

          {/* What to review */}
          {results.questions && <WhatToReview questions={results.questions} />}

          {/* Per-question reflection */}
          {results.questions && (
            <div className="w-full space-y-2.5 mb-8 fade-up">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
                <FiHelpCircle size={12} /> Question Review
                {wrong > 0 && <span className="text-muted font-normal normal-case tracking-normal">— tap a wrong answer to reflect</span>}
              </p>
              {results.questions.map((q, i) => (
                <ReflectionCard key={q.id} q={q} index={i} />
              ))}
            </div>
          )}

          {/* Actions */}
          <button
            onClick={handleExit}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-sky-400 text-gray-950 font-bold text-sm tracking-wide transition-all duration-200 hover:bg-sky-300 hover:-translate-y-px shadow-lg shadow-sky-400/30"
          >
            <FiRotateCw size={14} /> Return to Study Mode
          </button>
        </div>
      </div>
    );
  }

  /* ── Main screen ── */
  return (
    <div className="study-root relative min-h-screen bg-gray-950 text-text overflow-x-hidden" style={{ minHeight: '100vh', touchAction: 'pan-y' }}>
      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-7 pb-24">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <span className="pulse-dot block w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-sky-400">Study Mode</span>
          </div>
          <button onClick={handleExit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold
                       text-muted bg-theme-muted border border-theme-muted
                       transition-all duration-200 hover:bg-theme-hover hover:text-text hover:border-theme-hover"
          >
            <FiArrowLeft size={12} /> Exit
          </button>
        </div>

        {/* ── Mode tabs + timer ── */}
        {showTabs && (
          <div className="flex items-center gap-3 mb-9 flex-wrap fade-up">
            <div className="flex p-1 rounded-xl bg-theme-muted border border-theme-muted">
              {[
                { key: 'flashcards', label: 'Flashcards', Icon: FiTarget },
                { key: 'quiz',       label: 'Quiz',       Icon: FiHelpCircle },
              ].map(({ key, label, Icon }) => (
                <button key={key}
                  onClick={async () => {
                    if (mode === key) return;
                    if (key === 'flashcards') {
                      setMode('flashcards'); setSelectedDeck(projectDecks[0] || null); setCurrentIndex(0);
                    } else if (projectQuizzes.length > 0) {
                      const detail = await fetchQuizDetail(projectId, projectQuizzes[0].id);
                      setMode('quiz'); setSelectedQuiz(detail); setCurrentIndex(0);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold
                              tracking-wide transition-all duration-200
                              ${mode === key ? 'bg-sky-400 text-gray-950 shadow-md shadow-sky-400/30' : 'text-muted hover:text-text'}`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
            {isRunning && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-400/[0.08] border border-emerald-400/20">
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
            <ProgressBar current={currentIndex + 1} total={totalCards} label={`Card ${currentIndex + 1} of ${totalCards}`} />
            <div className="flex flex-col items-center py-8">
              <FlipCard card={currentCard} onReview={handleReview} size="xl" />
              {currentIndex >= totalCards - 1 && (
                <button onClick={() => setCurrentIndex(0)}
                  className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold
                             text-muted bg-theme-muted border border-theme-muted
                             transition-all duration-200 hover:bg-theme-hover hover:text-text"
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
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3.5">Choose a Deck</p>
            <div className="flex flex-col gap-2.5">
              {projectDecks.length === 0
                ? <p className="text-sm text-muted">No flashcard decks yet.</p>
                : projectDecks.map(d => (
                    <PickCard key={d.id} icon={<FiTarget />}
                      iconClass="bg-sky-400/10 border-sky-400/20 text-sky-400"
                      title={d.title} meta={`${d.card_count} cards`}
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
          const bloom        = BLOOM_META[q.bloom_level];

          return (
            <div className="max-w-2xl mx-auto fade-up">
              <ProgressBar current={currentIndex + 1} total={total} label={`Question ${currentIndex + 1} of ${total}`} />

              {/* Question dot nav */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {selectedQuiz.questions.map((qq, i) => (
                  <button key={i} onClick={() => setCurrentIndex(i)}
                  className={`w-6 h-6 rounded-md text-[10px] font-mono-study font-bold transition-all
                    ${i === currentIndex
                      ? 'bg-sky-400 text-gray-950'
                      : answers[qq.id]
                        ? 'bg-emerald-400/20 border border-emerald-400/30 text-emerald-400'
                        : 'question-num-unselected'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {/* Question card */}
              <div className="rounded-2xl bg-theme-subtle border border-theme-subtle p-8 mb-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-bold uppercase tracking-widest text-sky-400">Q{currentIndex + 1}</span>
                  {bloom && (
                    <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full border"
                      style={{ background: bloom.bg, borderColor: bloom.border, color: bloom.color }}>
                      {bloom.label}
                    </span>
                  )}
                </div>
                <p className="text-base font-medium text-text leading-relaxed">{q.question_text}</p>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-2.5 mb-5">
                {['option_a','option_b','option_c','option_d'].map((opt, i) => {
                  const letter     = ['a','b','c','d'][i];
                  const label      = ['A','B','C','D'][i];
                  const isSelected = answers[q.id] === letter;
                  return (
                    <button key={opt} onClick={() => handleAnswer(q.id, letter)}
                      className={`option-btn relative w-full flex items-start gap-3.5 px-5 py-3.5
                                  rounded-xl text-left overflow-hidden transition-all duration-200 border
                                  ${isSelected
                                    ? 'bg-sky-400/[0.1] border-sky-400/50 shadow-sky-400/10 shadow-md'
                                    : 'bg-theme-subtle border-theme-subtle hover:border-sky-400/30'}`}
                    >
                      <span className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center
                                            text-xs font-bold transition-all duration-200
                                            ${isSelected ? 'bg-sky-400 text-gray-950' : 'option-badge-unselected'}`}>
                        {label}
                      </span>
                      <span className={`text-sm leading-relaxed pt-0.5 transition-colors duration-150
                                        ${isSelected ? 'text-text' : 'text-muted'}`}>
                        {q[opt]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold
                             text-muted bg-theme-muted border border-theme-muted
                             transition-all duration-200 hover:bg-theme-hover hover:text-text
                             disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft size={14} /> Previous
                </button>
                <span className="font-mono-study text-xs text-muted">
                  <span className="text-emerald-400">{answeredCount}</span> / {total}
                </span>
                {currentIndex < total - 1 ? (
                  <button onClick={() => setCurrentIndex(p => p + 1)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold
                               bg-sky-400 text-gray-950 shadow-md shadow-sky-400/30
                               transition-all duration-200 hover:bg-sky-300 hover:shadow-sky-400/50"
                  >
                    Next <FiChevronRight size={14} />
                  </button>
                ) : (
                  <button onClick={handleQuizSubmit} disabled={answeredCount !== total}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold
                               bg-emerald-400 text-gray-950 shadow-md shadow-emerald-400/30
                               transition-all duration-200 hover:bg-emerald-300
                               disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FiCheck size={14} /> Submit
                  </button>
                )}
              </div>

              {/* Unanswered hint */}
              {answeredCount < total && currentIndex === total - 1 && (
                <p className="text-center text-xs mt-3" style={{ color: 'rgba(251,191,36,0.7)' }}>
                  {total - answeredCount} question{total - answeredCount !== 1 ? 's' : ''} still unanswered
                </p>
              )}
            </div>
          );
        })()}

        {/* Quiz — no quiz selected */}
        {mode === 'quiz' && !selectedQuiz && (
          <div className="fade-up">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3.5">Choose a Quiz</p>
            <div className="flex flex-col gap-2.5">
              {projectQuizzes.length === 0
                ? <p className="text-sm text-muted">No quizzes yet.</p>
                : projectQuizzes.map(q => (
                    <PickCard key={q.id} icon={<FiHelpCircle />}
                      iconClass="bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                      title={q.title} meta={`${q.question_count} questions`}
                      badge={q.score !== null ? { label: `${q.score}%`, color: q.score >= 70 ? '#34d399' : '#fb923c' } : null}
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
                heading: 'Flashcard Decks', Icon: FiTarget,
                iconClass: 'bg-sky-400/10 border-sky-400/20 text-sky-400',
                items: projectDecks, empty: 'No decks yet.',
                getMeta: d => `${d.card_count} cards`,
                onSelect: d => { setMode('flashcards'); setSelectedDeck(d); setCurrentIndex(0); },
              },
              {
                heading: 'Quizzes', Icon: FiHelpCircle,
                iconClass: 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400',
                items: projectQuizzes, empty: 'No quizzes yet.',
                getMeta: q => `${q.question_count} questions`,
                getBadge: q => q.score !== null ? { label: `${q.score}%`, color: q.score >= 70 ? '#34d399' : '#fb923c' } : null,
                onSelect: async q => {
                  try {
                    const detail = await fetchQuizDetail(projectId, q.id);
                    setMode('quiz'); setSelectedQuiz(detail); setCurrentIndex(0); setAnswers({});
                  } catch (e) { console.error(e); }
                },
              },
            ].map(({ heading, Icon, iconClass, items, empty, getMeta, getBadge, onSelect }) => (
              <div key={heading}>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3.5 flex items-center gap-2">
                  <Icon size={11} /> {heading}
                </p>
                <div className="flex flex-col gap-2.5">
                  {items.length === 0
                    ? <p className="text-sm text-muted">{empty}</p>
                    : items.map(item => (
                        <PickCard key={item.id} icon={<Icon />} iconClass={iconClass}
                          title={item.title} meta={getMeta(item)}
                          badge={getBadge ? getBadge(item) : null}
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