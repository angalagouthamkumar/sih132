import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Sprout, AlertCircle, RefreshCw } from 'lucide-react';
import CropCard from '../components/CropCard';
import FilterPanel from '../components/FilterPanel';
import EmptyState from '../components/EmptyState';
import PageLoader from '../components/PageLoader';
import { getAvailableCrops } from '../services/cropService';

export default function BrowseCrops() {
  const { showToast } = useOutletContext();

  const [crops, setCrops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  // Filter & search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const fetchCrops = useCallback(async () => {
    setIsLoading(true);
    setApiError('');

    try {
      const response = await getAvailableCrops();
      const cropList =
        response?.data?.crops ||
        (Array.isArray(response?.data) ? response.data : []) ||
        response?.crops ||
        [];

      if (response?.success) {
        setCrops(cropList);
      } else {
        setApiError(response?.message || 'Failed to retrieve available produce.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Unable to connect to crop services.';
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  // Extract unique locations from real loaded crops for the dropdown
  const availableLocations = useMemo(() => {
    const locSet = new Set();
    crops.forEach((crop) => {
      if (crop.location && crop.location.trim()) {
        locSet.add(crop.location.trim());
      }
    });
    return Array.from(locSet).sort();
  }, [crops]);

  // Filter, search, and sort logic
  const filteredAndSortedCrops = useMemo(() => {
    return crops
      .filter((crop) => {
        const matchesLocation =
          selectedLocation === 'all'
            ? true
            : crop.location?.toLowerCase() === selectedLocation.toLowerCase();

        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          query === '' ||
          (crop.name && crop.name.toLowerCase().includes(query)) ||
          (crop.variety && crop.variety.toLowerCase().includes(query)) ||
          (crop.location && crop.location.toLowerCase().includes(query));

        return matchesLocation && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') {
          return (Number(a.expectedPricePerKg) || 0) - (Number(b.expectedPricePerKg) || 0);
        }
        if (sortBy === 'price_desc') {
          return (Number(b.expectedPricePerKg) || 0) - (Number(a.expectedPricePerKg) || 0);
        }
        // 'newest' (default)
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [crops, searchQuery, selectedLocation, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLocation('all');
    setSortBy('newest');
  };

  if (isLoading) {
    return <PageLoader message="Loading certified harvest catalog..." />;
  }

  return (
    <div className="portal-page-container">
      {/* Header Banner */}
      <div className="page-title-banner">
        <div>
          <h2 className="page-heading">Browse Available Crops</h2>
          <p className="page-subheading">
            Direct farmer listings available for immediate bulk procurement and negotiated forward contracts across Telangana.
          </p>
        </div>
      </div>

      {/* Error Alert with Retry */}
      {apiError && (
        <div className="alert-box alert-error" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} className="alert-icon" />
          <div style={{ flex: 1 }}>
            <strong>Error loading crops: </strong>
            <span>{apiError}</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={fetchCrops}
          >
            <RefreshCw size={14} style={{ marginRight: '6px' }} />
            Retry
          </button>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <FilterPanel
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        sortBy={sortBy}
        onSortChange={setSortBy}
        availableLocations={availableLocations}
        onResetFilters={handleResetFilters}
        totalResults={filteredAndSortedCrops.length}
      />

      {/* Results Grid or Empty State */}
      {crops.length === 0 && !apiError ? (
        <EmptyState
          icon={Sprout}
          title="No Crops Available"
          description="There are currently no active harvest crops published by farmers. Please check back soon or post a custom procurement requirement."
        />
      ) : filteredAndSortedCrops.length > 0 ? (
        <div className="crops-grid-display">
          {filteredAndSortedCrops.map((crop) => (
            <CropCard key={crop._id} crop={crop} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Sprout}
          title="No Produce Matches Your Filters"
          description={`No active harvests found matching "${searchQuery}" in ${
            selectedLocation === 'all' ? 'any location' : selectedLocation
          }.`}
          actionLabel="Reset All Filters"
          onAction={handleResetFilters}
        />
      )}
    </div>
  );
}
