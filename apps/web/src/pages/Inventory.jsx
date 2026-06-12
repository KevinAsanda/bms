import { useState, useEffect, useCallback } from 'react';
import { Package, Search, Plus, LayoutGrid, List, History as HistoryIcon } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

import ProductTable from '../components/Inventory/ProductTable';
import ProductModal from '../components/Inventory/ProductModal';
import StockAdjustModal from '../components/Inventory/StockAdjustModal';
import CategoryManager from '../components/Inventory/CategoryManager';
import StockHistory from '../components/Inventory/StockHistory';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('PRODUCTS'); // 'PRODUCTS', 'CATEGORIES', 'HISTORY'
  
  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustType, setAdjustType] = useState('RECEIVE');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const user = useAuthStore((state) => state.user);

  const fetchProducts = useCallback(async (searchTerm = search) => {
    try {
      const response = await api.get(`/products?search=${searchTerm}`);
      setProducts(response.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  }, [search]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    // yield execution to the microtask queue to avoid synchronous setState warnings inside useEffect
    await Promise.resolve();
    setLoading(true);
    await Promise.all([fetchProducts(), fetchCategories()]);
    setLoading(false);
  }, [fetchProducts, fetchCategories]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleProductSubmit = async (data) => {
    try {
      if (selectedProduct) {
        await api.put(`/products/${selectedProduct.id}`, data);
      } else {
        await api.post('/products', data);
      }
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save product');
    }
  };

  const handleAdjustSubmit = async (data) => {
    try {
      await api.post('/stock/adjust', data);
      setIsAdjustModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to adjust stock');
    }
  };

  const handleArchive = async (id) => {
    if (!confirm('Are you sure you want to archive this product?')) return;
    try {
      await api.patch(`/products/${id}/archive`);
      fetchProducts();
    } catch (err) {
      console.error('Failed to archive product', err);
      alert('Failed to archive product');
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchProducts(val);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="w-12 h-12 border-4 border-[var(--color-brand-red)] border-t-transparent rounded-full animate-spin"></div>
      <p className="font-bold text-[var(--color-text-secondary)] uppercase tracking-widest text-xs">Loading Inventory...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--color-border-default)]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[var(--color-brand-red)]/10 rounded-sm">
              <Package className="text-[var(--color-brand-red)]" size={24} />
            </div>
            <h1 className="text-3xl font-[var(--font-display)] font-bold m-0">Inventory</h1>
          </div>
          <p className="text-[var(--color-text-secondary)] m-0 text-sm">
            Manage your catalogue and track stock levels across all categories.
          </p>
        </div>

        {/* Tab Controls (Rounded pills) */}
        <div className="flex items-center gap-1.5 bg-[var(--color-surface-card)] p-1 rounded-full border border-[var(--color-border-default)]">
          <button 
            onClick={() => setActiveTab('PRODUCTS')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${
              activeTab === 'PRODUCTS' 
                ? 'bg-[var(--color-brand-red)] text-white' 
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <List size={14} /> Products
          </button>
          <button 
            onClick={() => setActiveTab('CATEGORIES')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${
              activeTab === 'CATEGORIES' 
                ? 'bg-[var(--color-brand-red)] text-white' 
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <LayoutGrid size={14} /> Categories
          </button>
          <button 
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${
              activeTab === 'HISTORY' 
                ? 'bg-[var(--color-brand-red)] text-white' 
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <HistoryIcon size={14} /> Audit Log
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'PRODUCTS' ? (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
              <input
                type="text"
                placeholder="Search products or scan barcode..."
                className="input"
                style={{ paddingLeft: '3rem' }}
                value={search}
                onChange={handleSearchChange}
              />
            </div>

            {user?.role === 'OWNER' && (
              <button 
                onClick={() => { setSelectedProduct(null); setIsProductModalOpen(true); }}
                className="btn-primary w-full md:w-auto text-sm uppercase tracking-wider"
              >
                <Plus size={16} />
                <span>Add Product</span>
              </button>
            )}
          </div>

          <ProductTable 
            products={products} 
            user={user}
            onEdit={(p) => { setSelectedProduct(p); setIsProductModalOpen(true); }}
            onArchive={handleArchive}
            onReceive={(p) => { setSelectedProduct(p); setAdjustType('RECEIVE'); setIsAdjustModalOpen(true); }}
            onAdjust={(p) => { setSelectedProduct(p); setAdjustType('ADJUST'); setIsAdjustModalOpen(true); }}
          />
        </div>
      ) : activeTab === 'CATEGORIES' ? (
        <div className="max-w-2xl">
          <CategoryManager categories={categories} onRefresh={fetchCategories} />
        </div>
      ) : (
        <div>
          <StockHistory />
        </div>
      )}

      {/* Modals */}
      <ProductModal 
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={handleProductSubmit}
        editingProduct={selectedProduct}
        categories={categories}
      />

      <StockAdjustModal 
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        onSubmit={handleAdjustSubmit}
        product={selectedProduct}
        type={adjustType}
      />
    </div>
  );
}
