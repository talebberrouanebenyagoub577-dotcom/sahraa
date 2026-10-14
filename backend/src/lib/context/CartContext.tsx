"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  PRODUCT_UNIT_PRICE,
  calculateTierPrice,
  FREE_SHIPPING_COST,
} from "@/lib/pricing";

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string | null;
  name: string;
  nameAr?: string | null;
  slug: string;
  image: string;
  price: number;
  quantity: number;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  tierPrice: number;
  savings: number;
  shipping: number;
  total: number;
  remainingToNextTier: number;
  nextTierHintAr: string;
  nextTierHintEn: string;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  summary: CartSummary;
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  addItem: (
    product: {
      id: string;
      name: string;
      nameAr?: string | null;
      slug: string;
      image?: string;
      price?: number;
    },
    variantId?: string | null,
    quantity?: number,
    openDrawer?: boolean
  ) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string | null
  ) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  clearCart: () => void;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "sahraa_cart_items_v2";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // Ignore storage errors
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage errors
    }
  }, [items, isLoaded]);

  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const summary = useMemo<CartSummary>(() => {
    const itemCount = count;
    const tierPrice = calculateTierPrice(itemCount);
    const subtotal = itemCount * PRODUCT_UNIT_PRICE;
    const savings = Math.max(0, subtotal - tierPrice);

    let remainingToNextTier = 1;
    let nextTierHintAr = "أضف أي منتج بـ 199 ر.س";
    let nextTierHintEn = "Add any product for 199 SAR";

    if (itemCount === 1) {
      remainingToNextTier = 1;
      nextTierHintAr = "أضف منتجاً ثانياً بـ 80 ر.س فقط (2 بـ 279 ر.س بدلاً من 398 ر.س)";
      nextTierHintEn = "Add a 2nd product for 80 SAR only (2 for 279 SAR)";
    } else if (itemCount === 2) {
      remainingToNextTier = 1;
      nextTierHintAr = "أضف منتجاً ثالثاً بـ 70 ر.س فقط (3 بـ 349 ر.س بدلاً من 597 ر.س)";
      nextTierHintEn = "Add a 3rd product for 70 SAR only (3 for 349 SAR)";
    } else if (itemCount >= 3) {
      const rem = itemCount % 3;
      if (rem === 0) {
        remainingToNextTier = 0;
        nextTierHintAr = "🎉 رائع! أنت في أعلى باقة توفير (وفرت أكثر من 248 ر.س)";
        nextTierHintEn = "🎉 Great! You unlocked the maximum savings tier";
      } else if (rem === 1) {
        remainingToNextTier = 1;
        nextTierHintAr = "أضف منتجاً إضافياً للحصول على باقة 2 بـ 279 ر.س";
        nextTierHintEn = "Add another item for bundle pricing";
      } else {
        remainingToNextTier = 1;
        nextTierHintAr = "أضف منتجاً إضافياً لإكمال باقة الـ 3 بـ 349 ر.س";
        nextTierHintEn = "Add one more item to complete the 3 for 349 SAR bundle";
      }
    }

    return {
      itemCount,
      subtotal,
      tierPrice,
      savings,
      shipping: FREE_SHIPPING_COST,
      total: tierPrice,
      remainingToNextTier,
      nextTierHintAr,
      nextTierHintEn,
    };
  }, [count]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const openCheckout = useCallback(() => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }, []);
  const closeCheckout = useCallback(() => setIsCheckoutOpen(false), []);

  const addItem = useCallback(
    (
      product: {
        id: string;
        name: string;
        nameAr?: string | null;
        slug: string;
        image?: string;
        price?: number;
      },
      variantId?: string | null,
      quantity = 1,
      openDrawer = true
    ) => {
      setItems((prev) => {
        const key = `${product.id}-${variantId || ""}`;
        const existingIdx = prev.findIndex(
          (i) => `${i.productId}-${i.variantId || ""}` === key
        );

        if (existingIdx > -1) {
          const updated = [...prev];
          updated[existingIdx].quantity += quantity;
          return updated;
        }

        const newItem: CartItem = {
          id: key,
          productId: product.id,
          variantId: variantId || null,
          name: product.name,
          nameAr: product.nameAr || product.name,
          slug: product.slug,
          image: product.image || "/placeholder.png",
          price: PRODUCT_UNIT_PRICE,
          quantity,
        };

        return [...prev, newItem];
      });

      if (openDrawer) {
        setIsCartOpen(true);
      }
    },
    []
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number, variantId?: string | null) => {
      setItems((prev) => {
        const key = `${productId}-${variantId || ""}`;
        if (quantity <= 0) {
          return prev.filter(
            (i) => `${i.productId}-${i.variantId || ""}` !== key
          );
        }
        return prev.map((item) =>
          `${item.productId}-${item.variantId || ""}` === key
            ? { ...item, quantity }
            : item
        );
      });
    },
    []
  );

  const removeItem = useCallback(
    (productId: string, variantId?: string | null) => {
      setItems((prev) => {
        const key = `${productId}-${variantId || ""}`;
        return prev.filter(
          (i) => `${i.productId}-${i.variantId || ""}` !== key
        );
      });
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const refresh = useCallback(async () => {
    // Sync with server if logged in
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const d = await res.json();
        const serverItems = d.data?.items;
        if (Array.isArray(serverItems) && serverItems.length > 0) {
          // If server has items, we can merge or use them
        }
      }
    } catch {
      // Guest safe
    }
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        summary,
        isCartOpen,
        isCheckoutOpen,
        openCart,
        closeCart,
        openCheckout,
        closeCheckout,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
