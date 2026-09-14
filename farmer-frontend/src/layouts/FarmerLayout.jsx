import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import FarmerSidebar from '../components/FarmerSidebar';
import FarmerHeader from '../components/FarmerHeader';
import MobileNavigation from '../components/MobileNavigation';
import Toast from '../components/Toast';

export default function FarmerLayout() {
  const location = useLocation();
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard Overview';
      case '/add-crop':
        return 'Add New Crop Listing';
      case '/my-crops':
        return 'My Listed Crops';
      case '/market-prices':
        return 'APMC Market Mandi Prices';
      case '/offers':
        return 'Buyer Offers & Bids';
      case '/orders':
        return 'My Dispatch Orders';
      case '/profile':
        return 'Farmer Profile & Settings';
      default:
        return 'Farmer Portal';
    }
  };

  return (
    <div className="farmer-layout-root">
      <FarmerSidebar />

      <div className="farmer-main-wrapper">
        <FarmerHeader pageTitle={getPageTitle(location.pathname)} />

        <main className="farmer-scroll-content">
          <Outlet context={{ showToast }} />
        </main>

        <MobileNavigation />
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'info' })}
      />
    </div>
  );
}
