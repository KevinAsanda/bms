import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  RefreshCw,
  Wallet,
  CreditCard,
  Banknote
} from 'lucide-react';
import api from '../api/axios';
import { NavLink } from 'react-router-dom';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchStats, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/reports/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Dashboard load failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
      <RefreshCw className="animate-spin text-[var(--color-primary)]" size={48} />
    </div>
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      
      {/* Top Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black font-[var(--font-display)] tracking-tight">System Pulse</h1>
          <p className="text-[var(--color-text-secondary)] font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
            Live Business Intelligence
          </p>
        </div>
        <button 
          onClick={fetchStats}
          disabled={refreshing}
          className="p-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl hover:border-[var(--color-primary)] transition-all group disabled:opacity-50"
        >
          <RefreshCw size={20} className={`${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Today's Revenue" 
          value={`R ${parseFloat(data.today.revenue).toFixed(2)}`} 
          subValue={`Month: R ${parseFloat(data.monthRevenue).toFixed(2)}`}
          icon={TrendingUp}
          color="primary"
          trend="+12% vs yesterday"
        />
        <StatCard 
          label="Total Transactions" 
          value={data.today.count} 
          subValue="Sales processed today"
          icon={ShoppingCart}
          color="info"
        />
        <StatCard 
          label="Staff on Shift" 
          value={data.today.activeStaff} 
          subValue="Active system users"
          icon={Users}
          color="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Recent Activity (3/5 width) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black font-[var(--font-display)] uppercase tracking-tight flex items-center gap-2">
              <Clock size={20} className="text-[var(--color-primary)]" />
              Recent Sales
            </h2>
            <NavLink to="/reports" className="text-xs font-black uppercase tracking-widest text-[var(--color-primary)] hover:underline flex items-center gap-1">
              Full Report <ArrowRight size={14} />
            </NavLink>
          </div>
          
          <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--color-bg-elevated)]/50 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Cashier</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {data.recentSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-[var(--color-bg-hover)] transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-[var(--color-text-secondary)]">
                      {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-sm font-black">{sale.employee.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {sale.paymentMethod === 'CASH' && <Banknote size={14} className="text-[var(--color-success)]" />}
                        {sale.paymentMethod === 'CARD' && <CreditCard size={14} className="text-[var(--color-info)]" />}
                        {sale.paymentMethod === 'EFT' && <Wallet size={14} className="text-[var(--color-warning)]" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{sale.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-black text-[var(--color-primary)]">
                      R {parseFloat(sale.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts (2/5 width) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-black font-[var(--font-display)] uppercase tracking-tight flex items-center gap-2">
            <AlertTriangle size={20} className="text-[var(--color-error)]" />
            Inventory Alerts
          </h2>
          
          <div className="space-y-3">
            {data.lowStock.length === 0 ? (
              <div className="bg-[var(--color-success)]/5 border border-[var(--color-success)]/20 rounded-2xl p-6 text-center">
                <p className="text-sm font-bold text-[var(--color-success)]">All stock levels healthy</p>
              </div>
            ) : (
              data.lowStock.map(item => (
                <div key={item.id} className="bg-[var(--color-bg-surface)] border-l-4 border-l-[var(--color-error)] border border-[var(--color-border)] p-4 rounded-xl flex justify-between items-center group hover:bg-[var(--color-bg-hover)] transition-all">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{item.product.name}</p>
                    <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Threshold: {item.lowThreshold}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-black text-[var(--color-error)] text-lg">{parseFloat(item.quantity)}</p>
                    <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Remaining</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <NavLink to="/inventory" className="block w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-4 rounded-2xl text-center font-black uppercase tracking-widest text-xs hover:border-[var(--color-primary)] transition-all active:scale-[0.98]">
            Manage Inventory
          </NavLink>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, icon: Icon, color, trend }) {
  const colors = {
    primary: 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20',
    info: 'text-[var(--color-info)] bg-[var(--color-info)]/10 border-[var(--color-info)]/20',
    success: 'text-[var(--color-success)] bg-[var(--color-success)]/10 border-[var(--color-success)]/20',
  };

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-3xl p-8 space-y-6 shadow-xl group hover:border-[var(--color-primary)]/30 transition-all">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-2xl ${colors[color]}`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
        {trend && <span className="text-[10px] font-black text-[var(--color-success)] uppercase tracking-widest">{trend}</span>}
      </div>
      <div>
        <p className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-[0.2em] mb-1">{label}</p>
        <h3 className="text-4xl font-mono font-black tracking-tighter tabular-nums">{value}</h3>
        <p className="text-[10px] font-bold text-[var(--color-text-muted)] mt-2 uppercase">{subValue}</p>
      </div>
    </div>
  );
}
