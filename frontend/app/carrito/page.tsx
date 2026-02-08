import { apiFetch } from "@/lib/api";

export default async function CarritoPage() {
  const res = await apiFetch("/api/cart");
  const data = await res.json();

  return (
    <main>
      <h1>Carrito</h1>
      <p>ID: {data.cart_id}</p>
      <p>Tipo: {data.type}</p>
    </main>
  );
}
