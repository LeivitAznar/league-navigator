---
name: Lovable vite-tanstack-config host binding on Replit
description: Why an imported Lovable/TanStack Start project's dev server fails to start on Replit, and the fix.
---

Projects scaffolded by Lovable using `@lovable.dev/vite-tanstack-config`
hardcode the Vite dev server to `host: "::"` (IPv6 any-interface) — both
inside and outside its own "sandbox" detection branch. Replit's container
network stack does not support binding `"::"` at all (`EAFNOSUPPORT`), so
`bun run dev` / `npm run dev` crashes immediately with that error.

**Why:** the package targets Lovable's own sandbox by default; Replit's
container simply can't bind an IPv6 any-address socket.

**How to apply:** when outside Lovable's sandbox (no `LOVABLE_SANDBOX` /
`DEV_SERVER__PROJECT_PATH` env vars set — true by default on Replit), the
library merges its `{host: "::", port: 8080}` default *before* the user's
own `vite.config.ts` config, so the user's config wins. Add to
`vite.config.ts`:

```ts
export default defineConfig({
  // ...other options...
  vite: {
    server: { host: "0.0.0.0", port: 5000, strictPort: true, allowedHosts: true },
  },
});
```

Port 5000 matches Replit's webview workflow requirement. Confirmed working
on `@lovable.dev/vite-tanstack-config@2.7.0`.
