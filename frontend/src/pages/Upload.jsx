import { useState, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '', type: '', exam_type: '', course_name: '', university: '', semester_year: ''
  });
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFile = (f) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png'];
    if (!allowed.includes(f.type)) {
      setError('File type not supported. Allowed: PDF, DOCX, PPTX, JPG, PNG');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File exceeds 10 MB limit.');
      return;
    }
    setError('');
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || formData.title.length < 3) return setError('Title must be at least 3 characters.');
    if (!formData.type) return setError('Resource type is required.');
    if (formData.type === 'past_paper' && !formData.exam_type) return setError('Exam type is required for past papers.');
    if (!formData.course_name) return setError('Course name is required.');
    if (!formData.university) return setError('University is required.');
    if (!formData.semester_year) return setError('Semester / Year is required.');
    if (!file) return setError('Please select a file.');

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => { if (val) data.append(key, val); });
      data.append('file', file);

      const res = await api.post('/resources', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      navigate(`/resources/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '640px' }}>
        <div className="page-header">
          <h1>Upload a Resource</h1>
          <p>Share your notes, papers, and files with fellow students.</p>
        </div>

        <div className="form-card">
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="upload-title">Title</label>
              <input id="upload-title" name="title" type="text" className="form-input" placeholder="e.g., DSA Final Paper 2024" value={formData.title} onChange={handleChange} maxLength={150} disabled={loading} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="upload-type">Resource Type</label>
              <select id="upload-type" name="type" className="form-select" value={formData.type} onChange={handleChange} disabled={loading}>
                <option value="">Select type...</option>
                <option value="past_paper">Past Paper</option>
                <option value="notes">Notes</option>
                <option value="file">File</option>
              </select>
            </div>

            {formData.type === 'past_paper' && (
              <div className="form-group">
                <label className="form-label" htmlFor="upload-exam">Exam Type</label>
                <select id="upload-exam" name="exam_type" className="form-select" value={formData.exam_type} onChange={handleChange} disabled={loading}>
                  <option value="">Select exam type...</option>
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="upload-course">Course Name</label>
              <input id="upload-course" name="course_name" type="text" className="form-input" placeholder="e.g., Data Structures and Algorithms" value={formData.course_name} onChange={handleChange} disabled={loading} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="upload-uni">University</label>
              <input id="upload-uni" name="university" type="text" className="form-input" placeholder="e.g., FAST NUCES" value={formData.university} onChange={handleChange} disabled={loading} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="upload-semester">Semester / Year</label>
              <input id="upload-semester" name="semester_year" type="text" className="form-input" placeholder="e.g., Fall 2024" value={formData.semester_year} onChange={handleChange} disabled={loading} />
            </div>

            <div className="form-group">
              <label className="form-label">File</label>
              <div
                className={`dropzone ${dragActive ? 'active' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
                />
                {file ? (
                  <div className="dropzone-file">
                    <span>📄 {file.name} ({formatSize(file.size)})</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }}>✕</button>
                  </div>
                ) : (
                  <>
                    <div className="dropzone-icon">📁</div>
                    <div className="dropzone-text"><strong>Drag & drop</strong> your file or click to browse</div>
                    <div className="dropzone-hint">PDF, DOCX, PPTX, JPG, PNG — Max 10 MB</div>
                  </>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} id="upload-submit">
              {loading ? <><span className="spinner" /> Uploading...</> : 'Upload Resource'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
