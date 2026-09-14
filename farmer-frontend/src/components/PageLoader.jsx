import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function PageLoader({ text = 'Loading portal data...' }) {
  return (
    <div className="page-loader-wrap">
      <RefreshCw size={26} className="spin-animation" style={{ color: 'var(--forest-700)' }} />
      <span className="page-loader-text">{text}</span>
    </div>
  );
}
