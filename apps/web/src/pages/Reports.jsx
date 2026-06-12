import { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  Search, 
  Banknote, 
  CreditCard, 
  Wallet, 
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

  if (loading && !data) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="w-10 h-10 border-4 border-[var(--color-brand-red)] border-t-transparent rounded-full animate-spin" />
      <p className="font-bold text-[var(--color-text-secondary)] uppercase tracking-widest text-xs">Loading report...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header & Date Picker */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[var(--color-border-default)]">
        <div>
          <h1 className="text-3xl font-[var(--font-display)] font-bold tracking-tight m-0 flex items-center gap-3">
            <FileText className="text-[var(--color-brand-red)]" size={30} />
            Financial Audit
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1 m-0">
            Detailed performance breakdown for {reportDate}
          </p>
        </div>
        
        {/* Date Selector input styled */}
        <div className="flex items-center gap-2 bg-[var(--color-surface-card)] border border-[var(--color-border-default)] px-4 py-2 rounded-full shadow-sm">
          <Calendar size={14} className="text-[var(--color-text-secondary)]" />
          <input 
            type="date" 
            className="bg-transparent border-none text-xs font-bold uppercase tracking-wider focus:outline-none cursor-pointer text-[var(--color-text-primary)]"
            value={reportDate}
            onChange={e => setReportDate(e.target.value)}
          />
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricBox label="Daily Revenue" value={`R ${data.totalRevenue.toFixed(2)}`} icon={TrendingUp} delay={0} />
        <MetricBox label="Cash Payment" value={`R ${data.CASH.toFixed(2)}`} icon={Banknote} delay={75} />
        <MetricBox label="Card Payment" value={`R ${data.CARD.toFixed(2)}`} icon={CreditCard} delay={150} />
        <MetricBox label="EFT Payment" value={`R ${data.EFT.toFixed(2)}`} icon={Wallet} delay={225} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Category Performance */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 font-[var(--font-display)]">
            <Box size={18} className="text-[var(--color-brand-red)]" />
            Category Mix
          </h2>
          <div className="card bg-[var(--color-surface-card)] space-y-4">
            {categories.map(cat => (
              <div key={cat.name} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    {cat.name}
                  </span>
                  <span className="font-[var(--font-mono)] font-bold text-sm text-[var(--color-brand-red)]">
                    R {cat.total.toFixed(2)}
                  </span>
                </div>
                <div className="h-2 bg-[var(--color-surface-input)] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--color-brand-red)] transition-all duration-500" 
                    style={{ width: `${(cat.total / (data.totalRevenue || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-center text-xs text-[var(--color-text-muted)] py-10 italic m-0">
                No sales recorded for this date
              </p>
            )}
          </div>
        </div>

        {/* Transaction Ledger */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 font-[var(--font-display)]">
            <Search size={18} className="text-[var(--color-brand-red)]" />
            Transaction Ledger
          </h2>
          <div className="table-container bg-[var(--color-surface-card)] shadow-sm">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Employee</th>
                  <th>Item Count</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.sales.map(sale => (
                  <tr key={sale.id}>
                    <td className="text-xs font-semibold text-[var(--color-text-secondary)]">
                      {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="font-bold text-[var(--color-text-primary)]">{sale.employee.name}</td>
                    <td>
                      <span className="badge badge-steel">
                        {sale.items.length} lines
                      </span>
                    </td>
                    <td className="price font-bold text-[var(--color-brand-red)]">
                      R {parseFloat(sale.totalAmount || sale.total || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {data.sales.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-20 text-xs text-[var(--color-text-muted)] italic">
                      No transactions found for this date
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

function MetricBox({ label, value, icon: Icon, delay }) {
  return (
    <div 
      className="bg-[var(--color-surface-raised)] p-1 rounded-lg border border-[var(--color-border-default)] transition-all hover:border-[var(--color-brand-red)]/35 group animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="bg-[var(--color-surface-card)] p-4 rounded-[calc(8px-4px)] flex items-center justify-between shadow-sm relative overflow-hidden">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">
            {label}
          </span>
          <h3 className="text-xl font-[var(--font-mono)] font-bold tracking-tight text-[var(--color-text-primary)] m-0 tabular-nums">
            {value}
          </h3>
        </div>
        <Icon size={18} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-red)] transition-colors duration-200" />
      </div>
    </div>
  );
}
