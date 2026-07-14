---
name: Phaser Scene reserved property names
description: Avoid naming custom Scene fields after built-in Phaser Scene plugins (input, cameras, physics, etc).
---

Phaser's `Scene` base class already exposes properties like `input`, `cameras`,
`physics`, `matter`, `tweens`, `time`, `sys`. If a subclass declares its own
field with one of these names (e.g. a custom `InputSystem` instance stored as
`this.input`), TypeScript reports the subclass as incompatible with `Scene`
(`Property 'input' is private ... not assignable to the same property in base
type 'Scene'`), and at runtime it silently shadows/overwrites the real plugin.

**Why:** easy to hit when wrapping engine subsystems (input handling, physics
managers) in custom classes stored directly on the Scene instance — the
naming collision isn't obvious until the type error (or a confusing runtime
bug) appears.

**How to apply:** when adding a custom system/manager as a Scene field,
suffix it (`inputSystem`, `physicsManager`, `collisionSystem`) rather than
reusing a bare name that matches a Phaser Scene plugin.
