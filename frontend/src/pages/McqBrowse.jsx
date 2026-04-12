import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function McqBrowse() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mcqSets, setMcqSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    fetchMcqSets();
  }, [search, page]);

  const fetchMcqSets = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      const res = await api.get('/mcq-sets', { params });
      setMcqSets(res.data.mcqSets);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  let searchTimeout;
  const handleSearch = (value) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      setPage(1);
      setSearch(value);
    }, 300);
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div>
            <h1>MCQ Quizzes</h1>
            <p>Test your knowledge with community-created quizzes.</p>
          </div>
          {user && (
            <Link to="/mcqs/create" className="btn btn-primary" id="create-mcq-btn">
              + Create MCQ
            </Link>
          )}
        </div>

        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by title or course..."
            onChange={(e) => handleSearch(e.target.value)}
            style={{ maxWidth: '400px' }}
            id="mcq-search-input"
          />
        </div>

        {loading ? (
          <div className="resource-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        ) : mcqSets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3>No quizzes yet</h3>
            <p>{search ? 'No quizzes match your search.' : 'Be the first to create one!'}</p>
            {user && (
              <Link to="/mcqs/create" className="btn btn-primary">Create MCQ Quiz</Link>
            )}
          </div>
        ) : (
          <div className="resource-grid">
            {mcqSets.map(set => (
              <div key={set.id} className="card mcq-card" id={`mcq-card-${set.id}`}>
                <div className="mcq-card-title">{set.title}</div>
                <div className="mcq-card-meta">
                  <span>📘 {set.course_name}</span>
                  <span>📋 {set.question_count} Question{set.question_count !== 1 ? 's' : ''}</span>
                  <span>👤 By: {set.creator_name}</span>
                  <span>🕐 {timeAgo(set.created_at)}</span>
                </div>
                <div className="mcq-card-footer">
                  {user ? (
                    <button
                      className="btn btn-primary btn-full"
                      onClick={() => navigate(`/mcqs/${set.id}/attempt`)}
                    >
                      Start Quiz
                    </button>
                  ) : (
                    <Link to="/login" className="btn btn-outline btn-full">
                      Log in to attempt
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span className="pagination-info">Page {page} of {pagination.totalPages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
