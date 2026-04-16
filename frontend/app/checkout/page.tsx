import Link from "next/link";

import { apiFetch } from "@/lib/api";

async function getSessionState() {
  const res = await apiFetch("/api/profile");

  if (res.status === 401) {
    return { isAuthenticated: false as const, user: null };
  }

  if (!res.ok) {
    throw new Error("No se pudo comprobar la sesión del usuario.");
  }

  const user = await res.json();
  return { isAuthenticated: true as const, user };
}

export default async function CheckoutPage() {
  const session = await getSessionState();

  if (!session.isAuthenticated) {
    return (
      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "2rem 1rem" }}>
        <h1>Checkout</h1>
        <p>
          Para continuar con la compra necesitas iniciar sesión en tu cuenta.
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
          Iniciar sesión
        </Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: "760px", margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Checkout</h1>
      <p>Has iniciado sesión como {session.user.email}.</p>
      <p>El siguiente paso del checkout continuará aquí.</p>
    </main>
  );
}
