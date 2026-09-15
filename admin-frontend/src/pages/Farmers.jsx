import { Users as UiUsers } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getUsers, updateUserAccess, updateUserVerification } from '../services/adminService';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';

const Farmers = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');

  // Modal State
  const [modalState, setModalState] = useState({ isOpen: false, type: null, user: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchFarmers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { role: 'farmer' };
      if (search) params.search = search;
      if (isActiveFilter) params.isActive = isActiveFilter;
      if (verificationFilter) params.verificationStatus = verificationFilter;

      const res = await getUsers(params);
      if (res.success) {
        setFarmers(res.data);
      } else {
        setError(res.message || 'Failed to load farmers.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load farmers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActiveFilter, verificationFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFarmers();
  };

  const openModal = (type, user) => {
    setActionError('');
    setModalState({ isOpen: true, type, user });
  };
  const closeModal = () => {
    setActionError('');
    setModalState({ isOpen: false, type: null, user: null });
  };

  const handleActionConfirm = async () => {
    const { type, user } = modalState;
    if (!user) return;
    setActionLoading(true);
    setActionError('');
    try {
      if (type === 'access') {
        await updateUserAccess(user._id, !user.isActive);
      } else if (['verified', 'rejected', 'pending'].includes(type)) {
        await updateUserVerification(user._id, type);
      }
      await fetchFarmers();
      closeModal();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getModalConfig = () => {
    const { type, user } = modalState;
    if (!user) return {};

    if (type === 'access') {
      const actionText = user.isActive ? 'block' : 'activate';
      return {
        title: `${user.isActive ? 'Block' : 'Activate'} Farmer`,
        message: `Are you sure you want to ${actionText} ${user.name}? ${user.isActive ? 'They will lose API access.' : 'They will regain platform access.'}`,
        confirmText: user.isActive ? 'Block User' : 'Activate User',
        type: user.isActive ? 'danger' : 'primary',
      };
    }

    return {
      title: `Mark as ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      message: `Change verification status of ${user.name} to "${type}"?`,
      confirmText: 'Confirm Status',
      type: 'primary',
    };
  };

  return (
    <div className="admin-page">
      <div className="page-header-row">
        <div>
          <h2>Manage Farmers</h2>
          <p>View and moderate farmer accounts on the platform.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card card-sm">
        <form onSubmit={handleSearchSubmit} className="filter-bar">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-select-w">
            <select value={isActiveFilter} onChange={(e) => setIsActiveFilter(e.target.value)}>
              <option value="">All Access Status</option>
              <option value="true">Active</option>
              <option value="false">Blocked</option>
            </select>
          </div>
          <div className="filter-select-w">
            <select value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)}>
              <option value="">All Verification</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">Filter</button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error" role="alert">{error}</div>
      )}

      {/* Content */}
      {loading ? (
        <PageLoader />
      ) : !error && farmers.length === 0 ? (
        <EmptyState message="No farmers found matching the current filters." icon={<UiUsers size={20} />} />
      ) : !error ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Farmer Info</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Access</th>
                <th>Verification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((farmer) => (
                <tr key={farmer._id}>
                  <td>
                    <div className="font-semibold">{farmer.name}</div>
                    <div className="text-xs text-secondary">
                      Joined: {new Date(farmer.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">{farmer.email}</div>
                    <div className="text-sm text-secondary">{farmer.phone}</div>
                  </td>
                  <td className="text-sm">{farmer.location || 'N/A'}</td>
                  <td>
                    <StatusBadge status={farmer.isActive ? 'Active' : 'Blocked'} />
                  </td>
                  <td>
                    <StatusBadge status={farmer.verificationStatus || 'pending'} />
                  </td>
                  <td>
                    <div className="action-col">
                      <button
                        className={farmer.isActive ? 'btn-link-danger' : 'btn-link-primary'}
                        onClick={() => openModal('access', farmer)}
                      >
                        {farmer.isActive ? 'Block' : 'Activate'}
                      </button>
                      <div className="action-row">
                        {farmer.verificationStatus !== 'verified' && (
                          <button
                            className="btn-link-primary"
                            onClick={() => openModal('verified', farmer)}
                          >
                            Verify
                          </button>
                        )}
                        {farmer.verificationStatus !== 'rejected' && (
                          <button
                            className="btn-link-warning"
                            onClick={() => openModal('rejected', farmer)}
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-footer">
            {farmers.length} farmer{farmers.length !== 1 ? 's' : ''} found
          </div>
        </div>
      ) : null}

      {actionError && (
        <div className="alert alert-error" role="alert">{actionError}</div>
      )}

      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={handleActionConfirm}
        loading={actionLoading}
        error={actionError}
        {...getModalConfig()}
      />
    </div>
  );
};

export default Farmers;
