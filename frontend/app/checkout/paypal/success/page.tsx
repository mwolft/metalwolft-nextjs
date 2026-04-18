"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import OrderSuccessSummary from "@/components/checkout/OrderSuccessSummary";
import { CLIENT_API_URL, type OrderResponse } from "@/lib/metalwolft";

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
  const [orderData, setOrderData] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || !paypalOrderId) {
      setLoading(false);
      setError("No se ha recibido informacion valida de PayPal.");
      return;
    }

    let cancelled = false;

    async function capturePaypalPayment() {
      try {
        const captureRes = await fetch(`${CLIENT_API_URL}/api/payments/paypal/capture`, {
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
        const captureData = await captureRes.json();

        if (!captureRes.ok) {
          throw new Error(
            captureData?.error?.message ?? "No se pudo confirmar el pago de PayPal.",
          );
        }

        const orderRes = await fetch(`${CLIENT_API_URL}/api/orders/${orderId}`, {
          credentials: "include",
          cache: "no-store",
        });
        const orderPayload = await orderRes.json();

        if (!orderRes.ok) {
          throw new Error(
            orderPayload?.error?.message ?? "No se pudo cargar el resumen del pedido.",
          );
        }

        if (!cancelled) {
          setResult(captureData);
          setOrderData(orderPayload);
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

  const order = orderData?.order ?? null;

  return (
    <OrderSuccessSummary
      loading={loading}
      error={error}
      order={order}
      pendingMessage="Estamos terminando de confirmar el cobro con PayPal. Si el estado tarda un poco en actualizarse, no hace falta repetir el pago."
      technicalDetails={
        result ? (
          <>
            <p style={{ margin: "0 0 0.35rem" }}>Estado proveedor: {result.provider_status}</p>
            <p style={{ margin: "0 0 0.35rem" }}>Pago interno: #{result.payment.id}</p>
            <p style={{ margin: "0 0 0.35rem" }}>Estado del pago: {result.payment.status}</p>
            {result.payment.external_id ? (
              <p style={{ margin: "0 0 0.35rem" }}>ID externo: {result.payment.external_id}</p>
            ) : null}
          </>
        ) : null
      }
    />
  );
}
