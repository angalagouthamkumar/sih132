import React from 'react';
import { motion } from 'framer-motion';
import { PackageOpen } from 'lucide-react';

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No Records Found',
  description = 'There are no active records matching your criteria.',
  actionLabel,
  onAction,
}) {
  return (
    <motion.div
      className="empty-state-card"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="empty-state-icon">
        <Icon size={40} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
