# v2x-tools-app — asn1click account app (`app.asn1click.com`)

The logged-in **account / dashboard** app of the asn1click umbrella (account now, dashboard later).
Vite + React + TS + Tailwind/shadcn, served as static files behind **Caddy** (which reverse-proxies
`/api` over Railway private networking → same-origin, zero CORS).

**Own repo (`maxidigital/v2x-tools-app`) + own Railway service** — fully decoupled from the backend
services (a push here redeploys only this app, never the IdP). It only depends on them at runtime over
the internal network: `/api/auth/*` → the users IdP, `/api/*` → the hub.

## Railway service config

- **Root Directory:** repo root (`.`)
- **Build:** Dockerfile — Node build → Caddy serving `dist/`.
- **Custom domain:** `app.asn1click.com` (Cloudflare proxied).
- **No env vars required** for prod (Caddy upstreams are hard-coded internal hosts:
  `users.railway.internal:8095`, `v2x-tools-hub.railway.internal:8080`).

## Architecture (thin client)

One screen, GitHub-style: top `AppHeader` + left `Sidebar` (identity, Overview/Profile tabs, Settings +
Sign-out pinned bottom) + `<Outlet/>`. Tabs are real routes (`/account`, `/account/profile`,
`/account/settings`) for deep-linking. Each tab just fetches its service and renders:
- **Overview** → hub (`/api/aliases`, `/api/messages`, `/api/modules`, by Bearer). Read-only.
- **Profile** → users `/api/auth/me`.
- **Settings** → functional **Preferences** (theme, synced via `PUT /api/auth/me/preferences`) + stubs.

## Auth (reuses the central SSO)

`useAuthStore.init()` consumes the IdP `#token` bounce, hydrates via `/me`, and runs a one-time silent
SSO. **Key detail:** in `src/services/usersClient.ts`, login/sso/logout target the **absolute IdP host**
`https://v2x.tools` (`VITE_IDP_BASE`) — that's where the `sso` HttpOnly cookie lives, so a same-origin
silent check would always miss it. Data calls (`/me`, hub) stay **same-origin** via this app's own Caddy.
The users service `safeRedirect` allow-lists `https://app.asn1click.com`.

## Local dev

```bash
npm install
npm run dev          # :5173 (or next free port)
```

The dev proxy forwards `/api/*` to `https://v2x.tools` (its Caddy splits `/api/auth`→users, `/api`→hub),
so a browser already signed in to v2x.tools gets a full SSO + data round-trip. Override with
`VITE_API_TARGET`. The theme-save (`PUT /me/preferences`) needs the users service deployed with that
endpoint.

## Build

```bash
npm run build        # tsc --noEmit && vite build → dist/
```
