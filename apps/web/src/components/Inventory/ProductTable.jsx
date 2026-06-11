import { Edit2, Archive, Check } from 'lucide-react';

export default function ProductTable({ products, user, onEdit, onArchive, onAdjust, onReceive }) {
  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] text-xs uppercase tracking-widest">
              <th className="px-6 py-4 font-bold">Product</th>
              <th className="px-6 py-4 font-bold">Barcode</th>
              <th className="px-6 py-4 font-bold">Category</th>
              <th className="px-6 py-4 font-bold">Price</th>
              <th className="px-6 py-4 font-bold text-center">Stock</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {products.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-20 text-center text-[var(--color-text-muted)]">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-[var(--color-bg-hover)] transition-colors group">
                  <td className="px-6 py-4 font-bold text-[var(--color-text-primary)]">{product.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-[var(--color-text-secondary)]">{product.barcode}</td>
                  <td className="px-6 py-4">
                    <span className="bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold">
                      {product.category?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-[var(--color-primary)] font-bold">
                    R {parseFloat(product.pricePerUnit).toFixed(2)}
                    <span className="text-[var(--color-text-muted)] text-[10px] ml-1 font-normal uppercase">
                      /{product.unitType === 'per_kg' ? 'kg' : 'unit'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-center font-bold">
                    {parseFloat(product.stock?.quantity || 0)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                      (product.stock?.quantity || 0) > (product.stock?.lowThreshold || 0)
                        ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20'
                        : 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20'
                    }`}>
                      {(product.stock?.quantity || 0) > (product.stock?.lowThreshold || 0) ? 'In Stock' : 'Low Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(user?.role === 'OWNER' || user?.role === 'STOCK_MANAGER') && (
                        <>
                          <button 
                            onClick={() => onReceive(product)}
                            className="px-3 py-1.5 bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20 rounded-full text-[10px] font-bold hover:bg-[var(--color-success)] hover:text-black transition-all"
                          >
                            Receive
                          </button>
                          <button 
                            onClick={() => onAdjust(product)}
                            className="px-3 py-1.5 bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20 rounded-full text-[10px] font-bold hover:bg-[var(--color-warning)] hover:text-black transition-all"
                          >
                            Adjust
                          </button>
                        </>
                      )}
                      {user?.role === 'OWNER' && (
                        <>
                          <div className="w-px h-4 bg-[var(--color-border)] mx-1" />
                          <button 
                            onClick={() => onEdit(product)}
                            className="p-1.5 hover:bg-[var(--color-bg-elevated)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => onArchive(product.id)}
                            className="p-1.5 hover:bg-[var(--color-bg-elevated)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-colors"
                          >
                            <Archive size={16} />
                          </button>
                        </>
                      )}
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
