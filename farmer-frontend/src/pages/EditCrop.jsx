import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CropForm from '../components/CropForm';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';
import { getCropById, updateCrop } from '../services/api';

export default function EditCrop() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useOutletContext();
  const navigate = useNavigate();

  const [crop, setCrop] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function fetchCrop() {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await getCropById(id);
        if (isMounted) {
          const cropItem = response?.data?.crop || response?.data || response?.crop;
          if (response?.success && cropItem) {
            setCrop(cropItem);
          } else {
            setLoadError(response?.message || 'Crop record not found');
          }
        }
      } catch (err) {
        if (isMounted) {
          const msg =
            err.response?.data?.message ||
            err.message ||
            'Failed to load crop details from server';
          setLoadError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (id) {
      fetchCrop();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleUpdateCrop = async (payload) => {
    setIsSubmitting(true);
    setApiError('');

    try {
      const response = await updateCrop(id, payload);
      if (response?.success) {
        showToast('Crop listing updated successfully!', 'success');
        navigate('/my-crops');
      } else {
        setApiError(response?.message || 'Failed to update crop listing');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to connect to the backend server';
      setApiError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <PageLoader message="Loading harvest listing details..." />;
  }

  if (loadError || !crop) {
    return (
      <div className="portal-page-container">
        <EmptyState
          icon={AlertCircle}
          title="Listing Not Found"
          description={loadError || 'The requested crop could not be found or you may not have permission to edit it.'}
          actionLabel="Return to My Crops"
          onAction={() => navigate('/my-crops')}
        />
      </div>
    );
  }

  return (
    <div className="portal-page-container">
      <div className="page-title-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link to="/my-crops" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--forest-700)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600 }}>
              <ArrowLeft size={16} style={{ marginRight: '4px' }} /> Back to My Crops
            </Link>
          </div>
          <h2 className="page-heading">Edit Crop Listing</h2>
          <p className="page-subheading">
            Update harvest pricing, available inventory volume, or change listing status for {crop.name} ({crop.variety}).
          </p>
        </div>
      </div>

      <CropForm
        initialValues={{
          name: crop.name,
          variety: crop.variety,
          quantity: crop.quantity,
          unit: crop.unit,
          expectedPricePerKg: crop.expectedPricePerKg,
          location: crop.location,
          harvestDate: crop.harvestDate,
          imageUrl: crop.imageUrl || '',
          description: crop.description || '',
          status: crop.status || 'available',
        }}
        onSubmit={handleUpdateCrop}
        isSubmitting={isSubmitting}
        apiError={apiError}
        mode="edit"
      />
    </div>
  );
}
