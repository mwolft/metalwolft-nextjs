import Link from "next/link";

import { getApiUrl } from "@/lib/api";
import type { CatalogCategory } from "@/lib/catalog";

export const metadata = {
  title: "Rejas para ventanas a medida",
  description:
    "Rejas para ventanas a medida fabricadas en metal. Modelos fijos, abatibles y correderos, fabricados en España.",
  openGraph: {
    type: "website",
  },
};

async function getCategories(): Promise<CatalogCategory[]> {
  const res = await fetch(getApiUrl("/api/categories/"), {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }

  return res.json();
}

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <section
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2rem 1rem",
      }}
    >
      <h1>Rejas para ventanas a medida</h1>

      <p>
        Fabricamos rejas para ventanas a medida, combinando seguridad, diseño y
        fabricación artesanal en metal.
      </p>

      <section
        style={{
          marginTop: "2rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {categories.map((category) => (
          <article
            key={category.id}
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: "16px",
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {category.image_url ? (
              <img
                alt={category.name}
                src={category.image_url}
                style={{
                  width: "100%",
                  height: "180px",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : null}

            <div style={{ padding: "1rem" }}>
              <h2 style={{ marginTop: 0 }}>{category.name}</h2>

              {category.description ? (
                <p>{category.description}</p>
              ) : null}

              <Link href={`/categorias/${category.slug}`}>
                Ver categoría
              </Link>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
