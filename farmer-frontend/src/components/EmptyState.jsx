import React from 'react';
import { PackageOpen } from 'lucide-react';

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No records found',
  description = 'There are no items matching your current view or filter selection.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty-state-box">
      <div className="empty-state-icon">
        <Icon size={36} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn btn-secondary" onClick={onAction} style={{ marginTop: '16px' }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
