"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/components/cart/CartProvider";
import { CLIENT_API_URL } from "@/lib/metalwolft";

type QuoteResponse = {
  pricing: {
    products_subtotal: string;
    shipping_base: string;
    shipping_surcharge: string;
    total: string;
  };
  rules_applied: string[];
  currency: string;
};

export default function AddToCartForm({
  productId,
}: {
  productId: number;
}) {
  const router = useRouter();
  const { refreshCart } = useCart();
  const [widthCm, setWidthCm] = useState("120");
  const [heightCm, setHeightCm] = useState("150");
  const [quantity, setQuantity] = useState("1");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleQuote() {
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`${CLIENT_API_URL}/api/pricing/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          product_id: productId,
          width_cm: Number(widthCm),
          height_cm: Number(heightCm),
          quantity: Number(quantity),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message ?? "No se pudo calcular el precio.");
      }

      setQuote(data);
    } catch (err) {
      setQuote(null);
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`${CLIENT_API_URL}/api/cart/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          product_id: productId,
          width_cm: Number(widthCm),
          height_cm: Number(heightCm),
          quantity: Number(quantity),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message ?? "No se pudo añadir al carrito.");
      }

      await refreshCart();
      router.push("/carrito");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-neutral-900">
        Configura tu reja
      </h2>
      <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-1">
          <span className="text-sm font-medium text-neutral-700">Ancho (cm)</span>
          <input
            className="rounded-xl border border-neutral-300 px-4 py-3"
            min={1}
            name="widthCm"
            onChange={(event) => setWidthCm(event.target.value)}
            type="number"
            value={widthCm}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-neutral-700">Alto (cm)</span>
          <input
            className="rounded-xl border border-neutral-300 px-4 py-3"
            min={1}
            name="heightCm"
            onChange={(event) => setHeightCm(event.target.value)}
            type="number"
            value={heightCm}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-neutral-700">Cantidad</span>
          <input
            className="rounded-xl border border-neutral-300 px-4 py-3"
            min={1}
            name="quantity"
            onChange={(event) => setQuantity(event.target.value)}
            type="number"
            value={quantity}
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-xl border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-900"
            onClick={handleQuote}
            type="button"
          >
            {busy ? "Calculando..." : "Actualizar precio"}
          </button>
          <button
            className="rounded-xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white"
            disabled={busy}
            type="submit"
          >
            {busy ? "Guardando..." : "Añadir al carrito"}
          </button>
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </form>

      {quote ? (
        <div className="mt-6 rounded-2xl bg-neutral-50 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Resumen provisional
          </h3>
          <dl className="mt-3 grid gap-2 text-sm text-neutral-700">
            <div className="flex justify-between gap-4">
              <dt>Productos</dt>
              <dd>{quote.pricing.products_subtotal} {quote.currency}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Envío base</dt>
              <dd>{quote.pricing.shipping_base} {quote.currency}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Recargos de envío</dt>
              <dd>{quote.pricing.shipping_surcharge} {quote.currency}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-neutral-200 pt-2 font-semibold text-neutral-950">
              <dt>Total</dt>
              <dd>{quote.pricing.total} {quote.currency}</dd>
            </div>
          </dl>

          {quote.rules_applied.length ? (
            <p className="mt-3 text-xs text-neutral-500">
              Reglas aplicadas: {quote.rules_applied.join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
