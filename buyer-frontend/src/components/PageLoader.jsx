import React from 'react';
import { Loader2 } from 'lucide-react';

export default function PageLoader({ message = 'Loading procurement catalog...' }) {
  return (
    <div className="page-loader-wrapper">
      <div className="page-loader-box">
        <Loader2 size={32} className="spin-animation loader-icon" />
        <p className="page-loader-message">{message}</p>
      </div>
    </div>
  );
}
