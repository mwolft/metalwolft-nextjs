"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CheckoutCancelPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <main style={{ maxWidth: "760px", margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Pago cancelado</h1>

      <section
        style={{
          marginTop: "1rem",
          padding: "1rem",
          borderRadius: "16px",
          border: "1px solid #fde68a",
          background: "#fffbeb",
          color: "#92400e",
        }}
      >
        <strong>No se ha completado el pago.</strong>
        <p style={{ margin: "0.5rem 0 0" }}>
          Tu pedido sigue sin pagar y puedes volver al checkout para reintentar.
        </p>
        {orderId ? (
          <p style={{ margin: "0.5rem 0 0" }}>Pedido relacionado: #{orderId}</p>
        ) : null}
      </section>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
        <Link
          href="/checkout"
          style={{
            display: "inline-block",
            padding: "0.75rem 1rem",
            background: "#111",
            color: "#fff",
            borderRadius: "12px",
            textDecoration: "none",
          }}
        >
          Volver al checkout
        </Link>
        <Link
          href="/carrito"
          style={{
            display: "inline-block",
            padding: "0.75rem 1rem",
            borderRadius: "12px",
            border: "1px solid #d4d4d4",
            background: "#fff",
            color: "#111",
            textDecoration: "none",
          }}
        >
          Volver al carrito
        </Link>
      </div>
    </main>
  );
}
