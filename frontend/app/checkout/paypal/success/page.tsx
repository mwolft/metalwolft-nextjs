"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { CLIENT_API_URL } from "@/lib/metalwolft";

type CaptureResponse = {
  order_status: string;
  provider_status: string;
  payment: {
    id: number;
    provider: string;
    status: string;
    external_id: string | null;
    amount: string;
    currency: string;
  };
};

export default function PaypalSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const paypalOrderId = searchParams.get("token");
  const [result, setResult] = useState<CaptureResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || !paypalOrderId) {
      setLoading(false);
      setError("No se ha recibido información válida de PayPal.");
      return;
    }

    let cancelled = false;

    async function capturePaypalPayment() {
      try {
        const res = await fetch(`${CLIENT_API_URL}/api/payments/paypal/capture`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            order_id: orderId,
            paypal_order_id: paypalOrderId,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data?.error?.message ?? "No se pudo confirmar el pago de PayPal.",
          );
        }

        if (!cancelled) {
          setResult(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Error desconocido al confirmar el pago.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void capturePaypalPayment();

    return () => {
      cancelled = true;
    };
  }, [orderId, paypalOrderId]);

  return (
    <main style={{ maxWidth: "760px", margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Pago con PayPal</h1>

      {loading ? <p>Confirmando el pago de PayPal...</p> : null}

      {!loading && error ? (
        <section
          style={{
            marginTop: "1rem",
            padding: "1rem",
            borderRadius: "16px",
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#991b1b",
          }}
        >
          <strong>No hemos podido confirmar el pago.</strong>
          <p style={{ margin: "0.5rem 0 0" }}>{error}</p>
        </section>
      ) : null}

      {!loading && result ? (
        <section
          style={{
            marginTop: "1rem",
            padding: "1rem",
            borderRadius: "16px",
            border: "1px solid #e5e5e5",
            background:
              result.order_status === "paid" ? "#ecfdf5" : "#eff6ff",
            color:
              result.order_status === "paid" ? "#166534" : "#1d4ed8",
          }}
        >
          <strong>
            {result.order_status === "paid"
              ? "Pago confirmado"
              : "Pago pendiente de confirmación"}
          </strong>
          <p style={{ margin: "0.5rem 0 0" }}>
            Pedido #{orderId}. Estado del pedido: {result.order_status}. Pago{" "}
            #{result.payment.id} - {result.payment.provider}.
          </p>
          <p style={{ margin: "0.5rem 0 0" }}>
            Estado proveedor: {result.provider_status}. Total: {result.payment.amount}{" "}
            {result.payment.currency}
          </p>
        </section>
      ) : null}

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "0.75rem 1rem",
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
            padding: "0.75rem 1rem",
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
    </main>
  );
}
