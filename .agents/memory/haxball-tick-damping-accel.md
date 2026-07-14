---
name: Haxball-style per-tick damping + acceleration derivation
description: How to correctly derive the per-tick acceleration constant for a manual velocity = velocity*damping + accel movement model (used for Haxball-style arcade football physics), and a wrong shortcut to avoid.
---

When hand-rolling Haxball-style movement (velocity updated once per fixed
tick as `v = v * damping + accel`, independent of the physics engine's own
drag/friction), the steady-state speed a held direction converges to is:

    targetSpeed = accel / (1 - damping)

So to hit a desired `targetSpeed` given a chosen `damping` (e.g. 0.96 per
tick), solve for accel:

    accel = targetSpeed * (1 - damping)

**Why:** A tempting shortcut is "accel = targetSpeed / 60" (treating it like
a per-second value spread over 60 ticks). That is wrong by roughly two
orders of magnitude for typical damping values (e.g. damping=0.96 implies
dividing by ~25, not 60) and leaves the body barely moving — the recurrence
never gets anywhere near the intended target speed.

**How to apply:** Any time a spec or prompt says "just divide the target
velocity by the tick rate" for a damping-based (not drag-based) movement
model, verify against the steady-state formula above before trusting it.
