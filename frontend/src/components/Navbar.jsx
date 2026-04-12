import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          📚 <span>Paper Bank</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={isActive('/')}>Resources</Link>
          <Link to="/mcqs" className={isActive('/mcqs')}>MCQs</Link>

          {user ? (
            <>
              <Link to="/upload" className={`btn btn-primary btn-sm`}>+ Upload</Link>
              <Link to="/my-uploads" className={isActive('/my-uploads')}>My Uploads</Link>
              <div className="navbar-user">
                <div className="navbar-user-avatar">
                  {user.display_name?.charAt(0).toUpperCase()}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">Log In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
