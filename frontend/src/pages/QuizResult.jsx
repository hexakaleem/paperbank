import { useLocation, useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function QuizResult() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;
  const mcqSet = location.state?.mcqSet;

  if (!user) return <Navigate to="/login" replace />;

  if (!result) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3>No result data</h3>
            <p>Please complete a quiz first.</p>
            <Link to="/mcqs" className="btn btn-primary">Browse Quizzes</Link>
          </div>
        </div>
      </div>
    );
  }

  const { score, total, percentage, breakdown } = result;
  const correct = breakdown.filter(b => b.is_correct).length;
  const wrong = breakdown.filter(b => b.user_answer && !b.is_correct).length;
  const skipped = breakdown.filter(b => !b.user_answer).length;

  const percentageClass = percentage >= 70 ? 'good' : percentage >= 40 ? 'ok' : 'bad';

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '720px' }}>
        {/* Score Card */}
        <div className="result-score-card">
          <h2>Your Score</h2>
          <div className="result-score">{score} / {total}</div>
          <div className={`result-percentage ${percentageClass}`}>{percentage}%</div>
          <div className="result-breakdown">
            <div className="result-breakdown-item">
              <span style={{ color: 'var(--color-success)' }}>✓</span> {correct} Correct
            </div>
            <div className="result-breakdown-item">
              <span style={{ color: 'var(--color-danger)' }}>✕</span> {wrong} Wrong
            </div>
            <div className="result-breakdown-item">
              <span style={{ color: 'var(--color-text-muted)' }}>○</span> {skipped} Skipped
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="result-actions">
          <Link to="/mcqs" className="btn btn-secondary">Back to Quizzes</Link>
          {mcqSet && (
            <button className="btn btn-primary" onClick={() => navigate(`/mcqs/${mcqSet.id}/attempt`)}>
              Retry Quiz
            </button>
          )}
        </div>

        {/* Answer Review */}
        <h3 className="result-review-title">Answer Review</h3>

        {breakdown.map((item, index) => (
          <div key={item.question_id} className="result-question">
            <div className="result-question-text">
              Q{index + 1}. {item.question_text}
              <span style={{ marginLeft: '8px', fontSize: 'var(--font-size-sm)' }}>
                {item.is_correct ? (
                  <span style={{ color: 'var(--color-success)' }}>✓ Correct</span>
                ) : item.user_answer ? (
                  <span style={{ color: 'var(--color-danger)' }}>✕ Incorrect</span>
                ) : (
                  <span style={{ color: 'var(--color-text-muted)' }}>○ Skipped</span>
                )}
              </span>
            </div>

            {['A', 'B', 'C', 'D'].map(opt => {
              const optionKey = `option_${opt.toLowerCase()}`;
              const isCorrect = item.correct_answer === opt;
              const isUserAnswer = item.user_answer === opt;
              const isWrong = isUserAnswer && !isCorrect;

              let className = 'result-option';
              if (isCorrect) className += ' correct';
              if (isWrong) className += ' wrong';

              return (
                <div key={opt} className={className}>
                  <span>{opt}) {item[optionKey]}</span>
                  {isCorrect && <span className="result-option-tag">✓ Correct Answer</span>}
                  {isWrong && <span className="result-option-tag">✕ Your Answer</span>}
                  {isUserAnswer && isCorrect && <span className="result-option-tag">✓ Your Answer</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
