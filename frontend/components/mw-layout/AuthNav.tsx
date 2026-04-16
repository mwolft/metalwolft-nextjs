"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CLIENT_API_URL } from "@/lib/metalwolft";

export default function AuthNav() {
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const res = await fetch(`${CLIENT_API_URL}/api/profile`, {
          credentials: "include",
        });

        if (!cancelled) {
          setIsAuthenticated(res.ok);
          setSessionChecked(true);
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
          setSessionChecked(true);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch(`${CLIENT_API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setIsAuthenticated(false);
      router.push("/");
      router.refresh();
    }
  }

  if (!sessionChecked) {
    return null;
  }

  if (!isAuthenticated) {
    return <Link href="/login">Iniciar sesión</Link>;
  }

  return (
    <button onClick={() => void handleLogout()} type="button">
      Cerrar sesión
    </button>
  );
}
