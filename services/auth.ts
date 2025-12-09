import { useActiveAccount } from 'thirdweb/react';

const CORE_ENDPOINT = import.meta.env.VITE_AARIKA_CORE_ENDPOINT || 'http://localhost:8000';
const STORAGE_KEY = 'aarika_token_v1';

export type StoredToken = {
  token: string;
  expiresAt: number; // seconds epoch
  address: string;
};

export function getStoredToken(): StoredToken | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredToken = JSON.parse(raw);
    if (!parsed?.token || !parsed?.expiresAt || !parsed?.address) return null;
    const now = Math.floor(Date.now() / 1000);
    if (parsed.expiresAt <= now) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearStoredToken() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

async function refreshAccessToken(): Promise<StoredToken | null> {
  try {
    const res = await fetch(`${CORE_ENDPOINT}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    const stored: StoredToken = { token: data.token, expiresAt: data.expiresAt, address: data.address };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stored)); } catch {}
    return stored;
  } catch {
    return null;
  }
}

async function getValidTokenOrRefresh(expectedAddressLower?: string): Promise<string | null> {
  const existing = getStoredToken();
  if (existing) {
    // If address is expected, ensure it matches
    if (!expectedAddressLower || existing.address.toLowerCase() === expectedAddressLower) {
      return existing.token;
    }
  }
  const refreshed = await refreshAccessToken();
  if (refreshed && (!expectedAddressLower || refreshed.address.toLowerCase() === expectedAddressLower)) {
    return refreshed.token;
  }
  return null;
}

export async function ensureAuthToken(address: string, signMessage: (args: { message: string }) => Promise<string>): Promise<string | null> {
  // Try to reuse or silently refresh without asking user to sign
  const reused = await getValidTokenOrRefresh(address.toLowerCase());
  if (reused) return reused;
  const ts = Math.floor(Date.now() / 1000).toString();
  const message = `AARIKA_LOGIN\naddress:${address.toLowerCase()}\nts:${ts}`;
  const signature = await signMessage({ message });
  const res = await fetch(`${CORE_ENDPOINT}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ address, timestamp: ts, signature })
  });
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  const stored: StoredToken = { token: data.token, expiresAt: data.expiresAt, address };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stored)); } catch {}
  return stored.token;
}

export function getAuthHeader(): Record<string, string> {
  const tok = getStoredToken();
  return tok ? { Authorization: `Bearer ${tok.token}` } : {};
}
