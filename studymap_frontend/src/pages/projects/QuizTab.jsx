import { useState, useEffect, useCallback } from 'react';
import { FiCheck, FiX, FiHelpCircle, FiEdit, FiDownload, FiFileText, FiFile } from 'react-icons/fi';
import { useGenerationStore } from '../../store/useGenerationStore';
import { useAuthStore } from '../../store/useAuthStore';

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
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className={`text-6xl font-bold mb-4 ${results.score >= 70 ? 'text-success' : results.score >= 50 ? 'text-warning' : 'text-red-400'}`}>
            {results.score}%
          </div>
          <h2 className="text-2xl font-bold text-text">
            {results.score >= 70 ? 'Great job!' : results.score >= 50 ? 'Good effort!' : 'Keep practicing!'}
          </h2>
          <p className="text-muted mt-2">
            {results.correct} out of {results.total} correct
          </p>
        </div>

        <div className="space-y-4">
          {results.questions?.map((q, i) => (
            <div key={q.id} className={`p-4 rounded-xl border ${q.is_correct ? 'bg-success/10 border-success/50' : 'bg-red-500/10 border-red-500/50'}`}>
              <div className="flex items-start gap-3">
                <span className={`text-xl ${q.is_correct ? 'text-success' : 'text-red-400'}`}>
                  {q.is_correct ? <FiCheck /> : <FiX />}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-text mb-2">Q{i + 1}: {q.question_text}</p>
                  <div className="text-sm text-muted">
                    <p>Your answer: <span className={q.is_correct ? 'text-success' : 'text-red-400'}>{q.user_answer?.toUpperCase()}</span></p>
                    {!q.is_correct && (
                      <p>Correct: <span className="text-success">{q.correct_option.toUpperCase()}</span></p>
                    )}
                    {q.explanation && (
                      <p className="mt-2 text-muted italic">{q.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setShowResults(false); setAnswers({}); setCurrentQuestion(0); }}
            className="px-4 py-2 bg-surface hover:bg-gray-700 text-muted font-semibold rounded-xl"
          >
            Retake Quiz
          </button>
          <button
            onClick={() => { setSelectedQuiz(null); setCurrentQuestion(0); setAnswers({}); setResults(null); setShowResults(false); }}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"
          >
            Choose Another Quiz
          </button>
        </div>
      </div>
    );
  }

  if (selectedQuiz && totalQuestions > 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text">{selectedQuiz.title}</h2>
            <p className="text-sm text-muted">
              Question {currentQuestion + 1} of {totalQuestions}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowExport(!showExport)}
                className="px-4 py-2 bg-surface hover:bg-gray-700 text-muted font-semibold rounded-xl flex items-center gap-2"
              >
                <FiDownload size={16} /> Export
              </button>
              {showExport && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-gray-700 rounded-xl overflow-hidden z-10">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full px-4 py-2 text-left text-sm text-text hover:bg-gray-700 flex items-center gap-2"
                  >
                    <FiFile size={14} /> PDF
                  </button>
                  <button
                    onClick={() => handleExport('md')}
                    className="w-full px-4 py-2 text-left text-sm text-text hover:bg-gray-700 flex items-center gap-2"
                  >
                    <FiFileText size={14} /> Markdown
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => { setSelectedQuiz(null); setCurrentQuestion(0); setAnswers({}); }}
              className="px-4 py-2 bg-surface hover:bg-gray-700 text-muted font-semibold rounded-xl"
            >
              Back to Quizzes
            </button>
          </div>
        </div>

        {question && (
          <div className="bg-card rounded-xl p-6 border border-gray-800">
            <p className="text-lg font-medium text-text mb-6">
              {currentQuestion + 1}. {question.question_text}
            </p>
            <div className="space-y-3">
              {['option_a', 'option_b', 'option_c', 'option_d'].map((opt, i) => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(question.id, ['a', 'b', 'c', 'd'][i])}
                  className={`w-full p-4 rounded-xl text-left transition-all border ${
                    answers[question.id] === ['a', 'b', 'c', 'd'][i]
                      ? 'bg-primary/20 border-primary'
                      : 'bg-surface border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <span className="font-semibold text-muted mr-3">{getOptionLabel(i)}</span>
                  <span className="text-text">{question[opt]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="px-4 py-2 bg-surface hover:bg-gray-700 disabled:opacity-50 text-muted font-semibold rounded-xl"
          >
            Previous
          </button>
          {currentQuestion < totalQuestions - 1 ? (
            <button
              onClick={() => setCurrentQuestion(prev => prev + 1)}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length !== totalQuestions}
              className="px-4 py-2 bg-success hover:bg-success/90 disabled:opacity-50 text-white font-semibold rounded-xl"
            >
              Submit Quiz
            </button>
          )}
        </div>
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
            {isGenerating ? 'Generating...' : `Generate ${count} Questions`}
          </button>
        ))}
      </div>

      {projectQuizzes.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <FiHelpCircle className="text-5xl mb-4" />
          <p className="text-lg">No quizzes yet.</p>
          <p className="text-sm mt-2">Generate one from your documents.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text">Your Quizzes</h3>
          {projectQuizzes.map((quiz) => (
            <button
              key={quiz.id}
              onClick={() => handleSelectQuiz(quiz)}
              className="w-full p-4 bg-card rounded-xl flex items-center gap-4 border border-gray-800 hover:border-gray-700 transition-colors text-left"
            >
              <FiEdit className="text-3xl" />
              <div className="flex-1">
                <div className="font-medium text-text">{quiz.title}</div>
                <div className="text-sm text-muted">{quiz.question_count} questions</div>
              </div>
              {quiz.score !== null && (
                <span className={`px-3 py-1 text-sm rounded-full ${
                  quiz.score >= 70 ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                }`}>
                  {quiz.score}%
                </span>
              )}
              <span className="text-sm text-muted">
                {new Date(quiz.created_at).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}