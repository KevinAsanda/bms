import { Edit2, Archive } from 'lucide-react';

export default function ProductTable({ products, user, onEdit, onArchive, onAdjust, onReceive }) {
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Barcode</th>
            <th>Category</th>
            <th className="text-right">Price</th>
            <th className="text-center">Current Stock</th>
            <th>Status</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center py-20 text-[var(--color-text-muted)] font-medium">
                No products found
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product.id} className="group">
                <td className="font-bold text-[var(--color-brand-black)]">{product.name}</td>
                <td className="font-mono text-xs text-[var(--color-text-secondary)]">{product.barcode}</td>
                <td>
                  <span className="badge badge-steel">
                    {product.category?.name}
                  </span>
                </td>
                <td className="price text-[var(--color-brand-red)] font-bold">
                  R {parseFloat(product.pricePerUnit).toFixed(2)}
                  <span className="text-[var(--color-text-muted)] text-[10px] ml-1 font-normal uppercase">
                    /{product.unit}
                  </span>
                </td>
                <td className="qty font-bold text-center">
                  {parseFloat(product.stock?.quantity || 0)}
                </td>
                <td>
                  <span className={`badge ${
                    (product.stock?.quantity || 0) > (product.stock?.lowThreshold || 0)
                      ? 'badge-success'
                      : 'badge-warning'
                  }`}>
                    {(product.stock?.quantity || 0) > (product.stock?.lowThreshold || 0) ? 'In Stock' : 'Low Stock'}
                  </span>
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(user?.role === 'OWNER' || user?.role === 'STOCK_MANAGER') && (
                      <>
                        <button 
                          onClick={() => onReceive(product)}
                          className="btn-secondary btn-sm !py-1 !px-2.5 text-[10px]"
                        >
                          Receive
                        </button>
                        <button 
                          onClick={() => onAdjust(product)}
                          className="btn-secondary btn-sm !py-1 !px-2.5 text-[10px]"
                        >
                          Adjust
                        </button>
                      </>
                    )}
                    {user?.role === 'OWNER' && (
                      <>
                        <span className="inline-block w-px h-4 bg-[var(--color-border-default)] mx-1" />
                        <button 
                          onClick={() => onEdit(product)}
                          className="btn-ghost"
                          title="Edit Product"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => onArchive(product.id)}
                          className="btn-ghost hover:text-[var(--color-danger)]"
                          title="Archive Product"
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
  );
}
