import { getApiUrl } from "@/lib/api"
import type { CatalogProduct } from "@/lib/catalog"

async function getProducts(): Promise<CatalogProduct[]> {
  const res = await fetch(getApiUrl("/api/products/"), {
    cache: "no-store",
  })


  if (!res.ok) {
    throw new Error("Failed to fetch products")
  }

  return res.json()
}

export default async function ProductosPage() {
  const products = await getProducts()

  return (
    <main>
      <h1>Productos</h1>

      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <a href={`/productos/${product.slug}`}>
              <strong>{product.name}</strong>
            </a>
            {product.description && <p>{product.description}</p>}
          </li>
        ))}
      </ul>
    </main>
  )
}
