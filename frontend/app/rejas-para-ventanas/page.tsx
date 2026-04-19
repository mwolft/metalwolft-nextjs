import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCategoryBySlug, getCategories, getProductsByCategory } from "@/lib/categories";
import { getAbsoluteUrl } from "@/lib/site";

import styles from "./RejasParaVentanas.module.css";

const faqItems = [
  {
    question: "Como se calcula el precio final de una reja para ventana?",
    answer:
      "El precio final depende de las medidas, la cantidad, el sistema de anclaje y la configuracion elegida dentro de la ficha de producto.",
  },
  {
    question: "Todas las rejas se fabrican a medida?",
    answer:
      "La compra esta pensada para introducir medidas reales y terminar la configuracion en una ficha de producto preparada para ello.",
  },
  {
    question: "Puedo elegir color y anclaje despues?",
    answer:
      "Si. Esta categoria te ayuda a explorar modelos y la ficha de producto es donde completas el detalle final del pedido.",
  },
];

function getPageTitle(categoryName: string, seoTitle: string | null) {
  return seoTitle || categoryName;
}

function getPageDescription(
  categoryName: string,
  seoDescription: string | null,
  description: string | null,
) {
  if (seoDescription) {
    return seoDescription;
  }

  if (description) {
    return description;
  }

  return `${categoryName} en MetalWolft.`;
}

