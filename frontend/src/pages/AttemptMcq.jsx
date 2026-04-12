import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function AttemptMcq() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mcqSet, setMcqSet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  useEffect(() => {
    api.get(`/mcq-sets/${id}`)
      .then(res => {
        setMcqSet(res.data);
        setQuestions(res.data.questions || []);
      })
      .catch(() => navigate('/mcqs'))
      .finally(() => setLoading(false));
  }, [id]);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const selectAnswer = (option) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post(`/mcq-sets/${id}/attempt`, { answers });
      navigate(`/mcqs/${id}/result`, { state: { result: res.data, mcqSet } });
    } catch (err) {
      alert('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  if (!mcqSet || questions.length === 0) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">❓</div>
            <h3>Quiz not found</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '720px' }}>
        <h1 style={{ marginBottom: 'var(--space-sm)' }}>{mcqSet.title}</h1>

        {/* Progress */}
        <div className="quiz-progress">
          <div className="quiz-progress-text">
            Question {currentIndex + 1} of {questions.length}
          </div>
          <div className="quiz-progress-bar">
            <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question */}
        <div className="quiz-question-card">
          <div className="quiz-question-text">{currentQuestion.question_text}</div>
          <div className="quiz-options">
            {['A', 'B', 'C', 'D'].map(opt => {
              const optionKey = `option_${opt.toLowerCase()}`;
              const isSelected = answers[currentQuestion.id] === opt;
              return (
                <label
                  key={opt}
                  className={`quiz-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => selectAnswer(opt)}
                >
                  <input type="radio" name={`q-${currentQuestion.id}`} checked={isSelected} readOnly />
                  <span className="quiz-option-radio" />
                  <span className="quiz-option-label">{opt})</span>
                  <span>{currentQuestion[optionKey]}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="quiz-nav">
          <button
            className="btn btn-secondary"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(i => i - 1)}
          >
            ← Previous
          </button>
          <button
            className="btn btn-secondary"
            disabled={currentIndex === questions.length - 1}
            onClick={() => setCurrentIndex(i => i + 1)}
          >
            Next →
          </button>
        </div>

        {/* Question Navigator */}
        <div className="quiz-navigator">
          {questions.map((q, i) => (
            <button
              key={q.id}
              className={`quiz-nav-btn ${i === currentIndex ? 'current' : ''} ${answers[q.id] ? 'answered' : ''}`}
              onClick={() => setCurrentIndex(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Submit */}
        <button
          className="btn btn-primary btn-full btn-lg"
          onClick={() => setShowConfirm(true)}
          id="quiz-submit-btn"
        >
          Submit Quiz
        </button>

        {/* Confirm Modal */}
        {showConfirm && (
          <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Submit Quiz?</h2>
              <p>You have answered {answeredCount} out of {questions.length} questions. Unanswered questions will be marked incorrect.</p>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
