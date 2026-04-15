import { cookies } from "next/headers";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

export function getApiUrl(path: string) {
  return `${API_URL}${path}`;
}

type FetchOptions = RequestInit & {
  retry?: boolean;
};

export async function apiFetch(
  path: string,
  options: FetchOptions = {}
) {
  const cookieStore = cookies();

  const res = await fetch(getApiUrl(path), {
    ...options,
    headers: {
      ...(options.headers || {}),
      cookie: cookieStore.toString(),
    },
    credentials: "include",
    cache: "no-store",
  });

  // Si todo va bien, devolvemos
  if (res.status !== 401 || options.retry) {
    return res;
  }

  // Intentamos refresh una sola vez
  const refreshRes = await fetch(getApiUrl("/api/auth/refresh"), {
    method: "POST",
    headers: {
      cookie: cookieStore.toString(),
    },
    credentials: "include",
  });

  if (!refreshRes.ok) {
    // Refresh falló → usuario no autenticado
    return res;
  }

  // Retry del request original
  return apiFetch(path, { ...options, retry: true });
}
