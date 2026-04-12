import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const emptyQuestion = () => ({
  question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: ''
});

export default function CreateMcq() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [courseName, setCourseName] = useState('');
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const updateQuestion = (index, field, value) => {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  };

  const addQuestion = () => {
    setQuestions(prev => [...prev, emptyQuestion()]);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) return setError('Quiz title is required.');
    if (!courseName.trim()) return setError('Course name is required.');

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) return setError(`Question text is required for Question ${i + 1}.`);
      if (!q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()) {
        return setError(`All four options are required for Question ${i + 1}.`);
      }
      if (!q.correct_answer) return setError(`Select the correct answer for Question ${i + 1}.`);
    }

    setLoading(true);
    try {
      await api.post('/mcq-sets', { title, course_name: courseName, questions });
      navigate('/mcqs');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create quiz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '720px' }}>
        <div className="page-header">
          <h1>Create MCQ Quiz</h1>
        </div>

        <div className="form-card" style={{ marginBottom: 'var(--space-xl)' }}>
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="mcq-title">Title</label>
              <input id="mcq-title" type="text" className="form-input" placeholder="e.g., DSA Midterm Prep" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} disabled={loading} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="mcq-course">Course Name</label>
              <input id="mcq-course" type="text" className="form-input" placeholder="e.g., Data Structures" value={courseName} onChange={(e) => setCourseName(e.target.value)} disabled={loading} />
            </div>
          </form>
        </div>

        <h2 style={{ marginBottom: 'var(--space-lg)' }}>Questions</h2>

        {questions.map((q, index) => (
          <div key={index} className="question-block">
            <div className="question-block-header">
              <h3>Question {index + 1}</h3>
              {questions.length > 1 && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeQuestion(index)} style={{ color: 'var(--color-danger)' }}>
                  ✕ Remove
                </button>
              )}
            </div>

            <div className="form-group">
              <textarea
                className="form-textarea"
                placeholder="Enter your question..."
                value={q.question_text}
                onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                maxLength={500}
                disabled={loading}
                rows={2}
              />
            </div>

            <div className="question-options-grid">
              <div className="form-group">
                <label className="form-label">Option A</label>
                <input type="text" className="form-input" placeholder="Option A" value={q.option_a} onChange={(e) => updateQuestion(index, 'option_a', e.target.value)} disabled={loading} />
              </div>
              <div className="form-group">
                <label className="form-label">Option B</label>
                <input type="text" className="form-input" placeholder="Option B" value={q.option_b} onChange={(e) => updateQuestion(index, 'option_b', e.target.value)} disabled={loading} />
              </div>
              <div className="form-group">
                <label className="form-label">Option C</label>
                <input type="text" className="form-input" placeholder="Option C" value={q.option_c} onChange={(e) => updateQuestion(index, 'option_c', e.target.value)} disabled={loading} />
              </div>
              <div className="form-group">
                <label className="form-label">Option D</label>
                <input type="text" className="form-input" placeholder="Option D" value={q.option_d} onChange={(e) => updateQuestion(index, 'option_d', e.target.value)} disabled={loading} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Correct Answer</label>
              <select className="form-select" value={q.correct_answer} onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)} disabled={loading} style={{ maxWidth: '200px' }}>
                <option value="">Select...</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          </div>
        ))}

        <button type="button" className="btn btn-secondary" onClick={addQuestion} style={{ marginBottom: 'var(--space-xl)' }} disabled={loading}>
          + Add Question
        </button>

        <button className="btn btn-primary btn-full btn-lg" onClick={handleSubmit} disabled={loading} id="create-mcq-submit">
          {loading ? <><span className="spinner" /> Creating...</> : 'Create Quiz'}
        </button>
      </div>
    </div>
  );
}
