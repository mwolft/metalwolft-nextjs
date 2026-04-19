import type { Metadata } from "next";

import { getApiUrl } from "@/lib/api";
import type { CatalogProduct } from "@/lib/catalog";
import { getAbsoluteUrl } from "@/lib/site";

export async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const res = await fetch(getApiUrl(`/api/products/${slug}`), {
    cache: "no-store",
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error("Failed to fetch product");
  }

  return res.json();
}

export function getProductPublicPath(product: CatalogProduct) {
  if (product.category?.slug) {
    return `/${product.category.slug}/${product.slug}`;
  }

  return `/productos/${product.slug}`;
}

export function getProductMetadataTitle(product: CatalogProduct) {
  return product.seo?.title || product.name;
}

export function getProductMetadataDescription(product: CatalogProduct) {
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

export function getProductMetadata(product: CatalogProduct): Metadata {
  const title = getProductMetadataTitle(product);
  const description = getProductMetadataDescription(product);
  const canonicalPath = getProductPublicPath(product);
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

export function getProductBreadcrumbSchema(product: CatalogProduct) {
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
      item: getAbsoluteUrl(`/${product.category.slug}`),
    });
  }

  items.push({
    "@type": "ListItem",
    position: product.category ? 3 : 2,
    name: product.name,
    item: getAbsoluteUrl(getProductPublicPath(product)),
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

export function getProductSchema(product: CatalogProduct) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: getProductMetadataDescription(product),
    url: getAbsoluteUrl(getProductPublicPath(product)),
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
