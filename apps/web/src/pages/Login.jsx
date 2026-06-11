import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--color-bg-surface)] rounded-full mb-4 border border-[var(--color-border)] shadow-inner">
            <h1 className="text-[var(--color-primary)] text-3xl font-black font-[var(--font-display)] tracking-tighter">BMS</h1>
          </div>
          <h2 className="text-white text-2xl font-black tracking-tight mb-1 font-[var(--font-display)]">Butchery Management</h2>
          <p className="text-[var(--color-text-secondary)] text-[10px] font-bold uppercase tracking-[0.2em]">Simon Family Farm</p>
        </div>

        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2.5">Email Address</label>
              <input
                type="email"
                required
                className={`w-full bg-[var(--color-bg-elevated)] border-2 ${error ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'} text-white rounded-full px-5 py-3.5 text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-glow)] transition-all font-semibold`}
                placeholder="admin@bms.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2.5">Password</label>
              <input
                type="password"
                required
                className={`w-full bg-[var(--color-bg-elevated)] border-2 ${error ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'} text-white rounded-full px-5 py-3.5 text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-glow)] transition-all font-semibold`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] px-5 py-3.5 rounded-full text-xs font-bold text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-bold py-4 rounded-full transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider shadow-lg shadow-[var(--color-primary-glow)]"
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
