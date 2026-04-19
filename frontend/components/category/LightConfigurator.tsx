"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./LightConfigurator.module.css";

type LightConfiguratorProps = {
  targetSlug: string | null;
  productName?: string | null;
  minWidthCm?: number | null;
  maxWidthCm?: number | null;
  minHeightCm?: number | null;
  maxHeightCm?: number | null;
};

const DEFAULT_WIDTH_CM = 120;
const DEFAULT_HEIGHT_CM = 150;

function clamp(value: number, min: number | null | undefined, max: number | null | undefined) {
  const minValue = min ?? value;
  const maxValue = max ?? value;
  return Math.min(Math.max(value, minValue), maxValue);
}

export default function LightConfigurator({
  targetSlug,
  productName,
  minWidthCm,
  maxWidthCm,
  minHeightCm,
  maxHeightCm,
}: LightConfiguratorProps) {
  const router = useRouter();
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

  const widthHint = minWidthCm !== null && minWidthCm !== undefined &&
    maxWidthCm !== null && maxWidthCm !== undefined
    ? `Entre ${minWidthCm} y ${maxWidthCm} cm`
    : "Medida orientativa";
  const heightHint = minHeightCm !== null && minHeightCm !== undefined &&
    maxHeightCm !== null && maxHeightCm !== undefined
    ? `Entre ${minHeightCm} y ${maxHeightCm} cm`
    : "Medida orientativa";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!targetSlug) {
      router.push("/productos");
      return;
    }

    const params = new URLSearchParams({
      width: widthCm,
      height: heightCm,
    });

    router.push(`/productos/${targetSlug}?${params.toString()}`);
  }

  return (
    <aside className={styles.card}>
      <span className={styles.eyebrow}>Configurador rapido</span>
      <h2 className={styles.title}>Empieza con una medida aproximada</h2>
      <p className={styles.description}>
        Introduce ancho y alto orientativos para pasar a una ficha de producto
        real y continuar con la configuracion completa.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.grid}>
          <label className={styles.field}>
            <span className={styles.labelRow}>
              <span className={styles.label}>Ancho (cm)</span>
              <span className={styles.hint}>{widthHint}</span>
            </span>
            <input
              className={styles.input}
              min={minWidthCm ?? 1}
              max={maxWidthCm ?? undefined}
              onChange={(event) => setWidthCm(event.target.value)}
              type="number"
              value={widthCm}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.labelRow}>
              <span className={styles.label}>Alto (cm)</span>
              <span className={styles.hint}>{heightHint}</span>
            </span>
            <input
              className={styles.input}
              min={minHeightCm ?? 1}
              max={maxHeightCm ?? undefined}
              onChange={(event) => setHeightCm(event.target.value)}
              type="number"
              value={heightCm}
            />
          </label>
        </div>

        <button className={styles.button} type="submit">
          Calcular precio
        </button>
      </form>

      <p className={styles.note}>
        {targetSlug && productName
          ? `La siguiente pantalla abrira la ficha de ${productName} con estas medidas como referencia.`
          : "Si no hay una ficha recomendada disponible, te llevaremos al catalogo general."}
      </p>
    </aside>
  );
}
