import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Scan, Search, Plus, Minus, Trash2, X, Check, Printer, User } from 'lucide-react';
import api from '../api/axios';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';

// Components
import CustomerSelector from '../components/POS/CustomerSelector';

export default function POS() {
  const { items, addItem, removeItem, updateQuantity, updateWeight, clearCart, getGrandTotal } = useCartStore();
  const { user } = useAuthStore();
  
  const [barcode, setBarcode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [toast, setToast] = useState(null);
  
  const barcodeRef = useRef(null);

  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcode) return;
    
    try {
      const response = await api.get(`/products/barcode/${barcode}`);
      addItem(response.data);
      setBarcode('');
      showToast(`Added ${response.data.name}`);
      barcodeRef.current?.focus();
    } catch (err) {
      showToast('Product not found', 'error');
      setBarcode('');
      barcodeRef.current?.focus();
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await api.get(`/products?search=${query}`);
      setSearchResults(response.data);
    } catch (err) {
      console.error('Search failed');
    }
  };

  const handleCompleteSale = async () => {
    if (!paymentMethod || items.length === 0) return;
    
    // Check if any per_kg items have 0 weight
    const missingWeight = items.find(i => i.unitType === 'per_kg' && (!i.weightKg || i.weightKg <= 0));
    if (missingWeight) {
      showToast(`Please enter weight for ${missingWeight.name}`, 'error');
      return;
    }

    setLoading(true);
    
    try {
      const saleData = {
        customerId: selectedCustomer?.id || null,
        paymentMethod,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          weightKg: item.weightKg || null,
        })),
      };
      
      console.log('Sending Sale Data:', saleData);
      const response = await api.post('/sales', saleData);
      console.log('Sale Success Response:', response.data);
      
      // Ensure the response data has the expected structure before setting state
      if (!response.data || !response.data.id) {
        throw new Error('Invalid response from server');
      }

      setReceipt(response.data);
      clearCart();
      setPaymentMethod(null);
      setSelectedCustomer(null);
      showToast('Sale completed successfully!');
    } catch (err) {
      console.error('Full Checkout Error Object:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Sale failed';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col">
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel - Scanner & Search */}
        <div className="flex-1 p-6 space-y-8 overflow-y-auto">
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Scan size={18} className="text-[var(--color-primary)]" />
              <h2 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.2em]">Product Intake</h2>
            </div>
            <form onSubmit={handleBarcodeSubmit} className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
                 <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest hidden sm:block">Ready</span>
              </div>
              <input
                ref={barcodeRef}
                type="text"
                placeholder="Scan barcode or enter manually..."
                className="w-full bg-[var(--color-bg-elevated)] border-2 border-[var(--color-border-strong)] text-[var(--color-text-primary)] rounded-full pl-24 pr-4 py-5 text-lg font-bold focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-glow)] transition-all placeholder:text-[var(--color-text-muted)]"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </form>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
              <input
                type="text"
                placeholder="Lookup by name..."
                className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-[var(--color-primary)] transition-all font-bold"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-strong)] rounded-2xl shadow-2xl z-30 overflow-hidden backdrop-blur-xl">
                  <div className="p-2 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 text-[var(--color-text-secondary)]">Search Results</span>
                    <button onClick={() => setSearchResults([])}><X size={14}/></button>
                  </div>
                  {searchResults.map(product => (
                    <button
                      key={product.id}
                      onClick={() => { addItem(product); setSearchResults([]); setSearchQuery(''); barcodeRef.current?.focus(); showToast(`Added ${product.name}`); }}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--color-primary)] hover:text-black transition-all border-b border-[var(--color-border)] last:border-0 group"
                    >
                      <div className="text-left">
                        <p className="font-bold group-hover:text-black">{product.name}</p>
                        <p className="text-xs opacity-60 font-mono">{product.barcode}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-black text-[var(--color-primary)] group-hover:text-black">R {parseFloat(product.pricePerUnit).toFixed(2)}</p>
                        <p className="text-[10px] uppercase font-bold opacity-60">/{product.unitType === 'per_kg' ? 'kg' : 'unit'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <User size={18} className="text-[var(--color-primary)]" />
              <h2 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.2em]">Customer Association</h2>
            </div>
            <CustomerSelector onSelect={setSelectedCustomer} selectedCustomer={selectedCustomer} />
          </section>
        </div>

        {/* Right Panel - Cart */}
        <div className="w-full md:w-[480px] bg-[var(--color-bg-surface)] border-l border-[var(--color-border)] flex flex-col shadow-2xl">
          <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-elevated)]/30">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart size={24} />
                {items.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[var(--color-primary)] text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {items.reduce((acc, i) => acc + i.quantity, 0)}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black font-[var(--font-display)] uppercase tracking-tight">Checkout</h2>
            </div>
            <button 
              onClick={() => { if(confirm('Clear entire cart?')) clearCart(); }}
              className="text-[10px] font-black text-[var(--color-error)] border border-[var(--color-error)]/20 px-3 py-1.5 rounded-lg hover:bg-[var(--color-error)] hover:text-white transition-all uppercase tracking-widest"
            >
              Clear Cart
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--color-bg-base)]/50">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] space-y-6 opacity-40">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-[var(--color-border)] flex items-center justify-center">
                  <ShoppingCart size={40} strokeWidth={1} />
                </div>
                <p className="font-bold uppercase tracking-widest text-xs">Waiting for items...</p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.productId} className="bg-[var(--color-bg-surface)] border-2 border-[var(--color-border)] rounded-2xl p-4 space-y-4 shadow-lg group hover:border-[var(--color-primary)]/50 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-black text-lg leading-tight group-hover:text-[var(--color-primary)] transition-colors">{item.name}</p>
                      <p className="text-[10px] text-[var(--color-text-secondary)] font-mono mt-1 uppercase tracking-widest font-bold">{item.barcode}</p>
                    </div>
                    <button 
                      onClick={() => removeItem(item.productId)} 
                      className="p-2 bg-[var(--color-bg-elevated)] rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  
                  <div className="flex items-end justify-between gap-4">
                    <div className="flex items-center gap-1 bg-[var(--color-bg-elevated)] p-1 rounded-xl border border-[var(--color-border)]">
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)} 
                        className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]"
                      >
                        <Minus size={18} strokeWidth={3} />
                      </button>
                      <span className="font-mono font-black text-xl w-10 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)} 
                        className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[var(--color-bg-surface)] text-[var(--color-primary)]"
                      >
                        <Plus size={18} strokeWidth={3} />
                      </button>
                    </div>
                    
                    <div className="flex-1 max-w-[160px]">
                      {item.unitType === 'per_kg' ? (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] block">Weight (kg)</label>
                          <div className="relative">
                             <input 
                              type="number" 
                              step="0.001"
                              placeholder="0.000"
                              autoFocus={item.weightKg === 0}
                              className="w-full bg-[var(--color-bg-elevated)] border-2 border-[var(--color-border)] rounded-xl py-3 px-4 text-right font-mono font-black text-lg focus:outline-none focus:border-[var(--color-primary)]"
                              value={item.weightKg || ''}
                              onChange={(e) => updateWeight(item.productId, parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">Unit Price</p>
                          <p className="font-mono font-bold">R {item.unitPrice.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-[var(--color-border)] flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">Line Total</span>
                    <span className="font-mono font-black text-xl text-[var(--color-primary)]">
                      R {(item.unitType === 'per_kg' ? item.unitPrice * (item.weightKg || 0) : item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          <div className="p-6 bg-[var(--color-bg-elevated)] border-t-2 border-[var(--color-border-strong)] space-y-6">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Total Payable</span>
                <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">Incl. 15% VAT (R {(getGrandTotal() * 0.15).toFixed(2)})</p>
              </div>
              <span className="text-5xl font-mono font-black text-[var(--color-primary)] tabular-nums tracking-tighter">
                R {getGrandTotal().toFixed(2)}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-[0.2em]">Select Payment</p>
                {paymentMethod && <span className="text-[10px] bg-[var(--color-success)]/20 text-[var(--color-success)] px-2 py-0.5 rounded font-black uppercase tracking-widest">Selected</span>}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['CASH', 'CARD', 'EFT'].map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-3.5 rounded-full font-bold transition-all border-2 flex flex-col items-center justify-center ${
                      paymentMethod === method 
                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-black font-extrabold scale-[1.01]' 
                        : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/50'
                    }`}
                  >
                    <span className="text-xs">{method}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={loading || items.length === 0 || !paymentMethod}
              onClick={handleCompleteSale}
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-extrabold py-5 rounded-full text-lg transition-all active:scale-[0.97] disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Complete Transaction
                  <Check size={20} strokeWidth={3} />
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500" />
          <div className="relative bg-white text-black w-full max-w-sm rounded-3xl p-10 shadow-2xl space-y-8 font-mono text-sm animate-in zoom-in duration-300">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-4 font-black text-3xl">S</div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Simon Family Farm</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Clermont Rank, Durban</p>
              <p className="text-[10px] font-bold">Tel: +27 31 123 4567</p>
            </div>
            
            <div className="border-y border-dashed border-gray-300 py-6 space-y-2 uppercase text-[10px] font-bold text-gray-600">
              <div className="flex justify-between">
                <span>Transaction ID:</span>
                <span className="text-black font-black">#{receipt?.id?.slice(-8).toUpperCase() || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Date/Time:</span>
                <span className="text-black font-black">{receipt?.createdAt ? new Date(receipt.createdAt).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span className="text-black font-black">{user?.name || 'Staff'}</span>
              </div>
              {receipt?.customer && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="text-black font-black">{receipt.customer.name || 'Walk-in'}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {receipt?.items?.map(item => (
                <div key={item.id} className="space-y-1">
                  <div className="flex justify-between font-black text-base">
                    <span className="uppercase tracking-tighter">{item?.product?.name || 'Product'}</span>
                    <span>R {parseFloat(item?.lineTotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase">
                    {item?.quantity || 0} units x R {parseFloat(item?.unitPrice || 0).toFixed(2)}
                    {item?.weightKg && ` / ${parseFloat(item.weightKg).toFixed(3)}kg`}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t-2 border-black space-y-4">
              <div className="flex justify-between text-2xl font-black italic tracking-tighter">
                <span>TOTAL</span>
                <span>R {parseFloat(receipt?.total || 0).toFixed(2)}</span>
              </div>
              <div className="bg-gray-100 p-4 rounded-xl text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Paid via {receipt?.paymentMethod || 'UNKNOWN'}</p>
              </div>
            </div>

            <div className="text-center pt-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">--- End of Receipt ---</p>
            </div>

            <div className="flex flex-col gap-3 pt-6 print:hidden">
              <button 
                onClick={() => window.print()} 
                className="w-full bg-black text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95"
              >
                <Printer size={20} />
                Print Physical Copy
              </button>
              <button 
                onClick={() => { setReceipt(null); barcodeRef.current?.focus(); }} 
                className="w-full border-2 border-black font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-8 duration-500 ${
          toast.type === 'error' ? 'bg-[var(--color-error)] text-white' : 'bg-[var(--color-success)] text-white'
        }`}>
          {toast.type === 'error' ? <X size={24} strokeWidth={3} /> : <Check size={24} strokeWidth={3} />}
          <span className="font-black uppercase tracking-tight text-lg">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
