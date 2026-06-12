import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  
  addItem: (product) => {
    const items = get().items;
    const existingItem = items.find((item) => item.productId === product.id);
    
    if (existingItem) {
      // For weight-based products, let cashier add more items, but typically they change weight. 
      // If cashier scans again, increment qty by 1.
      set({
        items: items.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      set({
        items: [
          ...items,
          {
            productId: product.id,
            name: product.name,
            barcode: product.barcode,
            unitPrice: parseFloat(product.pricePerUnit),
            pricingType: product.pricingType,
            unit: product.unit,
            quantity: 1,
            weightKg: product.pricingType === 'WEIGHT_BASED' ? 0 : null,
          },
        ],
      });
    }
  },
  
  removeItem: (productId) => {
    set({
      items: get().items.filter((item) => item.productId !== productId),
    });
  },
  
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      ),
    });
  },
  
  updateWeight: (productId, weightKg) => {
    set({
      items: get().items.map((item) =>
        item.productId === productId ? { ...item, weightKg } : item
      ),
    });
  },
  
  clearCart: () => set({ items: [] }),
  
  getGrandTotal: () => {
    return get().items.reduce((total, item) => {
      const lineTotal = item.pricingType === 'WEIGHT_BASED'
        ? item.unitPrice * (item.weightKg || 0)
        : item.unitPrice * item.quantity;
      return total + lineTotal;
    }, 0);
  },
}));
