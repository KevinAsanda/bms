import { X } from 'lucide-react';

export default function ProductModal({ isOpen, onClose, onSubmit, editingProduct, categories }) {
  if (!isOpen) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      barcode: formData.get('barcode'),
      categoryId: formData.get('categoryId'),
      pricePerUnit: parseFloat(formData.get('pricePerUnit')),
      unitType: formData.get('unitType'),
    };
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-xl font-black font-[var(--font-display)] tracking-tight">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-1.5">Product Name</label>
            <input 
              name="name" 
              defaultValue={editingProduct?.name} 
              required 
              className="w-full bg-[var(--color-bg-elevated)] border-2 border-[var(--color-border)] text-white rounded-full px-5 py-3 text-sm focus:outline-none focus:border-[var(--color-primary)] font-semibold" 
              placeholder="e.g. Beef Wors 500g" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-1.5">Barcode</label>
              <input 
                name="barcode" 
                defaultValue={editingProduct?.barcode} 
                required 
                className="w-full bg-[var(--color-bg-elevated)] border-2 border-[var(--color-border)] text-white rounded-full px-5 py-3 text-sm focus:outline-none focus:border-[var(--color-primary)] font-mono font-semibold" 
                placeholder="Scan or type..." 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-1.5">Category</label>
              <select 
                name="categoryId" 
                defaultValue={editingProduct?.categoryId} 
                required 
                className="w-full bg-[var(--color-bg-elevated)] border-2 border-[var(--color-border)] text-white rounded-full px-5 py-3 text-sm focus:outline-none focus:border-[var(--color-primary)] font-semibold appearance-none cursor-pointer"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
 
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-1.5">Price (ZAR)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] font-mono text-sm">R</span>
                <input 
                  name="pricePerUnit" 
                  type="number" 
                  step="0.01" 
                  defaultValue={editingProduct?.pricePerUnit} 
                  required 
                  className="w-full bg-[var(--color-bg-elevated)] border-2 border-[var(--color-border)] text-white rounded-full pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary)] font-mono font-semibold" 
                  placeholder="0.00" 
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-1.5">Unit Type</label>
              <select 
                name="unitType" 
                defaultValue={editingProduct?.unitType || 'fixed'} 
                required 
                className="w-full bg-[var(--color-bg-elevated)] border-2 border-[var(--color-border)] text-white rounded-full px-5 py-3 text-sm focus:outline-none focus:border-[var(--color-primary)] font-semibold appearance-none cursor-pointer"
              >
                <option value="fixed">Fixed Price</option>
                <option value="per_kg">Per Kilogram</option>
              </select>
            </div>
          </div>
 
          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 bg-[var(--color-bg-elevated)] text-white font-bold py-3.5 rounded-full hover:bg-[var(--color-bg-hover)] transition-all text-sm uppercase tracking-wider"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-[var(--color-primary)] text-black font-extrabold py-3.5 rounded-full hover:bg-[var(--color-primary-dark)] transition-all active:scale-95 text-sm uppercase tracking-wider shadow-md"
            >
              {editingProduct ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
