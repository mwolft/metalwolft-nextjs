"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { CLIENT_API_URL, CartResponse } from "@/lib/metalwolft";

type CartContextValue = {
  cart: CartResponse | null;
  cartCount: number;
  loading: boolean;
  error: string | null;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
  setCart: (nextCart: CartResponse) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCartState] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCart = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(`${CLIENT_API_URL}/api/cart`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message ?? "No se pudo cargar el carrito.");
      }

      setCartState(data);
      setError(null);
    } catch (err) {
      setCartState(null);
      setError(err instanceof Error ? err.message : "Error desconocido al cargar el carrito.");
    } finally {
      setLoading(false);
    }
  }, []);

  const setCart = useCallback((nextCart: CartResponse) => {
    setCartState(nextCart);
    setError(null);
    setLoading(false);
  }, []);

  const clearCart = useCallback(() => {
    setCartState(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      cartCount: cart?.summary.total_quantity ?? 0,
      loading,
      error,
      clearCart,
      refreshCart,
      setCart,
    }),
    [cart, loading, error, clearCart, refreshCart, setCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }

  return context;
}
