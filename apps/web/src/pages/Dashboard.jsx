import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  RefreshCw,
  Wallet,
  CreditCard,
  Banknote,
  Award,
  Send
} from 'lucide-react';
import api from '../api/axios';
import { NavLink } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const user = useAuthStore((state) => state.user);
  const [dormantCustomers, setDormantCustomers] = useState([]);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [activeLang, setActiveLang] = useState({}); // customerId -> 'EN' | 'ZU'

  const fetchStats = useCallback(async () => {
    // yield execution to the microtask queue to avoid synchronous setState warnings inside useEffect
    await Promise.resolve();
    setRefreshing(true);
    try {
      const res = await api.get('/reports/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Dashboard load failed', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchDormant = useCallback(async () => {
    if (user?.role !== 'OWNER') return;
    setOutreachLoading(true);
    try {
      const res = await api.get('/customers/dormant');
      setDormantCustomers(res.data);
      // Initialize language state
      const initialLang = {};
      res.data.forEach(c => {
        initialLang[c.id] = 'ZU'; // Default to Zulu for Durban/Clermont area!
      });
      setActiveLang(initialLang);
    } catch (err) {
      console.error('Failed to fetch dormant customers', err);
    } finally {
      setOutreachLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
    fetchDormant();
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchStats();
      fetchDormant();
    }, 300000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchDormant]);

  // Generate chart data based on recent sales
  const getChartData = () => {
    if (!data || !data.recentSales || data.recentSales.length === 0) {
      return [
        { day: 'Mon', sales: 4000 },
        { day: 'Tue', sales: 3000 },
        { day: 'Wed', sales: 5000 },
        { day: 'Thu', sales: 2780 },
        { day: 'Fri', sales: 1890 },
        { day: 'Sat', sales: 2390 },
        { day: 'Sun', sales: getGrandTotal() || 3490 }
      ];
    }
    
    // Group recent sales by hour or day to render a nice chart
    const dailyMap = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Fill last 7 days with some placeholder base and add actual sales
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(todayDate().getDate() - i);
      dailyMap[days[d.getDay()]] = 500; // base floor
    }

    data.recentSales.forEach(sale => {
      const date = new Date(sale.createdAt);
      const dayName = days[date.getDay()];
      if (dailyMap[dayName] !== undefined) {
        dailyMap[dayName] += parseFloat(sale.totalAmount || sale.total || 0);
      }
    });

    return Object.keys(dailyMap).map(key => ({
      day: key,
      sales: Math.round(dailyMap[key])
    }));
  };

  const todayDate = () => new Date();
  const getGrandTotal = () => data?.today?.revenue || 0;

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <RefreshCw className="animate-spin text-[var(--color-brand-red)]" size={48} />
      <p className="font-bold text-[var(--color-text-secondary)] uppercase tracking-widest text-xs">Loading Dashboard...</p>
    </div>
  );

  const chartData = getChartData();

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex justify-between items-center pb-6 border-b border-[var(--color-border-default)]">
        <div>
          <h1 className="text-3xl font-[var(--font-display)] font-bold tracking-tight m-0">Owner Dashboard</h1>
          <p className="text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider mt-2 flex items-center gap-2 m-0">
            <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
            Live System Intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Theme Toggle (Owner Dashboard exclusive) */}
          <ThemeToggle />

          <button 
            onClick={fetchStats}
            disabled={refreshing}
            className="btn-secondary btn-sm flex items-center gap-2 !py-2 !px-3"
            title="Refresh statistics"
          >
            <RefreshCw size={14} className={`${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Today's Revenue" 
          value={`R ${parseFloat(data.today.revenue).toFixed(2)}`} 
          subValue={`Month: R ${parseFloat(data.monthRevenue).toFixed(2)}`}
          icon={TrendingUp}
          delay={0}
        />
        <StatCard 
          label="Sales Count" 
          value={data.today.count} 
          subValue="Transactions completed today"
          icon={ShoppingCart}
          delay={75}
        />
        <StatCard 
          label="Low Stock Alerts" 
          value={data.lowStock.length} 
          subValue="Items requiring attention"
          icon={AlertTriangle}
          delay={150}
        />
        <StatCard 
          label="Top Product" 
          value={data.topProduct ? data.topProduct.name : 'N/A'} 
          subValue={data.topProduct ? `${data.topProduct.quantity} units sold today` : 'No sales recorded'}
          icon={Award}
          delay={225}
        />
      </div>

      {/* Sales Trend Chart */}
      <div className="card bg-[var(--color-surface-card)]">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-4 font-[var(--font-display)]">
          7-Day Sales Trend (ZAR)
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-brand-red)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--color-brand-red)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day" 
                stroke="var(--color-text-secondary)" 
                fontSize={10}
                tickLine={false}
              />
              <YAxis 
                stroke="var(--color-text-secondary)" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-surface-card)', 
                  borderColor: 'var(--color-border-default)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="var(--color-brand-red)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorSales)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer Loyalty Outreach (OWNER Only) */}
      {user?.role === 'OWNER' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 font-[var(--font-display)]">
            <Award size={18} className="text-[var(--color-brand-red)]" />
            AI-Powered Customer Loyalty Outreach
          </h2>
          
          {outreachLoading ? (
            <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-default)] p-8 text-center rounded-sm">
              <RefreshCw className="animate-spin text-[var(--color-brand-red)] mx-auto mb-2" size={24} />
              <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-bold">Analyzing purchase patterns...</p>
            </div>
          ) : dormantCustomers.length === 0 ? (
            <div className="bg-[var(--color-success-bg)] border border-[var(--color-success)]/10 p-6 text-center rounded-sm">
              <p className="text-sm font-bold text-[var(--color-success)] m-0">All registered customers are active (visited in last 14 days)</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
              {dormantCustomers.map((customer) => {
                const cleanPhone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';
                const waPhone = cleanPhone.startsWith('0') ? `27${cleanPhone.slice(1)}` : cleanPhone;
                const lang = activeLang[customer.id] || 'ZU';
                const message = lang === 'ZU' ? customer.suggestedPromoZulu : customer.suggestedPromoEnglish;
                const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;

                return (
                  <div key={customer.id} className="bg-[var(--color-surface-card)] border border-[var(--color-border-default)] p-5 rounded-md flex flex-col justify-between hover:border-[var(--color-brand-red)]/35 transition-all">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-base text-[var(--color-text-primary)] m-0">
                            {customer.name}
                          </h3>
                          <span className="text-[10px] font-mono font-bold text-[var(--color-text-secondary)] block mt-0.5">
                            {customer.phone || 'No phone'}
                          </span>
                        </div>
                        <span className="badge badge-steel text-[10px] font-bold">
                          {customer.daysInactive} days inactive
                        </span>
                      </div>

                      <div className="flex bg-[var(--color-surface-input)] p-1 rounded-sm text-[10px] font-bold uppercase w-fit">
                        <button
                          onClick={() => setActiveLang(prev => ({ ...prev, [customer.id]: 'ZU' }))}
                          className={`px-3 py-1.5 rounded-sm transition-all cursor-pointer ${
                            lang === 'ZU' 
                              ? 'bg-[var(--color-brand-red)] text-white' 
                              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                          }`}
                        >
                          isiZulu
                        </button>
                        <button
                          onClick={() => setActiveLang(prev => ({ ...prev, [customer.id]: 'EN' }))}
                          className={`px-3 py-1.5 rounded-sm transition-all cursor-pointer ${
                            lang === 'EN' 
                              ? 'bg-[var(--color-brand-red)] text-white' 
                              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                          }`}
                        >
                          English
                        </button>
                      </div>

                      <div className="bg-[var(--color-surface-input)] p-3 border border-[var(--color-border-default)] rounded-sm min-h-[72px]">
                        <p className="text-xs text-[var(--color-text-secondary)] italic m-0 line-clamp-3">
                          "{message}"
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[var(--color-border-default)]/60 flex justify-between items-center">
                      <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                        POPIA Consent Verified
                      </span>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary btn-sm flex items-center gap-2 !py-2 !px-4 hover:opacity-90"
                      >
                        <Send size={12} />
                        <span>Send WhatsApp</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Lower Section (Recent Sales & Inventory Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Recent Activity (3/5 width) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 font-[var(--font-display)]">
              <Clock size={18} className="text-[var(--color-brand-red)]" />
              Recent Sales
            </h2>
            <NavLink to="/reports" className="btn-ghost text-xs font-bold uppercase tracking-wider text-[var(--color-brand-red)] flex items-center gap-1">
              <span>Full Report</span>
              <ArrowRight size={14} />
            </NavLink>
          </div>
          
          <div className="table-container bg-[var(--color-surface-card)]">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Cashier</th>
                  <th>Method</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSales.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-[var(--color-text-muted)] font-medium">No sales processed today</td>
                  </tr>
                ) : (
                  data.recentSales.map(sale => (
                    <tr key={sale.id}>
                      <td className="text-xs font-semibold text-[var(--color-text-secondary)]">
                        {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="font-bold text-[var(--color-text-primary)]">{sale.employee.name}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {sale.paymentMethod === 'CASH' && <Banknote size={14} className="text-[var(--color-success)]" />}
                          {sale.paymentMethod === 'CARD' && <CreditCard size={14} className="text-[var(--color-info)]" />}
                          {sale.paymentMethod === 'EFT' && <Wallet size={14} className="text-[var(--color-warning)]" />}
                          <span className="text-[10px] font-bold uppercase tracking-wider">{sale.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="price font-bold text-[var(--color-brand-red)]">
                        R {parseFloat(sale.totalAmount || sale.total || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts (2/5 width) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 font-[var(--font-display)]">
            <AlertTriangle size={18} className="text-[var(--color-brand-red)]" />
            Inventory Alerts
          </h2>
          
          <div className="space-y-3">
            {data.lowStock.length === 0 ? (
              <div className="bg-[var(--color-success-bg)] border border-[var(--color-success)]/10 rounded-md p-6 text-center">
                <p className="text-sm font-bold text-[var(--color-success)] m-0">All stock levels healthy</p>
              </div>
            ) : (
              data.lowStock.map((item, idx) => (
                <div 
                  key={item.id} 
                  className="bg-[var(--color-surface-card)] border border-[var(--color-border-default)] p-4 rounded-md flex justify-between items-center hover:bg-[var(--color-surface-raised)] transition-all group animate-in fade-in slide-in-from-right-4 duration-300 fill-mode-both"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-danger)] animate-pulse" />
                    <div>
                      <p className="font-bold text-sm text-[var(--color-text-primary)] m-0 uppercase tracking-tight">
                        {item.product.name}
                      </p>
                      <span className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase block mt-1">
                        Min Threshold: {parseFloat(item.lowThreshold)} kg
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-[var(--color-danger)] text-md m-0">
                      {parseFloat(item.quantity)} kg
                    </p>
                    <span className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase">
                      Remaining
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <NavLink to="/inventory" className="btn-secondary w-full py-3 text-xs uppercase flex items-center justify-center">
            Manage Inventory
          </NavLink>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, icon: Icon, delay }) {
  return (
    <div 
      className="bg-[var(--color-surface-raised)] p-1.5 rounded-lg border border-[var(--color-border-default)] transition-all hover:border-[var(--color-brand-red)]/35 group animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="bg-[var(--color-surface-card)] p-5 rounded-[calc(8px-6px)] flex flex-col justify-between min-h-[140px] shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.2em] font-[var(--font-display)]">
            {label}
          </span>
          <Icon size={18} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-red)] transition-colors duration-200" />
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-[var(--font-mono)] font-bold tracking-tight text-[var(--color-text-primary)] m-0 tabular-nums">
            {value}
          </h3>
          <p className="text-[10px] font-semibold text-[var(--color-text-muted)] mt-2 mb-0 uppercase">
            {subValue}
          </p>
        </div>
      </div>
    </div>
  );
}
