import { useState, useEffect, useCallback } from 'react';
import { FiCheck, FiX, FiHelpCircle, FiEdit, FiDownload, FiFileText, FiFile, FiZap, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useGenerationStore } from '../../store/useGenerationStore';
import { useAuthStore } from '../../store/useAuthStore';
import '../../styles/quiz.css';

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
  const { token } = useAuthStore();

  const projectQuizzes = quizzes[projectId] || [];

  useEffect(() => {
    if (projectId) {
      fetchQuizzes(projectId);
    }
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
    } catch (error) {
      console.error('Failed to generate quiz:', error);
    }
  };

  const handleSelectQuiz = async (quiz) => {
    try {
      const detail = await fetchQuizDetail(projectId, quiz.id);
      setSelectedQuiz(detail);
      setCurrentQuestion(0);
      setAnswers({});
      setResults(null);
      setShowResults(false);
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

  const handleExport = async (format) => {
    if (!selectedQuiz) return;
    const url = `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/quiz/${selectedQuiz.id}/export/?format=${format}`;
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
      const filename = `${selectedQuiz.title}.${format}`;
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

  const getOptionLabel = (index) => ['A', 'B', 'C', 'D'][index];

  const question = selectedQuiz?.questions?.[currentQuestion];
  const totalQuestions = selectedQuiz?.questions?.length || 0;

  if (showResults && results) {
    const wrong = results.total - results.correct;
    return (
      <div className="quiz-root tab-root overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4 md:mb-7">
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                <FiCheck size={12} /> Results
              </span>
              <button
                onClick={() => { setSelectedQuiz(null); setCurrentQuestion(0); setAnswers({}); setResults(null); setShowResults(false); }}
                className="quiz-btn px-4 py-2 rounded-xl text-xs font-medium text-gray-500"
              >
                Choose Another
              </button>
            </div>
            <div className="text-center py-8 fade-up">
              <div className={`text-6xl font-mono-study font-bold mb-4 ${results.score >= 70 ? 'text-emerald-400' : results.score >= 50 ? 'text-orange-400' : 'text-red-400'}`}>
                {results.score}%
              </div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">
                {results.score >= 70 ? 'Great job!' : results.score >= 50 ? 'Good effort!' : 'Keep practicing!'}
              </h2>
              <p className="text-gray-500 text-sm">
                {results.correct} out of {results.total} correct
              </p>
            </div>

            <div className="flex gap-3 mb-7 fade-up justify-center">
              <div className="px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center">
                <div className="font-mono-study text-2xl font-bold text-emerald-400">{results.correct}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Correct</div>
              </div>
              <div className="px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center">
                <div className="font-mono-study text-2xl font-bold text-red-400">{wrong}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Wrong</div>
              </div>
              <div className="px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center">
                <div className="font-mono-study text-2xl font-bold text-sky-400">{results.total}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Total</div>
              </div>
            </div>

            <div className="space-y-3">
              {results.questions?.map((q, i) => (
                <div key={q.id} className={`p-4 rounded-2xl border ${q.is_correct ? 'bg-emerald-400/5 border-emerald-400/20' : 'bg-red-400/5 border-red-400/20'}`}>
                  <div className="flex items-start gap-3">
                    <span className={`text-lg ${q.is_correct ? 'text-emerald-400' : 'text-red-400'}`}>
                      {q.is_correct ? <FiCheck /> : <FiX />}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-100 mb-2">Q{i + 1}: {q.question_text}</p>
                      <div className="text-sm text-gray-500">
                        <p>Your answer: <span className={q.is_correct ? 'text-emerald-400' : 'text-red-400'}>{q.user_answer?.toUpperCase()}</span></p>
                        {!q.is_correct && (
                          <p>Correct: <span className="text-emerald-400">{q.correct_option.toUpperCase()}</span></p>
                        )}
                        {q.explanation && (
                          <p className="mt-2 text-gray-600 italic">{q.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-7 justify-center">
              <button
                onClick={() => { setShowResults(false); setAnswers({}); setCurrentQuestion(0); }}
                className="quiz-btn px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400"
              >
                <FiZap size={14} className="inline mr-1.5" /> Retake Quiz
              </button>
            </div>
          </div>
        </div>
    );
  }

  if (selectedQuiz && totalQuestions > 0) {
    return (
      <div className="quiz-root tab-root overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4 md:mb-7">
              <div>
                <h2 className="text-lg font-bold">{selectedQuiz.title}</h2>
                <p className="font-mono-study text-xs mt-1">
                  Question {currentQuestion + 1} of {totalQuestions}
                </p>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowExport(!showExport)}
                    className="glow-btn px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2"
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
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full h-0.5 bg-white/[0.06] rounded-full overflow-hidden mb-7">
              <div
                className="progress-fill h-full rounded-full transition-all duration-500"
                style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
              />
            </div>

            {question && (
              <div className="quiz-card rounded-2xl p-6 mb-5 fade-up">
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
                        <span
                          className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200
                            ${isSelected
                              ? 'bg-sky-400 text-gray-950'
                              : 'bg-white/[0.06] border border-white/[0.1] text-gray-500'}`}
                        >
                          {label}
                        </span>
                        <span className={`text-sm leading-relaxed pt-0.5 transition-colors duration-150
                          ${isSelected ? 'text-gray-100' : 'text-gray-400'}`}>
                          {question[opt]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
                  disabled={Object.keys(answers).length !== totalQuestions}
                  className="glow-emerald px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiCheck size={14} /> Submit Quiz
                </button>
              )}
            </div>
          </div>
      </div>
    );
  }

  return (
    <div className="quiz-root tab-root overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4 md:mb-7">
            <span className="block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              Quizzes
            </span>
          </div>

          <div className="flex gap-2 mb-4 md:mb-7 fade-up">
            {[15, 30, 50].map((count) => (
              <button
                key={count}
                onClick={() => handleGenerate(count)}
                disabled={isGenerating}
                className="glow-sky flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:-translate-y-px disabled:opacity-40"
              >
                {isGenerating ? <><FiZap size={12} className="inline mr-1" /> Generating...</> : `Generate ${count} Questions`}
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
                {projectQuizzes.map((quiz) => (
                  <button
                    key={quiz.id}
                    onClick={() => handleSelectQuiz(quiz)}
                    className="quiz-card w-full flex items-center gap-4 p-4 rounded-2xl text-left"
                  >
                    <div className="quiz-icon w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FiHelpCircle size={18} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-100">{quiz.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{quiz.question_count} questions</div>
                    </div>
                    {quiz.score !== null && (
                      <span className={`px-3 py-1 text-xs font-mono-study font-semibold rounded-full ${
                        quiz.score >= 70 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-orange-400/10 text-orange-400'
                      }`}>
                        {quiz.score}%
                      </span>
                    )}
                    <span className="text-xs text-gray-600">
                      {new Date(quiz.created_at).toLocaleDateString()}
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