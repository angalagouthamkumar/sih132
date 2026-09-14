import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';
import MobileNavigation from '../components/MobileNavigation';

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

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
      <div className="admin-sidebar-panel">
        <AdminSidebar />
      </div>

      {/* Main Content Area */}
      <div className="admin-main-area">
        <AdminHeader />

        <main className="admin-content-scroll">
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  );
};

export default AdminLayout;
