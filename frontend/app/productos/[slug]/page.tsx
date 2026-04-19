import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import ProductDetailPage from "@/components/product/ProductDetailPage";
import {
  getProductBySlug,
  getProductMetadata,
  getProductPublicPath,
} from "@/lib/products";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return getProductMetadata(product);
}

export default async function LegacyProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const publicPath = getProductPublicPath(product);

  if (publicPath !== `/productos/${product.slug}`) {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(resolvedSearchParams)) {
      if (typeof value === "string") {
        query.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((item) => query.append(key, item));
      }
    }

    redirect(query.toString() ? `${publicPath}?${query.toString()}` : publicPath);
  }

  return <ProductDetailPage product={product} />;
}
