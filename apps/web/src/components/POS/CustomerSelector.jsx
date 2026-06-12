import { useState } from 'react';
import { User, Search, Plus, X, Phone } from 'lucide-react';
import api from '../../api/axios';

export default function CustomerSelector({ onSelect, selectedCustomer }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [popiaConsent, setPopiaConsent] = useState(false);

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

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!popiaConsent) {
      alert("POPIA consent is required to store customer data.");
      return;
    }
    try {
      const res = await api.post('/customers', { name: newName, phone: newPhone || null });
      onSelect(res.data);
      setIsAdding(false);
      setNewName('');
      setNewPhone('');
      setPopiaConsent(false);
      setQuery('');
      setResults([]);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create customer');
    }
  };

  if (selectedCustomer) {
    return (
      <div className="bg-[var(--color-brand-red)]/5 border border-[var(--color-brand-red)]/10 p-4 rounded-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-brand-red)] rounded-full flex items-center justify-center text-white font-bold font-[var(--font-display)]">
            {selectedCustomer.name[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-sm text-[var(--color-brand-black)] m-0 leading-tight">{selectedCustomer.name}</p>
            <p className="text-xs text-[var(--color-text-secondary)] m-0 font-mono mt-1">{selectedCustomer.phone || 'No phone'}</p>
          </div>
        </div>
        <button 
          onClick={() => onSelect(null)} 
          className="btn-ghost hover:text-[var(--color-danger)] p-1.5"
          title="Remove Customer"
        >
          <X size={16} />
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
            className="input font-semibold"
            style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
            placeholder="Search customer by name or phone..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
          />
          <button 
            onClick={() => setIsAdding(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-ghost text-[var(--color-brand-red)] hover:bg-[var(--color-surface-raised)]"
            title="Add New Customer"
          >
            <Plus size={20} />
          </button>

          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-surface-card)] border border-[var(--color-border-default)] rounded-md shadow-lg z-20 overflow-hidden">
              {results.map(cust => (
                <button
                  key={cust.id}
                  onClick={() => { onSelect(cust); setResults([]); setQuery(''); }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--color-surface-raised)] transition-colors border-b border-[var(--color-border-default)] last:border-0"
                >
                  <User size={16} className="text-[var(--color-brand-red)]" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-[var(--color-brand-black)] m-0">{cust.name}</p>
                    <p className="text-[10px] text-[var(--color-text-secondary)] font-mono m-0 mt-0.5">{cust.phone || 'No phone'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleCreate} className="bg-[var(--color-surface-card)] border border-[var(--color-border-default)] p-4 rounded-md space-y-4 animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center pb-2 border-b border-[var(--color-border-default)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] m-0">New Customer Record</h3>
            <button type="button" className="btn-ghost p-0.5" onClick={() => setIsAdding(false)}>
              <X size={16} />
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Full Name</label>
              <input 
                autoFocus
                required
                className="input text-sm py-2 px-3"
                placeholder="John Doe"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={14} />
                <input 
                  className="input pr-3 py-2 text-sm font-mono"
                  style={{ paddingLeft: '2.25rem' }}
                  placeholder="0821234567"
                  maxLength={10}
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                />
              </div>
            </div>

            {/* POPIA Consent Section */}
            <div className="bg-[var(--color-surface-input)] p-3 border border-[var(--color-border-default)] space-y-2 rounded-sm">
              <p className="text-[9px] text-[var(--color-text-secondary)] font-medium leading-relaxed m-0">
                We store the customer's name and phone number to track purchase history. Customer data is encrypted at rest and processed in compliance with the Protection of Personal Information Act (POPIA).
              </p>
              <label className="flex items-start gap-2 cursor-pointer mt-1">
                <input 
                  type="checkbox" 
                  required
                  checked={popiaConsent}
                  onChange={e => setPopiaConsent(e.target.checked)}
                  className="mt-0.5 accent-[var(--color-brand-red)]" 
                />
                <span className="text-[10px] font-bold text-[var(--color-brand-black)] leading-tight">
                  I agree to my information being stored by Simon Family Farm.
                </span>
              </label>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={!newName || !popiaConsent}
            className="btn-primary w-full py-2.5 text-xs uppercase font-bold tracking-wider"
          >
            Create & Select Customer
          </button>
        </form>
      )}
    </div>
  );
}
