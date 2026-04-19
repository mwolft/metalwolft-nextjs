import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import AddToCartForm from "@/components/checkout/AddToCartForm";
import { getApiUrl } from "@/lib/api";
import type { CatalogProduct } from "@/lib/catalog";
import { getAbsoluteUrl } from "@/lib/site";

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

function getProductMetadataTitle(product: CatalogProduct) {
  return product.seo?.title || product.name;
}

function getProductMetadataDescription(product: CatalogProduct) {
  if (product.seo?.description) {
    return product.seo.description;
  }

  if (product.description) {
    return product.description;
  }

  if (product.category?.name) {
    return `${product.name} en ${product.category.name} de MetalWolft.`;
  }

  return `${product.name} de MetalWolft.`;
}

function getProductBreadcrumbSchema(product: CatalogProduct) {
  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Inicio",
      item: getAbsoluteUrl("/"),
    },
  ];

  if (product.category) {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: product.category.name,
      item: getAbsoluteUrl(`/categorias/${product.category.slug}`),
    });
  }

  items.push({
    "@type": "ListItem",
    position: product.category ? 3 : 2,
    name: product.name,
    item: getAbsoluteUrl(`/productos/${product.slug}`),
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

function getProductSchema(product: CatalogProduct) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: getProductMetadataDescription(product),
    url: getAbsoluteUrl(`/productos/${product.slug}`),
    brand: {
      "@type": "Brand",
      name: "MetalWolft",
    },
  };

  if (product.image) {
    schema.image = [product.image];
  }

  if (product.category?.name) {
    schema.category = product.category.name;
  }

  return schema;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const title = getProductMetadataTitle(product);
  const description = getProductMetadataDescription(product);
  const canonicalPath = `/productos/${product.slug}`;
  const socialImage = product.image || getAbsoluteUrl("/opengraph-image");

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: "website",
      siteName: "MetalWolft",
      locale: "es_ES",
      images: [
        {
          url: socialImage,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
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
                href={`/categorias/${product.category.slug}`}
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
