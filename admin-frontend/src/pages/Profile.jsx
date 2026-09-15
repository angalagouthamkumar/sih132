import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="admin-page">
      <div className="page-header-row">
        <div>
          <h2 className="admin-page-title">Admin Profile</h2>
          <p className="admin-page-subtitle">Your account information.</p>
        </div>
      </div>

      <div className="card admin-profile-card">
        <div className="profile-header-section">
          <div className="profile-avatar-large" aria-label="Avatar">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="profile-header-info">
            <h3 className="profile-user-name">{user?.name || 'Administrator'}</h3>
            <span className="profile-role-badge">
              System Administrator
            </span>
          </div>
        </div>

        <div className="profile-details-list">
          <div className="profile-detail-item">
            <span className="profile-detail-label">Email Address</span>
            <span className="profile-detail-value">{user?.email || '—'}</span>
          </div>
          
          <div className="profile-detail-item">
            <span className="profile-detail-label">Phone Number</span>
            <span className="profile-detail-value">{user?.phone || '—'}</span>
          </div>
          
          <div className="profile-detail-item">
            <span className="profile-detail-label">Account Role</span>
            <span className="profile-detail-value capitalize">{user?.role || 'Admin'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

