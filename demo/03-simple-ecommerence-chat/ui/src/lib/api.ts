/**
 * API helper — Fetches data from the ZStore backend.
 * All pages use this to pull live data from MongoDB via the API.
 */

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9000';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json();
}
