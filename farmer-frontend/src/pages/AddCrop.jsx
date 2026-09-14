import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CropForm from '../components/CropForm';
import { createCrop } from '../services/api';

export default function AddCrop() {
  const { user } = useAuth();
  const { showToast } = useOutletContext();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleCreateCrop = async (payload) => {
    setIsSubmitting(true);
    setApiError('');

    try {
      const response = await createCrop(payload);
      if (response?.success) {
        showToast('Crop listing published successfully!', 'success');
        navigate('/my-crops');
      } else {
        setApiError(response?.message || 'Failed to list crop produce');
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

  return (
    <div className="portal-page-container">
      <div className="page-title-banner">
        <div>
          <h2 className="page-heading">List Harvest Produce</h2>
          <p className="page-subheading">
            Publish your harvested crops to certified agricultural buyers and food processors across India.
          </p>
        </div>
      </div>

      <CropForm
        initialValues={{
          location: user?.location || '',
        }}
        onSubmit={handleCreateCrop}
        isSubmitting={isSubmitting}
        apiError={apiError}
        mode="create"
      />
    </div>
  );
}
