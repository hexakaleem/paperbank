import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const typeLabels = { past_paper: 'Past Paper', notes: 'Notes', file: 'File' };
const typeClasses = { past_paper: 'badge-paper', notes: 'badge-notes', file: 'badge-file' };
const examLabels = { midterm: 'Midterm', final: 'Final', quiz: 'Quiz', assignment: 'Assignment' };

export default function ResourceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get(`/resources/${id}`)
      .then(res => setResource(res.data))
      .catch(() => setResource(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    try {
      const res = await api.get(`/resources/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', resource.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setResource(prev => ({ ...prev, download_count: prev.download_count + 1 }));
    } catch (err) {
      alert('Download failed. Please try again.');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/resources/${id}`);
      navigate('/');
    } catch (err) {
      alert('Delete failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  if (!resource) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>Resource not found</h3>
            <p>This resource may have been deleted.</p>
            <Link to="/" className="btn btn-primary">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container detail-page">
        <Link to="/" className="detail-back">← Back to Resources</Link>

        <span className={`badge ${typeClasses[resource.type]}`}>
          {typeLabels[resource.type]}
        </span>

        <div className="detail-card" style={{ marginTop: 'var(--space-md)' }}>
          <h1 className="detail-title">{resource.title}</h1>

          <div className="detail-grid">
            <span className="detail-label">Course</span>
            <span className="detail-value">{resource.course_name}</span>

            <span className="detail-label">University</span>
            <span className="detail-value">{resource.university}</span>

            <span className="detail-label">Semester</span>
            <span className="detail-value">{resource.semester_year}</span>

            {resource.type === 'past_paper' && resource.exam_type && (
              <>
                <span className="detail-label">Exam Type</span>
                <span className="detail-value">{examLabels[resource.exam_type]}</span>
              </>
            )}

            <span className="detail-label">Uploaded by</span>
            <span className="detail-value">{resource.uploader_name}</span>

            <span className="detail-label">Uploaded on</span>
            <span className="detail-value">{formatDate(resource.created_at)}</span>

            <span className="detail-label">Downloads</span>
            <span className="detail-value">{resource.download_count}</span>
          </div>

          <div className="detail-file">
            📄 {resource.file_name} {resource.file_size ? `(${formatSize(resource.file_size)})` : ''}
          </div>

          <div className="detail-actions">
            {user ? (
              <button className="btn btn-primary btn-lg" onClick={handleDownload} id="download-btn">
                ↓ Download File
              </button>
            ) : (
              <Link to="/login" className="btn btn-primary btn-lg">
                Log in to download
              </Link>
            )}

            {user && user.id === resource.uploader_id && (
              <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)} id="delete-resource-btn">
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Delete this resource?</h2>
              <p>This action cannot be undone. The file will be permanently removed.</p>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
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
