"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

interface CartContextType {
  count: number;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({ count: 0, refresh: async () => {} });

export function CartProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        const items = data.data?.items || [];
        setCount(items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0));
      } else {
        setCount(0);
      }
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <CartContext.Provider value={{ count, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
