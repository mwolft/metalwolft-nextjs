import Link from "next/link";
import { notFound } from "next/navigation";

import { getCategoryBySlug, getProductsByCategory } from "@/lib/categories";

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [category, products] = await Promise.all([
    getCategoryBySlug(slug),
    getProductsByCategory(slug),
  ]);

  if (!category && products.length === 0) {
    notFound();
  }

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1>{category?.name ?? slug}</h1>
        {category?.description ? <p>{category.description}</p> : null}
      </header>

      {!products.length ? (
        <p>No hay productos publicados en esta categoría.</p>
      ) : (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {products.map((product) => (
            <article
              key={product.id}
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: "16px",
                overflow: "hidden",
                background: "#fff",
              }}
            >
              {product.image ? (
                <img
                  alt={product.name}
                  src={product.image}
                  style={{
                    width: "100%",
                    height: "180px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : null}

              <div style={{ padding: "1rem" }}>
                <h2 style={{ marginTop: 0 }}>{product.name}</h2>
                {product.description ? <p>{product.description}</p> : null}
                <Link href={`/productos/${product.slug}`}>Ver producto</Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
