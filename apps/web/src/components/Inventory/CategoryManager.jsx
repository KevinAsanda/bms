import { useState } from 'react';
import { Trash2, Plus, Edit2, X, Check } from 'lucide-react';
import api from '../../api/axios';

export default function CategoryManager({ categories, onRefresh }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');

  const handleCreate = async () => {
    try {
      await api.post('/categories', { name });
      setName('');
      setIsAdding(false);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create category');
    }
  };

  const handleUpdate = async (id) => {
    try {
      await api.put(`/categories/${id}`, { name });
      setEditingId(null);
      setName('');
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update category');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure? Only empty categories can be deleted.')) return;
    try {
      await api.delete(`/categories/${id}`);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete category');
    }
  };

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
        <h2 className="text-xl font-bold font-[var(--font-display)]">Categories</h2>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-bold text-sm flex items-center gap-1"
          >
            <Plus size={16} /> Add New
          </button>
        )}
      </div>

      <div className="p-4 space-y-2">
        {isAdding && (
          <div className="flex gap-2 p-2 bg-[var(--color-bg-elevated)] rounded-xl">
            <input 
              autoFocus
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
              placeholder="Category name..."
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <button onClick={handleCreate} className="text-[var(--color-success)]"><Check size={20}/></button>
            <button onClick={() => setIsAdding(false)} className="text-[var(--color-error)]"><X size={20}/></button>
          </div>
        )}

        {categories.map(cat => (
          <div key={cat.id} className="flex items-center justify-between p-3 hover:bg-[var(--color-bg-hover)] rounded-xl transition-colors group">
            {editingId === cat.id ? (
              <div className="flex gap-2 w-full">
                <input 
                  autoFocus
                  className="flex-1 bg-[var(--color-bg-elevated)] border border-[var(--color-primary)] rounded-lg px-2 py-1 text-sm focus:outline-none"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                <button onClick={() => handleUpdate(cat.id)} className="text-[var(--color-success)]"><Check size={18}/></button>
                <button onClick={() => setEditingId(null)} className="text-[var(--color-error)]"><X size={18}/></button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm">{cat.name}</span>
                  <span className="text-[10px] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded-full uppercase font-bold">
                    {cat._count?.products || 0} Products
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setEditingId(cat.id); setName(cat.name); }}
                    className="p-1.5 hover:bg-[var(--color-bg-elevated)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(cat.id)}
                    className="p-1.5 hover:bg-[var(--color-bg-elevated)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-error)]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
