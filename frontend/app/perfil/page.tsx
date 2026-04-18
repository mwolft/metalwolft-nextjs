"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAnchoringLabel, getColorLabel } from "@/lib/productConfiguration";
import {
  CLIENT_API_URL,
  type OrdersListResponse,
  type ProfileResponse,
} from "@/lib/metalwolft";

function formatOrderDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function PerfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [orders, setOrders] = useState<OrdersListResponse["orders"]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfilePage() {
      try {
        const profileRes = await fetch(`${CLIENT_API_URL}/api/profile`, {
          credentials: "include",
          cache: "no-store",
        });

        if (profileRes.status === 401) {
          router.replace("/login?next=/perfil");
          return;
        }

        const profileData = await profileRes.json();

        if (!profileRes.ok) {
          throw new Error("No se pudo cargar tu perfil.");
        }

        const ordersRes = await fetch(`${CLIENT_API_URL}/api/orders`, {
          credentials: "include",
          cache: "no-store",
        });

        if (ordersRes.status === 401) {
          router.replace("/login?next=/perfil");
          return;
        }

        const ordersData = await ordersRes.json();

        if (!ordersRes.ok) {
          throw new Error(
            ordersData?.error?.message ?? "No se pudo cargar tu historial de pedidos.",
          );
        }

        if (!cancelled) {
          setProfile(profileData);
          setOrders(ordersData.orders ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Error desconocido al cargar tu cuenta.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfilePage();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main style={{ maxWidth: "980px", margin: "0 auto", padding: "2rem 1rem 3rem" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0 }}>Mi cuenta</h1>
        <p style={{ margin: "0.75rem 0 0", color: "#525252", lineHeight: 1.6 }}>
          Desde aqui puedes revisar la informacion basica de tu cuenta y consultar tus pedidos.
        </p>
      </header>

      {loading ? (
        <p>Cargando tu cuenta...</p>
      ) : null}

      {!loading && error ? (
        <section
          style={{
            padding: "1rem",
            borderRadius: "16px",
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#991b1b",
          }}
        >
          <strong>No hemos podido cargar tu cuenta.</strong>
          <p style={{ margin: "0.5rem 0 0" }}>{error}</p>
        </section>
      ) : null}

      {!loading && !error && profile ? (
        <>
          <section
            style={{
              padding: "1.25rem",
              borderRadius: "18px",
              border: "1px solid #e5e7eb",
              background: "#fff",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Datos de la cuenta</h2>
            <p style={{ margin: 0, color: "#404040" }}>
              <strong>Email:</strong> {profile.email}
            </p>
          </section>

          <section style={{ marginTop: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>Mis pedidos</h2>
              <Link
                href="/productos"
                style={{
                  color: "#111",
                  textDecoration: "none",
                  borderBottom: "1px solid #d4d4d4",
                }}
              >
                Seguir comprando
              </Link>
            </div>

            {orders.length === 0 ? (
              <section
                style={{
                  marginTop: "1rem",
                  padding: "1.25rem",
                  borderRadius: "18px",
                  border: "1px dashed #d4d4d4",
                  background: "#fafaf9",
                }}
              >
                <p style={{ margin: 0, color: "#525252" }}>
                  Aun no has realizado ningun pedido.
                </p>
              </section>
            ) : (
              <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
                {orders.map((order) => (
                  <article
                    key={order.id}
                    style={{
                      padding: "1.25rem",
                      borderRadius: "18px",
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gap: "0.75rem",
                        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.8rem", color: "#737373", textTransform: "uppercase" }}>
                          Pedido
                        </div>
                        <strong>#{order.id}</strong>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.8rem", color: "#737373", textTransform: "uppercase" }}>
                          Fecha
                        </div>
                        <strong>{formatOrderDate(order.created_at)}</strong>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.8rem", color: "#737373", textTransform: "uppercase" }}>
                          Estado
                        </div>
                        <strong>{order.status}</strong>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.8rem", color: "#737373", textTransform: "uppercase" }}>
                          Total
                        </div>
                        <strong>{order.summary.total} {order.currency}</strong>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "1rem",
                        paddingTop: "1rem",
                        borderTop: "1px solid #e5e7eb",
                        display: "grid",
                        gap: "0.75rem",
                      }}
                    >
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            padding: "0.9rem 1rem",
                            borderRadius: "14px",
                            background: "#fafaf9",
                            border: "1px solid #f0f0f0",
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>{item.product.name}</div>
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
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
