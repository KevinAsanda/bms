import { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  Search, 
  Banknote, 
  CreditCard, 
  Wallet, 
  ChevronRight,
  TrendingUp,
  Box
} from 'lucide-react';
import api from '../api/axios';
import { format } from 'date-fns';

export default function Reports() {
  const [reportDate, setReportDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [reportDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const [salesRes, catRes] = await Promise.all([
        api.get(`/reports/daily?date=${reportDate}`),
        api.get(`/reports/categories?date=${reportDate}`)
      ]);
      setData(salesRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Report fetch failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) return <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
    <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
  </div>;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Date Picker */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black font-[var(--font-display)] uppercase tracking-tight flex items-center gap-3">
            <FileText className="text-[var(--color-primary)]" size={32} />
            Financial Audit
          </h1>
          <p className="text-[var(--color-text-secondary)] font-bold text-xs uppercase tracking-widest mt-1">Detailed performance breakdown for {reportDate}</p>
        </div>
        
        <div className="flex items-center gap-2 bg-[var(--color-bg-surface)] border border-[var(--color-border)] px-4 py-2 rounded-full">
          <Calendar size={16} className="text-[var(--color-text-secondary)]" />
          <input 
            type="date" 
            className="bg-transparent border-none text-xs font-bold uppercase tracking-wider focus:ring-0 cursor-pointer text-white"
            value={reportDate}
            onChange={e => setReportDate(e.target.value)}
          />
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricBox label="Revenue" value={`R ${data.totalRevenue.toFixed(2)}`} icon={TrendingUp} color="primary" />
        <MetricBox label="Cash" value={`R ${data.CASH.toFixed(2)}`} icon={Banknote} color="success" />
        <MetricBox label="Card" value={`R ${data.CARD.toFixed(2)}`} icon={CreditCard} color="info" />
        <MetricBox label="EFT" value={`R ${data.EFT.toFixed(2)}`} icon={Wallet} color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Category Performance */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-lg font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <Box size={18} className="text-[var(--color-primary)]" />
            Category Mix
          </h2>
          <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-3xl p-6 space-y-4">
            {categories.map(cat => (
              <div key={cat.name} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-widest">{cat.name}</span>
                  <span className="font-mono font-black text-sm text-[var(--color-primary)]">R {cat.total.toFixed(2)}</span>
                </div>
                <div className="h-1.5 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--color-primary)] transition-all duration-1000" 
                    style={{ width: `${(cat.total / data.totalRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {categories.length === 0 && <p className="text-center text-xs text-[var(--color-text-muted)] py-10 italic">No sales recorded for this date</p>}
          </div>
        </div>

        {/* Transaction Ledger */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <Search size={18} className="text-[var(--color-primary)]" />
            Transaction Ledger
          </h2>
          <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-bg-elevated)] text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {data.sales.map(sale => (
                  <tr key={sale.id} className="hover:bg-[var(--color-bg-hover)] transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-[var(--color-text-secondary)]">
                      {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 font-black text-sm">{sale.employee.name}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] bg-[var(--color-bg-elevated)] px-2 py-1 rounded font-bold">
                        {sale.items.length} units
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="font-mono font-black text-[var(--color-primary)]">R {parseFloat(sale.total).toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
                {data.sales.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center text-xs text-[var(--color-text-muted)] italic">
                      No transactions found for this date range
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

function MetricBox({ label, value, icon: Icon, color }) {
  const colors = {
    primary: 'text-[var(--color-primary)] border-[var(--color-primary)]/20',
    success: 'text-[var(--color-success)] border-[var(--color-success)]/20',
    info: 'text-[var(--color-info)] border-[var(--color-info)]/20',
    warning: 'text-[var(--color-warning)] border-[var(--color-warning)]/20',
  };

  return (
    <div className={`bg-[var(--color-bg-surface)] border rounded-2xl p-6 flex items-center justify-between shadow-lg ${colors[color]}`}>
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">{label}</p>
        <h3 className="text-xl font-mono font-black tracking-tighter">{value}</h3>
      </div>
      <Icon size={20} strokeWidth={3} className="opacity-40" />
    </div>
  );
}
