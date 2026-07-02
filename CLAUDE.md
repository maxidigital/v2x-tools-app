# `v2x-tools-app` — el account app (`app.asn1click.com`)

> Doc por-servicio (se auto-carga al entrar). Detalle de deploy/dev también en `README.md`. Lo transversal
> vive en **`v2x-tools-docs/`** (`SYSTEM.md`, `ADDRESSING.md`, `AUTH.md`).

**Propósito**: la **cuenta/dashboard** del producto asn1click (`app.asn1click.com`) — Overview, **Modules**
(explorar módulos + elements del índice), Profile, Settings. **Thin client**: no corre nada, consume el hub.
**Tecnología**: React 18 · Vite · TS · Tailwind · react-router · Caddy. Scaffoldeado del chasis del converter.

## Qué hace / qué NO hace
- ✅ UI de cuenta (tabs con sidebar estilo GitHub); lee el **índice** vía el hub (`/api/index/elements`,
  `/api/modules`); edita el `short` de un módulo; login/tema por la SSO central.
- ❌ **NO** es el converter (ese es `v2x-tools-frontend` / "Web Tools") · **NO** tiene backend propio.

## Estructura (`src/`)
`App.tsx` (BrowserRouter: `/account`, `/account/modules`, `/account/modules/:moduleId`, profile, settings) ·
`pages/` · `components/account/` · `services/{hubClient,usersClient}` · `stores/useAuthStore`.

## Parámetros / config (env vars)
| Variable | Para qué |
|---|---|
| `PORT` | Puerto que sirve Caddy. |
| `VITE_IDP_BASE` | Host del IdP (`users`) para login/sso/logout (absoluto; la data va same-origin). |
| `VITE_API_BASE` | Base de la API (same-origin `/api` en prod). |

Caddy (`Caddyfile`): `/api/auth/*` → `users:8095`, `/api/*` → `hub:8080`, resto → SPA estático.

## DB
Sin DB (thin client).

## Deploy
Railway — push a `git@github.com:maxidigital/v2x-tools-app.git` (auto-deploy). Build `npm run build` → `dist`
→ Caddy. Dominio `app.asn1click.com`.

## Gotchas
- Toolchain **userspace** (Node 20 de `~/.local`, exportar PATH).
- Auth = **SSO central** (cookie `sso` en el host de v2x.tools; login/sso/logout al host del IdP). Ver `AUTH.md`.
- El tema: Settings es la autoridad (persistida por cuenta); el toggle del converter es local por-device.

## Ver también
`v2x-tools-docs/SYSTEM.md` · `AUTH.md` · `MCP-INDEX.md` (el índice que muestra Modules) · `README.md`.
