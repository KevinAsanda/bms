import { useState, useEffect } from 'react';
import { Package, Search, Plus, LayoutGrid, List, History as HistoryIcon } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

// Components
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

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchProducts(), fetchCategories()]);
    setLoading(false);
  };

  const fetchProducts = async (searchTerm = search) => {
    try {
      const response = await api.get(`/products?search=${searchTerm}`);
      setProducts(response.data);
    } catch (err) {
      console.error('Failed to fetch products');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

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
      alert('Failed to archive product');
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchProducts(val);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-[var(--color-text-secondary)] uppercase tracking-widest text-xs">Loading Inventory...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[var(--color-primary)]/10 rounded-lg">
                <Package className="text-[var(--color-primary)]" size={24} />
              </div>
              <h1 className="text-3xl font-extrabold font-[var(--font-display)]">Inventory</h1>
            </div>
            <p className="text-[var(--color-text-secondary)]">Manage your catalogue and track stock levels across all categories.</p>
          </div>

          <div className="flex items-center gap-2 bg-[var(--color-bg-surface)] p-1.5 rounded-full border border-[var(--color-border)]">
            <button 
              onClick={() => setActiveTab('PRODUCTS')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all ${
                activeTab === 'PRODUCTS' ? 'bg-[var(--color-bg-elevated)] text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-white'
              }`}
            >
              <List size={16} /> Products
            </button>
            <button 
              onClick={() => setActiveTab('CATEGORIES')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all ${
                activeTab === 'CATEGORIES' ? 'bg-[var(--color-bg-elevated)] text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-white'
              }`}
            >
              <LayoutGrid size={16} /> Categories
            </button>
            <button 
              onClick={() => setActiveTab('HISTORY')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all ${
                activeTab === 'HISTORY' ? 'bg-[var(--color-bg-elevated)] text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-white'
              }`}
            >
              <HistoryIcon size={16} /> Audit
            </button>
          </div>
        </div>

        {activeTab === 'PRODUCTS' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
                <input
                  type="text"
                  placeholder="Search products or scan barcode..."
                  className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-full pl-12 pr-4 py-3 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-glow)] transition-all"
                  value={search}
                  onChange={handleSearchChange}
                />
              </div>

              {user?.role === 'OWNER' && (
                <button 
                  onClick={() => { setSelectedProduct(null); setIsProductModalOpen(true); }}
                  className="w-full md:w-auto bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black font-bold px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
                >
                  <Plus size={16} /> Add Product
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
          <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CategoryManager categories={categories} onRefresh={fetchCategories} />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
    </div>
  );
}
