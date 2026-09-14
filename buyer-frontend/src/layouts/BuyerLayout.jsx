import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import BuyerSidebar from '../components/BuyerSidebar';
import BuyerHeader from '../components/BuyerHeader';
import MobileNavigation from '../components/MobileNavigation';
import Toast from '../components/Toast';

export default function BuyerLayout() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <div className="buyer-portal-layout">
      {/* Desktop Fixed Left Sidebar */}
      <BuyerSidebar />

      {/* Main Content Area */}
      <div className="buyer-main-wrapper">
        <BuyerHeader />

        <main className="buyer-content-scrollable">
          <Outlet context={{ showToast }} />
        </main>

        {/* Mobile Navigation Bar */}
        <MobileNavigation />
      </div>

      {/* Floating Toast Notification */}
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
