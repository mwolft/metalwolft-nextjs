export type CatalogCategorySummary = {
  id: number;
  name: string;
  slug: string;
};

export type CatalogCategory = {
  id: number;
  name: string;
  slug: string;
  seo_title: string | null;
  seo_description: string | null;
  description: string | null;
  image_url: string | null;
  parent: CatalogCategorySummary | null;
  children_count: number;
};

export type CatalogProduct = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  price_m2: string | null;
  min_width_cm: number | null;
  max_width_cm: number | null;
  min_height_cm: number | null;
  max_height_cm: number | null;
  category: CatalogCategorySummary | null;
  image: string | null;
  flags: {
    featured: boolean;
    new: boolean;
  };
  seo: {
    title: string | null;
    description: string | null;
    h1: string | null;
  };
  content?: string;
};
