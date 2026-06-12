import { Navigate } from 'react-router-dom';
import Navigation from './Navigation';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, token } = useAuthStore();
  
  if (!token) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" />;
  
  return (
    <div className="flex min-h-screen bg-[var(--color-surface-page)] text-[var(--color-text-primary)]">
      <Navigation />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}
