import type { Metadata } from "next";
import Link from "next/link";

import LightConfigurator from "@/components/landing/LightConfigurator";
import { getApiUrl } from "@/lib/api";
import type { CatalogCategory, CatalogProduct } from "@/lib/catalog";
import { getAbsoluteUrl } from "@/lib/site";

import styles from "./RejasLanding.module.css";

async function getCategories(): Promise<CatalogCategory[]> {
  const res = await fetch(getApiUrl("/api/categories/"), {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }

  return res.json();
}

async function getProducts(): Promise<CatalogProduct[]> {
  const res = await fetch(getApiUrl("/api/products/"), {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  return res.json();
}

export const metadata: Metadata = {
  title: "Rejas Para Ventanas A Medida",
  description:
    "Descubre rejas para ventanas a medida con configuracion sencilla, orientacion de precios y acceso rapido a la ficha de producto para continuar tu pedido.",
  alternates: {
    canonical: "/rejas-para-ventanas",
  },
  openGraph: {
    title: "Rejas para ventanas a medida | MetalWolft",
    description:
      "Landing SEO + conversion para elegir rejas para ventanas, entender tipos, precios orientativos y pasar a una ficha de producto real.",
    url: "/rejas-para-ventanas",
    type: "website",
    siteName: "MetalWolft",
    images: [
      {
        url: getAbsoluteUrl("/opengraph-image"),
        alt: "Rejas para ventanas a medida en MetalWolft",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rejas para ventanas a medida | MetalWolft",
    description:
      "Elige tipo de reja, revisa precios orientativos y salta a una ficha real para configurar tu pedido.",
    images: [getAbsoluteUrl("/opengraph-image")],
  },
};

const faqItems = [
  {
    question: "Como se calcula el precio final de una reja para ventana?",
    answer:
      "El precio final depende de las medidas, la cantidad, el sistema de anclaje y la configuracion elegida en la ficha de producto.",
  },
  {
    question: "Puedo pedir una reja a medida para una ventana concreta?",
    answer:
      "Si. El flujo esta pensado para introducir ancho y alto reales y continuar luego con la configuracion completa del producto.",
  },
  {
    question: "Esta pagina ya cierra el pedido?",
    answer:
      "No. Esta landing te ayuda a entender opciones y a empezar. El pedido se termina en una ficha real de producto con configurador completo.",
  },
];

export default async function RejasParaVentanasPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  const featuredProduct = products[0] ?? null;
  const categoriesToShow = categories.slice(0, 6);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Landing principal</span>
          <h1 className={styles.title}>Rejas para ventanas a medida</h1>
          <p className={styles.lead}>
            Si buscas una reja para ventana que encaje con tus medidas, tu tipo de
            instalacion y el estilo de tu vivienda, aqui tienes una base clara para
            empezar: orientacion de precios, tipos de rejas, proceso de compra y un
            acceso directo a una ficha real para continuar la configuracion.
          </p>

          {featuredProduct?.price_m2 ? (
            <section className={styles.priceBox}>
              <span className={styles.priceLabel}>Precio orientativo base</span>
              <div className={styles.priceValue}>
                <span className={styles.priceAmount}>{featuredProduct.price_m2} EUR</span>
                <span className={styles.priceUnit}>/ m2</span>
              </div>
              <p className={styles.priceHint}>
                Es una referencia inicial. El precio real se ajusta despues segun medidas,
                anclaje, color y cantidad en la ficha de producto.
              </p>
            </section>
          ) : null}

          <div className={styles.heroHighlights}>
            <article className={styles.heroHighlight}>
              <h2 className={styles.heroHighlightTitle}>Configura desde una base real</h2>
              <p className={styles.heroHighlightText}>
                El siguiente paso te lleva a una ficha real de producto, no a un formulario ficticio.
              </p>
            </article>
            <article className={styles.heroHighlight}>
              <h2 className={styles.heroHighlightTitle}>Entiende opciones antes de comprar</h2>
              <p className={styles.heroHighlightText}>
                Revisa tipos de rejas, disenos y proceso para elegir con mas claridad.
              </p>
            </article>
            <article className={styles.heroHighlight}>
              <h2 className={styles.heroHighlightTitle}>Pensada para SEO y conversion</h2>
              <p className={styles.heroHighlightText}>
                Contenido visible util para Google y un camino corto hacia la configuracion.
              </p>
            </article>
          </div>
        </div>

        <LightConfigurator
          targetSlug={featuredProduct?.slug ?? null}
          productName={featuredProduct?.name ?? null}
          minWidthCm={featuredProduct?.min_width_cm ?? null}
          maxWidthCm={featuredProduct?.max_width_cm ?? null}
          minHeightCm={featuredProduct?.min_height_cm ?? null}
          maxHeightCm={featuredProduct?.max_height_cm ?? null}
        />
      </section>

      <section className={styles.section} aria-labelledby="explicacion-title">
        <header className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Explicacion</span>
          <h2 className={styles.sectionTitle} id="explicacion-title">
            Que debes mirar antes de pedir una reja para ventana
          </h2>
          <p className={styles.sectionLead}>
            La eleccion no depende solo del diseno. Tambien importa como se va a instalar,
            el hueco real de la ventana y el nivel de integracion que buscas en fachada o interior.
          </p>
        </header>

        <div className={styles.textGrid}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Medidas del hueco</h3>
            <p className={styles.cardText}>
              Una reja a medida empieza por unas dimensiones reales. Esa informacion condiciona tanto el precio como la viabilidad del modelo.
            </p>
          </article>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Sistema de anclaje</h3>
            <p className={styles.cardText}>
              No es lo mismo una instalacion sin obra que una fijacion con garras. Elegir bien este punto mejora el resultado final.
            </p>
          </article>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Uso y estilo</h3>
            <p className={styles.cardText}>
              La seguridad importa, pero tambien el aspecto visual. El modelo adecuado debe encajar con la vivienda y con la ventana real.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="tipos-title">
        <header className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Tipos de rejas</span>
          <h2 className={styles.sectionTitle} id="tipos-title">
            Soluciones segun el tipo de ventana y la instalacion
          </h2>
        </header>

        <div className={styles.textGrid}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Rejas fijas</h3>
            <p className={styles.cardText}>
              Opcion habitual para huecos donde prima la seguridad y no hace falta acceso frecuente al exterior.
            </p>
          </article>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Rejas abatibles</h3>
            <p className={styles.cardText}>
              Aportan flexibilidad cuando necesitas apertura y mantenimiento sin renunciar a una solucion metalica a medida.
            </p>
          </article>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Rejas correderas</h3>
            <p className={styles.cardText}>
              Pensadas para casos donde el movimiento lateral o el uso del hueco requiere una solucion mas especifica.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="disenos-title">
        <header className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Disenos</span>
          <h2 className={styles.sectionTitle} id="disenos-title">
            Estetica, color y presencia visual en fachada
          </h2>
        </header>

        <div className={styles.textGrid}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Lineas clasicas</h3>
            <p className={styles.cardText}>
              Ideales para viviendas donde buscas una presencia reconocible, sobria y facil de integrar.
            </p>
          </article>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Acabados contemporaneos</h3>
            <p className={styles.cardText}>
              Colores como blanco, negro o antracita ayudan a alinear la reja con carpinterias y fachadas actuales.
            </p>
          </article>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Proyecto a medida</h3>
            <p className={styles.cardText}>
              La combinacion de medidas, color y anclaje define el resultado final mucho mas que una foto generica de catalogo.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="proceso-title">
        <header className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Proceso</span>
          <h2 className={styles.sectionTitle} id="proceso-title">
            Como pasar de la idea inicial a una ficha de producto preparada para comprar
          </h2>
        </header>

        <div className={styles.processList}>
          <article className={styles.processStep}>
            <span className={styles.stepNumber}>1</span>
            <h3 className={styles.stepTitle}>Define ancho y alto aproximados</h3>
            <p className={styles.stepText}>
              Usa el configurador ligero para arrancar con una medida orientativa y no empezar desde cero.
            </p>
          </article>
          <article className={styles.processStep}>
            <span className={styles.stepNumber}>2</span>
            <h3 className={styles.stepTitle}>Accede a una ficha real de producto</h3>
            <p className={styles.stepText}>
              El boton te lleva a una ficha con configurador completo, pricing real y add to cart operativo.
            </p>
          </article>
          <article className={styles.processStep}>
            <span className={styles.stepNumber}>3</span>
            <h3 className={styles.stepTitle}>Completa anclaje, color y pedido</h3>
            <p className={styles.stepText}>
              En la siguiente pantalla puedes revisar el precio y continuar el flujo real de compra.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="precios-title">
        <header className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Precios orientativos</span>
          <h2 className={styles.sectionTitle} id="precios-title">
            Referencia inicial antes de configurar la reja
          </h2>
          <p className={styles.sectionLead}>
            Esta landing no calcula el precio final. El objetivo es darte contexto y llevarte despues a la ficha completa para cerrar la configuracion.
          </p>
        </header>

        <div className={styles.textGrid}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Base por metro cuadrado</h3>
            <p className={styles.cardText}>
              El punto de partida suele expresarse por m2, pero siempre debe reinterpretarse segun las medidas reales del hueco.
            </p>
          </article>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Impacto del anclaje</h3>
            <p className={styles.cardText}>
              El sistema de fijacion puede modificar el precio final y conviene revisarlo ya en la ficha de producto.
            </p>
          </article>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Cantidad y acabado</h3>
            <p className={styles.cardText}>
              El numero de unidades y la configuracion elegida terminan de ajustar el total antes del carrito.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="faq-title">
        <header className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>FAQ</span>
          <h2 className={styles.sectionTitle} id="faq-title">
            Preguntas frecuentes sobre rejas para ventanas a medida
          </h2>
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

      <section className={styles.section} aria-labelledby="categorias-title">
        <header className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Categorias</span>
          <h2 className={styles.sectionTitle} id="categorias-title">
            Explora categorias relacionadas antes de elegir modelo
          </h2>
        </header>

        <div className={styles.linksGrid}>
          {categoriesToShow.map((category) => (
            <Link
              className={styles.linkCard}
              href={`/categorias/${category.slug}`}
              key={category.id}
            >
              <span className={styles.linkTitle}>{category.name}</span>
              <span className={styles.linkText}>
                {category.description || "Ver productos disponibles en esta categoria."}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
