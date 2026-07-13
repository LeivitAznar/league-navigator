/**
 * Tunable constants for the Matter-based match engine. Calibrated to
 * reproduce HaxBall's "Classic" stadium feel: instant, precise player
 * control (no inertia/ice feel) layered on top of Matter's collision
 * solver for realistic ball contact (deflections, blocks, soft touches).
 *
 * Movement/damping stay deterministic and engine-independent: every tick we
 * set velocity directly (`velocity = velocity*damping + input*accel`,
 * clamped to a max speed) instead of relying on Matter's built-in
 * `frictionAir` — this keeps input response immediate and reproducible.
 * Matter's own solver (restitution/friction/mass) is reserved for what it's
 * good at: body-to-body contact response.
 */

export const FIELD = {
  width: 1000,
  height: 600,
  wallThickness: 24,
  goalWidth: 160,
  goalDepth: 34,
};

export const PHYSICS = {
  playerRadius: 15,
  ballRadius: 10,

  // Haxball ratio: player mass : ball mass ~= 2:1
  playerMass: 2.2,
  ballMass: 1,

  // Manual per-tick multiplicative damping applied ourselves every fixed
  // Matter step (see movement-system.ts) — NOT Matter's frictionAir, which
  // we zero out on every body for full determinism.
  playerDamping: 0.92,
  ballDamping: 0.985,

  // Steady-state speed ≈ accelPerTick / (1 - damping).
  playerAccelPerTick: 16,
  playerMaxSpeed: 6.2, // px/ms-tick equivalent (~ Matter velocity units)

  ballMaxSpeed: 22,

  // Matter contact material properties. Friction (tangential) is kept at 0
  // everywhere: these are circles that never need rolling/sliding friction
  // for gameplay feel, and zero friction avoids any spin-driven drift.
  playerRestitution: 0.05, // players barely bounce off each other/walls
  ballRestitutionWall: 0.78, // lively wall rebounds
  ballRestitutionPlayer: 0.35, // ball deflects off players without going dead
  friction: 0,
  frictionStatic: 0,

  kickRange: 36,
  passSpeed: 9.5,
  shotSpeed: 18,
  kickCooldownMs: 320,

  // Lunge: brief extra velocity in the kick direction right after kicking,
  // simulating the player's body lunging into the ball.
  lungeSpeed: 3.2,
  lungeDurationMs: 110,
} as const;

export const AI = {
  decisionEveryNFrames: 4,
  chaseRange: 260,
};

export const CONTROLS = {
  joystickRadius: 55,
  joystickDeadzone: 8,
};

/** Matter collision categories (bitmask). Category 0x0001 is Matter's default/unused. */
export const COLLISION = {
  PLAYER: 0x0002,
  BALL: 0x0004,
  WALL: 0x0008,
  GOAL_SENSOR: 0x0010,
} as const;
