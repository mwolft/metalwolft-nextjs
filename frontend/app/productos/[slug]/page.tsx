import { Metadata } from "next"
import { notFound } from "next/navigation"

type Product = {
  id: number
  slug: string
  name: string
  category: string
  description: string | null
  content: string
  seo?: {
    title: string | null
    description: string | null
    h1: string | null
  }
}

/* ---------- Fetch ---------- */

async function getProduct(slug: string): Promise<Product | null> {
  const res = await fetch(
    `http://localhost:3001/api/products/${slug}`,
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
      <h1>{product.seo?.h1 || product.name}</h1>

      {product.description && <p>{product.description}</p>}

      <article
        dangerouslySetInnerHTML={{ __html: product.content }}
      />
    </main>
  )
}
