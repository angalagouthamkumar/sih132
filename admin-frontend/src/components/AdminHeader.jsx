import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminHeader = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <button 
          type="button"
          className="header-menu-btn"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          ☰
        </button>
        <span className="admin-header-title">Admin Console</span>
      </div>

      <div className="admin-header-right">
        <div className="header-user-info" onClick={() => navigate('/profile')}>
          <span className="header-user-name">{user?.name || 'Administrator'}</span>
          <span className="header-user-role">{user?.role || 'Admin'}</span>
        </div>
        
        <button 
          type="button"
          className="header-avatar"
          onClick={() => navigate('/profile')}
          title="View profile"
          aria-label="View admin profile"
        >
          {user?.name?.charAt(0).toUpperCase() || 'A'}
        </button>

        <button 
          type="button"
          onClick={handleLogout}
          className="header-logout-btn"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;

