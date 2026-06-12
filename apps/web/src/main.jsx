import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Inventory from './pages/Inventory'
import POS from './pages/POS'
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import Admin from './pages/Admin'
import ProtectedRoute from './components/ProtectedRoute'
import VirtualKeyboard from './components/VirtualKeyboard'
import './index.css'

// Global Error Catch for Debugging
window.addEventListener('error', (event) => {
  console.error('Unhandled Runtime Error:', event.error);
  // alert(`Critical UI Error: ${event.error?.message || 'Check console for details'}`);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/inventory" element={
          <ProtectedRoute allowedRoles={['OWNER', 'STOCK_MANAGER']}>
            <Inventory />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['OWNER']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/pos" element={
          <ProtectedRoute allowedRoles={['OWNER', 'CASHIER']}>
            <POS />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['OWNER']}>
            <Admin />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['OWNER']}>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
      <VirtualKeyboard />
    </BrowserRouter>
  </React.StrictMode>,
)
