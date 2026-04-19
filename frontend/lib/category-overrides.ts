import type { CatalogCategory, CatalogProduct } from "@/lib/catalog";

export type CategoryFaqItem = {
  question: string;
  answer: string;
};

export type CategoryTextCard = {
  title: string;
  text: string;
};

export type CategoryOverride = {
  hero?: {
    eyebrow?: string;
    title?: string;
    description?: string;
    benefits?: string[];
  };
  catalog?: {
    title?: string;
    lead?: string;
  };
  lightConfigurator?: {
    enabled?: boolean;
    featuredProductSlug?: string;
  };
  quickLinks?: Array<{
    id: string;
    label: string;
  }>;
  howToChoose?: {
    title: string;
    lead?: string;
    cards: CategoryTextCard[];
  };
  relatedCategories?: {
    title: string;
    slugs: string[];
  };
  seoFooter?: {
    title: string;
    lead?: string;
    body: string[];
  };
  faq?: {
    title: string;
    items: CategoryFaqItem[];
  };
  softCta?: {
    title: string;
    text: string;
    primaryHref: string;
    primaryLabel: string;
  };
};

export const categoryOverrides: Record<string, CategoryOverride> = {
  "rejas-para-ventanas": {
    hero: {
      eyebrow: "Categoria comercial",
      title: "Rejas para ventanas a medida",
      description:
        "Explora modelos pensados para proteger ventanas con una lectura clara del catalogo, contexto util para elegir y acceso rapido a una ficha de producto real.",
      benefits: [
        "Fabricacion a medida",
        "Catalogo visible desde el inicio",
        "Paso directo a ficha con configurador",
      ],
    },
    catalog: {
      title: "Modelos disponibles para esta categoria",
      lead:
        "Empieza por el catalogo. Desde aqui puedes comparar modelos y despues continuar la configuracion completa en la ficha de producto.",
    },
    quickLinks: [
      { id: "catalogo", label: "Catalogo" },
      { id: "como-elegir", label: "Como elegir" },
      { id: "categorias-relacionadas", label: "Categorias relacionadas" },
      { id: "informacion", label: "Informacion" },
      { id: "faq", label: "FAQ" },
    ],
    howToChoose: {
      title: "Como elegir una reja para ventana",
      lead:
        "Antes de decidir un modelo conviene revisar tres factores basicos: medidas, sistema de instalacion y presencia visual.",
      cards: [
        {
          title: "Medidas reales del hueco",
          text:
            "La anchura y la altura condicionan tanto el modelo adecuado como el precio final de la reja.",
        },
        {
          title: "Tipo de anclaje",
          text:
            "No es lo mismo una instalacion sin obra que una fijacion con garras o pletinas. Elegir bien este punto evita errores.",
        },
        {
          title: "Estilo y color",
          text:
            "La reja debe cumplir una funcion de seguridad, pero tambien integrarse visualmente con la ventana y la fachada.",
        },
      ],
    },
    relatedCategories: {
      title: "Categorias relacionadas",
      slugs: [],
    },
    seoFooter: {
      title: "Rejas para ventanas: seguridad, medida y configuracion clara",
      lead:
        "Esta categoria esta pensada para quienes buscan una solucion clara y comercial antes de entrar en el detalle del configurador.",
      body: [
        "Una reja para ventana a medida no se elige solo por la imagen del producto. Tambien influyen el hueco real, el tipo de anclaje y la integracion visual en la vivienda.",
        "Por eso esta pagina muestra primero el catalogo disponible y despues ofrece contenido de apoyo para ayudarte a entender mejor el producto antes de pasar a la ficha completa.",
      ],
    },
    faq: {
      title: "Preguntas frecuentes sobre rejas para ventanas",
      items: [
        {
          question: "Puedo calcular el precio final desde esta categoria?",
          answer:
            "Aqui puedes iniciar el proceso y ver el catalogo, pero el precio final se calcula en la ficha de producto con la configuracion completa.",
        },
        {
          question: "Todas las rejas son a medida?",
          answer:
            "La compra esta pensada para introducir medidas reales y terminar la configuracion en una ficha de producto preparada para ello.",
        },
        {
          question: "Que hago si no se que anclaje necesito?",
          answer:
            "Puedes revisar primero el catalogo y pasar a la ficha para comparar opciones de instalacion con mas contexto.",
        },
      ],
    },
    softCta: {
      title: "Prefieres pasar directamente a una ficha de producto?",
      text:
        "Si ya tienes una idea clara de las medidas, puedes entrar en un modelo y continuar con la configuracion completa.",
      primaryHref: "/productos",
      primaryLabel: "Ver todos los productos",
    },
  },
};

export function getCategoryOverride(slug: string) {
  return categoryOverrides[slug] ?? null;
}

export function getOverrideFeaturedProduct(
  products: CatalogProduct[],
  override: CategoryOverride | null,
) {
  if (!override?.lightConfigurator?.featuredProductSlug) {
    return products[0] ?? null;
  }

  return (
    products.find((product) => product.slug === override.lightConfigurator?.featuredProductSlug) ??
    products[0] ??
    null
  );
}

export function getOverrideRelatedCategories(
  categories: CatalogCategory[],
  currentSlug: string,
  override: CategoryOverride | null,
) {
  if (override?.relatedCategories?.slugs?.length) {
    return override.relatedCategories.slugs
      .map((slug) => categories.find((category) => category.slug === slug) ?? null)
      .filter((category): category is CatalogCategory => Boolean(category));
  }

  return categories
    .filter((category) => category.slug !== currentSlug)
    .slice(0, 3);
}
