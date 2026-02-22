import { createContext, useContext, useState, useCallback } from 'react';

const CartSidebarContext = createContext(null);

export function CartSidebarProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openCartSidebar = useCallback(() => setOpen(true), []);
  const closeCartSidebar = useCallback(() => setOpen(false), []);

  return (
    <CartSidebarContext.Provider value={{ open, openCartSidebar, closeCartSidebar, setOpen }}>
      {children}
    </CartSidebarContext.Provider>
  );
}

export function useCartSidebar() {
  const ctx = useContext(CartSidebarContext);
  if (!ctx) return { openCartSidebar: () => {}, closeCartSidebar: () => {} };
  return ctx;
}
