import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCategoryBySlug, getProductsByCategory } from "@/lib/categories";
import { getProductPublicPath } from "@/lib/products";

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
  const [category, products] = await Promise.all([
    getCategoryBySlug(categorySlug),
    getProductsByCategory(categorySlug),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Categoria</span>
        <h1 className={styles.title}>{category.name}</h1>
        {category.description ? (
          <p className={styles.description}>{category.description}</p>
        ) : null}
      </header>

      {!products.length ? (
        <p className={styles.emptyState}>No hay productos publicados en esta categoria.</p>
      ) : (
        <section className={styles.catalogGrid}>
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
                <h2 className={styles.productTitle}>{product.name}</h2>
                {product.description ? (
                  <p className={styles.productDescription}>{product.description}</p>
                ) : null}
                <Link className={styles.productLink} href={getProductPublicPath(product)}>
                  Ver producto
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
