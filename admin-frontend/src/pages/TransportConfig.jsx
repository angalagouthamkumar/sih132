import { useState, useEffect } from 'react';
import { getTransportConfig, updateTransportConfig } from '../services/adminService';
import PageLoader from '../components/PageLoader';

const TransportConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [form, setForm] = useState({ baseCharge: '', ratePerKm: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getTransportConfig();
      if (res.success && res.data) {
        setConfig(res.data);
        setForm({
          baseCharge: res.data.baseCharge ?? '',
          ratePerKm:  res.data.ratePerKm ?? '',
        });
      } else {
        setError(res.message || 'Failed to load transport configuration.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transport configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    const baseCharge = Number(form.baseCharge);
    const ratePerKm  = Number(form.ratePerKm);

    if (isNaN(baseCharge) || baseCharge < 0) {
      setFormError('Base charge must be a non-negative number.');
      return;
    }
    if (isNaN(ratePerKm) || ratePerKm < 0) {
      setFormError('Rate per km must be a non-negative number.');
      return;
    }

    setSaving(true);
    try {
      const res = await updateTransportConfig({ baseCharge, ratePerKm });
      if (res.success) {
        setConfig(res.data);
        setSuccessMsg('Transport configuration updated successfully.');
      } else {
        setFormError(res.message || 'Failed to update configuration.');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="admin-page">
      <div className="page-header-row">
        <div>
          <h2>Transport Configuration</h2>
          <p>
            Set the base transport charge and per-kilometre rate used to calculate
            logistics costs in offer matching. Changes take effect immediately on
            new matches.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">{error}</div>
      )}

      {config && (
        <div className="transport-config-grid">
          {/* Current values */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 700 }}>
              Current Active Values
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div className="kpi-label">Base Charge</div>
                <div className="transport-current-value tabular-nums">
                  ₹{config.baseCharge.toLocaleString('en-IN')}
                </div>
                <div className="transport-unit">flat fee per delivery</div>
              </div>
              <div>
                <div className="kpi-label">Rate per km</div>
                <div className="transport-current-value tabular-nums">
                  ₹{config.ratePerKm.toLocaleString('en-IN')}
                </div>
                <div className="transport-unit">per kilometre</div>
              </div>
              {config.updatedBy && (
                <div className="text-xs text-secondary" style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                  Last updated by: <strong>{config.updatedBy?.name || config.updatedBy}</strong>
                  {config.updatedAt && (
                    <span> on {new Date(config.updatedAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Edit form */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 700 }}>
              Update Configuration
            </h3>

            {formError && (
              <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>
                {formError}
              </div>
            )}
            {successMsg && (
              <div className="alert alert-success" role="status" style={{ marginBottom: '1rem' }}>
                ✓ {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-row" style={{ gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="baseCharge">
                    Base Charge (₹)
                  </label>
                  <input
                    id="baseCharge"
                    type="number"
                    name="baseCharge"
                    min="0"
                    step="1"
                    value={form.baseCharge}
                    onChange={handleChange}
                    placeholder="e.g. 500"
                    required
                    disabled={saving}
                  />
                  <small className="text-secondary text-xs">
                    Flat fee added to every delivery regardless of distance.
                  </small>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ratePerKm">
                    Rate per km (₹/km)
                  </label>
                  <input
                    id="ratePerKm"
                    type="number"
                    name="ratePerKm"
                    min="0"
                    step="0.5"
                    value={form.ratePerKm}
                    onChange={handleChange}
                    placeholder="e.g. 15"
                    required
                    disabled={saving}
                  />
                  <small className="text-secondary text-xs">
                    Multiplied by the farm-to-delivery distance in kilometres.
                  </small>
                </div>
              </div>

              {form.baseCharge !== '' && form.ratePerKm !== '' && (
                <div className="alert alert-info" style={{ marginBottom: '1rem', fontSize: '0.82rem' }}>
                  Preview: 50 km delivery → ₹{(Number(form.baseCharge) + Number(form.ratePerKm) * 50).toLocaleString('en-IN')} total transport cost
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportConfig;
