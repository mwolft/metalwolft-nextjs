"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { CLIENT_API_URL } from "@/lib/metalwolft";

type OrderStatusResponse = {
  order: {
    id: number;
    status: string;
    currency: string;
    summary: {
      total: string;
    };
    payments?: Array<{
      id: number;
      provider: string;
      status: string;
      amount: string;
      currency: string;
      external_id: string | null;
    }>;
  };
};

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const sessionId = searchParams.get("session_id");
  const [orderData, setOrderData] = useState<OrderStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const shouldPoll = useMemo(() => {
    if (!orderData?.order) {
      return false;
    }

    return orderData.order.status === "pending_payment";
  }, [orderData]);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError("No se ha recibido un pedido válido desde Stripe.");
      return;
    }

    let cancelled = false;

    async function loadOrder() {
      try {
        const res = await fetch(`${CLIENT_API_URL}/api/orders/${orderId}`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data?.error?.message ?? "No se pudo consultar el estado del pedido.",
          );
        }

        if (!cancelled) {
          setOrderData(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Error desconocido al consultar el pedido.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    if (!orderId || !shouldPoll) {
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`${CLIENT_API_URL}/api/orders/${orderId}`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();

        if (res.ok) {
          setOrderData(data);
        }
      } catch {
        // Dejamos el estado actual y permitimos reintento manual.
      }
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [orderId, shouldPoll, orderData]);

  const order = orderData?.order;
  const latestPayment = order?.payments?.[0] ?? null;
  const isPaid = order?.status === "paid";
  const isPending = order?.status === "pending_payment";
  const paymentProviderLabel =
    latestPayment?.provider === "stripe"
      ? "Stripe"
      : latestPayment?.provider === "bizum"
        ? "Bizum"
        : latestPayment?.provider === "transferencia"
          ? "Transferencia bancaria"
          : latestPayment?.provider ?? null;

  return (
    <main style={{ maxWidth: "760px", margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>{isPaid ? "Pedido pagado" : "Estado del pago"}</h1>

      {loading ? <p>Comprobando el estado real de tu pago...</p> : null}

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

      {!loading && order ? (
        <>
          <section
            style={{
              marginTop: "1rem",
              padding: "1rem",
              borderRadius: "16px",
              border: "1px solid #e5e5e5",
              background:
                isPaid
                  ? "#ecfdf5"
                  : isPending
                    ? "#eff6ff"
                    : "#fef2f2",
              color:
                isPaid
                  ? "#166534"
                  : isPending
                    ? "#1d4ed8"
                    : "#991b1b",
            }}
          >
            <strong>
              {isPaid
                ? "Pago confirmado"
                : isPending
                  ? "Pago pendiente de confirmación"
                  : "Estado de pago no confirmado"}
            </strong>
            <p style={{ margin: "0.5rem 0 0" }}>
              Pedido #{order.id}. Estado del pedido: {order.status}. Total:{" "}
              {order.summary.total} {order.currency}
            </p>
            {isPaid ? (
              <p style={{ margin: "0.5rem 0 0" }}>
                Hemos recibido tu pedido y el pago ha quedado confirmado
                correctamente. Te contactaremos si necesitamos algún dato
                adicional.
              </p>
            ) : null}
            {isPending ? (
              <p style={{ margin: "0.5rem 0 0" }}>
                Estamos esperando la confirmación del webhook de Stripe. Esta
                pantalla se actualizará automáticamente.
              </p>
            ) : null}
          </section>

          <section
            style={{
              marginTop: "1rem",
              padding: "1rem",
              borderRadius: "16px",
              border: "1px solid #e5e5e5",
              background: "#fff",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Detalles</h2>
            <p style={{ margin: "0.35rem 0" }}>Pedido: #{order.id}</p>
            <p style={{ margin: "0.35rem 0" }}>Total: {order.summary.total} {order.currency}</p>
            {sessionId ? (
              <p style={{ margin: "0.35rem 0" }}>Stripe session: {sessionId}</p>
            ) : null}
            {latestPayment ? (
              <>
                <p style={{ margin: "0.35rem 0" }}>
                  Pago #{latestPayment.id}
                </p>
                <p style={{ margin: "0.35rem 0" }}>
                  Estado del pago: {latestPayment.status}
                </p>
                {paymentProviderLabel ? (
                  <p style={{ margin: "0.35rem 0" }}>
                    Método de pago: {paymentProviderLabel}
                  </p>
                ) : null}
              </>
            ) : null}
          </section>
        </>
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
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "12px",
            border: "1px solid #d4d4d4",
            background: "#fff",
            cursor: "pointer",
          }}
          type="button"
        >
          Actualizar estado
        </button>
      </div>
    </main>
  );
}
