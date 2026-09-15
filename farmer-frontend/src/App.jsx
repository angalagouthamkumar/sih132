import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import FarmerLayout from './layouts/FarmerLayout';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';

// Farmer Portal Pages
import Dashboard from './pages/Dashboard';
import AddCrop from './pages/AddCrop';
import EditCrop from './pages/EditCrop';
import MyCrops from './pages/MyCrops';
import MarketPrices from './pages/MarketPrices';
import Offers from './pages/Offers';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import BuyerRequirements from './pages/BuyerRequirements';

export default function App() {
  return (
    <AuthProvider expectedRole="farmer">
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Farmer Portal Layout & Routes */}
        <Route
          element={
            <ProtectedRoute>
              <FarmerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-crop" element={<AddCrop />} />
          <Route path="/my-crops" element={<MyCrops />} />
          <Route path="/my-crops/:id/edit" element={<EditCrop />} />
          <Route path="/market-prices" element={<MarketPrices />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/buyer-requirements" element={<BuyerRequirements />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Default / Fallback Routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
