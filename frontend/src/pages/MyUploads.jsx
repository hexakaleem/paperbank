import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const typeLabels = { past_paper: 'Past Paper', notes: 'Notes', file: 'File' };
const typeClasses = { past_paper: 'badge-paper', notes: 'badge-notes', file: 'badge-file' };

export default function MyUploads() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  useEffect(() => {
    fetchUploads();
  }, [page]);

  const fetchUploads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/my/uploads', { params: { page, limit: 12 } });
      setResources(res.data.resources);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/resources/${deleteId}`);
      setDeleteId(null);
      fetchUploads();
    } catch (err) {
      alert('Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="page-header">
          <h1>My Uploads</h1>
          <p>You have uploaded {pagination.total} resource{pagination.total !== 1 ? 's' : ''}.</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '80px' }} />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📤</div>
            <h3>You haven't uploaded anything yet</h3>
            <p>Share your study materials with fellow students.</p>
            <Link to="/upload" className="btn btn-primary">Upload Your First Resource</Link>
          </div>
        ) : (
          <div className="upload-list">
            {resources.map(r => (
              <div key={r.id} className="upload-row">
                <div className="upload-row-info">
                  <div className="upload-row-title">{r.title}</div>
                  <div className="upload-row-meta">
                    <span className={`badge ${typeClasses[r.type]}`} style={{ padding: '2px 8px', fontSize: '11px' }}>
                      {typeLabels[r.type]}
                    </span>
                    <span>{r.semester_year}</span>
                    <span>↓ {r.download_count}</span>
                    <span>Uploaded {formatDate(r.created_at)}</span>
                  </div>
                </div>
                <div className="upload-row-actions">
                  <Link to={`/resources/${r.id}`} className="btn btn-secondary btn-sm">View</Link>
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(r.id)}>Delete</button>
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

        {/* Delete Modal */}
        {deleteId && (
          <div className="modal-overlay" onClick={() => setDeleteId(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Delete this resource?</h2>
              <p>This action cannot be undone. The file will be permanently removed.</p>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
