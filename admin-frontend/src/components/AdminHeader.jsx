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
    <header className="h-[72px] bg-surface border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {/* Hamburger for mobile, although we use bottom nav mainly, it's good for standard layouts */}
        <button 
          className="md:hidden p-2 text-text-secondary hover:text-text"
          onClick={onMenuClick}
        >
          ☰
        </button>
        <div className="md:hidden font-heading text-lg font-bold text-primary-900">
          Admin
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-sm font-semibold text-text">{user?.name}</span>
          <span className="text-xs text-text-secondary capitalize">{user?.role}</span>
        </div>
        
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-900 font-bold border border-primary-400 cursor-pointer" onClick={() => navigate('/profile')}>
          {user?.name?.charAt(0).toUpperCase() || 'A'}
        </div>

        <button 
          onClick={handleLogout}
          className="text-sm font-medium text-danger hover:text-[#9b2c2c] transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
