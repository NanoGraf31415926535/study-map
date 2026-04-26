import { useState, useEffect, useCallback } from 'react';
import { FiCheck, FiX, FiHelpCircle, FiEdit, FiDownload, FiFileText, FiFile, FiZap, FiChevronLeft, FiChevronRight, FiAlertCircle, FiBookOpen, FiRefreshCw, FiTarget, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useGenerationStore } from '../../store/useGenerationStore';
import { useAuthStore } from '../../store/useAuthStore';
import '../../styles/quiz.css';

// ─── Bloom level metadata ───────────────────────────────────────────────────
const BLOOM_META = {
  remember:   { label: 'Remember',   color: 'text-violet-400',  bg: 'bg-violet-400/10',  border: 'border-violet-400/20',  desc: 'Recall of facts and basic concepts' },
  understand: { label: 'Understand', color: 'text-sky-400',     bg: 'bg-sky-400/10',     border: 'border-sky-400/20',     desc: 'Explain ideas or concepts' },
  apply:      { label: 'Apply',      color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', desc: 'Use information in new situations' },
  analyze:    { label: 'Analyze',    color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20',   desc: 'Draw connections and break down information' },
  evaluate:   { label: 'Evaluate',   color: 'text-orange-400',  bg: 'bg-orange-400/10',  border: 'border-orange-400/20',  desc: 'Justify decisions or opinions' },
  create:     { label: 'Create',     color: 'text-rose-400',    bg: 'bg-rose-400/10',    border: 'border-rose-400/20',    desc: 'Produce new or original work' },
};

const REFLECTION_PROMPTS = [
  'Did you misread the question, or was the concept genuinely unclear?',
  'What did you think the answer was, and why?',
  'Where in your notes or materials can you review this?',
  'Can you explain the correct answer in your own words now?',
];

// ─── Sub-components ─────────────────────────────────────────────────────────

function ScoreRing({ score }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#34d399' : score >= 50 ? '#fb923c' : '#f87171';

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono-study text-3xl font-bold" style={{ color }}>{score}%</span>
        <span className="text-xs text-gray-500 mt-0.5">score</span>
      </div>
    </div>
  );
}

function BloomBreakdown({ questions }) {
  // Build per-bloom stats
  const stats = {};
  for (const q of questions) {
    const level = q.bloom_level || 'remember';
    if (!stats[level]) stats[level] = { correct: 0, total: 0 };
    stats[level].total += 1;
    if (q.is_correct) stats[level].correct += 1;
  }

  const entries = Object.entries(stats).sort((a, b) => {
    const order = Object.keys(BLOOM_META);
    return order.indexOf(a[0]) - order.indexOf(b[0]);
  });

  if (entries.length === 0) return null;

  return (
    <div className="quiz-card rounded-2xl p-5 mb-5 fade-up">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
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
                  <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                  <span className="text-xs text-gray-600">{meta.desc}</span>
                </div>
                <span className={`font-mono-study text-xs font-bold ${meta.color}`}>
                  {correct}/{total}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: meta.color.replace('text-', '').includes('400') ? undefined : undefined, backgroundColor: getComputedColorHex(meta.color) }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// helper – maps tailwind class to a hex so we can use it inline
function getComputedColorHex(twClass) {
  const map = {
    'text-violet-400': '#a78bfa',
    'text-sky-400': '#38bdf8',
    'text-emerald-400': '#34d399',
    'text-amber-400': '#fbbf24',
    'text-orange-400': '#fb923c',
    'text-rose-400': '#fb7185',
  };
  return map[twClass] || '#34d399';
}

function ReflectionCard({ q, index }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-200 ${q.is_correct ? 'bg-emerald-400/5 border-emerald-400/20' : 'bg-red-400/5 border-red-400/20'}`}>
      {/* Header row */}
      <button
        className="w-full flex items-start gap-3 p-4 text-left"
        onClick={() => !q.is_correct && setOpen(o => !o)}
        style={{ cursor: q.is_correct ? 'default' : 'pointer' }}
      >
        <span className={`mt-0.5 flex-shrink-0 text-lg ${q.is_correct ? 'text-emerald-400' : 'text-red-400'}`}>
          {q.is_correct ? <FiCheck /> : <FiX />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-100 text-sm leading-snug">
            Q{index + 1}: {q.question_text}
          </p>
          <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-500">
            <span>
              Your answer:{' '}
              <span className={q.is_correct ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                {q.user_answer?.toUpperCase() ?? '—'}
              </span>
            </span>
            {!q.is_correct && (
              <span>
                Correct: <span className="text-emerald-400 font-semibold">{q.correct_option?.toUpperCase()}</span>
              </span>
            )}
            {q.bloom_level && (() => {
              const meta = BLOOM_META[q.bloom_level] || {};
              return (
                <span className={`${meta.color || 'text-gray-400'} font-medium`}>
                  {meta.label || q.bloom_level}
                </span>
              );
            })()}
          </div>
        </div>
        {!q.is_correct && (
          <span className="text-gray-600 flex-shrink-0 mt-0.5">
            {open ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </span>
        )}
      </button>

      {/* Expandable self-reflection panel (wrong answers only) */}
      {!q.is_correct && open && (
        <div className="px-4 pb-4 space-y-4 border-t border-red-400/10 pt-4 fade-up">
          {/* Explanation */}
          {q.explanation && (
            <div className="flex gap-2.5">
              <FiBookOpen size={13} className="text-sky-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-400 leading-relaxed">{q.explanation}</p>
            </div>
          )}

          {/* Answer options revealed */}
          <div className="grid grid-cols-2 gap-2">
            {['a', 'b', 'c', 'd'].map(letter => {
              const optKey = `option_${letter}`;
              const text = q[optKey];
              if (!text) return null;
              const isCorrect = letter === q.correct_option;
              const wasChosen = letter === q.user_answer;
              return (
                <div
                  key={letter}
                  className={`flex items-start gap-2 px-3 py-2 rounded-xl border text-xs
                    ${isCorrect ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-300' :
                      wasChosen ? 'bg-red-400/10 border-red-400/30 text-red-300' :
                      'bg-white/[0.03] border-white/[0.06] text-gray-500'}`}
                >
                  <span className="font-bold flex-shrink-0">{letter.toUpperCase()}.</span>
                  <span className="leading-snug">{text}</span>
                  {isCorrect && <FiCheck size={11} className="text-emerald-400 ml-auto flex-shrink-0 mt-0.5" />}
                  {wasChosen && !isCorrect && <FiX size={11} className="text-red-400 ml-auto flex-shrink-0 mt-0.5" />}
                </div>
              );
            })}
          </div>

          {/* Reflection prompts */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <FiAlertCircle size={11} /> Self-Reflection
            </p>
            <ul className="space-y-1.5">
              {REFLECTION_PROMPTS.map((prompt, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                  <span className="text-gray-700 flex-shrink-0 font-mono-study">{i + 1}.</span>
                  {prompt}
                </li>
              ))}
            </ul>
            <textarea
              placeholder="Jot your thoughts here…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="mt-3 w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-700 resize-none focus:outline-none focus:border-amber-400/30 transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  );
}

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
  if (entries.length === 0) return null;

  return (
    <div className="quiz-card rounded-2xl p-5 mb-5 fade-up">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
        <FiBookOpen size={12} /> What to Review
      </h3>
      <div className="space-y-2.5">
        {entries.map(([level, qs]) => {
          const meta = BLOOM_META[level] || BLOOM_META.remember;
          return (
            <div key={level} className={`flex items-start gap-3 px-3.5 py-3 rounded-xl ${meta.bg} border ${meta.border}`}>
              <div className="flex-1">
                <span className={`text-xs font-bold ${meta.color}`}>{meta.label}</span>
                <ul className="mt-1.5 space-y-1">
                  {qs.map((q, i) => (
                    <li key={q.id} className="text-xs text-gray-500 leading-snug">
                      • {q.question_text.length > 80 ? q.question_text.slice(0, 80) + '…' : q.question_text}
                    </li>
                  ))}
                </ul>
              </div>
              <span className={`font-mono-study text-xs font-bold ${meta.color} flex-shrink-0`}>
                {qs.length} missed
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function QuizTab({ projectId, isStudyMode = false }) {
  const {
    quizzes,
    isGenerating,
    generateQuiz,
    fetchQuizzes,
    fetchQuizDetail,
    submitQuiz,
  } = useGenerationStore();

  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showExport, setShowExport] = useState(false);
  // retake-weak state
  const [retakeMode, setRetakeMode] = useState(false);
  const [retakeQuestions, setRetakeQuestions] = useState([]);
  const { token } = useAuthStore();

  const projectQuizzes = quizzes[projectId] || [];

  useEffect(() => {
    if (projectId) fetchQuizzes(projectId);
  }, [projectId, fetchQuizzes]);

  useEffect(() => {
    if (projectQuizzes.length > 0 && !selectedQuiz) {
      setSelectedQuiz(projectQuizzes[0]);
    }
  }, [projectQuizzes, selectedQuiz]);

  const handleGenerate = async (count) => {
    try {
      const quiz = await generateQuiz(projectId, count);
      setSelectedQuiz(quiz);
      setCurrentQuestion(0);
      setAnswers({});
      setResults(null);
      setShowResults(false);
      setRetakeMode(false);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
    }
  };

  const handleSelectQuiz = async (quiz) => {
    try {
      const detail = await fetchQuizDetail(projectId, quiz.id);
      setSelectedQuiz(detail);
      setCurrentQuestion(0);
      setRetakeMode(false);

      // If this quiz was already completed and every question has a saved answer,
      // reconstruct the results object and jump straight to the results screen.
      const questions = detail.questions || [];
      const allAnswered = questions.length > 0 && questions.every(q => q.user_answer);

      if (detail.score !== null && detail.score !== undefined && allAnswered) {
        const correctCount = questions.filter(q => q.user_answer === q.correct_option).length;
        const reconstructed = {
          score: detail.score,
          correct: correctCount,
          total: questions.length,
          questions: questions.map(q => ({
            ...q,
            is_correct: q.user_answer === q.correct_option,
          })),
        };
        const savedAnswers = {};
        questions.forEach(q => { if (q.user_answer) savedAnswers[q.id] = q.user_answer; });
        setAnswers(savedAnswers);
        setResults(reconstructed);
        setShowResults(true);
      } else {
        setAnswers({});
        setResults(null);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Failed to load quiz:', error);
    }
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!selectedQuiz) return;
    try {
      const res = await submitQuiz(projectId, selectedQuiz.id, answers);
      setResults(res);
      setShowResults(true);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    }
  };

  const handleRetakeWeak = () => {
    if (!results?.questions) return;
    const wrong = results.questions.filter(q => !q.is_correct);
    setRetakeQuestions(wrong);
    setAnswers({});
    setCurrentQuestion(0);
    setShowResults(false);
    setRetakeMode(true);
  };

  const handleExport = async (format) => {
    if (!selectedQuiz) return;
    const url = `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/quiz/${selectedQuiz.id}/export/?format=${format}`;
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${selectedQuiz.title}.${format}`;
      a.click();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export. Please try again.');
    }
    setShowExport(false);
  };

  const question = retakeMode
    ? retakeQuestions[currentQuestion]
    : selectedQuiz?.questions?.[currentQuestion];

  const totalQuestions = retakeMode
    ? retakeQuestions.length
    : selectedQuiz?.questions?.length || 0;

  // ── Results view ───────────────────────────────────────────────────────────
  if (showResults && results) {
    const wrong = results.total - results.correct;
    const allCorrect = wrong === 0;
    const isPastResult = !!(selectedQuiz?.completed_at && results.questions?.every(q => q.user_answer));

    return (
      <div className="quiz-root tab-root overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-4 fade-up">
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <FiCheck size={12} /> {isPastResult ? 'Past Results' : 'Results'}
            </span>
            <button
              onClick={() => { setSelectedQuiz(null); setCurrentQuestion(0); setAnswers({}); setResults(null); setShowResults(false); setRetakeMode(false); }}
              className="quiz-btn px-4 py-2 rounded-xl text-xs font-medium text-gray-500"
            >
              ← All Quizzes
            </button>
          </div>

          {/* Past attempt banner */}
          {isPastResult && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-sky-400/5 border border-sky-400/20 flex items-center gap-2.5 fade-up">
              <FiBookOpen size={13} className="text-sky-400 flex-shrink-0" />
              <p className="text-xs text-sky-300">
                Showing your previous attempt from{' '}
                <span className="font-semibold">
                  {new Date(selectedQuiz.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>.
                Retake below to try again.
              </p>
            </div>
          )}

          {/* Score ring + headline */}
          <div className="text-center py-6 fade-up">
            <ScoreRing score={results.score} />
            <h2 className="text-xl font-bold text-gray-100 mt-4 mb-1">
              {results.score >= 70 ? '🎉 Great job!' : results.score >= 50 ? '💪 Good effort!' : '📚 Keep practicing!'}
            </h2>
            <p className="text-gray-500 text-sm">{results.correct} out of {results.total} correct</p>
          </div>

          {/* Summary stats */}
          <div className="flex gap-3 mb-6 fade-up justify-center">
            {[
              { label: 'Correct', value: results.correct, color: 'text-emerald-400' },
              { label: 'Wrong',   value: wrong,           color: 'text-red-400' },
              { label: 'Total',   value: results.total,   color: 'text-sky-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center min-w-[80px]">
                <div className={`font-mono-study text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Bloom breakdown */}
          {results.questions && <BloomBreakdown questions={results.questions} />}

          {/* What to review */}
          {results.questions && <WhatToReview questions={results.questions} />}

          {/* Per-question breakdown with self-reflection */}
          {results.questions && (
            <div className="space-y-2.5 mb-7 fade-up">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                <FiHelpCircle size={12} /> Question Review
                {wrong > 0 && <span className="text-gray-700 font-normal normal-case tracking-normal">— tap a wrong answer to reflect</span>}
              </p>
              {results.questions.map((q, i) => (
                <ReflectionCard key={q.id} q={q} index={i} />
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 justify-center fade-up">
            <button
              onClick={() => { setShowResults(false); setAnswers({}); setCurrentQuestion(0); setRetakeMode(false); }}
              className="quiz-btn px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 flex items-center gap-1.5"
            >
              <FiRefreshCw size={13} /> Retake Full Quiz
            </button>
            {!allCorrect && (
              <button
                onClick={handleRetakeWeak}
                className="glow-emerald px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5"
              >
                <FiTarget size={13} /> Retake {wrong} Missed Question{wrong !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz taking view ───────────────────────────────────────────────────────
  if ((selectedQuiz && totalQuestions > 0) || retakeMode) {
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="quiz-root tab-root overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-4 md:mb-7">
            <div>
              <h2 className="text-lg font-bold">
                {retakeMode ? '🎯 Retake: Missed Questions' : selectedQuiz.title}
              </h2>
              <p className="font-mono-study text-xs mt-1 text-gray-500">
                Question {currentQuestion + 1} of {totalQuestions}
                {retakeMode && <span className="ml-2 text-amber-400">· Weak questions only</span>}
              </p>
            </div>
            <div className="flex gap-2">
              {!retakeMode && (
                <div className="relative">
                  <button
                    onClick={() => setShowExport(!showExport)}
                    className="glow-btn px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2"
                  >
                    <FiDownload size={13} /> Export
                  </button>
                  {showExport && (
                    <div className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-20 export-dropdown">
                      <button onClick={() => handleExport('pdf')} className="w-full px-4 py-2.5 text-left text-xs flex items-center gap-2 export-item">
                        <FiFile size={12} /> PDF
                      </button>
                      <button onClick={() => handleExport('md')} className="w-full px-4 py-2.5 text-left text-xs flex items-center gap-2 export-item">
                        <FiFileText size={12} /> Markdown
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-0.5 bg-white/[0.06] rounded-full overflow-hidden mb-7">
            <div
              className="progress-fill h-full rounded-full transition-all duration-500"
              style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
            />
          </div>

          {/* Answer progress dots */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {Array.from({ length: totalQuestions }).map((_, i) => {
              const q = retakeMode ? retakeQuestions[i] : selectedQuiz?.questions?.[i];
              const answered = q && answers[q.id];
              return (
                <button
                  key={i}
                  onClick={() => setCurrentQuestion(i)}
                  className={`w-6 h-6 rounded-md text-[10px] font-mono-study font-bold transition-all
                    ${i === currentQuestion ? 'bg-sky-400 text-gray-950' :
                      answered ? 'bg-emerald-400/20 border border-emerald-400/30 text-emerald-400' :
                      'bg-white/[0.04] border border-white/[0.07] text-gray-600'}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Question card */}
          {question && (
            <div className="quiz-card rounded-2xl p-6 mb-5 fade-up">
              {question.bloom_level && (() => {
                const meta = BLOOM_META[question.bloom_level] || {};
                return (
                  <span className={`inline-block text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${meta.bg} ${meta.color} ${meta.border} border mb-3`}>
                    {meta.label || question.bloom_level}
                  </span>
                );
              })()}
              <p className="text-base font-medium text-gray-100 mb-6">
                {currentQuestion + 1}. {question.question_text}
              </p>
              <div className="space-y-2.5">
                {['option_a', 'option_b', 'option_c', 'option_d'].map((opt, i) => {
                  const letter = ['a', 'b', 'c', 'd'][i];
                  const label = ['A', 'B', 'C', 'D'][i];
                  const isSelected = answers[question.id] === letter;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(question.id, letter)}
                      className={`option-btn relative w-full flex items-start gap-3.5 px-5 py-3.5 rounded-xl text-left overflow-hidden transition-all duration-200 border
                        ${isSelected
                          ? 'bg-sky-400/[0.1] border-sky-400/50 shadow-sky-400/10 shadow-md'
                          : 'bg-white/[0.03] border-white/[0.07] hover:border-sky-400/30'}`}
                    >
                      <span className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200
                        ${isSelected ? 'bg-sky-400 text-gray-950' : 'bg-white/[0.06] border border-white/[0.1] text-gray-500'}`}>
                        {label}
                      </span>
                      <span className={`text-sm leading-relaxed pt-0.5 transition-colors duration-150 ${isSelected ? 'text-gray-100' : 'text-gray-400'}`}>
                        {question[opt]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className="quiz-btn px-4 py-2.5 rounded-xl text-xs font-medium text-gray-500 flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <FiChevronLeft size={14} /> Previous
            </button>
            {currentQuestion < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                className="glow-sky px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all hover:-translate-y-px"
              >
                Next <FiChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={answeredCount !== totalQuestions}
                className="glow-emerald px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FiCheck size={14} /> Submit Quiz
              </button>
            )}
          </div>

          {/* Unanswered count hint */}
          {answeredCount < totalQuestions && currentQuestion === totalQuestions - 1 && (
            <p className="text-center text-xs text-amber-400/70 mt-3">
              {totalQuestions - answeredCount} question{totalQuestions - answeredCount !== 1 ? 's' : ''} still unanswered
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Quiz list view ─────────────────────────────────────────────────────────
  return (
    <div className="quiz-root tab-root overflow-hidden">
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-4 md:mb-7">
          <span className="block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Quizzes</span>
        </div>

        <div className="flex gap-2 mb-4 md:mb-7 fade-up">
          {[15, 30, 50].map((count) => (
            <button
              key={count}
              onClick={() => handleGenerate(count)}
              disabled={isGenerating}
              className="glow-sky flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:-translate-y-px disabled:opacity-40"
            >
              {isGenerating ? <><FiZap size={12} className="inline mr-1" /> Generating…</> : `Generate ${count} Questions`}
            </button>
          ))}
        </div>

        {projectQuizzes.length === 0 ? (
          <div className="text-center py-20 fade-up">
            <div className="quiz-icon w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center">
              <FiHelpCircle size={28} />
            </div>
            <p className="text-gray-100 font-medium">No quizzes yet.</p>
            <p className="text-gray-500 text-sm mt-2">Generate one from your documents.</p>
          </div>
        ) : (
          <div className="fade-up">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3.5 flex items-center gap-2 section-header">
              <FiHelpCircle size={12} /> Your Quizzes
            </p>
            <div className="flex flex-col gap-2.5">
              {projectQuizzes.map((quiz) => {
                const completed = quiz.score !== null;
                return (
                  <button
                    key={quiz.id}
                    onClick={() => handleSelectQuiz(quiz)}
                    className="quiz-card w-full flex items-center gap-4 p-4 rounded-2xl text-left"
                  >
                    {/* Icon — checkmark if done, question mark if fresh */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      completed ? 'bg-emerald-400/10' : 'quiz-icon'
                    }`}>
                      {completed
                        ? <FiCheck size={18} className="text-emerald-400" />
                        : <FiHelpCircle size={18} />}
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium text-gray-100 truncate">{quiz.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {quiz.question_count} questions
                        {completed && (
                          <span className="ml-2 text-gray-600">
                            · {new Date(quiz.completed_at || quiz.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {completed ? (
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`px-3 py-1 text-xs font-mono-study font-semibold rounded-full ${
                          quiz.score >= 70 ? 'bg-emerald-400/10 text-emerald-400' :
                          quiz.score >= 50 ? 'bg-orange-400/10 text-orange-400' :
                          'bg-red-400/10 text-red-400'
                        }`}>
                          {quiz.score}%
                        </span>
                        <span className="text-[10px] text-gray-600 uppercase tracking-widest">View Results</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-sky-400 font-semibold uppercase tracking-widest flex-shrink-0">
                        Start →
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}