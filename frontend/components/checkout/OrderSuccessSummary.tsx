"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { getAnchoringLabel, getColorLabel } from "@/lib/productConfiguration";
import type { OrderResponse } from "@/lib/metalwolft";

type OrderSuccessSummaryProps = {
  loading: boolean;
  error: string | null;
  order: OrderResponse["order"] | null;
  pendingMessage?: string | null;
  technicalDetails?: ReactNode;
};

function getPaymentProviderLabel(provider: string | null | undefined) {
  if (!provider) {
    return null;
  }

  switch (provider) {
    case "stripe":
      return "Stripe";
    case "paypal":
      return "PayPal";
    case "bizum":
      return "Bizum";
    case "transferencia":
    case "bank_transfer":
      return "Transferencia bancaria";
    default:
      return provider;
  }
}

export default function OrderSuccessSummary({
  loading,
  error,
  order,
  pendingMessage,
  technicalDetails,
}: OrderSuccessSummaryProps) {
  const latestPayment = order?.payments?.[0] ?? null;
  const isPaid = order?.status === "paid";
  const isPending = order?.status === "pending_payment";
  const pageTitle = isPaid ? "Pago confirmado" : "Pedido recibido";
  const heroTitle = isPaid ? "Tu pedido ya esta confirmado" : "Tu pedido se ha recibido correctamente";
  const heroMessage = isPaid
    ? "Hemos confirmado el pago y ya podemos revisar tu pedido para prepararlo y pasarlo a fabricacion."
    : "Hemos recibido tu pedido y estamos terminando de confirmar el pago. Si hiciera falta algun dato adicional, te contactaremos.";
  const paymentLabel = getPaymentProviderLabel(latestPayment?.provider);

  return (
    <main style={{ maxWidth: "920px", margin: "0 auto", padding: "2rem 1rem 3rem" }}>
      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "24px",
          background: "#ffffff",
          padding: "1.5rem",
          boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: "0.35rem 0.75rem",
            borderRadius: "999px",
            background: isPaid ? "#dcfce7" : "#dbeafe",
            color: isPaid ? "#166534" : "#1d4ed8",
            fontSize: "0.85rem",
            fontWeight: 700,
          }}
        >
          {pageTitle}
        </div>

        <h1 style={{ margin: "1rem 0 0.5rem", fontSize: "2rem", lineHeight: 1.1 }}>
          {heroTitle}
        </h1>
        <p style={{ margin: 0, maxWidth: "60ch", color: "#525252", lineHeight: 1.6 }}>
          {heroMessage}
        </p>

        {loading ? (
          <p style={{ marginTop: "1rem", color: "#525252" }}>
            Estamos comprobando los datos finales de tu pedido...
          </p>
        ) : null}

        {!loading && error && !order ? (
          <section
            style={{
              marginTop: "1rem",
              padding: "1rem",
              borderRadius: "18px",
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#991b1b",
            }}
          >
            <strong>No hemos podido cargar el resumen final del pedido.</strong>
            <p style={{ margin: "0.5rem 0 0" }}>{error}</p>
          </section>
        ) : null}

        {!loading && order ? (
          <>
            <section
              style={{
                marginTop: "1.5rem",
                display: "grid",
                gap: "1rem",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "18px",
                  background: "#fafaf9",
                  padding: "1rem",
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "#737373", textTransform: "uppercase" }}>
                  Numero de pedido
                </div>
                <div style={{ marginTop: "0.35rem", fontSize: "1.4rem", fontWeight: 700 }}>
                  #{order.id}
                </div>
              </div>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "18px",
                  background: "#fafaf9",
                  padding: "1rem",
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "#737373", textTransform: "uppercase" }}>
                  Total
                </div>
                <div style={{ marginTop: "0.35rem", fontSize: "1.4rem", fontWeight: 700 }}>
                  {order.summary.total} {order.currency}
                </div>
              </div>
            </section>

            <section
              style={{
                marginTop: "1.25rem",
                padding: "1.25rem",
                borderRadius: "18px",
                border: "1px solid #e5e7eb",
                background: "#ffffff",
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Resumen del pedido</h2>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {order.items.map((item) => (
                  <article
                    key={item.id}
                    style={{
                      padding: "1rem",
                      borderRadius: "16px",
                      border: "1px solid #e5e7eb",
                      background: "#fafaf9",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#171717" }}>
                      {item.product.name}
                    </div>
                    <div style={{ marginTop: "0.35rem", color: "#525252", lineHeight: 1.6 }}>
                      {item.configuration.width_cm} x {item.configuration.height_cm} cm
                    </div>
                    <div style={{ color: "#525252", lineHeight: 1.6 }}>
                      Cantidad: {item.configuration.quantity}
                    </div>
                    <div style={{ color: "#525252", lineHeight: 1.6 }}>
                      Anclaje: {getAnchoringLabel(item.configuration.anchoring_type)}
                    </div>
                    <div style={{ color: "#525252", lineHeight: 1.6 }}>
                      Color: {getColorLabel(item.configuration.color)}
                    </div>
                  </article>
                ))}
              </div>

              <div
                style={{
                  marginTop: "1rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid #e5e7eb",
                  display: "grid",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <span style={{ color: "#525252" }}>Productos</span>
                  <strong>{order.summary.products_subtotal} {order.currency}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <span style={{ color: "#525252" }}>Envio base</span>
                  <strong>{order.summary.shipping_base} {order.currency}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <span style={{ color: "#525252" }}>Recargos de envio</span>
                  <strong>{order.summary.shipping_surcharge} {order.currency}</strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    marginTop: "0.25rem",
                    paddingTop: "0.75rem",
                    borderTop: "1px solid #e5e7eb",
                    fontSize: "1.05rem",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>Total</span>
                  <strong>{order.summary.total} {order.currency}</strong>
                </div>
              </div>
            </section>

            <section
              style={{
                marginTop: "1.25rem",
                padding: "1.25rem",
                borderRadius: "18px",
                border: "1px solid #e5e7eb",
                background: isPaid ? "#f0fdf4" : "#eff6ff",
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Que pasa ahora</h2>
              <p style={{ margin: 0, color: "#404040", lineHeight: 1.7 }}>
                Revisaremos tu pedido para confirmar medidas, configuracion y prepararlo para fabricacion.
                Si necesitamos aclarar algun detalle, te contactaremos en <strong>{order.customer.email}</strong>.
              </p>
              <p style={{ margin: "0.75rem 0 0", color: "#404040", lineHeight: 1.7 }}>
                {isPending
                  ? pendingMessage ?? "El pedido ya esta registrado. En cuanto el pago quede confirmado, seguiremos con el siguiente paso."
                  : "A partir de aqui nuestro equipo revisa el pedido y te contactara si falta algun dato antes de fabricar."}
              </p>
              {paymentLabel ? (
                <p style={{ margin: "0.75rem 0 0", color: "#525252" }}>
                  Metodo de pago: {paymentLabel}
                </p>
              ) : null}
            </section>

            {technicalDetails ? (
              <details
                style={{
                  marginTop: "1rem",
                  padding: "1rem 1.1rem",
                  borderRadius: "16px",
                  border: "1px solid #e5e7eb",
                  background: "#fafafa",
                }}
              >
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  Informacion tecnica del pago
                </summary>
                <div style={{ marginTop: "0.75rem", color: "#525252", lineHeight: 1.6 }}>
                  {technicalDetails}
                </div>
              </details>
            ) : null}
          </>
        ) : null}

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "0.85rem 1.1rem",
              background: "#111",
              color: "#fff",
              borderRadius: "12px",
              textDecoration: "none",
            }}
          >
            Volver al inicio
          </Link>
          <Link
            href="/productos"
            style={{
              display: "inline-block",
              padding: "0.85rem 1.1rem",
              borderRadius: "12px",
              border: "1px solid #d4d4d4",
              background: "#fff",
              color: "#111",
              textDecoration: "none",
            }}
          >
            Seguir comprando
          </Link>
        </div>
      </section>
    </main>
  );
}
