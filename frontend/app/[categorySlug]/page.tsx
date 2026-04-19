import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import LightConfigurator from "@/components/category/LightConfigurator";
import {
  getCategoryBySlug,
  getCategories,
  getProductsByCategory,
} from "@/lib/categories";
import {
  getCategoryOverride,
  getOverrideFeaturedProduct,
  getOverrideRelatedCategories,
} from "@/lib/category-overrides";

import styles from "./CategoryPage.module.css";

function getCategoryTitle(name: string, seoTitle: string | null) {
  return seoTitle || name;
}

function getCategoryDescription(
  name: string,
  seoDescription: string | null,
  description: string | null,
) {
  if (seoDescription) {
    return seoDescription;
  }

  if (description) {
    return description;
  }

  return `${name} en MetalWolft.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  return {
    title: getCategoryTitle(category.name, category.seo_title),
    description: getCategoryDescription(
      category.name,
      category.seo_description,
      category.description,
    ),
    alternates: {
      canonical: `/${category.slug}`,
    },
  };
}

export default async function PublicCategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const [category, products, categories] = await Promise.all([
    getCategoryBySlug(categorySlug),
    getProductsByCategory(categorySlug),
    getCategories(),
  ]);

  if (!category) {
    notFound();
  }

  const override = getCategoryOverride(category.slug);
  const featuredProduct = getOverrideFeaturedProduct(products, override);
  const relatedCategories = getOverrideRelatedCategories(
    categories,
    category.slug,
    override,
  );
  const heroTitle = override?.hero?.title || category.name;
  const heroDescription = override?.hero?.description || category.description;
  const heroBenefits = override?.hero?.benefits || [];
  const catalogTitle = override?.catalog?.title || "Productos de esta categoria";
  const catalogLead = override?.catalog?.lead || null;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>
            {override?.hero?.eyebrow || "Categoria"}
          </span>
          <h1 className={styles.title}>{heroTitle}</h1>
          {heroDescription ? (
            <p className={styles.description}>{heroDescription}</p>
          ) : null}
          {heroBenefits.length ? (
            <div className={styles.benefits}>
              {heroBenefits.map((benefit) => (
                <span className={styles.benefit} key={benefit}>
                  {benefit}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {override?.lightConfigurator?.enabled ? (
          <LightConfigurator
            targetSlug={featuredProduct?.slug ?? null}
            productName={featuredProduct?.name ?? null}
            minWidthCm={featuredProduct?.min_width_cm ?? null}
            maxWidthCm={featuredProduct?.max_width_cm ?? null}
            minHeightCm={featuredProduct?.min_height_cm ?? null}
            maxHeightCm={featuredProduct?.max_height_cm ?? null}
          />
        ) : null}
      </header>

      {override?.quickLinks?.length ? (
        <nav aria-label="Navegacion rapida" className={styles.quickNav}>
          {override.quickLinks.map((item) => (
            <a className={styles.quickNavLink} href={`#${item.id}`} key={item.id}>
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}

      <section className={styles.section} id="catalogo">
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{catalogTitle}</h2>
          {catalogLead ? <p className={styles.sectionLead}>{catalogLead}</p> : null}
        </header>

        {!products.length ? (
          <p className={styles.emptyState}>No hay productos publicados en esta categoria.</p>
        ) : (
          <section className={styles.catalogGrid}>
          {products.map((product) => (
            <article
              key={product.id}
              className={styles.productCard}
            >
              {product.image ? (
                <img
                  alt={product.name}
                  src={product.image}
                  className={styles.productImage}
                />
              ) : null}

              <div className={styles.productBody}>
                <h3 className={styles.productTitle}>{product.name}</h3>
                {product.description ? <p>{product.description}</p> : null}
                <Link className={styles.productLink} href={`/productos/${product.slug}`}>
                  Ver producto
                </Link>
              </div>
            </article>
          ))}
          </section>
        )}
      </section>

      {override?.howToChoose ? (
        <section className={styles.section} id="como-elegir">
          <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{override.howToChoose.title}</h2>
            {override.howToChoose.lead ? (
              <p className={styles.sectionLead}>{override.howToChoose.lead}</p>
            ) : null}
          </header>
          <div className={styles.infoGrid}>
            {override.howToChoose.cards.map((card) => (
              <article className={styles.infoCard} key={card.title}>
                <h3 className={styles.infoCardTitle}>{card.title}</h3>
                <p className={styles.infoCardText}>{card.text}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {relatedCategories.length ? (
        <section className={styles.section} id="categorias-relacionadas">
          <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              {override?.relatedCategories?.title || "Categorias relacionadas"}
            </h2>
          </header>
          <div className={styles.relatedGrid}>
            {relatedCategories.map((relatedCategory) => (
              <Link
                className={styles.relatedCard}
                href={`/${relatedCategory.slug}`}
                key={relatedCategory.id}
              >
                <span className={styles.relatedTitle}>{relatedCategory.name}</span>
                <span className={styles.relatedText}>
                  {relatedCategory.description || "Explora esta categoria del catalogo."}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {override?.seoFooter ? (
        <section className={styles.section} id="informacion">
          <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{override.seoFooter.title}</h2>
            {override.seoFooter.lead ? (
              <p className={styles.sectionLead}>{override.seoFooter.lead}</p>
            ) : null}
          </header>
          <div className={styles.seoBody}>
            {override.seoFooter.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ) : null}

      {override?.faq ? (
        <section className={styles.section} id="faq">
          <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{override.faq.title}</h2>
          </header>
          <div className={styles.faqList}>
            {override.faq.items.map((item) => (
              <article className={styles.faqItem} key={item.question}>
                <h3 className={styles.faqQuestion}>{item.question}</h3>
                <p className={styles.faqAnswer}>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {override?.softCta ? (
        <section className={styles.softCta}>
          <div>
            <h2 className={styles.sectionTitle}>{override.softCta.title}</h2>
            <p className={styles.sectionLead}>{override.softCta.text}</p>
          </div>
          <Link className={styles.ctaLink} href={override.softCta.primaryHref}>
            {override.softCta.primaryLabel}
          </Link>
        </section>
      ) : null}
    </div>
  );
}