export async function generateMetadata(): Promise<Metadata> {
  const category = await getCategoryBySlug("rejas-para-ventanas");

  if (!category) {
    notFound();
  }

  const title = getPageTitle(category.name, category.seo_title);
  const description = getPageDescription(
    category.name,
    category.seo_description,
    category.description,
  );

  return {
    title,
    description,
    alternates: {
      canonical: "/rejas-para-ventanas",
    },
    openGraph: {
      title,
      description,
      url: "/rejas-para-ventanas",
      type: "website",
      siteName: "MetalWolft",
      images: [
        {
          url: category.image_url || getAbsoluteUrl("/opengraph-image"),
          alt: category.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [category.image_url || getAbsoluteUrl("/opengraph-image")],
    },
  };
}

export default async function RejasParaVentanasPage() {
  const [category, products, categories] = await Promise.all([
    getCategoryBySlug("rejas-para-ventanas"),
    getProductsByCategory("rejas-para-ventanas"),
    getCategories(),
  ]);

  if (!category) {
    notFound();
  }

  const relatedCategories = categories
    .filter((item) => item.slug !== category.slug)
    .slice(0, 3);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Categoria comercial</span>
          <h1 className={styles.title}>Rejas para ventanas a medida</h1>
          <p className={styles.lead}>
            Explora un catalogo real de rejas para ventanas, compara modelos y
            accede despues a una ficha de producto preparada para continuar la
            configuracion y la compra.
          </p>
          <div className={styles.benefits}>
            <span className={styles.benefit}>Catalogo visible desde el inicio</span>
            <span className={styles.benefit}>Fabricacion a medida</span>
            <span className={styles.benefit}>Paso directo a ficha real</span>
          </div>
        </div>

        <nav aria-label="Navegacion rapida" className={styles.quickNav}>
          <a className={styles.quickLink} href="#catalogo">Catalogo</a>
          <a className={styles.quickLink} href="#como-elegir">Como elegir</a>
          <a className={styles.quickLink} href="#categorias-relacionadas">Categorias relacionadas</a>
          <a className={styles.quickLink} href="#informacion">Informacion</a>
          <a className={styles.quickLink} href="#faq">FAQ</a>
        </nav>
      </header>

      <section className={styles.section} id="catalogo">
        <header className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Catalogo</span>
          <h2 className={styles.sectionTitle}>Modelos disponibles para esta categoria</h2>
          <p className={styles.sectionLead}>
            Empieza por el catalogo. Desde aqui puedes comparar productos y dar
            el siguiente paso hacia la ficha de compra cuando ya tengas un modelo en mente.
          </p>
        </header>

        {!products.length ? (
          <p className={styles.emptyState}>No hay productos publicados en esta categoria.</p>
        ) : (
          <div className={styles.catalogGrid}>
            {products.map((product) => (
              <article className={styles.productCard} key={product.id}>
                {product.image ? (
                  <img
                    alt={product.name}
                    className={styles.productImage}
                    src={product.image}
                  />
                ) : null}

                <div className={styles.productBody}>
                  <h3 className={styles.productTitle}>{product.name}</h3>
                  {product.description ? (
                    <p className={styles.productDescription}>{product.description}</p>
                  ) : null}
                  <Link className={styles.productLink} href={`/productos/${product.slug}`}>
                    Ver producto
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section} id="como-elegir">
        <header className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Guia rapida</span>
          <h2 className={styles.sectionTitle}>Como elegir una reja para ventana</h2>
          <p className={styles.sectionLead}>
            Antes de decidir un modelo conviene revisar tres factores basicos:
            medidas reales, tipo de instalacion y presencia visual.
          </p>
        </header>

        <div className={styles.infoGrid}>
          <article className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>Medidas del hueco</h3>
            <p className={styles.infoCardText}>
              La anchura y la altura condicionan tanto el modelo adecuado como el precio final de la reja.
            </p>
          </article>
          <article className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>Tipo de anclaje</h3>
            <p className={styles.infoCardText}>
              No es lo mismo una instalacion sin obra que una fijacion con garras o pletinas. Elegir bien este punto evita errores.
            </p>
          </article>
          <article className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>Estilo y color</h3>
            <p className={styles.infoCardText}>
              La reja debe cumplir una funcion de seguridad, pero tambien integrarse visualmente con la ventana y la fachada.
            </p>
          </article>
        </div>
      </section>

      {relatedCategories.length ? (
        <section className={styles.section} id="categorias-relacionadas">
          <header className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Explora mas</span>
            <h2 className={styles.sectionTitle}>Categorias relacionadas</h2>
          </header>

          <div className={styles.relatedGrid}>
            {relatedCategories.map((relatedCategory) => (
              <Link className={styles.relatedCard} href={`/${relatedCategory.slug}`} key={relatedCategory.id}>
                <span className={styles.relatedTitle}>{relatedCategory.name}</span>
                <span className={styles.relatedText}>
                  {relatedCategory.description || "Explora esta categoria del catalogo."}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.section} id="informacion">
        <header className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Informacion</span>
          <h2 className={styles.sectionTitle}>Rejas para ventanas: seguridad, medida y configuracion clara</h2>
          <p className={styles.sectionLead}>
            Esta categoria esta pensada para quienes quieren ver producto real antes de entrar en el detalle del configurador.
          </p>
        </header>

        <div className={styles.seoBody}>
          <p>
            Una reja para ventana a medida no se elige solo por la imagen del producto. Tambien influyen el hueco real, el tipo de anclaje y la integracion visual en la vivienda.
          </p>
          <p>
            Por eso esta pagina muestra primero el catalogo disponible y despues ofrece contenido de apoyo para ayudarte a entender mejor el producto antes de pasar a la ficha completa.
          </p>
        </div>
      </section>

      <section className={styles.section} id="faq">
        <header className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>FAQ</span>
          <h2 className={styles.sectionTitle}>Preguntas frecuentes sobre rejas para ventanas</h2>
        </header>

        <div className={styles.faqList}>
          {faqItems.map((item) => (
            <article className={styles.faqItem} key={item.question}>
              <h3 className={styles.faqQuestion}>{item.question}</h3>
              <p className={styles.faqAnswer}>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.softCta}>
        <div>
          <h2 className={styles.sectionTitle}>Prefieres revisar todo el catalogo?</h2>
          <p className={styles.sectionLead}>
            Si todavia no tienes claro el modelo, puedes entrar al listado general y comparar opciones con mas calma.
          </p>
        </div>
        <Link className={styles.ctaLink} href="/productos">
          Ver todos los productos
        </Link>
      </section>
    </div>
  );
}
