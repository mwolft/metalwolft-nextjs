"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CLIENT_API_URL, CartResponse } from "@/lib/metalwolft";

export default function CartClient({
  initialCart,
}: {
  initialCart: CartResponse;
}) {
  const router = useRouter();
  const [cart, setCart] = useState(initialCart);
  const [loadingItemId, setLoadingItemId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateQuantity(itemId: number, quantity: number) {
    setLoadingItemId(itemId);
    setError(null);

    try {
      const res = await fetch(`${CLIENT_API_URL}/api/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message ?? "No se pudo actualizar el item.");
      }

      setCart(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setLoadingItemId(null);
    }
  }

  async function deleteItem(itemId: number) {
    setLoadingItemId(itemId);
    setError(null);

    try {
      const res = await fetch(`${CLIENT_API_URL}/api/cart/items/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message ?? "No se pudo eliminar el item.");
      }

      setCart(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setLoadingItemId(null);
    }
  }

  if (!cart.items.length) {
    return (
      <section className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
        <h2 className="text-xl font-semibold text-neutral-900">
          Tu carrito está vacío
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Añade una reja desde la ficha de producto para empezar.
        </p>
        <Link
          className="mt-4 inline-flex rounded-xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white"
          href="/productos"
        >
          Ver productos
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
      <section className="grid gap-4">
        {cart.items.map((item) => (
          <article
            className="rounded-2xl border border-neutral-200 bg-white p-5"
            key={item.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-neutral-950">
                  {item.product.name}
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  {item.configuration.width_cm} x {item.configuration.height_cm} cm
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  Cantidad actual: {item.configuration.quantity}
                </p>
              </div>

              <button
                className="text-sm font-medium text-red-600"
                disabled={loadingItemId === item.id}
                onClick={() => deleteItem(item.id)}
                type="button"
              >
                Eliminar
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="grid gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Nueva cantidad
                </span>
                <input
                  className="w-28 rounded-xl border border-neutral-300 px-3 py-2"
                  defaultValue={item.configuration.quantity}
                  min={1}
                  onBlur={(event) => {
                    const value = Number(event.target.value);
                    if (value >= 1 && value !== item.configuration.quantity) {
                      void updateQuantity(item.id, value);
                    }
                  }}
                  type="number"
                />
              </label>
            </div>

            <dl className="mt-4 grid gap-2 text-sm text-neutral-700">
              <div className="flex justify-between gap-4">
                <dt>Subtotal productos</dt>
                <dd>{item.pricing.products_subtotal} {cart.currency}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Recargos</dt>
                <dd>{item.pricing.shipping_surcharge} {cart.currency}</dd>
              </div>
              <div className="flex justify-between gap-4 font-semibold text-neutral-950">
                <dt>Total línea</dt>
                <dd>{item.pricing.total} {cart.currency}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>

      <aside className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
        <h2 className="text-lg font-semibold text-neutral-950">
          Resumen del pedido
        </h2>
        <dl className="mt-4 grid gap-2 text-sm text-neutral-700">
          <div className="flex justify-between gap-4">
            <dt>Items</dt>
            <dd>{cart.summary.items_count}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Unidades</dt>
            <dd>{cart.summary.total_quantity}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Productos</dt>
            <dd>{cart.summary.products_subtotal} {cart.currency}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Envío base</dt>
            <dd>{cart.summary.shipping_base} {cart.currency}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Recargos</dt>
            <dd>{cart.summary.shipping_surcharge} {cart.currency}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-neutral-200 pt-3 font-semibold text-neutral-950">
            <dt>Total</dt>
            <dd>{cart.summary.total} {cart.currency}</dd>
          </div>
        </dl>

        {cart.rules_applied.length ? (
          <p className="mt-4 text-xs text-neutral-500">
            Reglas aplicadas: {cart.rules_applied.join(", ")}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <Link
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white"
          href="/checkout"
        >
          Continuar al checkout
        </Link>
      </aside>
    </div>
  );
}
