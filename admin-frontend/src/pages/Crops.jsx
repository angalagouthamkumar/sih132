import { useState, useEffect } from 'react';
import { getCrops, updateCropStatus } from '../services/adminService';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';

const Crops = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal State
  const [modalState, setModalState] = useState({ isOpen: false, crop: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchCrops = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getCrops();
      if (res.success) {
        setCrops(res.data);
      } else {
        setError(res.message || 'Failed to load crops.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load crops.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  const openModal = (crop) => {
    setActionError('');
    setModalState({ isOpen: true, crop });
  };
  const closeModal = () => {
    setActionError('');
    setModalState({ isOpen: false, crop: null });
  };

  const handleStatusToggle = async () => {
    const { crop } = modalState;
    if (!crop) return;
    setActionLoading(true);
    setActionError('');
    try {
      const newStatus = crop.status === 'available' ? 'inactive' : 'available';
      await updateCropStatus(crop._id, newStatus);
      await fetchCrops();
      closeModal();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update crop status.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCrops = crops.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.variety?.toLowerCase().includes(search.toLowerCase()) ||
    c.farmer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      <div className="page-header-row">
        <div>
          <h2>Crop Moderation</h2>
          <p>Monitor and moderate crop listings posted by farmers.</p>
        </div>
      </div>

      <div className="card card-sm">
        <input
          type="text"
          placeholder="Search by crop name, variety, or farmer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="alert alert-error" role="alert">{error}</div>
      )}

      {loading ? (
        <PageLoader />
      ) : !error && filteredCrops.length === 0 ? (
        <EmptyState
          message={crops.length === 0 ? 'No crop listings found.' : 'No crops match the search.'}
          icon="🌾"
        />
      ) : !error ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Crop Details</th>
                <th>Farmer</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCrops.map((crop) => (
                <tr key={crop._id}>
                  <td>
                    <div className="font-semibold">{crop.name}</div>
                    <div className="text-sm text-secondary">{crop.variety}</div>
                    <div className="text-xs text-secondary">{crop.location}</div>
                  </td>
                  <td>
                    <div className="text-sm font-semibold">{crop.farmer?.name || 'Unknown'}</div>
                  </td>
                  <td className="text-sm">
                    {crop.quantity} {crop.unit}
                  </td>
                  <td className="text-sm font-semibold tabular-nums">
                    ₹{crop.expectedPricePerKg}/kg
                  </td>
                  <td>
                    <StatusBadge status={crop.status} />
                  </td>
                  <td>
                    {crop.status !== 'sold' ? (
                      <button
                        className={crop.status === 'available' ? 'btn-link-danger' : 'btn-link-primary'}
                        onClick={() => openModal(crop)}
                      >
                        {crop.status === 'available' ? 'Deactivate' : 'Activate'}
                      </button>
                    ) : (
                      <span className="text-xs text-secondary italic">No actions (sold)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-footer">
            Showing {filteredCrops.length} of {crops.length} listings
          </div>
        </div>
      ) : null}

      {actionError && (
        <div className="alert alert-error" role="alert">{actionError}</div>
      )}

      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={handleStatusToggle}
        loading={actionLoading}
        title={modalState.crop?.status === 'available' ? 'Deactivate Listing' : 'Activate Listing'}
        message={
          modalState.crop?.status === 'available'
            ? `Deactivate "${modalState.crop.name}"? It will no longer be visible to buyers.`
            : `Activate "${modalState.crop?.name}"? It will become visible to buyers again.`
        }
        confirmText={modalState.crop?.status === 'available' ? 'Deactivate' : 'Activate'}
        type={modalState.crop?.status === 'available' ? 'danger' : 'primary'}
      />
    </div>
  );
};

export default Crops;
