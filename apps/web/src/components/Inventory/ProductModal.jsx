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
      pricingType: formData.get('pricingType'),
      unit: formData.get('unit'),
    };
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-[var(--color-surface-card)] border border-[var(--color-border-default)] rounded-md w-full max-w-lg shadow-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-[var(--color-border-default)] flex items-center justify-between">
          <h2 className="text-xl font-bold font-[var(--font-display)] uppercase m-0 text-[var(--color-text-primary)]">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1 text-[var(--color-text-secondary)]">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
              Product Name
            </label>
            <input 
              name="name" 
              defaultValue={editingProduct?.name} 
              required 
              className="input font-semibold" 
              placeholder="e.g. Beef Wors 500g" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                Barcode
              </label>
              <input 
                name="barcode" 
                defaultValue={editingProduct?.barcode} 
                required 
                className="input font-mono font-semibold" 
                placeholder="Scan or type..." 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                Category
              </label>
              <select 
                name="categoryId" 
                defaultValue={editingProduct?.categoryId} 
                required 
                className="input font-semibold cursor-pointer"
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
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                Price (ZAR)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] font-mono text-sm">R</span>
                <input 
                  name="pricePerUnit" 
                  type="number" 
                  step="0.01" 
                  defaultValue={editingProduct?.pricePerUnit} 
                  required 
                  className="input pl-9 pr-4 font-mono font-semibold" 
                  placeholder="0.00" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                Pricing Type
              </label>
              <select 
                name="pricingType" 
                defaultValue={editingProduct?.pricingType || 'FIXED'} 
                required 
                className="input font-semibold cursor-pointer"
              >
                <option value="FIXED">Fixed Price</option>
                <option value="WEIGHT_BASED">Weight Based</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
              Unit (e.g. kg, each, pack)
            </label>
            <select 
              name="unit" 
              defaultValue={editingProduct?.unit || 'each'} 
              required 
              className="input font-semibold cursor-pointer"
            >
              <option value="each">each</option>
              <option value="kg">kg</option>
              <option value="pack">pack</option>
            </select>
          </div>
  
          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-secondary flex-1 py-3"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary flex-1 py-3"
            >
              {editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
