import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  ArrowRight,
  Building2,
  Warehouse,
  Truck,
  Scale,
  DollarSign,
  Sprout,
  HelpCircle,
} from 'lucide-react';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';
import { getMyCrops } from '../services/api';
import { getReceivedOffers } from '../services/offerService';
import { getMarketData } from '../services/marketService';
import { formatINR } from '../utils/formatters';
import {
  compareMarketAndOffers,
  convertToKg,
  roundTwoDecimals,
} from '../utils/priceDiscovery';

export default function MarketPrices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCropId = searchParams.get('cropId');

  // State
  const [crops, setCrops] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState('');
  const [mandiRecords, setMandiRecords] = useState([]);
  const [buyerOffers, setBuyerOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Filters for the mandi benchmark table
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');

  // Expandable calculation breakdown
  const [showCalculationInfo, setShowCalculationInfo] = useState(false);

  // Load initial data
  const loadAllData = async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      // 1. Fetch farmer's real crops
      const cropRes = await getMyCrops();
      const cropList =
        cropRes?.data?.crops ||
        (Array.isArray(cropRes?.data) ? cropRes.data : []) ||
        cropRes?.crops ||
        [];
      setCrops(cropList);

      // Select crop (either from URL param or default to first available crop)
      let initialCropId = '';
      if (urlCropId && cropList.some((c) => c._id === urlCropId)) {
        initialCropId = urlCropId;
      } else if (cropList.length > 0) {
        initialCropId = cropList[0]._id;
      }
      setSelectedCropId(initialCropId);

      // 2. Fetch all mandi records
      const marketRes = await getMarketData();
      const markets = marketRes?.data?.markets || [];
      setMandiRecords(markets);

      // 3. Fetch farmer's real received offers
      const offerRes = await getReceivedOffers();
      const offers =
        offerRes?.data?.offers ||
        (Array.isArray(offerRes?.data) ? offerRes.data : []) ||
        offerRes?.offers ||
        [];
      setBuyerOffers(offers);
    } catch (err) {
      setLoadError(
        err.response?.data?.message ||
        err.message ||
        'Failed to retrieve live market intelligence and crop listings.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Update URL search params when selectedCropId changes
  const handleSelectCrop = (cropId) => {
    setSelectedCropId(cropId);
    if (cropId) {
      setSearchParams({ cropId });
    } else {
      setSearchParams({});
    }
  };

  // Currently selected crop object
  const selectedCrop = useMemo(() => {
    return crops.find((c) => c._id === selectedCropId) || null;
  }, [crops, selectedCropId]);

  // Filter mandi records matching the selected crop
  const cropMatchingMandis = useMemo(() => {
    if (!selectedCrop) return mandiRecords;
    const cropName = selectedCrop.name.toLowerCase();
    return mandiRecords.filter(
      (m) =>
        cropName.includes(m.crop.toLowerCase()) ||
        m.crop.toLowerCase().includes(cropName) ||
        (selectedCrop.variety &&
          m.variety.toLowerCase().includes(selectedCrop.variety.toLowerCase()))
    );
  }, [selectedCrop, mandiRecords]);

  // Evaluate price discovery & net-realization comparison
  const comparisonResult = useMemo(() => {
    if (!selectedCrop) return null;
    return compareMarketAndOffers(
      selectedCrop,
      cropMatchingMandis,
      buyerOffers
    );
  }, [selectedCrop, cropMatchingMandis, buyerOffers]);

  // District options for table filtering
  const districts = useMemo(() => {
    const list = mandiRecords.map((m) => m.district).filter(Boolean);
    return ['all', ...new Set(list)];
  }, [mandiRecords]);

  // Filtered mandi records for the general benchmark table
  const filteredMandiTable = useMemo(() => {
    return mandiRecords.filter((item) => {
      const matchesDistrict =
        districtFilter === 'all' ? true : item.district === districtFilter;

      const matchesSearch =
        searchQuery.trim() === ''
          ? true
          : item.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.marketName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.district.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesDistrict && matchesSearch;
    });
  }, [mandiRecords, districtFilter, searchQuery]);

  if (isLoading) {
    return <PageLoader message="Loading market intelligence and running price discovery..." />;
  }

  return (
    <div className="portal-page-container">
      {/* Page Header */}
      <div className="page-title-banner">
        <div>
          <h2 className="page-heading">Price Discovery & Decision Support</h2>
          <p className="page-subheading">
            Transparent, rule-based net-realization comparison between buyer farm-gate offers and regional APMC wholesale mandis.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary-action"
          onClick={loadAllData}
          disabled={isLoading}
        >
          <RefreshCw size={15} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Market Intelligence Advisory Banner */}
      <div className="demo-notice-bar" style={{ background: 'var(--sage-100)', borderColor: 'var(--sage-400)', color: 'var(--forest-950)' }}>
        <Info size={16} className="notice-icon" color="var(--forest-700)" />
        <span>
          <strong>Market Intelligence Benchmark: </strong>
          Wholesale mandi prices reflect recorded benchmark figures for Telangana APMC market yards. Buyer offers reflect real pending proposals from MongoDB.
        </span>
      </div>

      {loadError && (
        <div className="alert-box alert-error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <span>{loadError}</span>
          </div>
          <button type="button" className="btn btn-sm btn-secondary-action" onClick={loadAllData}>
            Retry
          </button>
        </div>
      )}

      {/* SECTION 1: CROP SELECTOR */}
      {crops.length > 0 ? (
        <div className="crop-selector-container">
          <div className="crop-selector-header">
            <span className="selector-title">
              <Sprout size={16} color="var(--forest-700)" />
              <span>Select Your Harvest Listing to Analyze:</span>
            </span>
          </div>

          <div className="crop-selector-chips">
            {crops.map((c) => (
              <button
                key={c._id}
                type="button"
                className={`crop-chip-btn ${c._id === selectedCropId ? 'active' : ''}`}
                onClick={() => handleSelectCrop(c._id)}
              >
                <div className="crop-chip-main">
                  <strong>{c.name}</strong>
                  <small>({c.variety})</small>
                </div>
                <div className="crop-chip-meta tabular-nums">
                  {c.quantity} {c.unit} · ₹{c.expectedPricePerKg}/kg
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <Sprout size={36} color="var(--forest-600)" style={{ margin: '0 auto 8px' }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--forest-950)' }}>No Active Crops Listed</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '460px', margin: '6px auto 16px' }}>
            To run personalized net-realization price discovery, register a harvest crop lot in your farm inventory.
          </p>
          <Link to="/add-crop" className="btn btn-primary-action">
            List Produce Now
          </Link>
        </div>
      )}

      {/* SECTION 2: PRICE DISCOVERY & COMPARISON PANEL */}
      {selectedCrop && comparisonResult && (
        <div className="decision-panel-card">
          <div className="decision-panel-top">
            <div className="decision-summary-titles">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="analysis-tag">Rule-Based Net Analysis</span>
                <span className="crop-badge-pill">
                  {selectedCrop.name} ({selectedCrop.quantity} {selectedCrop.unit})
                </span>
              </div>
              <h3 className="decision-heading">
                Procurement Decision & Realization Ranking
              </h3>
            </div>

            {/* Expandable Formula Button */}
            <button
              type="button"
              className="btn btn-text-sm"
              onClick={() => setShowCalculationInfo(!showCalculationInfo)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Info size={14} />
              <span>How This Was Calculated</span>
              {showCalculationInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Expandable Breakdown Drawer */}
          <AnimatePresence>
            {showCalculationInfo && (
              <motion.div
                className="calculation-breakdown-box"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="breakdown-inner">
                  <h4 className="breakdown-title">
                    <HelpCircle size={15} color="var(--forest-700)" />
                    <span>Transparent Ranking Methodology (No AI / ML Predictions)</span>
                  </h4>
                  <p className="breakdown-desc">
                    Different options often involve different quantities (e.g., a buyer offering to buy 10 quintals vs hauling your entire 50 quintals to a mandi). To ensure fair comparison, all channels are evaluated on <strong>Net Realization Per Kilogram</strong>:
                  </p>
                  <div className="formula-box tabular-nums">
                    <code>Net Per Kg = [Gross Bid Amount - Transport Cost - Mandi Cess / Handling Fees] / Quantity in kg</code>
                  </div>
                  <ul className="breakdown-steps">
                    <li>
                      <strong>Wholesale Mandi:</strong> Gross is benchmarked from the modal price for your lot size. Freight and mandi market fee (cess) are deducted.
                    </li>
                    <li>
                      <strong>Buyer Offer:</strong> Uses the verified server-calculated net realization from the buyer’s submitted proposal.
                    </li>
                    <li>
                      <strong>Rank Criteria:</strong> Highest net per kg ranks #1. Total net realization is used only as a tie-breaker.
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Highlighted Recommendation Banner */}
          {comparisonResult.recommendedOption && (
            <div className="recommendation-highlight-banner">
              <div className="rec-banner-icon">
                <Sparkles size={22} />
              </div>
              <div className="rec-banner-body">
                <div className="rec-banner-tag">
                  ★ Best Net Realization Channel
                </div>
                <div className="rec-banner-title">
                  {comparisonResult.recommendedOption.name} (
                  {comparisonResult.recommendedOption.type === 'buyer' ? 'Direct Farm-Gate Buyer' : 'Wholesale APMC Yard'}
                  )
                </div>
                <p className="rec-banner-explanation">
                  {comparisonResult.explanation}
                </p>
              </div>
              <div className="rec-banner-metrics tabular-nums">
                <div className="rec-metric-val">
                  ₹{comparisonResult.recommendedOption.netPerKg.toFixed(2)}
                  <small>/kg</small>
                </div>
                <div className="rec-metric-sub">
                  Est. Net: {formatINR(comparisonResult.recommendedOption.netRealization)}
                </div>
              </div>
            </div>
          )}

          {/* Options Comparison Table */}
          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th className="text-center">Rank</th>
                  <th>Channel / Buyer</th>
                  <th>Type</th>
                  <th className="tabular-nums">Lot Evaluated</th>
                  <th className="tabular-nums">Offered / Modal Price</th>
                  <th className="tabular-nums">Gross Value</th>
                  <th className="tabular-nums">Freight & Fees</th>
                  <th className="tabular-nums">Final Net</th>
                  <th className="tabular-nums th-highlight">Net / kg</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {comparisonResult.rankedOptions.map((opt) => {
                  const isTopRank = opt.rank === 1;
                  const totalDeductions = (Number(opt.transportCost) || 0) + (Number(opt.otherCharges) || 0);

                  return (
                    <tr key={opt.id} className={isTopRank ? 'tr-recommended' : ''}>
                      <td className="text-center">
                        <span className={`rank-badge ${isTopRank ? 'rank-top' : ''}`}>
                          #{opt.rank}
                        </span>
                      </td>
                      <td>
                        <div className="channel-name-cell">
                          <strong>{opt.name}</strong>
                          {opt.district && <small className="channel-sub">{opt.district}</small>}
                        </div>
                      </td>
                      <td>
                        <span className={`channel-type-badge type-${opt.type}`}>
                          {opt.type === 'buyer' ? (
                            <>
                              <Building2 size={12} />
                              <span>Buyer Bidding</span>
                            </>
                          ) : (
                            <>
                              <Warehouse size={12} />
                              <span>APMC Mandi</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="tabular-nums">
                        {opt.quantityDisplay}
                      </td>
                      <td className="tabular-nums">
                        ₹{opt.pricePerKg}/kg
                      </td>
                      <td className="tabular-nums">
                        {formatINR(opt.grossAmount)}
                      </td>
                      <td className="tabular-nums text-danger">
                        {totalDeductions > 0 ? `- ${formatINR(totalDeductions)}` : '₹0'}
                      </td>
                      <td className="tabular-nums font-bold">
                        {formatINR(opt.netRealization)}
                      </td>
                      <td className="tabular-nums td-highlight">
                        <strong className="net-per-kg-val">₹{opt.netPerKg.toFixed(2)}</strong>
                        <small>/kg</small>
                      </td>
                      <td className="text-center">
                        {opt.type === 'buyer' ? (
                          <Link to="/offers" className="btn btn-xs btn-accept" title="Review buyer offer in Offers Portal">
                            <span>Review Offer</span>
                            <ArrowRight size={11} />
                          </Link>
                        ) : (
                          <span className="mandi-transport-info" title="Hauling to APMC requires arranging transport">
                            Mandi Haul
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: ALL APMC REGIONAL BENCHMARK MANDIS TABLE */}
      <div className="dashboard-section-box" style={{ marginTop: '32px' }}>
        <div className="section-box-header">
          <div>
            <h3 className="section-box-title">Telangana Wholesale Mandi Catalog</h3>
            <p className="section-box-subtitle">
              Modal rates, distance, and cess rates across key APMC yards in Telangana districts.
            </p>
          </div>
        </div>

        {/* Search & District Filter Bar */}
        <div className="filter-toolbar">
          <div className="filter-search-box" style={{ maxWidth: '340px' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="filter-search-input"
              placeholder="Filter by commodity or mandi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-select-wrap">
            <label htmlFor="district-select" className="filter-label-inline">
              District:
            </label>
            <select
              id="district-select"
              className="form-input filter-dropdown"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
            >
              <option value="all">All Telangana Districts</option>
              {districts
                .filter((d) => d !== 'all')
                .map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {filteredMandiTable.length > 0 ? (
          <div className="card table-card-container">
            <div className="table-responsive-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Commodity & Variety</th>
                    <th>Market Yard / Mandi</th>
                    <th>District</th>
                    <th className="text-right">Min / Max</th>
                    <th className="text-right">Modal Rate</th>
                    <th className="text-right">Distance</th>
                    <th className="text-right">Est. Freight</th>
                    <th className="text-center">Demand & Trend</th>
                    <th>Last Update</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMandiTable.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="table-highlight-text">{item.crop}</span>
                        <span className="table-sub-text">{item.variety}</span>
                      </td>
                      <td>
                        <span className="table-market-name">{item.marketName}</span>
                      </td>
                      <td>{item.district}</td>
                      <td className="text-right tabular-nums" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        ₹{item.minPricePerKg} - ₹{item.maxPricePerKg}/kg
                      </td>
                      <td className="text-right tabular-nums">
                        <span className="table-modal-badge">
                          ₹{item.modalPricePerKg}/kg
                        </span>
                      </td>
                      <td className="text-right tabular-nums">
                        {item.distanceKm} km
                      </td>
                      <td className="text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                        ₹{item.transportCost}
                      </td>
                      <td className="text-center">
                        <span
                          className={`trend-pill ${
                            item.trend === 'rising'
                              ? 'trend-up'
                              : item.trend === 'falling'
                              ? 'trend-down'
                              : 'trend-stable'
                          }`}
                        >
                          {item.trend === 'rising' && <TrendingUp size={12} />}
                          {item.trend === 'falling' && <TrendingDown size={12} />}
                          {item.trend === 'stable' && <Minus size={12} />}
                          <span style={{ textTransform: 'capitalize' }}>
                            {item.demand} · {item.trend}
                          </span>
                        </span>
                      </td>
                      <td className="table-timestamp tabular-nums">
                        {item.lastUpdated}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="No Mandi Benchmarks Found"
            description={`No wholesale rates match your search criteria for district "${districtFilter}".`}
            actionLabel="Reset Search"
            onAction={() => {
              setSearchQuery('');
              setDistrictFilter('all');
            }}
          />
        )}
      </div>
    </div>
  );
}
