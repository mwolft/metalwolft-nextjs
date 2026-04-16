"use client";

import { useEffect, useState } from "react";

import CartClient from "@/components/checkout/CartClient";
import { CLIENT_API_URL, CartResponse } from "@/lib/metalwolft";

export default function CartPageClient() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCart() {
      try {
        const res = await fetch(`${CLIENT_API_URL}/api/cart`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error?.message ?? "No se pudo cargar el carrito.");
        }

        if (!cancelled) {
          setCart(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Error desconocido al cargar el carrito.",
          );
        }
      }
    }

    void loadCart();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <main>
        <h1>Carrito</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (!cart) {
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
