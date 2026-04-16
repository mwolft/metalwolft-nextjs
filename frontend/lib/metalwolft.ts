export const CLIENT_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type CartPricing = {
  unit_area_m2: string;
  unit_price_m2: string;
  unit_price_base: string;
  unit_shipping_surcharge: string;
  products_subtotal: string;
  shipping_base: string;
  shipping_surcharge: string;
  total: string;
};

export type CartItem = {
  id: number;
  product: {
    id: number;
    slug: string;
    name: string;
  };
  configuration: {
    width_cm: number;
    height_cm: number;
    quantity: number;
  };
  pricing: CartPricing;
  rules_applied: string[];
};

export type CartResponse = {
  cart_id: number;
  type: string;
  items: CartItem[];
  summary: {
    items_count: number;
    total_quantity: number;
    products_subtotal: string;
    shipping_base: string;
    shipping_surcharge: string;
    total: string;
  };
  rules_applied: string[];
  currency: string;
};

export type OrderResponse = {
  order: {
    id: number;
    status: string;
    currency: string;
    customer: {
      name: string;
      email: string;
      phone: string | null;
    };
    shipping_address: {
      name: string;
      address_line1: string;
      address_line2: string | null;
      city: string;
      postal_code: string;
      country: string;
    };
    summary: {
      products_subtotal: string;
      shipping_base: string;
      shipping_surcharge: string;
      total: string;
    };
    rules_applied: string[];
    payments: Array<{
      id: number;
      order_id: number;
      method: string;
      status: string;
      provider: string;
      provider_reference: string | null;
      amount: string;
    }>;
    items: CartItem[];
  };
};
