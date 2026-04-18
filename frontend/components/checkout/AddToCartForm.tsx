"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useCart } from "@/components/cart/CartProvider";
import { CLIENT_API_URL } from "@/lib/metalwolft";
import {
  anchoringOptions,
  colorOptions,
  type AnchoringType,
  type ProductColor,
} from "@/lib/productConfiguration";

import styles from "./AddToCartForm.module.css";

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

type AddToCartFormProps = {
  productId: number;
  priceM2: string | null;
  minWidthCm: number | null;
  maxWidthCm: number | null;
  minHeightCm: number | null;
  maxHeightCm: number | null;
};

const INITIAL_QUANTITY = "1";
const INITIAL_ANCHORING_TYPE: AnchoringType = "interior_holes";
const INITIAL_COLOR: ProductColor = "white";
const DEFAULT_WIDTH_CM = 120;
const DEFAULT_HEIGHT_CM = 150;

function clamp(value: number, min: number | null, max: number | null) {
  const minValue = min ?? value;
  const maxValue = max ?? value;

  return Math.min(Math.max(value, minValue), maxValue);
}

export default function AddToCartForm({
  productId,
  priceM2,
  minWidthCm,
  maxWidthCm,
  minHeightCm,
  maxHeightCm,
}: AddToCartFormProps) {
  const router = useRouter();
  const { refreshCart } = useCart();

  const initialWidth = useMemo(
    () => String(clamp(DEFAULT_WIDTH_CM, minWidthCm, maxWidthCm)),
    [minWidthCm, maxWidthCm],
  );
  const initialHeight = useMemo(
    () => String(clamp(DEFAULT_HEIGHT_CM, minHeightCm, maxHeightCm)),
    [minHeightCm, maxHeightCm],
  );

  const [widthCm, setWidthCm] = useState(initialWidth);
  const [heightCm, setHeightCm] = useState(initialHeight);
  const [quantity, setQuantity] = useState(INITIAL_QUANTITY);
  const [anchoringType, setAnchoringType] = useState<AnchoringType>(INITIAL_ANCHORING_TYPE);
  const [color, setColor] = useState<ProductColor>(INITIAL_COLOR);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWidthCm(initialWidth);
    setHeightCm(initialHeight);
    setQuantity(INITIAL_QUANTITY);
    setAnchoringType(INITIAL_ANCHORING_TYPE);
    setColor(INITIAL_COLOR);
    setQuote(null);
    setError(null);
  }, [initialHeight, initialWidth, productId]);

  function resetForm() {
    setWidthCm(initialWidth);
    setHeightCm(initialHeight);
    setQuantity(INITIAL_QUANTITY);
    setAnchoringType(INITIAL_ANCHORING_TYPE);
    setColor(INITIAL_COLOR);
    setQuote(null);
    setError(null);
  }

  function buildConfiguration() {
    return {
      width_cm: Number(widthCm),
      height_cm: Number(heightCm),
      anchoring_type: anchoringType,
      color,
      options: [],
    };
  }

  function invalidateQuote() {
    setQuote(null);
    setError(null);
  }

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
          quantity: Number(quantity),
          configuration: buildConfiguration(),
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
          quantity: Number(quantity),
          configuration: buildConfiguration(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message ?? "No se pudo anadir al carrito.");
      }

      await refreshCart();
      resetForm();
      toast.success("Producto anadido al carrito", {
        action: {
          label: "Ver carrito",
          onClick: () => router.push("/carrito"),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setBusy(false);
    }
  }

  const widthHint = (
    minWidthCm !== null &&
    maxWidthCm !== null
      ? `Entre ${minWidthCm} y ${maxWidthCm} cm`
      : "Introduce el ancho en centimetros"
  );
  const heightHint = (
    minHeightCm !== null &&
    maxHeightCm !== null
      ? `Entre ${minHeightCm} y ${maxHeightCm} cm`
      : "Introduce el alto en centimetros"
  );

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Configurador</span>
        <h2 className={styles.title}>Configura tu reja</h2>
        <p className={styles.description}>
          Define medidas, anclaje y color antes de calcular el precio final o
          anadir el producto al carrito.
        </p>
      </div>

      <div className={styles.rangeBanner}>
        {priceM2 ? (
          <>
            Base orientativa desde <strong>{priceM2} EUR/m2</strong>. El total final
            se ajusta a tus medidas y configuracion.
          </>
        ) : (
          <>
            Introduce una configuracion valida para obtener un precio real antes
            de continuar.
          </>
        )}
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              <span>Ancho (cm)</span>
              <span className={styles.fieldHint}>{widthHint}</span>
            </span>
            <input
              className={styles.input}
              min={minWidthCm ?? 1}
              max={maxWidthCm ?? undefined}
              name="widthCm"
              onChange={(event) => {
                invalidateQuote();
                setWidthCm(event.target.value);
              }}
              type="number"
              value={widthCm}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              <span>Alto (cm)</span>
              <span className={styles.fieldHint}>{heightHint}</span>
            </span>
            <input
              className={styles.input}
              min={minHeightCm ?? 1}
              max={maxHeightCm ?? undefined}
              name="heightCm"
              onChange={(event) => {
                invalidateQuote();
                setHeightCm(event.target.value);
              }}
              type="number"
              value={heightCm}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              <span>Cantidad</span>
              <span className={styles.fieldHint}>Minimo 1 unidad</span>
            </span>
            <input
              className={styles.input}
              min={1}
              name="quantity"
              onChange={(event) => {
                invalidateQuote();
                setQuantity(event.target.value);
              }}
              type="number"
              value={quantity}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              <span>Tipo de anclaje</span>
              <span className={styles.fieldHint}>Afecta al precio final</span>
            </span>
            <select
              className={styles.select}
              name="anchoringType"
              onChange={(event) => {
                invalidateQuote();
                setAnchoringType(event.target.value as AnchoringType);
              }}
              value={anchoringType}
            >
              {anchoringOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={`${styles.field} ${styles.fieldWide}`}>
            <span className={styles.fieldLabel}>
              <span>Color</span>
              <span className={styles.fieldHint}>Seleccion visible en pedido y carrito</span>
            </span>
            <select
              className={styles.select}
              name="color"
              onChange={(event) => {
                invalidateQuote();
                setColor(event.target.value as ProductColor);
              }}
              value={color}
            >
              {colorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.secondaryButton}
            disabled={busy}
            onClick={handleQuote}
            type="button"
          >
            {busy ? "Calculando..." : "Calcular precio final"}
          </button>
          <button
            className={styles.primaryButton}
            disabled={busy}
            type="submit"
          >
            {busy ? "Guardando..." : "Anadir al carrito"}
          </button>
        </div>

        <p className={styles.ctaHint}>
          Al anadirla al carrito guardaremos esta configuracion exacta para que
          no pierdas medidas ni opciones al continuar con la compra.
        </p>

        {error ? (
          <p className={styles.error}>{error}</p>
        ) : null}
      </form>

      {quote ? (
        <section className={styles.summary}>
          <div className={styles.summaryHeader}>
            <h3 className={styles.summaryTitle}>Resumen provisional</h3>
            <span className={styles.summarySubtitle}>Pricing real</span>
          </div>

          <div className={styles.summaryGrid}>
            <div className={styles.summaryRow}>
              <span>Productos</span>
              <strong>{quote.pricing.products_subtotal} {quote.currency}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Envio base</span>
              <strong>{quote.pricing.shipping_base} {quote.currency}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Recargos de envio</span>
              <strong>{quote.pricing.shipping_surcharge} {quote.currency}</strong>
            </div>
          </div>

          <div className={styles.summaryTotal}>
            <span className={styles.summaryTotalLabel}>Total estimado</span>
            <span className={styles.summaryTotalValue}>
              {quote.pricing.total} {quote.currency}
            </span>
          </div>

          {quote.rules_applied.length ? (
            <p className={styles.summaryRules}>
              Reglas aplicadas: {quote.rules_applied.join(", ")}
            </p>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
