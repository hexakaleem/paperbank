import { useNavigate } from 'react-router-dom';

const typeLabels = {
  past_paper: 'Past Paper',
  notes: 'Notes',
  file: 'File',
};

const typeClasses = {
  past_paper: 'badge-paper',
  notes: 'badge-notes',
  file: 'badge-file',
};

const examLabels = {
  midterm: 'Midterm',
  final: 'Final',
  quiz: 'Quiz',
  assignment: 'Assignment',
};

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

export default function ResourceCard({ resource }) {
  const navigate = useNavigate();

  return (
    <div
      className="card card-clickable resource-card"
      onClick={() => navigate(`/resources/${resource.id}`)}
      id={`resource-card-${resource.id}`}
    >
      <span className={`badge ${typeClasses[resource.type]}`}>
        {typeLabels[resource.type]}
      </span>

      <div className="resource-card-title">{resource.title}</div>

      <div className="resource-card-meta">
        <span>📘 {resource.course_name}</span>
        <span>🏫 {resource.university}</span>
        <span>📅 {resource.semester_year}</span>
        {resource.type === 'past_paper' && resource.exam_type && (
          <span>📝 {examLabels[resource.exam_type]}</span>
        )}
      </div>

      <div className="resource-card-footer">
        <span>↓ {resource.download_count} downloads</span>
        <span>{timeAgo(resource.created_at)}</span>
      </div>
    </div>
  );
}
