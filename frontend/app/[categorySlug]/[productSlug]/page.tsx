import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProductDetailPage from "@/components/product/ProductDetailPage";
import {
  getProductBySlug,
  getProductMetadata,
} from "@/lib/products";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string; productSlug: string }>;
}): Promise<Metadata> {
  const { categorySlug, productSlug } = await params;
  const product = await getProductBySlug(productSlug);

  if (!product || product.category?.slug !== categorySlug) {
    notFound();
  }

  return getProductMetadata(product);
}

export default async function PublicProductPage({
  params,
}: {
  params: Promise<{ categorySlug: string; productSlug: string }>;
}) {
  const { categorySlug, productSlug } = await params;
  const product = await getProductBySlug(productSlug);

  if (!product || product.category?.slug !== categorySlug) {
    notFound();
  }

  return <ProductDetailPage product={product} />;
}
