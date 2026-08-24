const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL n'est pas configurée.");
}

export async function apiRequest(
  path: string,
  options: RequestInit = {}
) {
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access")
      : null;

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      body.detail ||
        Object.values(body).flat().join(" ") ||
        "La requête a échoué."
    );
  }

  return body;
}