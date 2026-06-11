import { X } from 'lucide-react';

export default function StockAdjustModal({ isOpen, onClose, onSubmit, product, type }) {
  if (!isOpen) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      productId: product.id,
      changeQty: parseFloat(formData.get('changeQty')),
      reason: type === 'RECEIVE' ? 'DELIVERY' : formData.get('reason'),
      notes: formData.get('notes'),
    };
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-xl font-bold font-[var(--font-display)]">
            {type === 'RECEIVE' ? 'Receive Delivery' : 'Adjust Stock'}
          </h2>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-1.5">Product</label>
            <p className="font-bold text-lg text-[var(--color-text-primary)]">{product?.name}</p>
            <p className="text-xs text-[var(--color-text-secondary)] font-mono">{product?.barcode}</p>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-1.5">
              {type === 'RECEIVE' ? 'Quantity Received' : 'Adjustment Amount'}
            </label>
            <div className="relative">
              <input 
                name="changeQty" 
                type="number" 
                step="0.001" 
                required 
                className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl px-4 py-3.5 focus:outline-none focus:border-[var(--color-primary)] font-mono" 
                placeholder={type === 'RECEIVE' ? 'e.g. 50' : 'e.g. -2.5'} 
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] uppercase text-[10px] font-bold">
                {product?.unitType === 'per_kg' ? 'kg' : 'units'}
              </span>
            </div>
          </div>

          {type === 'ADJUST' && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-1.5">Reason</label>
              <select 
                name="reason" 
                required 
                className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl px-4 py-3.5 focus:outline-none focus:border-[var(--color-primary)] appearance-none"
              >
                <option value="WASTAGE">Wastage</option>
                <option value="SPOILAGE">Spoilage</option>
                <option value="COUNTING_ERROR">Counting Error</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-1.5">Notes (Optional)</label>
            <textarea 
              name="notes" 
              className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl px-4 py-3.5 focus:outline-none focus:border-[var(--color-primary)] min-h-[100px] resize-none text-sm" 
              placeholder="Add any additional details..."
            ></textarea>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] font-bold py-3.5 rounded-xl hover:bg-[var(--color-bg-hover)] transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-[var(--color-primary)] text-black font-bold py-3.5 rounded-xl hover:bg-[var(--color-primary-dark)] transition-all active:scale-95"
            >
              {type === 'RECEIVE' ? 'Confirm Delivery' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
