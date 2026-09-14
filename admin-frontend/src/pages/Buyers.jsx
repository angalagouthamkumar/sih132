import { useState, useEffect } from 'react';
import { getUsers, updateUserAccess, updateUserVerification } from '../services/adminService';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';

const Buyers = () => {
  const [buyers, setBuyers] = useState([]);
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

  const fetchBuyers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { role: 'buyer' };
      if (search) params.search = search;
      if (isActiveFilter) params.isActive = isActiveFilter;
      if (verificationFilter) params.verificationStatus = verificationFilter;

      const res = await getUsers(params);
      if (res.success) {
        setBuyers(res.data);
      } else {
        setError(res.message || 'Failed to load buyers.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load buyers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActiveFilter, verificationFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBuyers();
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
      await fetchBuyers();
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
        title: `${user.isActive ? 'Block' : 'Activate'} Buyer`,
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
          <h2>Manage Buyers</h2>
          <p>View and moderate buyer accounts on the platform.</p>
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
      ) : !error && buyers.length === 0 ? (
        <EmptyState message="No buyers found matching the current filters." icon="🛒" />
      ) : !error ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Buyer Info</th>
                <th>Business Name</th>
                <th>Contact</th>
                <th>Access</th>
                <th>Verification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buyers.map((buyer) => (
                <tr key={buyer._id}>
                  <td>
                    <div className="font-semibold">{buyer.name}</div>
                    <div className="text-xs text-secondary">
                      Joined: {new Date(buyer.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </td>
                  <td className="text-sm">{buyer.businessName || 'N/A'}</td>
                  <td>
                    <div className="text-sm">{buyer.email}</div>
                    <div className="text-sm text-secondary">{buyer.phone}</div>
                  </td>
                  <td>
                    <StatusBadge status={buyer.isActive ? 'Active' : 'Blocked'} />
                  </td>
                  <td>
                    <StatusBadge status={buyer.verificationStatus || 'pending'} />
                  </td>
                  <td>
                    <div className="action-col">
                      <button
                        className={buyer.isActive ? 'btn-link-danger' : 'btn-link-primary'}
                        onClick={() => openModal('access', buyer)}
                      >
                        {buyer.isActive ? 'Block' : 'Activate'}
                      </button>
                      <div className="action-row">
                        {buyer.verificationStatus !== 'verified' && (
                          <button
                            className="btn-link-primary"
                            onClick={() => openModal('verified', buyer)}
                          >
                            Verify
                          </button>
                        )}
                        {buyer.verificationStatus !== 'rejected' && (
                          <button
                            className="btn-link-warning"
                            onClick={() => openModal('rejected', buyer)}
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
            {buyers.length} buyer{buyers.length !== 1 ? 's' : ''} found
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
        {...getModalConfig()}
      />
    </div>
  );
};

export default Buyers;
