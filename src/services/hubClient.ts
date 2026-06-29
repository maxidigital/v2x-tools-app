import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Same-origin read-only client for the hub (`/api/*`). The app's Caddy proxies `/api/*` to the
 * v2x-tools-hub service; in dev Vite proxies to VITE_API_TARGET (see vite.config.ts). The account
 * app only browses what the signed-in user owns — it doesn't run codecs.
 */
const BASE = import.meta.env.VITE_API_BASE ?? '';

/**
 * Identity header. The hub derives the userId + plan from this Bearer token (the JWT minted by
 * v2x-tools-users) and ignores any client-set X-User-Id. No token → anonymous (userId 0 / public).
 */
function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class HubError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'HubError';
  }
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

async function getJson<T>(path: string, fallback: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new HubError(await readError(res, fallback), res.status);
  return (await res.json()) as T;
}

/** A user alias for a module OID. `scope` is `default` (public, user 0) or `personal`. */
export interface Alias {
  alias: string;
  moduleId: string;
  scope: 'default' | 'personal';
}

/** A saved message ref (named definition with optional generation fixups). */
export interface SavedMessage {
  name: string;
  moduleAlias: string;
  rootType: string;
  description: string;
  fixups: unknown[];
}

/** An ASN.1 module visible to the user (their own + public). */
export interface Module {
  moduleId: string;
  oid: string;
}

/** GET /api/aliases — the user's aliases plus the public defaults. */
export function listAliases(): Promise<Alias[]> {
  return getJson<Alias[]>('/api/aliases', 'Could not load aliases');
}

/** GET /api/messages — the user's saved messages (none for anonymous). */
export function listMessages(): Promise<SavedMessage[]> {
  return getJson<SavedMessage[]>('/api/messages', 'Could not load saved messages');
}

/** GET /api/modules — modules visible to the user (their own + public), sorted by name. */
export function listModules(): Promise<Module[]> {
  return getJson<Module[]>('/api/modules', 'Could not load modules');
}
