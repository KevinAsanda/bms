import { useState } from 'react';
import { User, Search, Plus, X, Phone } from 'lucide-react';
import api from '../../api/axios';

export default function CustomerSelector({ onSelect, selectedCustomer }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const handleSearch = async (val) => {
    setQuery(val);
    if (val.length < 3) {
      setResults([]);
      return;
    }
    try {
      const res = await api.get(`/customers?query=${val}`);
      setResults(res.data);
    } catch (err) {
      console.error('Customer search failed');
    }
  };

  const handleCreate = async () => {
    try {
      const res = await api.post('/customers', { name: newName, phone: newPhone });
      onSelect(res.data);
      setIsAdding(false);
      setNewName('');
      setNewPhone('');
      setQuery('');
      setResults([]);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create customer');
    }
  };

  if (selectedCustomer) {
    return (
      <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-black font-bold">
            {selectedCustomer.name[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-sm">{selectedCustomer.name}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">{selectedCustomer.phone || 'No phone'}</p>
          </div>
        </div>
        <button onClick={() => onSelect(null)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-error)]">
          <X size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isAdding ? (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
          <input 
            className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl pl-12 pr-12 py-3 text-sm focus:outline-none focus:border-[var(--color-primary)]"
            placeholder="Search customer by name or phone..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
          />
          <button 
            onClick={() => setIsAdding(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[var(--color-primary)] hover:bg-[var(--color-bg-elevated)] rounded-lg"
            title="Add New Customer"
          >
            <Plus size={20} />
          </button>

          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)] rounded-xl shadow-2xl z-20 overflow-hidden">
              {results.map(cust => (
                <button
                  key={cust.id}
                  onClick={() => { onSelect(cust); setResults([]); setQuery(''); }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--color-bg-hover)] transition-colors border-b border-[var(--color-border)] last:border-0"
                >
                  <User size={16} className="text-[var(--color-primary)]" />
                  <div className="text-left">
                    <p className="text-sm font-bold">{cust.name}</p>
                    <p className="text-[10px] text-[var(--color-text-secondary)]">{cust.phone || 'No phone'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-4 rounded-xl space-y-3 animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">New Customer</h3>
            <button onClick={() => setIsAdding(false)}><X size={16} /></button>
          </div>
          <input 
            autoFocus
            className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none"
            placeholder="Full Name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={14} />
            <input 
              className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none font-mono"
              placeholder="0821234567"
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
            />
          </div>
          <button 
            disabled={!newName}
            onClick={handleCreate}
            className="w-full bg-[var(--color-primary)] text-black font-bold py-2 rounded-lg text-sm disabled:opacity-50"
          >
            Create & Select
          </button>
        </div>
      )}
    </div>
  );
}
