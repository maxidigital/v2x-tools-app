# `v2x-tools-app` — cheat-sheet

> Quick-ref operativo (se auto-carga). **Arquitectura / decisiones →
> [`v2x-tools-docs/services/app/`](../v2x-tools-docs/services/app/README.md)**. Auth → `AUTH.md`. Este archivo: lo operativo.

**Qué es**: el **account app** (`app.asn1click.com`) — Overview, Modules, Profile, Settings. Thin client: consume
el hub, no corre nada. React 18 · Vite · TS · Tailwind · Caddy.

## Estructura / config
- `src/`: `App.tsx` (rutas `/account…`), `pages/`, `components/account/`, `services/{hubClient,usersClient}`, `stores/useAuthStore` (user con `role`).
- Caddy: `/api/auth/*` → `users:8095`, `/api/*` → `hub:8080`, resto → SPA.
- Env: `PORT`, `VITE_IDP_BASE` (host del IdP), `VITE_API_BASE`. Sin DB.

## Build / Deploy
`npm run build` → `dist` → Caddy. Push a `git@github.com:maxidigital/v2x-tools-app.git` → Railway. Dominio `app.asn1click.com`.

## Gotchas
- Toolchain **userspace** (Node 20 de `~/.local`, exportar PATH).
- Auth = **SSO central** (cookie `sso` en el host de v2x.tools). Ver `AUTH.md`.
- Tema: Settings es la autoridad (persistida por cuenta); el toggle del converter es local por-device.
- Edición web del `short` OFF (flag `webEditEnabled=false`; irá por chat/MCP).
