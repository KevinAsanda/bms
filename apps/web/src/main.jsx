import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Inventory from './pages/Inventory'
import POS from './pages/POS'
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import Admin from './pages/Admin'
import Navigation from './components/Navigation'
import './index.css'
import { useAuthStore } from './store/authStore'

// Global Error Catch for Debugging
window.addEventListener('error', (event) => {
  console.error('Unhandled Runtime Error:', event.error);
  // alert(`Critical UI Error: ${event.error?.message || 'Check console for details'}`);
});

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuthStore()
  
  if (!token) return <Navigate to="/login" />
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" />
  
  return (
    <>
      <Navigation />
      {children}
    </>
  )
}

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
    </BrowserRouter>
  </React.StrictMode>,
)
