import { create } from 'zustand';
import { toast } from 'sonner';
import * as usersClient from '@/services/usersClient';

const TOKEN_KEY = 'v2x-auth';

export type Plan = 'FREE' | 'BETA' | 'PRO' | 'ORG';

export interface AuthOrganization {
  id: number;
  name: string;
  type: string;
}

/** Free-form, product-owned user preferences (stored server-side as a JSON object). */
export type UserPreferences = Record<string, unknown>;

export interface AuthUser {
  id: number;
  email: string;
  displayName: string | null;
  pictureUrl: string | null;
  role: string;
  plan: Plan;
  preferences: UserPreferences;
  organization?: AuthOrganization;
}

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function persistToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // quota / unavailable
  }
}

/** Read & strip a one-shot fragment param (#token=… / #error=…) the OAuth callback bounced us back with. */
function takeHashParam(name: string): string | null {
  if (!location.hash || location.hash.length < 2) return null;
  const params = new URLSearchParams(location.hash.slice(1));
  const value = params.get(name);
  if (value == null) return null;
  params.delete(name);
  const rest = params.toString();
  const url = location.pathname + location.search + (rest ? `#${rest}` : '');
  history.replaceState(null, '', url);
  return value;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  login: (provider?: string) => void;
  logout: () => void;
  redeem: (code: string) => Promise<void>;
  /** Persist the user's preferences (merged over the current ones) server-side, then update state. */
  savePreferences: (patch: UserPreferences) => Promise<void>;
  /** One-time hydration: consume the callback fragment, then resolve the session via /me. */
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: readToken(),
  ready: false,

  login: (provider = 'google') => {
    window.location.href = usersClient.loginUrl(provider, window.location.origin);
  },

  logout: () => {
    persistToken(null);
    set({ user: null, token: null });
    // Global logout: clear the IdP session cookie too, else the silent SSO would sign us back in.
    window.location.href = usersClient.logoutUrl(window.location.origin);
  },

  redeem: async (code: string) => {
    const token = get().token;
    if (!token) throw new Error('You must be signed in to redeem a code');
    const { user, token: fresh } = await usersClient.redeem(token, code);
    persistToken(fresh);
    set({ user, token: fresh });
    toast.success('Invite code redeemed — beta access unlocked');
  },

  savePreferences: async (patch: UserPreferences) => {
    const { token, user } = get();
    if (!token || !user) throw new Error('You must be signed in to save preferences');
    const next = { ...user.preferences, ...patch };
    const updated = await usersClient.updatePreferences(token, next);
    set({ user: updated });
  },

  init: async () => {
    const incomingError = takeHashParam('error');
    if (incomingError) toast.error(`Login failed: ${incomingError}`);

    // Outcomes of a silent-SSO / logout bounce (consume + clean the URL).
    if (takeHashParam('loggedout')) {
      try { sessionStorage.setItem('sso_tried', '1'); } catch { /* ignore */ }
    }
    const noSession = takeHashParam('nosession') != null;

    const incomingToken = takeHashParam('token');
    if (incomingToken) {
      persistToken(incomingToken);
      set({ token: incomingToken });
    }

    let token = get().token;
    if (token) {
      try {
        const user = await usersClient.me(token);
        set({ user });
      } catch {
        // expired / invalid → drop it, fall back to anonymous
        persistToken(null);
        set({ user: null, token: null });
        token = null;
      }
    }

    // Single sign-on: no local session, and we haven't asked the IdP this browser session.
    // A valid IdP cookie bounces us back with #token; otherwise #nosession (handled above).
    let tried = false;
    try { tried = sessionStorage.getItem('sso_tried') != null; } catch { /* ignore */ }
    if (!token && !noSession && !tried) {
      try { sessionStorage.setItem('sso_tried', '1'); } catch { /* ignore */ }
      window.location.href = usersClient.ssoUrl(window.location.href);
      return; // redirecting — stay not-ready until we come back
    }

    set({ ready: true });
  },
}));

/** Component-facing selector hook. */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const redeem = useAuthStore((s) => s.redeem);
  const savePreferences = useAuthStore((s) => s.savePreferences);
  return { user, ready, login, logout, redeem, savePreferences, isAuthenticated: user != null };
}
