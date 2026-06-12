import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Scan, Search, Plus, Minus, Trash2, User } from 'lucide-react';
import api from '../api/axios';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
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

  // Focus the invisible barcode input on mount and keep it focused
  useEffect(() => {
    barcodeRef.current?.focus();
    const handleFocus = (e) => {
      // Do not steal focus if the click was inside an input, textarea, select, button, link, or active button role
      if (
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' || 
        e.target.tagName === 'SELECT' || 
        e.target.closest('button') ||
        e.target.closest('a') ||
        e.target.closest('[role="button"]')
      ) {
        return;
      }
      barcodeRef.current?.focus();
    };
    document.addEventListener('click', handleFocus);
    return () => {
      document.removeEventListener('click', handleFocus);
    };
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
    } catch (err) {
      console.error('Barcode search failed', err);
      showToast('Product not found', 'error');
      setBarcode('');
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
      console.error('Search failed', err);
    }
  };

  const handleCompleteSale = async () => {
    if (!paymentMethod || items.length === 0) return;
    
    // Check if any WEIGHT_BASED items have 0 weight
    const missingWeight = items.find(i => i.pricingType === 'WEIGHT_BASED' && (!i.weightKg || i.weightKg <= 0));
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
      
      const response = await api.post('/sales', saleData);
      
      if (!response.data || !response.data.id) {
        throw new Error('Invalid response from server');
      }

      setReceipt(response.data);
      clearCart();
      setPaymentMethod(null);
      setSelectedCustomer(null);
      showToast('Sale completed successfully!');
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Sale failed';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-light flex h-[calc(100vh-64px)] overflow-hidden w-full bg-[var(--color-surface-page)] text-[var(--color-text-primary)]">
      {/* Invisible Barcode Input for silent scans */}
      <form onSubmit={handleBarcodeSubmit} className="absolute top-0 left-0 opacity-0 pointer-events-none">
        <input
          ref={barcodeRef}
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />
      </form>

      {/* Left Column (60% width): Product Intake & Search */}
      <div className="w-[60%] p-6 flex flex-col gap-6 overflow-y-auto border-r border-[var(--color-border-default)]">
        {/* Scanner Active Header Indicator */}
        <div className="flex items-center justify-between card bg-[var(--color-surface-card)] p-4 border border-[var(--color-border-default)]">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-success)]"></span>
            </span>
            <span className="font-[var(--font-body)] text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Barcode Scanner Active (Ready for input)
            </span>
          </div>
          <button 
            onClick={() => barcodeRef.current?.focus()}
            className="btn-secondary btn-sm flex items-center gap-2"
          >
            <Scan size={14} />
            <span>Refocus Scanner</span>
          </button>
        </div>

        {/* Product Search */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Search size={18} className="text-[var(--color-brand-red)]" />
            <h2 className="font-[var(--font-display)] text-sm font-bold tracking-wider m-0">Product Search</h2>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Type product name to search..."
              className="input font-bold"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Search Results Grid (3 columns, tap-friendly tiles) */}
          {searchQuery.length >= 2 && (
            <div className="grid grid-cols-3 gap-4 mt-2">
              {searchResults.length === 0 ? (
                <div className="col-span-3 card text-center py-8 text-[var(--color-text-muted)]">
                  No products found matching "{searchQuery}"
                </div>
              ) : (
                searchResults.map(product => (
                  <button
                    key={product.id}
                    onClick={() => {
                      addItem(product);
                      setSearchQuery('');
                      setSearchResults([]);
                      showToast(`Added ${product.name}`);
                    }}
                    className="card flex flex-col justify-between items-start text-left min-h-[80px] p-4 cursor-pointer hover:border-[var(--color-brand-red)] border border-[var(--color-border-default)] transition-all bg-[var(--color-surface-card)]"
                  >
                    <div className="w-full">
                      <span className="badge badge-steel mb-2">
                        {product.category?.name || 'Category'}
                      </span>
                      <h3 className="font-[var(--font-display)] text-sm font-bold text-[var(--color-brand-black)] leading-tight m-0 truncate w-full">
                        {product.name}
                      </h3>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between w-full">
                      <span className="font-[var(--font-mono)] text-sm font-bold text-[var(--color-brand-red)]">
                        R {parseFloat(product.pricePerUnit).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)] font-semibold">
                        /{product.unit}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Customer Association */}
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex items-center gap-2">
            <User size={18} className="text-[var(--color-brand-red)]" />
            <h2 className="font-[var(--font-display)] text-sm font-bold tracking-wider m-0">Customer Association (POPIA compliant)</h2>
          </div>
          <CustomerSelector onSelect={setSelectedCustomer} selectedCustomer={selectedCustomer} />
        </div>
      </div>

      {/* Right Column (40% width): Fixed Cart */}
      <div className="w-[40%] bg-[var(--color-surface-card)] flex flex-col h-full shadow-md">
        {/* Cart Header */}
        <div className="p-5 border-b border-[var(--color-border-default)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-[var(--color-brand-red)]" />
            <h2 className="font-[var(--font-display)] text-lg font-bold tracking-tight m-0">LIVE CART</h2>
          </div>
          {items.length > 0 && (
            <button 
              onClick={() => { if(confirm('Clear entire cart?')) clearCart(); }}
              className="btn-danger btn-sm uppercase font-bold tracking-wider"
            >
              Clear
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--color-surface-page)]">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] space-y-3 opacity-60">
              <ShoppingCart size={48} strokeWidth={1.2} />
              <p className="font-[var(--font-body)] text-xs font-bold uppercase tracking-wider">Cart is Empty</p>
            </div>
          ) : (
            items.map(item => (
              <div 
                key={item.productId} 
                className="bg-[var(--color-surface-card)] border border-[var(--color-border-default)] p-4 space-y-4 shadow-sm hover:border-[var(--color-brand-red)]/50 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="overflow-hidden">
                    <p className="font-[var(--font-body)] font-bold text-md leading-tight text-[var(--color-brand-black)] m-0 truncate">
                      {item.name}
                    </p>
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono font-semibold block mt-1">
                      {item.barcode}
                    </span>
                  </div>
                  <button 
                    onClick={() => removeItem(item.productId)} 
                    className="btn-ghost text-[var(--color-text-muted)] hover:text-[var(--color-brand-red)] p-1.5"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="flex items-end justify-between gap-4">
                  {/* Quantity controls */}
                  <div className="flex items-center gap-1 border border-[var(--color-border-default)] p-0.5 bg-[var(--color-surface-input)]">
                    <button 
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)} 
                      className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-white"
                    >
                      <Minus size={14} strokeWidth={2.5} />
                    </button>
                    <span className="font-[var(--font-mono)] font-bold text-sm w-8 text-center">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)} 
                      className="w-8 h-8 flex items-center justify-center text-[var(--color-brand-red)] hover:bg-white"
                    >
                      <Plus size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                  
                  {/* Weight or pricing details */}
                  <div className="flex-1 max-w-[140px]">
                    {item.pricingType === 'WEIGHT_BASED' ? (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] block">
                          Weight (kg)
                        </label>
                        <input 
                          type="number" 
                          step="0.001"
                          placeholder="0.000"
                          autoFocus={item.weightKg === 0}
                          className="input input-numeric py-1.5 px-2.5 text-sm"
                          value={item.weightKg || ''}
                          onChange={(e) => updateWeight(item.productId, parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] block">
                          Unit Price
                        </span>
                        <span className="font-[var(--font-mono)] text-sm font-semibold">
                          R {item.unitPrice.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-2 border-t border-[var(--color-border-default)] flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">Line Total</span>
                  <span className="font-[var(--font-mono)] font-bold text-md text-[var(--color-brand-red)]">
                    R {(item.pricingType === 'WEIGHT_BASED' ? item.unitPrice * (item.weightKg || 0) : item.unitPrice * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer / Checkout Controls */}
        <div className="p-6 bg-[var(--color-surface-input)] border-t border-[var(--color-border-default)] space-y-5">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Total Payable</span>
            <span className="text-3xl font-[var(--font-mono)] font-bold text-[var(--color-brand-red)] tabular-nums tracking-tighter">
              R {getGrandTotal().toFixed(2)}
            </span>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block">
              Payment Method
            </span>
            <div className="grid grid-cols-3 gap-2">
              {['CASH', 'CARD', 'EFT'].map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-3 border transition-all text-xs font-semibold ${
                    paymentMethod === method 
                      ? 'bg-[var(--color-brand-red)] border-[var(--color-brand-red)] text-white font-bold' 
                      : 'bg-[var(--color-surface-card)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-red)]/50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Checkout Submit Button */}
          <button
            disabled={loading || items.length === 0 || !paymentMethod}
            onClick={handleCompleteSale}
            className="btn-primary btn-xl w-full flex items-center justify-center gap-2 h-16"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Processing Sale...</span>
              </span>
            ) : (
              <span>Complete Sale — R {getGrandTotal().toFixed(2)}</span>
            )}
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white text-black w-full max-w-sm rounded-md p-6 shadow-lg space-y-6 font-mono text-xs overflow-y-auto max-h-[90vh]">
            <div className="text-center space-y-1">
              <img 
                src="/logo-icon.svg" 
                alt="SFF Logo" 
                className="h-16 mx-auto mb-2 object-contain" 
              />
              <h2 className="font-[var(--font-display)] text-xl font-bold uppercase tracking-tight m-0 text-black">
                SIMON FAMILY FARM
              </h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest m-0">Clermont Rank, Durban</p>
              <p className="text-[10px] m-0">Tel: +27 31 123 4567</p>
            </div>
            
            <div className="border-y border-dashed border-gray-300 py-4 space-y-1.5 uppercase text-[9px] font-bold text-gray-600">
              <div className="flex justify-between">
                <span>Receipt Ref:</span>
                <span className="text-black">{receipt?.receiptRef || receipt?.id?.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>Date/Time:</span>
                <span className="text-black">{receipt?.createdAt ? new Date(receipt.createdAt).toLocaleString('en-ZA') : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span className="text-black">{user?.name || 'Staff'}</span>
              </div>
              {receipt?.customer && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="text-black">{receipt.customer.name}</span>
                </div>
              )}
            </div>

            <div className="space-y-3 py-2">
              {receipt?.items?.map(item => (
                <div key={item.id} className="space-y-1">
                  <div className="flex justify-between font-bold text-sm">
                    <span className="uppercase">{item?.product?.name || 'Product'}</span>
                    <span>R {parseFloat(item?.lineTotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">
                    {item?.pricingType === 'WEIGHT_BASED' 
                      ? `${parseFloat(item.weightKg).toFixed(3)}kg`
                      : `${parseFloat(item.quantity).toFixed(0)} units`
                    } x R {parseFloat(item?.unitPrice || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t-2 border-black space-y-3">
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL PAID</span>
                <span>R {parseFloat(receipt?.totalAmount || receipt?.total || 0).toFixed(2)}</span>
              </div>
              <div className="bg-gray-100 p-3 text-center rounded-sm">
                <p className="text-[9px] font-bold uppercase tracking-wider m-0">
                  Paid via {receipt?.paymentMethod || 'UNKNOWN'}
                </p>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 m-0">
                --- Thank You ---
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-4 print:hidden">
              <button 
                onClick={() => window.print()} 
                className="btn-primary w-full py-3 text-xs uppercase"
              >
                Print Receipt
              </button>
              <button 
                onClick={() => { setReceipt(null); barcodeRef.current?.focus(); }} 
                className="btn-secondary w-full py-3 text-xs uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${
          toast.type === 'error' ? 'toast-danger' : 'toast-success'
        }`}>
          <div className="font-bold text-xs">
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
