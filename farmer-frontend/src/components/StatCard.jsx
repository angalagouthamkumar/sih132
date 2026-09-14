import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  helperText,
  accentColor = 'var(--forest-700)',
}) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="stat-card-top">
        <span className="stat-card-title">{title}</span>
        {Icon && (
          <div className="stat-card-icon-wrap" style={{ color: accentColor }}>
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="stat-card-main">
        <div className="stat-card-value tabular-nums">{value}</div>
        {trend && (
          <span
            className={`stat-trend-badge ${
              trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : 'trend-stable'
            }`}
          >
            {trendLabel}
          </span>
        )}
      </div>

      {helperText && <p className="stat-card-helper">{helperText}</p>}
    </motion.div>
  );
}
