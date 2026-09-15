import { User as UiUser, LogOut as UiLogOut, X as UiX } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminSidebar, { navItems } from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import MobileNavigation from '../components/MobileNavigation';

const AdminLayout = () => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close drawer automatically on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="admin-loading-screen">
        <div className="admin-loading-text">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="admin-shell">
      {/* Desktop Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="admin-main-area">
        <AdminHeader onMenuClick={() => setMobileMenuOpen((prev) => !prev)} />

        <main className="admin-content-scroll">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer Navigation (Full 9-item menu) */}
      <div 
        className={`admin-drawer-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      >
        <div 
          className={`admin-drawer ${mobileMenuOpen ? 'open' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="admin-drawer-header">
            <span className="sidebar-logo">Admin Portal</span>
            <button 
              type="button"
              className="admin-drawer-close"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation"
            >
              {<UiX size={18} />}
            </button>
          </div>

          <nav className="sidebar-nav">
            <ul>
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `sidebar-nav-link${isActive ? ' active' : ''}`
                    }
                  >
                    <span className="sidebar-nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="admin-drawer-footer">
            <NavLink
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `sidebar-nav-link${isActive ? ' active' : ''}`
              }
            >
              <span className="sidebar-nav-icon">{<UiUser size={18} />}</span>
              <span>Admin Profile</span>
            </NavLink>
            <button 
              type="button"
              className="sidebar-nav-link text-danger"
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
                navigate('/login');
              }}
              style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', marginTop: '0.25rem' }}
            >
              <span className="sidebar-nav-icon">{<UiLogOut size={18} />}</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation />
    </div>
  );
};

export default AdminLayout;

