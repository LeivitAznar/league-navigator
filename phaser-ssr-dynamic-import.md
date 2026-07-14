---
name: Phaser + SSR frameworks
description: Phaser crashes SSR (Next, TanStack Start, Remix, etc.) unless imported client-only via dynamic import.
---

Phaser's module init code touches browser globals (`navigator`, etc.) as
soon as the module is evaluated — not just when a `Phaser.Game` is
constructed. In any SSR framework, a static top-level `import Phaser from
"phaser"` (even transitively, e.g. importing a wrapper file that imports
Phaser) gets evaluated during server-side rendering and throws
`ReferenceError: navigator is not defined`, producing a 500 on every page
that (even transitively) imports the module.

**Why:** Phaser assumes a browser environment unconditionally at import
time, not just at instantiation time.

**How to apply:** never statically import Phaser (or any module that
imports it) from a file that's part of the SSR route/component tree.
Instead, dynamically import it inside a `useEffect` (or equivalent
client-only lifecycle hook) that only runs in the browser:

```ts
useEffect(() => {
  let cancelled = false;
  import("./create-game").then(({ createGame }) => {
    if (!cancelled) gameRef.current = createGame(container);
  });
  return () => {
    cancelled = true;
    gameRef.current?.destroy(true);
  };
}, []);
```

A `import type Phaser from "phaser"` type-only import is safe (erased at
compile time) and can stay static for typing purposes.
