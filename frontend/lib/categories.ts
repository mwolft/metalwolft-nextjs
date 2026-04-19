import { getApiUrl } from "@/lib/api";
import type { CatalogCategory, CatalogProduct } from "@/lib/catalog";

export async function getCategories(): Promise<CatalogCategory[]> {
  const res = await fetch(getApiUrl("/api/categories/"), {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }

  return res.json();
}

export async function getCategoryBySlug(slug: string) {
  const categories = await getCategories();
  return categories.find((item) => item.slug === slug) ?? null;
}

export async function getProductsByCategory(
  slug: string,
): Promise<CatalogProduct[]> {
  const res = await fetch(getApiUrl(`/api/products/?category=${slug}`), {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch category products");
  }

  return res.json();
}
