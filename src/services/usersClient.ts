import type { AuthUser, UserPreferences } from '@/stores/useAuthStore';

/**
 * Client for the identity service (`/api/auth/*`).
 *
 * Two different hosts on purpose:
 *  - **Data calls** (`me` / `redeem`) are **same-origin** (`BASE = ''`): the app's own Caddy proxies
 *    `/api/auth/*` to the users service over Railway private networking → no CORS.
 *  - **The OAuth/SSO dance** (login / sso / logout) is a **top-level redirect to the IdP host**
 *    (`IDP_BASE`, default `https://v2x.tools`). The HttpOnly IdP session cookie `sso` is seated on
 *    `v2x.tools` (`Path=/api/auth`), so the silent SSO check only carries the cookie when the browser
 *    navigates to that host directly — a same-origin `/api/auth/sso` here would reach users without the
 *    cookie and always report `#nosession`. The IdP bounces back to this app via `?redirect=` (the
 *    users service allow-lists `app.asn1click.com` in `safeRedirect`).
 */
const BASE = import.meta.env.VITE_API_BASE ?? '';
const IDP_BASE = import.meta.env.VITE_IDP_BASE ?? 'https://v2x.tools';

/** The URL to send the browser to in order to start the OAuth flow with a provider (on the IdP host). */
export function loginUrl(provider: string, returnTo: string): string {
  return `${IDP_BASE}/api/auth/${provider}/login?redirect=${encodeURIComponent(returnTo)}`;
}

/** Silent SSO check against the IdP — bounces back #token=… (already signed in elsewhere) or #nosession=1. */
export function ssoUrl(returnTo: string): string {
  return `${IDP_BASE}/api/auth/sso?redirect=${encodeURIComponent(returnTo)}`;
}

/** Global logout — clears the IdP session cookie, then bounces back #loggedout=1. */
export function logoutUrl(returnTo: string): string {
  return `${IDP_BASE}/api/auth/logout?redirect=${encodeURIComponent(returnTo)}`;
}

async function readError(res: Response, fallback: string): Promise<string> {
  const text = await res.text().catch(() => '');
  try {
    const json = JSON.parse(text);
    if (json?.error) return String(json.error);
  } catch {
    // not JSON
  }
  return text || fallback;
}

/** GET /api/auth/me — the current user's profile. Throws on 401 (expired/invalid token). */
export async function me(token: string): Promise<AuthUser> {
  const res = await fetch(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readError(res, 'Not authenticated'));
  return (await res.json()) as AuthUser;
}

/** POST /api/auth/redeem — redeem an invite code; returns the updated user and a fresh token. */
export async function redeem(token: string, code: string): Promise<{ user: AuthUser; token: string }> {
  const res = await fetch(`${BASE}/api/auth/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error(await readError(res, 'Could not redeem code'));
  return (await res.json()) as { user: AuthUser; token: string };
}

/** PUT /api/auth/me/preferences — replace the user's preferences; returns the updated user. */
export async function updatePreferences(token: string, preferences: UserPreferences): Promise<AuthUser> {
  const res = await fetch(`${BASE}/api/auth/me/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(preferences),
  });
  if (!res.ok) throw new Error(await readError(res, 'Could not save preferences'));
  return (await res.json()) as AuthUser;
}
