type Product = {
  id: number
  slug: string
  name: string
  category: string
  description: string | null
  image: string | null
  flags: {
    featured: boolean
    new: boolean
  }
}

async function getProducts(): Promise<Product[]> {
const res = await fetch("http://localhost:3001/api/products/", {
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
