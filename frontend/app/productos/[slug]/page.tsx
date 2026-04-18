import { Metadata } from "next";
import { notFound } from "next/navigation";

import AddToCartForm from "@/components/checkout/AddToCartForm";
import { getApiUrl } from "@/lib/api";
import type { CatalogProduct } from "@/lib/catalog";

import styles from "./ProductPage.module.css";

async function getProduct(slug: string): Promise<CatalogProduct | null> {
  const res = await fetch(
    getApiUrl(`/api/products/${slug}`),
    { cache: "no-store" },
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch product");

  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const title = product.seo?.title || product.name;
  const description = product.seo?.description || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
  };
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const title = product.seo?.h1 || product.name;
  const categoryName = product.category?.name ?? "Reja a medida";
  const hasPhysicalRanges = (
    product.min_width_cm !== null &&
    product.max_width_cm !== null &&
    product.min_height_cm !== null &&
    product.max_height_cm !== null
  );

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.mediaPanel}>
          <div className={styles.mediaFrame}>
            {product.image ? (
              <img
                alt={product.name}
                className={styles.mediaImage}
                src={product.image}
              />
            ) : (
              <div className={styles.mediaPlaceholder}>
                Imagen principal del producto disponible proximamente.
              </div>
            )}
          </div>

          <div className={styles.mediaMeta}>
            <span className={styles.mediaTag}>Fabricacion a medida</span>
            {product.flags.new ? (
              <span className={styles.mediaTag}>Novedad</span>
            ) : null}
            {product.flags.featured ? (
              <span className={styles.mediaTag}>Producto destacado</span>
            ) : null}
          </div>
        </div>

        <div className={styles.infoColumn}>
          <div className={styles.eyebrowRow}>
            <span className={styles.eyebrow}>{categoryName}</span>
            {hasPhysicalRanges ? (
              <span className={`${styles.eyebrow} ${styles.eyebrowAccent}`}>
                Medidas reales del producto
              </span>
            ) : null}
          </div>

          <div>
            <h1 className={styles.title}>{title}</h1>
            {product.description ? (
              <p className={styles.description}>{product.description}</p>
            ) : null}
          </div>

          {product.price_m2 ? (
            <section className={styles.priceBox}>
              <span className={styles.priceLabel}>Precio orientativo base</span>
              <div className={styles.priceValue}>
                <span className={styles.priceAmount}>{product.price_m2} EUR</span>
                <span className={styles.priceUnit}>/ m2</span>
              </div>
              <p className={styles.priceHint}>
                Es una referencia visual para situarte. El precio final depende
                de las medidas, la cantidad y la configuracion elegida.
              </p>
            </section>
          ) : null}

          <div className={styles.highlights}>
            <div className={styles.highlightCard}>
              <strong className={styles.highlightTitle}>Configuracion clara</strong>
              <p className={styles.highlightText}>
                Elige medidas reales, anclaje y color antes de calcular tu precio.
              </p>
            </div>
            <div className={styles.highlightCard}>
              <strong className={styles.highlightTitle}>Precio bajo demanda</strong>
              <p className={styles.highlightText}>
                El configurador consulta el pricing real del sistema, no una estimacion inventada.
              </p>
            </div>
            <div className={styles.highlightCard}>
              <strong className={styles.highlightTitle}>Compra con tranquilidad</strong>
              <p className={styles.highlightText}>
                Al anadir la reja al carrito conservamos toda la configuracion para el pedido final.
              </p>
            </div>
          </div>

          <AddToCartForm
            productId={product.id}
            priceM2={product.price_m2}
            minWidthCm={product.min_width_cm}
            maxWidthCm={product.max_width_cm}
            minHeightCm={product.min_height_cm}
            maxHeightCm={product.max_height_cm}
          />
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.contentHeader}>
          <span className={styles.contentEyebrow}>Detalles del producto</span>
          <h2 className={styles.contentTitle}>Informacion para decidir con mas claridad</h2>
          <p className={styles.contentLead}>
            Aqui reunimos la informacion comercial y tecnica de esta reja para que
            puedas revisar acabados, contexto de instalacion y lo que necesites antes de comprar.
          </p>
        </div>

        <article
          className={styles.contentBody}
          dangerouslySetInnerHTML={{ __html: product.content ?? "" }}
        />
      </section>
    </main>
  );
}
