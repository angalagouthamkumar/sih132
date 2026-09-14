import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Farmers from './pages/Farmers';
import Buyers from './pages/Buyers';
import Crops from './pages/Crops';
import Offers from './pages/Offers';
import Orders from './pages/Orders';
import MarketData from './pages/MarketData';
import Profile from './pages/Profile';
import Requirements from './pages/Requirements';
import TransportConfig from './pages/TransportConfig';

export default function App() {
  return (
    <AuthProvider expectedRole="admin">
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<AdminLayout />}>
          <Route path="/dashboard"        element={<Dashboard />} />
          <Route path="/farmers"          element={<Farmers />} />
          <Route path="/buyers"           element={<Buyers />} />
          <Route path="/crops"            element={<Crops />} />
          <Route path="/offers"           element={<Offers />} />
          <Route path="/orders"           element={<Orders />} />
          <Route path="/market-data"      element={<MarketData />} />
          <Route path="/profile"          element={<Profile />} />
          <Route path="/requirements"     element={<Requirements />} />
          <Route path="/transport-config" element={<TransportConfig />} />

          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
