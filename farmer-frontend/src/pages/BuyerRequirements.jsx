import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, ClipboardList, IndianRupee, MapPin, Package, RefreshCw, Search } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import PageLoader from '../components/PageLoader';
import { getBuyerRequirements } from '../services/requirementService';
import { formatDate, formatINR } from '../utils/formatters';

export default function BuyerRequirements() {
  const [requirements, setRequirements] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRequirements = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getBuyerRequirements();
      setRequirements(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load active buyer requirements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequirements();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return requirements;
    return requirements.filter((item) =>
      [item.cropName, item.variety, item.deliveryLocation, item.buyer?.businessName, item.buyer?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [requirements, search]);

  if (loading) return <PageLoader message="Loading active buyer requirements..." />;

  return (
    <div className="portal-page-container">
      <div className="page-title-banner requirements-page-header">
        <div>
          <h2 className="page-heading">Active Buyer Requirements</h2>
          <p className="page-subheading">
            Review current procurement needs posted by registered buyers and compare them with your available crops.
          </p>
        </div>
        <button type="button" className="btn btn-secondary-action" onClick={loadRequirements}>
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="filter-toolbar requirements-filter">
        <div className="filter-search-box">
          <Search size={16} className="search-icon" />
          <label className="sr-only" htmlFor="requirement-search">Search buyer requirements</label>
          <input
            id="requirement-search"
            className="filter-search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search crop, variety, buyer or location"
          />
        </div>
      </div>

      {error && (
        <div className="alert-box alert-error requirements-error" role="alert">
          <span>{error}</span>
          <button type="button" className="btn btn-secondary-action" onClick={loadRequirements}>Retry</button>
        </div>
      )}

      {!error && filtered.length > 0 ? (
        <div className="requirements-grid">
          {filtered.map((item) => (
            <article className="requirement-card" key={item._id}>
              <div className="requirement-card-head">
                <div>
                  <span className="requirement-status">Active Requirement</span>
                  <h3>{item.cropName}</h3>
                  <p>{item.variety}</p>
                </div>
                <div className="requirement-price tabular-nums">
                  {formatINR(item.targetPricePerKg)}<small>/kg</small>
                </div>
              </div>

              <dl className="requirement-details">
                <div><dt><Package size={15} /> Quantity</dt><dd>{item.quantity} {item.unit}</dd></div>
                <div><dt><MapPin size={15} /> Delivery</dt><dd>{item.deliveryLocation}</dd></div>
                <div><dt><Calendar size={15} /> Required by</dt><dd>{formatDate(item.requiredDate)}</dd></div>
                <div><dt><IndianRupee size={15} /> Buyer</dt><dd>{item.buyer?.businessName || item.buyer?.name || 'Registered buyer'}</dd></div>
              </dl>

              {item.qualityNotes && <p className="requirement-notes">{item.qualityNotes}</p>}
              <div className="requirement-verification">
                Buyer status: {item.buyer?.verificationStatus === 'verified' ? 'Verified' : 'Verification pending'}
              </div>
            </article>
          ))}
        </div>
      ) : !error ? (
        <EmptyState
          icon={ClipboardList}
          title={requirements.length ? 'No matching requirements' : 'No active buyer requirements'}
          description={requirements.length
            ? 'Try a different crop, buyer or location search.'
            : 'New requirements will appear here when buyers publish active procurement needs.'}
          actionLabel={requirements.length ? 'Clear Search' : 'Refresh'}
          onAction={requirements.length ? () => setSearch('') : loadRequirements}
        />
      ) : null}
    </div>
  );
}
