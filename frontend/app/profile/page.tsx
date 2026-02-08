import { apiFetch } from "@/lib/api";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const res = await apiFetch("/api/profile");

  if (res.status === 401) {
    redirect("/login");
  }

  const user = await res.json();

  return (
    <main>
      <h1>Mi perfil</h1>
      <p>Email: {user.email}</p>
      <p>Admin: {user.is_admin ? "Sí" : "No"}</p>
    </main>
  );
}

