import { useState, useEffect } from 'react';
import api from '../api';
import ResourceCard from '../components/ResourceCard';

export default function Home() {
  const [resources, setResources] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ type: '', university: '', exam_type: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    api.get('/resources/universities').then(res => setUniversities(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchResources();
  }, [search, filters, page]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (filters.type) params.type = filters.type;
      if (filters.university) params.university = filters.university;
      if (filters.exam_type) params.exam_type = filters.exam_type;

      const res = await api.get('/resources', { params });
      setResources(res.data.resources);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleFilterChange = (key, value) => {
    setPage(1);
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({ type: '', university: '', exam_type: '' });
    setSearch('');
    setSearchInput('');
  };

  return (
    <div className="page">
      <div className="container">
        {/* Hero */}
        <div className="hero">
          <h1>Find Past Papers, Notes & Files</h1>
          <p>Browse academic resources shared by students across universities.</p>
          <form className="hero-search" onSubmit={handleSearch}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by title or course name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              id="home-search-input"
            />
            <button type="submit" className="btn btn-primary" id="home-search-btn">Search</button>
          </form>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <select
            className="form-select"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            id="filter-type"
          >
            <option value="">All Types</option>
            <option value="past_paper">Past Paper</option>
            <option value="notes">Notes</option>
            <option value="file">File</option>
          </select>

          <select
            className="form-select"
            value={filters.university}
            onChange={(e) => handleFilterChange('university', e.target.value)}
            id="filter-university"
          >
            <option value="">All Universities</option>
            {universities.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          <select
            className="form-select"
            value={filters.exam_type}
            onChange={(e) => handleFilterChange('exam_type', e.target.value)}
            disabled={filters.type !== 'past_paper'}
            id="filter-exam-type"
          >
            <option value="">All Exam Types</option>
            <option value="midterm">Midterm</option>
            <option value="final">Final</option>
            <option value="quiz">Quiz</option>
            <option value="assignment">Assignment</option>
          </select>

          {(filters.type || filters.university || filters.exam_type || search) && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear Filters</button>
          )}

          <span className="result-count">
            {pagination.total} result{pagination.total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Resource Grid */}
        {loading ? (
          <div className="resource-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <h3>No resources found</h3>
            <p>{search || filters.type ? 'Try different keywords or filters.' : 'Be the first to upload a resource!'}</p>
          </div>
        ) : (
          <div className="resource-grid">
            {resources.map(r => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-secondary btn-sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              ← Prev
            </button>
            <span className="pagination-info">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page === pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
