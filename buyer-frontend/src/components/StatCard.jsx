import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  helperText,
  accentColor,
}) {
  return (
    <motion.div
      className="kpi-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="kpi-card-header">
        <span className="kpi-title">{title}</span>
        {Icon && (
          <div
            className="kpi-icon-wrapper"
            style={accentColor ? { backgroundColor: `${accentColor}18`, color: accentColor } : {}}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="kpi-card-body">
        <div className="kpi-value tabular-nums">{value}</div>

        {(trendLabel || helperText) && (
          <div className="kpi-footer-row">
            {trendLabel && (
              <span
                className={`kpi-trend-pill ${
                  trend === 'up'
                    ? 'trend-up'
                    : trend === 'down'
                    ? 'trend-down'
                    : 'trend-neutral'
                }`}
              >
                {trendLabel}
              </span>
            )}
            {helperText && <span className="kpi-helper-text">{helperText}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}
