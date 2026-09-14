import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle,
  Search,
  Sprout,
  AlertCircle,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import CropCard from '../components/CropCard';
import EmptyState from '../components/EmptyState';
import PageLoader from '../components/PageLoader';
import { getMyCrops, deleteCrop } from '../services/api';

export default function MyCrops() {
  const { showToast } = useOutletContext();
  const navigate = useNavigate();

  const [crops, setCrops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [cropToDelete, setCropToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchCrops = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getMyCrops();
      const cropsList =
        response?.data?.crops ||
        (Array.isArray(response?.data) ? response.data : []) ||
        response?.crops ||
        [];

      if (response?.success) {
        setCrops(cropsList);
      } else {
        setError(response?.message || 'Failed to retrieve crops list');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Unable to connect to crop services';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  // Handler for delete modal confirmation
  const handleConfirmDelete = async () => {
    if (!cropToDelete?._id) return;
    setIsDeleting(true);
    setDeleteError('');

    try {
      const response = await deleteCrop(cropToDelete._id);
      if (response?.success) {
        setCrops((prev) => prev.filter((c) => c._id !== cropToDelete._id));
        showToast('Crop listing removed successfully.', 'success');
        setCropToDelete(null);
      } else {
        setDeleteError(response?.message || 'Failed to remove crop');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Error deleting crop listing';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (crop) => {
    navigate(`/my-crops/${crop._id}/edit`);
  };

  const handleDeleteRequest = (crop) => {
    setDeleteError('');
    setCropToDelete(crop);
  };

  // Filtered and searched crop results
  const filteredCrops = crops.filter((crop) => {
    const matchesFilter =
      filter === 'all' ? true : crop.status === filter;

    const nameStr = crop.name || '';
    const varietyStr = crop.variety || '';
    const locStr = crop.location || '';
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch =
      query === '' ||
      nameStr.toLowerCase().includes(query) ||
      varietyStr.toLowerCase().includes(query) ||
      locStr.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  const availableCount = crops.filter((c) => c.status === 'available').length;
  const soldCount = crops.filter((c) => c.status === 'sold').length;
  const inactiveCount = crops.filter((c) => c.status === 'inactive').length;

  if (isLoading) {
    return <PageLoader message="Loading your crop inventory..." />;
  }

  return (
    <div className="portal-page-container">
      {/* Header bar */}
      <div className="page-title-banner">
        <div>
          <h2 className="page-heading">My Crop Inventory</h2>
          <p className="page-subheading">
            Manage your registered harvests, adjust expected minimum prices, and track market availability.
          </p>
        </div>

        <Link to="/add-crop" className="btn btn-primary-action">
          <PlusCircle size={18} />
          <span>Add New Crop</span>
        </Link>
      </div>

      {/* Error alert if fetch failed */}
      {error && (
        <div className="alert-box alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} className="alert-icon" />
          <div style={{ flex: 1 }}>
            <strong>Could not fetch inventory: </strong>
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '4px 12px', fontSize: '0.8rem' }}
            onClick={fetchCrops}
          >
            <RefreshCw size={14} style={{ marginRight: '6px' }} />
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-tabs-group">
          <button
            type="button"
            className={`filter-tab-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Crops ({crops.length})
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${filter === 'available' ? 'active' : ''}`}
            onClick={() => setFilter('available')}
          >
            Available ({availableCount})
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${filter === 'sold' ? 'active' : ''}`}
            onClick={() => setFilter('sold')}
          >
            Sold Out ({soldCount})
          </button>
          {inactiveCount > 0 && (
            <button
              type="button"
              className={`filter-tab-btn ${filter === 'inactive' ? 'active' : ''}`}
              onClick={() => setFilter('inactive')}
            >
              Inactive ({inactiveCount})
            </button>
          )}
        </div>

        <div className="filter-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search crop, variety, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Crops or Empty State */}
      {crops.length === 0 && !error ? (
        <EmptyState
          icon={Sprout}
          title="No Crops Listed Yet"
          description="You haven't listed any farm harvests yet. Add your first crop to start receiving bids from verified buyers."
          actionLabel="List Your First Crop"
          onAction={() => navigate('/add-crop')}
        />
      ) : filteredCrops.length > 0 ? (
        <div className="crops-grid-display">
          {filteredCrops.map((crop) => (
            <CropCard
              key={crop._id}
              crop={crop}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
              onActionNotice={showToast}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Sprout}
          title="No Matching Crops Found"
          description={`No crops match your current search "${searchQuery}" or filter selection.`}
          actionLabel="Reset Filters"
          onAction={() => {
            setFilter('all');
            setSearchQuery('');
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {cropToDelete && (
          <div className="modal-backdrop" onClick={() => !isDeleting && setCropToDelete(null)}>
            <motion.div
              className="modal-box"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <div className="modal-header">
                <div className="modal-header-icon-danger">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 id="modal-title" className="modal-title">
                    Delete Crop Listing
                  </h3>
                  <p className="modal-subtitle">
                    This action will permanently remove this crop from the platform.
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => !isDeleting && setCropToDelete(null)}
                  aria-label="Close dialog"
                  disabled={isDeleting}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                {deleteError && (
                  <div className="alert-box alert-error" style={{ marginBottom: '14px' }}>
                    <AlertCircle size={16} />
                    <span>{deleteError}</span>
                  </div>
                )}
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Are you sure you want to delete <strong>{cropToDelete.name}</strong> ({cropToDelete.variety})?
                </p>
                <div className="modal-crop-details-summary">
                  <div>
                    <span className="summary-label">Quantity:</span>{' '}
                    <strong>{cropToDelete.quantity} {cropToDelete.unit}</strong>
                  </div>
                  <div>
                    <span className="summary-label">Expected Price:</span>{' '}
                    <strong>₹{cropToDelete.expectedPricePerKg} / kg</strong>
                  </div>
                  <div>
                    <span className="summary-label">Location:</span>{' '}
                    <span>{cropToDelete.location}</span>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCropToDelete(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger-action"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw size={16} className="spin-animation" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Confirm Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
