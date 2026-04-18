"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import OrderSuccessSummary from "@/components/checkout/OrderSuccessSummary";
import { CLIENT_API_URL, type OrderResponse } from "@/lib/metalwolft";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const sessionId = searchParams.get("session_id");
  const [orderData, setOrderData] = useState<OrderResponse | null>(null);
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
      setError("No se ha recibido un pedido valido.");
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

  const order = orderData?.order ?? null;
  const latestPayment = order?.payments?.[0] ?? null;

  return (
    <OrderSuccessSummary
      loading={loading}
      error={error}
      order={order}
      pendingMessage="Estamos terminando de confirmar el pago. Esta pagina se actualizara automaticamente en unos segundos."
      technicalDetails={
        order || sessionId ? (
          <>
            {sessionId ? <p style={{ margin: "0 0 0.35rem" }}>Stripe session: {sessionId}</p> : null}
            {latestPayment ? (
              <>
                <p style={{ margin: "0 0 0.35rem" }}>Pago interno: #{latestPayment.id}</p>
                <p style={{ margin: "0 0 0.35rem" }}>Estado del pago: {latestPayment.status}</p>
                {latestPayment.reference ? (
                  <p style={{ margin: "0 0 0.35rem" }}>Referencia: {latestPayment.reference}</p>
                ) : null}
                {latestPayment.external_id ? (
                  <p style={{ margin: "0 0 0.35rem" }}>ID externo: {latestPayment.external_id}</p>
                ) : null}
              </>
            ) : null}
          </>
        ) : null
      }
    />
  );
}
