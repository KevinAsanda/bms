import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      setToken(token);
      setUser(user);
      
      // Redirect based on role
      if (user.role === 'OWNER') navigate('/dashboard');
      else if (user.role === 'CASHIER') navigate('/pos');
      else if (user.role === 'STOCK_MANAGER') navigate('/inventory');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-[var(--color-surface-page)] px-4 py-8">
      {/* Spacer to push content down */}
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="w-full max-w-[420px]">
          {/* Logo and Headings */}
          <div className="text-center mb-8">
            <img 
              src="/logo-icon.svg" 
              alt="Simon Family Farm Mascot" 
              className="h-24 mx-auto mb-4 object-contain" 
            />
            <h1 className="font-[var(--font-display)] text-xl font-bold tracking-wider text-[var(--color-brand-black)] uppercase m-0">
              Simon Family Farm
            </h1>
            <p className="font-[var(--font-body)] text-sm text-[var(--color-text-secondary)] mt-1 mb-0">
              Butchery Management System
            </p>
          </div>

          {/* Form Card */}
          <div className="card shadow-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="input"
                  placeholder="name@bms.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="bg-[var(--color-danger-bg)] border border-[var(--color-brand-red-mid)]/20 text-[var(--color-danger)] px-4 py-3 text-xs font-semibold rounded-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-sm uppercase font-bold tracking-wider"
              >
                {loading ? 'Logging in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* POPIA Compliant Footer */}
      <footer className="text-center w-full max-w-[420px] mt-8">
        <p className="text-[10px] text-[var(--color-text-muted)] font-medium leading-relaxed m-0">
          This system is strictly for authorized employee use. Personal information is collected and processed in compliance with the South African Protection of Personal Information Act (POPIA), Act 4 of 2013.
        </p>
        <div className="mt-2">
          <a 
            href="#privacy-policy" 
            onClick={(e) => {
              e.preventDefault();
              alert("Simon Family Farm Privacy Policy (POPIA compliant):\n\nWe collect only essential customer information (names and phone numbers) to track purchase history. Customer data is encrypted at rest using AES-256 and never shared with third parties. You may request record deletion at any time by contacting the Owner.");
            }}
            className="text-[10px] text-[var(--color-brand-red)] hover:underline font-semibold"
          >
            Privacy Notice & Consent Policy
          </a>
        </div>
      </footer>
    </div>
  );
}
