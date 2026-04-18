"use client";

import { useEffect } from "react";

import CartClient from "@/components/checkout/CartClient";
import { useCart } from "@/components/cart/CartProvider";

export default function CartPageClient() {
  const { cart, error, loading, refreshCart } = useCart();

  useEffect(() => {
    if (!cart) {
      void refreshCart();
    }
  }, [cart, refreshCart]);

  if (error) {
    return (
      <main>
        <h1>Carrito</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (loading || !cart) {
    return (
      <main>
        <h1>Carrito</h1>
        <p>Cargando carrito...</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Carrito</h1>
      <CartClient initialCart={cart} />
    </main>
  );
}
