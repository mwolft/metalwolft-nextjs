import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getApiUrl } from "@/lib/api"
import type { CatalogProduct } from "@/lib/catalog"

/* ---------- Fetch ---------- */

async function getProduct(slug: string): Promise<CatalogProduct | null> {
  const res = await fetch(
    getApiUrl(`/api/products/${slug}`),
    { cache: "no-store" }
  )

  if (res.status === 404) return null
  if (!res.ok) throw new Error("Failed to fetch product")

  return res.json()
}

/* ---------- SEO (SSR) ---------- */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) notFound()

  const title = product.seo?.title || product.name
  const description = product.seo?.description || undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
  }
}

/* ---------- Page ---------- */

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) notFound()

  return (
    <main>
      {product.image ? (
        <img
          alt={product.name}
          src={product.image}
          style={{
            display: "block",
            width: "100%",
            maxWidth: "640px",
            height: "auto",
            marginBottom: "1.5rem",
          }}
        />
      ) : null}

      <h1>{product.seo?.h1 || product.name}</h1>

      {product.description && <p>{product.description}</p>}

      <article
        dangerouslySetInnerHTML={{ __html: product.content ?? "" }}
      />
    </main>
  )
}
