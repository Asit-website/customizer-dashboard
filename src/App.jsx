import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import LayerDesigns from './pages/LayerDesigns';
import CustomizeLayerDesign from './pages/CustomizeLayerDesign';
import LayerDesignsBySQ from './pages/LayerDesignsBySQ';
import Users from './pages/Users';
import { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/layerdesigns" element={<ProtectedRoute><LayerDesigns /></ProtectedRoute>} />
        <Route path="/layerdesigns/:sq" element={<ProtectedRoute><LayerDesignsBySQ /></ProtectedRoute>} />
        <Route path="/customize-layerdesign/:id" element={<ProtectedRoute><CustomizeLayerDesign /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
      </Routes>
      <ToastContainer position="top-right" autoClose={2500} />
    </Router>
  );
}

export default App;
