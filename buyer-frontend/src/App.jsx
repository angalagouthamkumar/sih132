import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import BuyerLayout from './layouts/BuyerLayout';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';

// Buyer Portal Pages
import Dashboard from './pages/Dashboard';
import BrowseCrops from './pages/BrowseCrops';
import CropDetails from './pages/CropDetails';
import CreateRequirement from './pages/CreateRequirement';
import Offers from './pages/Offers';
import Orders from './pages/Orders';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider expectedRole="buyer">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Buyer Layout & Routes */}
        <Route
          element={
            <ProtectedRoute>
              <BuyerLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/browse-crops" element={<BrowseCrops />} />
          <Route path="/crops/:id" element={<CropDetails />} />
          <Route path="/create-requirement" element={<CreateRequirement />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Default & Fallback Routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
