"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { CLIENT_API_URL, CartResponse } from "@/lib/metalwolft";

type SessionState =
  | { status: "loading"; user: null }
  | { status: "anonymous"; user: null }
  | { status: "authenticated"; user: { email?: string | null } };

type CheckoutFormState = {
  fullName: string;
  phone: string;
  addressLine1: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
};

type CheckoutFormErrors = Partial<Record<keyof CheckoutFormState, string>>;
type CheckoutStep = "details" | "review";
type PaymentMethod = "stripe" | "paypal" | "bizum" | "bank_transfer" | null;
type ManualInstructions = {
  account_holder: string;
  iban: string;
  reference: string;
  message: string;
};

function getPaymentMethodLabel(paymentMethod: Exclude<PaymentMethod, null>) {
  switch (paymentMethod) {
    case "stripe":
      return "Stripe";
    case "paypal":
      return "PayPal";
    case "bank_transfer":
      return "Transferencia bancaria";
    case "bizum":
      return "Bizum";
    default:
      return paymentMethod;
  }
}

export default function CheckoutPage() {
  const [session, setSession] = useState<SessionState>({
    status: "loading",
    user: null,
  });
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [form, setForm] = useState<CheckoutFormState>({
    fullName: "",
    phone: "",
    addressLine1: "",
    city: "",
    province: "",
    postalCode: "",
    country: "España",
  });
  const [formErrors, setFormErrors] = useState<CheckoutFormErrors>({});
  const [step, setStep] = useState<CheckoutStep>("details");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<{
    orderId: number;
    status: string;
    paymentMethod: Exclude<PaymentMethod, null>;
  } | null>(null);
  const [paymentFlowState, setPaymentFlowState] = useState<{
    provider: Exclude<PaymentMethod, null>;
    paymentId?: number;
    status: string;
    externalId?: string | null;
    reference?: string | null;
  } | null>(null);
  const [manualInstructions, setManualInstructions] = useState<ManualInstructions | null>(null);
  const confirmKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const res = await fetch(`${CLIENT_API_URL}/api/profile`, {
          credentials: "include",
        });

        if (cancelled) {
          return;
        }

        if (res.status === 401) {
          setSession({ status: "anonymous", user: null });
          return;
        }

        if (!res.ok) {
          throw new Error("No se pudo comprobar la sesion del usuario.");
        }

        const user = await res.json();
        setSession({ status: "authenticated", user });
      } catch {
        if (!cancelled) {
          setSession({ status: "anonymous", user: null });
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (session.status !== "authenticated") {
      return;
    }

    let cancelled = false;
    setCartLoading(true);
    setCartError(null);

    async function loadCart() {
      try {
        const res = await fetch(`${CLIENT_API_URL}/api/cart`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error?.message ?? "No se pudo cargar el carrito.");
        }

        if (!cancelled) {
          setCart(data);
        }
      } catch (err) {
        if (!cancelled) {
          setCartError(
            err instanceof Error ? err.message : "Error desconocido al cargar el carrito.",
          );
        }
      } finally {
        if (!cancelled) {
          setCartLoading(false);
        }
      }
    }

    void loadCart();

    return () => {
      cancelled = true;
    };
  }, [session.status]);

  function updateField(field: keyof CheckoutFormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setFormErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
    setPaymentMessage(null);
    setSubmitError(null);
    setSubmitSuccess(null);
    setPaymentFlowState(null);
    setManualInstructions(null);
    confirmKeyRef.current = null;
  }

  function validateForm(values: CheckoutFormState) {
    const errors: CheckoutFormErrors = {};

    if (!values.fullName.trim()) {
      errors.fullName = "Introduce tu nombre completo.";
    }

    if (!values.phone.trim()) {
      errors.phone = "Introduce tu teléfono.";
    }

    if (!values.addressLine1.trim()) {
      errors.addressLine1 = "Introduce tu dirección.";
    }

    if (!values.city.trim()) {
      errors.city = "Introduce tu ciudad.";
    }

    if (!values.province.trim()) {
      errors.province = "Introduce tu provincia.";
    }

    if (!values.postalCode.trim()) {
      errors.postalCode = "Introduce tu código postal.";
    }

    if (!values.country.trim()) {
      errors.country = "Introduce tu país.";
    }

    return errors;
  }

  function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateForm(form);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setPaymentMessage(null);
      return;
    }

    setFormErrors({});
    setStep("review");
  }

  function renderCartSummary() {
    if (cartLoading) {
      return <p>Cargando carrito...</p>;
    }

    if (cartError) {
      return <p style={{ color: "#b91c1c" }}>{cartError}</p>;
    }

    if (!cart || !cart.items.length) {
      return (
        <>
          <p>Tu carrito esta vacio. Anade productos antes de continuar.</p>
          <Link
            href="/productos"
            style={{
              display: "inline-block",
              marginTop: "0.75rem",
              padding: "0.75rem 1rem",
              background: "#111",
              color: "#fff",
              borderRadius: "12px",
              textDecoration: "none",
            }}
          >
            Volver a la tienda
          </Link>
        </>
      );
    }

    return (
      <>
        <div style={{ display: "grid", gap: "1rem" }}>
          {cart.items.map((item) => (
            <article
              key={item.id}
              style={{
                paddingBottom: "1rem",
                borderBottom: "1px solid #ededed",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  alignItems: "start",
                }}
              >
                <div>
                  <h3 style={{ margin: 0 }}>{item.product.name}</h3>
                  <p style={{ margin: "0.35rem 0 0", color: "#525252" }}>
                    {item.configuration.width_cm} x {item.configuration.height_cm} cm
                  </p>
                  <p style={{ margin: "0.35rem 0 0", color: "#525252" }}>
                    Cantidad: {item.configuration.quantity}
                  </p>
                </div>
                <strong>
                  {item.pricing.total} {cart.currency}
                </strong>
              </div>
            </article>
          ))}
        </div>

        <dl
          style={{
            display: "grid",
            gap: "0.75rem",
            marginTop: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
            <dt>Subtotal productos</dt>
            <dd style={{ margin: 0 }}>
              {cart.summary.products_subtotal} {cart.currency}
            </dd>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
            <dt>Envio base</dt>
            <dd style={{ margin: 0 }}>
              {cart.summary.shipping_base} {cart.currency}
            </dd>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
            <dt>Recargos</dt>
            <dd style={{ margin: 0 }}>
              {cart.summary.shipping_surcharge} {cart.currency}
            </dd>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
              paddingTop: "0.75rem",
              borderTop: "1px solid #ededed",
              fontWeight: 700,
            }}
          >
            <dt>Total</dt>
            <dd style={{ margin: 0 }}>
              {cart.summary.total} {cart.currency}
            </dd>
          </div>
        </dl>
      </>
    );
  }

  function getConfirmIdempotencyKey() {
    if (!confirmKeyRef.current) {
      confirmKeyRef.current =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `checkout-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    return confirmKeyRef.current;
  }

  async function handleCheckoutConfirm() {
    if (paymentMethod === null) {
      setSubmitError("Selecciona un método de pago para continuar.");
      setSubmitSuccess(null);
      return;
    }

    setSubmitLoading(true);
    setSubmitError(null);
    setPaymentMessage(null);
    setPaymentFlowState(null);
    setManualInstructions(null);

    try {
      const payload = {
        idempotency_key: getConfirmIdempotencyKey(),
        customer_email: session.status === "authenticated" ? session.user.email ?? "" : "",
        shipping_name: form.fullName,
        shipping_address_line1: form.addressLine1,
        shipping_city: form.city,
        shipping_postal_code: form.postalCode,
        shipping_country: form.country,
      };

      const res = await fetch(`${CLIENT_API_URL}/api/checkout/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error?.message ?? "No se pudo preparar el pedido para el pago.",
        );
      }

      setSubmitSuccess({
        orderId: data.order_id,
        status:
          paymentMethod === "bank_transfer" ? "pendiente de transferencia" : data.status,
        paymentMethod,
      });

      if (
        paymentMethod === "stripe" ||
        paymentMethod === "paypal" ||
        paymentMethod === "bank_transfer"
      ) {
        const paymentRes = await fetch(`${CLIENT_API_URL}/api/payments/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            order_id: data.order_id,
            provider: paymentMethod,
          }),
        });
        const paymentData = await paymentRes.json();

        if (!paymentRes.ok) {
          throw new Error(
            paymentData?.error?.message ??
              `No se pudo iniciar el pago con ${paymentMethod}.`,
          );
        }

        setPaymentFlowState({
          provider: paymentMethod,
          paymentId: paymentData.payment?.id,
          status: paymentData.payment?.status ?? "pending",
          externalId: paymentData.payment?.external_id ?? null,
          reference: paymentData.payment?.reference ?? null,
        });

        if (paymentMethod === "bank_transfer") {
          if (paymentData.provider_payload?.type !== "manual_instructions") {
            throw new Error(
              "La respuesta de transferencia bancaria no incluye instrucciones manuales.",
            );
          }

          setManualInstructions(paymentData.provider_payload.instructions ?? null);
          setPaymentMessage(
            "Hemos recibido tu pedido, pero sigue pendiente de transferencia. Usa la referencia indicada y validaremos el pago manualmente.",
          );
          return;
        }

        setPaymentMessage(
          paymentMethod === "stripe"
            ? "Pago Stripe iniciado. Redirigiendo a Stripe Checkout."
            : "Pago PayPal iniciado. Redirigiendo a PayPal.",
        );

        if (paymentData.provider_payload?.checkout_url) {
          window.location.assign(paymentData.provider_payload.checkout_url);
          return;
        }
      } else {
        setPaymentFlowState({
          provider: paymentMethod,
          status: "pending_manual",
        });
        setPaymentMessage(
          paymentMethod === "bizum"
            ? "Bizum queda seleccionado. La operativa real de cobro será el siguiente paso."
            : "La transferencia bancaria queda seleccionada. La operativa real será el siguiente paso.",
        );
      }
    } catch (error) {
      setSubmitSuccess(null);
      setPaymentFlowState(null);
      setSubmitError(
        error instanceof Error ? error.message : "Error desconocido al preparar el pedido.",
      );
    } finally {
      setSubmitLoading(false);
    }
  }

  if (session.status === "loading") {
    return (
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1rem" }}>
        <h1>Checkout</h1>
        <p>Comprobando sesion...</p>
      </main>
    );
  }

  if (session.status !== "authenticated") {
    return (
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1rem" }}>
        <h1>Checkout</h1>
        <p>
          Para continuar con la compra necesitas iniciar sesion en tu cuenta.
        </p>
        <Link
          href="/login?next=/checkout"
          style={{
            display: "inline-block",
            marginTop: "1rem",
            padding: "0.75rem 1rem",
            background: "#111",
            color: "#fff",
            borderRadius: "12px",
            textDecoration: "none",
          }}
        >
          Iniciar sesion
        </Link>
      </main>
    );
  }

  const hasItems = Boolean(cart && cart.items.length);

  return (
    <main style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Checkout</h1>

      <section
        style={{
          marginTop: "1.5rem",
          padding: "1rem",
          border: "1px solid #e5e5e5",
          borderRadius: "16px",
          background: "#fafafa",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Cuenta</h2>
        <p style={{ marginBottom: 0 }}>
          Has iniciado sesion como <strong>{session.user.email}</strong>.
        </p>
      </section>

      {hasItems ? (
        <section
          style={{
            marginTop: "1rem",
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              padding: "0.65rem 0.9rem",
              borderRadius: "999px",
              background: step === "details" ? "#111" : "#f1f5f9",
              color: step === "details" ? "#fff" : "#334155",
              fontWeight: 600,
            }}
          >
            Paso 1: Datos
          </div>
          <div
            style={{
              padding: "0.65rem 0.9rem",
              borderRadius: "999px",
              background: step === "review" ? "#111" : "#f1f5f9",
              color: step === "review" ? "#fff" : "#334155",
              fontWeight: 600,
            }}
          >
            Paso 2: Revision
          </div>
        </section>
      ) : null}

      <div
        style={{
          display: "grid",
          gap: "1.5rem",
          marginTop: "1.5rem",
          alignItems: "start",
        }}
      >
        {hasItems && step === "details" ? (
          <section
            style={{
              padding: "1rem",
              border: "1px solid #e5e5e5",
              borderRadius: "16px",
              background: "#fff",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Datos de cliente y envío</h2>
            <form onSubmit={handleContinue}>
              <div style={{ display: "grid", gap: "1rem" }}>
                <label style={{ display: "grid", gap: "0.35rem" }}>
                  <span>Correo electrónico</span>
                  <input
                    readOnly
                    style={{
                      padding: "0.75rem",
                      borderRadius: "12px",
                      border: "1px solid #d4d4d4",
                      background: "#f5f5f5",
                    }}
                    type="email"
                    value={session.user.email ?? ""}
                  />
                </label>

                <label style={{ display: "grid", gap: "0.35rem" }}>
                  <span>Nombre completo</span>
                  <input
                    onChange={(event) => updateField("fullName", event.target.value)}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "12px",
                      border: `1px solid ${formErrors.fullName ? "#dc2626" : "#d4d4d4"}`,
                    }}
                    type="text"
                    value={form.fullName}
                  />
                  {formErrors.fullName ? (
                    <small style={{ color: "#b91c1c" }}>{formErrors.fullName}</small>
                  ) : null}
                </label>

                <label style={{ display: "grid", gap: "0.35rem" }}>
                  <span>Teléfono</span>
                  <input
                    onChange={(event) => updateField("phone", event.target.value)}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "12px",
                      border: `1px solid ${formErrors.phone ? "#dc2626" : "#d4d4d4"}`,
                    }}
                    type="tel"
                    value={form.phone}
                  />
                  {formErrors.phone ? (
                    <small style={{ color: "#b91c1c" }}>{formErrors.phone}</small>
                  ) : null}
                </label>

                <label style={{ display: "grid", gap: "0.35rem" }}>
                  <span>Dirección</span>
                  <input
                    onChange={(event) => updateField("addressLine1", event.target.value)}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "12px",
                      border: `1px solid ${formErrors.addressLine1 ? "#dc2626" : "#d4d4d4"}`,
                    }}
                    type="text"
                    value={form.addressLine1}
                  />
                  {formErrors.addressLine1 ? (
                    <small style={{ color: "#b91c1c" }}>{formErrors.addressLine1}</small>
                  ) : null}
                </label>

                <div
                  style={{
                    display: "grid",
                    gap: "1rem",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  }}
                >
                  <label style={{ display: "grid", gap: "0.35rem" }}>
                    <span>Ciudad</span>
                    <input
                      onChange={(event) => updateField("city", event.target.value)}
                      style={{
                        padding: "0.75rem",
                        borderRadius: "12px",
                        border: `1px solid ${formErrors.city ? "#dc2626" : "#d4d4d4"}`,
                      }}
                      type="text"
                      value={form.city}
                    />
                    {formErrors.city ? (
                      <small style={{ color: "#b91c1c" }}>{formErrors.city}</small>
                    ) : null}
                  </label>

                  <label style={{ display: "grid", gap: "0.35rem" }}>
                    <span>Provincia</span>
                    <input
                      onChange={(event) => updateField("province", event.target.value)}
                      style={{
                        padding: "0.75rem",
                        borderRadius: "12px",
                        border: `1px solid ${formErrors.province ? "#dc2626" : "#d4d4d4"}`,
                      }}
                      type="text"
                      value={form.province}
                    />
                    {formErrors.province ? (
                      <small style={{ color: "#b91c1c" }}>{formErrors.province}</small>
                    ) : null}
                  </label>

                  <label style={{ display: "grid", gap: "0.35rem" }}>
                    <span>Código postal</span>
                    <input
                      onChange={(event) => updateField("postalCode", event.target.value)}
                      style={{
                        padding: "0.75rem",
                        borderRadius: "12px",
                        border: `1px solid ${formErrors.postalCode ? "#dc2626" : "#d4d4d4"}`,
                      }}
                      type="text"
                      value={form.postalCode}
                    />
                    {formErrors.postalCode ? (
                      <small style={{ color: "#b91c1c" }}>{formErrors.postalCode}</small>
                    ) : null}
                  </label>

                  <label style={{ display: "grid", gap: "0.35rem" }}>
                    <span>País</span>
                    <input
                      onChange={(event) => updateField("country", event.target.value)}
                      style={{
                        padding: "0.75rem",
                        borderRadius: "12px",
                        border: `1px solid ${formErrors.country ? "#dc2626" : "#d4d4d4"}`,
                      }}
                      type="text"
                      value={form.country}
                    />
                    {formErrors.country ? (
                      <small style={{ color: "#b91c1c" }}>{formErrors.country}</small>
                    ) : null}
                  </label>
                </div>
              </div>

              <section
                style={{
                  marginTop: "1.5rem",
                  padding: "1rem",
                  border: "1px dashed #d4d4d4",
                  borderRadius: "16px",
                  background: "#fafafa",
                }}
              >
                <h3 style={{ marginTop: 0 }}>Siguiente paso</h3>
                <p style={{ marginTop: 0 }}>
                  Revisa tus datos para pasar a la revision del pedido.
                </p>
                <button
                  style={{
                    padding: "0.85rem 1.2rem",
                    background: "#111",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                  }}
                  type="submit"
                >
                  Continuar
                </button>
              </section>
            </form>
          </section>
        ) : null}

        {hasItems && step === "review" ? (
          <section
            style={{
              padding: "1rem",
              border: "1px solid #e5e5e5",
              borderRadius: "16px",
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ margin: 0 }}>Revision del pedido</h2>
              <button
                onClick={() => {
                  setStep("details");
                  setSubmitError(null);
                  setPaymentMessage(null);
                  setPaymentFlowState(null);
                  setManualInstructions(null);
                }}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "12px",
                  border: "1px solid #d4d4d4",
                  background: "#fff",
                  cursor: "pointer",
                }}
                type="button"
              >
                Editar datos
              </button>
            </div>

            <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
              <section
                style={{
                  padding: "1rem",
                  borderRadius: "12px",
                  background: "#fafafa",
                  border: "1px solid #ededed",
                }}
              >
                <h3 style={{ marginTop: 0 }}>Cuenta</h3>
                <p style={{ marginBottom: 0 }}>{session.user.email}</p>
              </section>

              <section
                style={{
                  padding: "1rem",
                  borderRadius: "12px",
                  background: "#fafafa",
                  border: "1px solid #ededed",
                }}
              >
                <h3 style={{ marginTop: 0 }}>Datos de envio</h3>
                <p style={{ margin: "0 0 0.35rem" }}>{form.fullName}</p>
                <p style={{ margin: "0 0 0.35rem" }}>{form.phone}</p>
                <p style={{ margin: "0 0 0.35rem" }}>{form.addressLine1}</p>
                <p style={{ margin: "0 0 0.35rem" }}>
                  {form.city}, {form.province}
                </p>
                <p style={{ margin: "0 0 0.35rem" }}>
                  {form.postalCode}, {form.country}
                </p>
              </section>

              <section
                style={{
                  padding: "1rem",
                  borderRadius: "12px",
                  background: "#fafafa",
                  border: "1px solid #ededed",
                }}
              >
                <h3 style={{ marginTop: 0 }}>Metodo de pago</h3>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {[
                    { value: "stripe", label: "Stripe" },
                    { value: "paypal", label: "PayPal" },
                    { value: "bizum", label: "Bizum (Proximamente)", disabled: true },
                    { value: "bank_transfer", label: "Transferencia bancaria" },
                  ].map((method) => (
                    <label
                      key={method.value}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.85rem 1rem",
                        borderRadius: "12px",
                        border:
                          paymentMethod === method.value
                            ? "1px solid #111"
                            : "1px solid #d4d4d4",
                        background: paymentMethod === method.value ? "#f5f5f5" : "#fff",
                        opacity: method.disabled ? 0.55 : 1,
                        cursor: method.disabled ? "not-allowed" : "pointer",
                      }}
                    >
                      <input
                        disabled={method.disabled}
                        checked={paymentMethod === method.value}
                        name="paymentMethod"
                        onChange={() => {
                          setPaymentMethod(method.value as Exclude<PaymentMethod, null>);
                          setSubmitError(null);
                          setPaymentMessage(null);
                          setPaymentFlowState(null);
                          setManualInstructions(null);
                        }}
                        type="radio"
                      />
                      <span>{method.label}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section
                style={{
                  padding: "1rem",
                  borderRadius: "12px",
                  background: "#fafafa",
                  border: "1px dashed #d4d4d4",
                }}
              >
                <h3 style={{ marginTop: 0 }}>Siguiente paso</h3>
                <p style={{ marginTop: 0 }}>
                  Ya tienes tus datos y tu pedido revisados. Ahora vamos a
                  preparar el pedido contra backend antes de conectar el pago
                  real.
                </p>
                <button
                  disabled={submitLoading}
                  onClick={() => void handleCheckoutConfirm()}
                  style={{
                    padding: "0.85rem 1.2rem",
                    background: "#111",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    cursor: submitLoading ? "wait" : "pointer",
                    opacity: submitLoading ? 0.7 : 1,
                  }}
                  type="button"
                >
                  {submitLoading ? "Preparando pedido..." : "Continuar al pago"}
                </button>
                {submitError ? (
                  <p style={{ marginBottom: 0, marginTop: "0.75rem", color: "#b91c1c" }}>
                    {submitError}
                  </p>
                ) : null}
                {submitSuccess ? (
                  <div
                    style={{
                      marginTop: "0.75rem",
                      padding: "0.85rem 1rem",
                      borderRadius: "12px",
                      background: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      color: "#166534",
                    }}
                  >
                    <strong>Pedido preparado</strong>
                    <p style={{ margin: "0.5rem 0 0" }}>
                      Pedido #{submitSuccess.orderId} creado con estado{" "}
                      {submitSuccess.status}. Método seleccionado:{" "}
                      {getPaymentMethodLabel(submitSuccess.paymentMethod)}.
                    </p>
                  </div>
                ) : null}
                {paymentFlowState && paymentFlowState.provider !== "bank_transfer" ? (
                  <div
                    style={{
                      marginTop: "0.75rem",
                      padding: "0.85rem 1rem",
                      borderRadius: "12px",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      color: "#1d4ed8",
                    }}
                  >
                    <strong>Estado del pago</strong>
                    <p style={{ margin: "0.5rem 0 0" }}>
                      Proveedor: {paymentFlowState.provider}. Estado:{" "}
                      {paymentFlowState.status}
                      {paymentFlowState.paymentId
                        ? `. Payment #${paymentFlowState.paymentId}`
                        : ""}
                      {paymentFlowState.reference
                        ? `. Referencia: ${paymentFlowState.reference}`
                        : ""}
                      {paymentFlowState.externalId
                        ? `. External ID: ${paymentFlowState.externalId}`
                        : ""}
                    </p>
                  </div>
                ) : null}
                {manualInstructions ? (
                  <div
                    style={{
                      marginTop: "0.75rem",
                      padding: "1rem",
                      borderRadius: "12px",
                      background: "#fff7ed",
                      border: "1px solid #fdba74",
                      color: "#9a3412",
                    }}
                  >
                    <strong>Pedido recibido. Pendiente de transferencia.</strong>
                    <p style={{ margin: "0.5rem 0 0" }}>
                      Tu pedido aun no esta pagado. Realiza la transferencia usando
                      la referencia exacta y validaremos el ingreso manualmente.
                    </p>
                    <dl
                      style={{
                        display: "grid",
                        gap: "0.65rem",
                        marginTop: "0.85rem",
                      }}
                    >
                      <div>
                        <dt style={{ fontWeight: 700 }}>Titular</dt>
                        <dd style={{ margin: "0.2rem 0 0" }}>
                          {manualInstructions.account_holder}
                        </dd>
                      </div>
                      <div>
                        <dt style={{ fontWeight: 700 }}>IBAN</dt>
                        <dd style={{ margin: "0.2rem 0 0" }}>{manualInstructions.iban}</dd>
                      </div>
                      <div>
                        <dt style={{ fontWeight: 700 }}>Concepto / referencia</dt>
                        <dd style={{ margin: "0.2rem 0 0" }}>
                          {manualInstructions.reference}
                        </dd>
                      </div>
                    </dl>
                    <p style={{ margin: "0.85rem 0 0" }}>{manualInstructions.message}</p>
                  </div>
                ) : null}
                {paymentMessage ? (
                  <p style={{ marginBottom: 0, marginTop: "0.75rem", color: "#525252" }}>
                    {paymentMessage}
                  </p>
                ) : null}
              </section>
            </div>
          </section>
        ) : null}

        <section
          style={{
            padding: "1rem",
            border: "1px solid #e5e5e5",
            borderRadius: "16px",
            background: "#fff",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Resumen del pedido</h2>
          {renderCartSummary()}
        </section>
      </div>
    </main>
  );
}
