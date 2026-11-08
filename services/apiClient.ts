import { auth } from './firebase';

export function reportApiError(error: unknown) {
  const message = error instanceof Error ? error.message : 'The request failed. Please retry.';
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('nanolabs_api_error', { detail: message }));
}
export function apiBaseUrl() {
  const value = String(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
  if (!value) throw new Error('The API address is not configured. Contact support.');
  const url = new URL(value);
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('The API requires a secure HTTPS address.');
  return value;
}
export async function apiFetch(path: string, init: RequestInit = {}) {
  try {
    const headers = new Headers(init.headers);
    await auth.authStateReady();
    if (auth.currentUser && !auth.currentUser.isAnonymous) headers.set('Authorization', `Bearer ${await auth.currentUser.getIdToken()}`);
    const response = await fetch(`${apiBaseUrl()}${path}`, { ...init, headers, signal: init.signal ?? AbortSignal.timeout(20000) });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error ?? `Request failed (${response.status}). Please retry.`);
    }
    return response;
  } catch (error) { reportApiError(error); throw error; }
}
export async function apiJson<T = any>(path: string, data?: unknown, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, { ...init, method: init.method ?? (data === undefined ? 'GET' : 'POST'), headers: { 'Content-Type': 'application/json', ...init.headers }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  const result = await response.json();
  if (result.success !== true) throw new Error(result.error ?? 'The operation was not completed.');
  return result;
}
/** The same request keeps its key after a timeout/reload; a confirmed success clears it. */
export async function idempotentRequest<T = any>(path: string, data: unknown): Promise<T> {
  const bytes = new TextEncoder().encode(JSON.stringify([auth.currentUser?.uid, path, data]));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const storageKey = `nanolabs_request_${Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('')}`;
  let key = sessionStorage.getItem(storageKey);
  if (!key) { key = crypto.randomUUID(); sessionStorage.setItem(storageKey, key); }
  const result = await apiJson<T>(path, data, { headers: { 'Idempotency-Key': key } });
  sessionStorage.removeItem(storageKey);
  window.dispatchEvent(new Event('nanolabs_booking_updated'));
  return result;
}
