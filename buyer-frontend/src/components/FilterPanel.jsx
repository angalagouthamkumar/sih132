import React from 'react';
import { Search, MapPin, ArrowUpDown, RotateCcw } from 'lucide-react';

export default function FilterPanel({
  searchQuery,
  onSearchChange,
  selectedLocation,
  onLocationChange,
  sortBy,
  onSortChange,
  availableLocations = [],
  onResetFilters,
  totalResults = 0,
}) {
  const hasActiveFilters = searchQuery.trim() !== '' || selectedLocation !== 'all' || sortBy !== 'newest';

  return (
    <div className="filter-panel-card">
      <div className="filter-panel-grid">
        {/* Search Input */}
        <div className="filter-field-group search-group">
          <label htmlFor="search-crop" className="filter-label">
            Search Produce
          </label>
          <div className="filter-input-wrapper">
            <Search size={16} className="filter-field-icon" />
            <input
              id="search-crop"
              type="text"
              className="filter-input-control"
              placeholder="Search crop or variety (e.g. Paddy, Chilli, Cotton)..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Location Dropdown */}
        <div className="filter-field-group">
          <label htmlFor="location-filter" className="filter-label">
            Dispatch Location
          </label>
          <div className="filter-input-wrapper">
            <MapPin size={16} className="filter-field-icon" />
            <select
              id="location-filter"
              className="filter-input-control filter-select-control"
              value={selectedLocation}
              onChange={(e) => onLocationChange(e.target.value)}
            >
              <option value="all">All Locations / Mandis</option>
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort By Dropdown */}
        <div className="filter-field-group">
          <label htmlFor="sort-filter" className="filter-label">
            Sort By
          </label>
          <div className="filter-input-wrapper">
            <ArrowUpDown size={16} className="filter-field-icon" />
            <select
              id="sort-filter"
              className="filter-input-control filter-select-control"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="newest">Newest Listed First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results & Reset Bar */}
      <div className="filter-footer-bar">
        <span className="results-counter-text">
          Showing <strong>{totalResults}</strong> available harvest lots
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            className="btn-reset-filters"
            onClick={onResetFilters}
          >
            <RotateCcw size={13} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
