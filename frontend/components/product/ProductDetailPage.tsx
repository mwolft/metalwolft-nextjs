import Link from "next/link";

import AddToCartForm from "@/components/checkout/AddToCartForm";
import type { CatalogProduct } from "@/lib/catalog";
import {
  getProductBreadcrumbSchema,
  getProductSchema,
} from "@/lib/products";

import styles from "./ProductDetailPage.module.css";

export default function ProductDetailPage({
  product,
}: {
  product: CatalogProduct;
}) {
  const title = product.seo?.h1 || product.name;
  const categoryName = product.category?.name ?? "Reja a medida";
  const hasPhysicalRanges = (
    product.min_width_cm !== null &&
    product.max_width_cm !== null &&
    product.min_height_cm !== null &&
    product.max_height_cm !== null
  );
  const productSchema = getProductSchema(product);
  const breadcrumbSchema = getProductBreadcrumbSchema(product);
  const heroDescription = product.description || `${product.name} fabricada a medida para ventanas.`;

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
        <ol className={styles.breadcrumbList}>
          <li className={styles.breadcrumbItem}>
            <Link className={styles.breadcrumbLink} href="/">
              Inicio
            </Link>
          </li>
          {product.category ? (
            <li className={styles.breadcrumbItem}>
              <Link
                className={styles.breadcrumbLink}
                href={`/${product.category.slug}`}
              >
                {product.category.name}
              </Link>
            </li>
          ) : null}
          <li
            aria-current="page"
            className={`${styles.breadcrumbItem} ${styles.breadcrumbCurrent}`}
          >
            {product.name}
          </li>
        </ol>
      </nav>

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

          <section aria-labelledby="product-title" className={styles.heroCopy}>
            <p className={styles.kicker}>
              Reja a medida para ventanas con configuracion real de instalacion.
            </p>
            <h1 className={styles.title} id="product-title">{title}</h1>
            <p className={styles.description}>{heroDescription}</p>
            <p className={styles.supportText}>
              Define ancho, alto, anclaje y color para obtener una referencia clara
              del precio antes de anadir la configuracion exacta al carrito.
            </p>
          </section>

          {product.price_m2 ? (
            <section className={styles.priceBox}>
              <span className={styles.priceLabel}>Precio orientativo base</span>
              <div className={styles.priceValue}>
                <span className={styles.priceAmount}>{product.price_m2} EUR</span>
                <span className={styles.priceUnit}>/ m2</span>
              </div>
              <p className={styles.priceHint}>
                Sirve como referencia inicial por metro cuadrado. El total final
                se ajusta a las medidas, la cantidad y el sistema de anclaje elegido.
              </p>
            </section>
          ) : null}

          <section
            aria-labelledby="product-highlights-title"
            className={styles.highlightsSection}
          >
            <div className={styles.sectionHeader}>
              <span className={styles.sectionEyebrow}>Antes de configurarla</span>
              <h2 className={styles.sectionTitle} id="product-highlights-title">
                Lo esencial para pedir esta reja a medida con seguridad
              </h2>
            </div>

            <div className={styles.highlights}>
              <article className={styles.highlightCard}>
                <h3 className={styles.highlightTitle}>Medidas reales del hueco</h3>
                <p className={styles.highlightText}>
                  Introduce ancho y alto dentro del rango admitido para pedir una reja ajustada a tu ventana.
                </p>
              </article>
              <article className={styles.highlightCard}>
                <h3 className={styles.highlightTitle}>Anclaje segun tu instalacion</h3>
                <p className={styles.highlightText}>
                  Elige la fijacion que mejor encaje con tu obra o reforma y revisa como impacta en el precio.
                </p>
              </article>
              <article className={styles.highlightCard}>
                <h3 className={styles.highlightTitle}>Configuracion guardada en el pedido</h3>
                <p className={styles.highlightText}>
                  Las medidas, el color y el anclaje viajan contigo al carrito para evitar errores al continuar.
                </p>
              </article>
            </div>
          </section>

          <section aria-labelledby="configurator-intro-title" className={styles.configIntro}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionEyebrow}>Siguiente paso</span>
              <h2 className={styles.sectionTitle} id="configurator-intro-title">
                Configura tu reja y revisa el precio antes de anadirla al carrito
              </h2>
            </div>
            <p className={styles.configIntroText}>
              Si ya conoces las medidas del hueco, puedes preparar el pedido aqui mismo.
              El configurador utiliza el pricing real del sistema para darte una referencia util antes del checkout.
            </p>
          </section>

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
          <h2 className={styles.contentTitle}>Ficha tecnica, instalacion y claves para decidir mejor</h2>
          <p className={styles.contentLead}>
            Aqui puedes revisar la informacion ampliada del producto: materiales,
            contexto de uso, instalacion y cualquier detalle relevante antes de confirmar tu pedido.
          </p>
        </div>

        <article
          className={styles.contentBody}
          dangerouslySetInnerHTML={{ __html: product.content ?? "" }}
        />
      </section>
    </div>
  );
}
