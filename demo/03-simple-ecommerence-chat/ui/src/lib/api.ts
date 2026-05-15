/**
 * API helper — Fetches data from the ZStore backend.
 * All pages use this to pull live data from MongoDB via the API.
 */

// Vite proxies /api/* → http://localhost:9000/* (see vite.config.ts)
const API_BASE = '/api';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json();
}
