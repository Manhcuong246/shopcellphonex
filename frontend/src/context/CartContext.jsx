import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '@/api/axios';

const STORAGE_KEY = 'cellphone_cart';

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i && Number.isInteger(i.variant_id))
      .map((i) => ({ variant_id: i.variant_id, quantity: Math.max(1, parseInt(i.quantity, 10) || 1) }));
  } catch {
    return [];
  }
}

function saveCart(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Lưu giỏ hàng thất bại', e);
  }
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const [hydrated, setHydrated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const removeItem = useCallback((variantId) => {
    setItems((prev) => prev.filter((i) => i.variant_id !== variantId));
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      setHydrated([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const variantIds = items.map((i) => i.variant_id).join(',');
    api
      .get(`/products/cart-info?variant_ids=${variantIds}`)
      .then(({ data: serverList }) => {
        const byId = new Map((serverList || []).map((r) => [r.variant_id, r]));
        const merged = [];
        const missingIds = [];
        for (const local of items) {
          const info = byId.get(local.variant_id);
          if (!info) {
            missingIds.push(local.variant_id);
            continue;
          }
          merged.push({
            variant_id: local.variant_id,
            product_id: info.product_id,
            name: info.name,
            slug: info.slug,
            image: info.image || null,
            variant_label: info.variant_label,
            price: info.price,
            quantity: local.quantity,
            stock: info.stock,
          });
        }
        missingIds.forEach((id) => removeItem(id));
        setHydrated(merged);
      })
      .catch(() => {
        setHydrated(
          items.map((i) => ({
            variant_id: i.variant_id,
            product_id: null,
            name: 'Đang tải...',
            slug: '',
            image: null,
            variant_label: '',
            price: 0,
            quantity: i.quantity,
            stock: 0,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, [items, removeItem]);

  const addItem = useCallback((variantIdOrItem, quantityOrUndefined) => {
    let variant_id;
    let qty = 1;
    if (typeof variantIdOrItem === 'object' && variantIdOrItem !== null) {
      variant_id = variantIdOrItem.variant_id;
      qty = Math.max(1, parseInt(variantIdOrItem.quantity, 10) || 1);
    } else {
      variant_id = variantIdOrItem;
      qty = Math.max(1, parseInt(quantityOrUndefined, 10) || 1);
    }
    if (!variant_id) return;
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.variant_id === variant_id);
      const next = [...prev];
      if (idx >= 0) {
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      next.push({ variant_id, quantity: qty });
      return next;
    });
  }, []);

  const updateQty = useCallback((variantId, quantity) => {
    const qty = Math.max(0, parseInt(quantity, 10) || 0);
    setItems((prev) => {
      if (qty === 0) return prev.filter((i) => i.variant_id !== variantId);
      return prev.map((i) => (i.variant_id === variantId ? { ...i, quantity: qty } : i));
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const count = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const total = hydrated.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 0), 0);

  const value = {
    items: hydrated,
    loading,
    error,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    total,
    count,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
