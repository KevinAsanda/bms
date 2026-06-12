import { useState, useEffect, useCallback } from 'react';
import { History, User, Calendar, Info } from 'lucide-react';
import api from '../../api/axios';

export default function StockHistory({ productId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const url = productId ? `/stock/history/${productId}` : '/stock/history';
      const response = await api.get(url);
      setHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch stock history', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (loading) return <div className="p-8 text-center text-[var(--color-text-secondary)]">Loading history...</div>;

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-[var(--color-border)] flex items-center gap-3 bg-[var(--color-bg-elevated)]/30">
        <History size={20} className="text-[var(--color-primary)]" />
        <h2 className="text-xl font-bold font-[var(--font-display)] uppercase tracking-tight">Stock Audit Trail</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] text-[10px] uppercase tracking-[0.2em] font-black border-b border-[var(--color-border)]">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Adjustment</th>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4">By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {history.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-[var(--color-text-muted)] text-sm italic">
                  No adjustment records found
                </td>
              </tr>
            ) : (
              history.map((record) => (
                <tr key={record.id} className="hover:bg-[var(--color-bg-hover)] transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <Calendar size={12} className="text-[var(--color-text-muted)]" />
                      {new Date(record.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm text-[var(--color-text-primary)]">{record.product.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-mono font-black text-sm ${record.changeQty > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
                      {record.changeQty > 0 ? '+' : ''}{parseFloat(record.changeQty)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                       <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest w-fit ${
                        record.reason === 'DELIVERY' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20' :
                        record.reason === 'SPOILAGE' || record.reason === 'WASTAGE' ? 'bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20' :
                        'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                      }`}>
                        {record.reason.replace('_', ' ')}
                      </span>
                      {record.notes && (
                        <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] font-medium">
                          <Info size={10} />
                          {record.notes}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-secondary)]">
                      <User size={12} />
                      {record.employee.name}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
