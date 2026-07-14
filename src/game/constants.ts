/**
 * Haxball-calibrated constants for the match engine (Phaser Arcade Physics).
 *
 * Movement is NOT Arcade's built-in linear drag (`setDrag`) — it's Haxball's
 * own model: every fixed 60Hz tick we multiply velocity by a damping factor
 * (<1) and add a fixed acceleration in the input direction, applied by hand
 * in MatchScene.fixedPhysicsUpdate(). Arcade's own per-frame position
 * integration and circle-vs-circle collision response (mass, bounce) still
 * do the rest — that part we don't hand-roll, it's what Arcade is for.
 */

// Haxball's own per-tick multiplicative damping (documented "Classic"
// stadium values) — kept as-is, these define the "weight"/feel.
export const PLAYER_DAMPING = 0.96;
export const BALL_DAMPING = 0.985;

// Target equilibrium speed for a player holding a direction, in the same
// units as Arcade's body.velocity (px/s). Earlier builds felt too fast —
// this pass is deliberately slower and heavier; controllability over speed.
export const PLAYER_MAX_VEL_TARGET = 118;

// Steady-state speed of the recurrence v = v*damping + accel is
// accel / (1 - damping). Solve for accel given the damping + target above.
// (Note: the "divide by 60" shortcut some prompts use here is wrong by two
// orders of magnitude — it conflates a per-tick recurrence with a per-second
// one. This is the value that actually converges to PLAYER_MAX_VEL_TARGET.)
const PLAYER_ACCEL_PER_TICK = PLAYER_MAX_VEL_TARGET * (1 - PLAYER_DAMPING);

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

  playerDamping: PLAYER_DAMPING,
  ballDamping: BALL_DAMPING,
  playerAccelPerTick: PLAYER_ACCEL_PER_TICK,
  playerMaxVelTarget: PLAYER_MAX_VEL_TARGET,

  // Arcade `setBounce()` coefficients. Player contact stays soft (barely
  // bounces off other players or walls); the ball is lively off walls/posts.
  playerBounce: 0.08,
  ballBounceWall: 0.6,

  kickRange: 35,
  passSpeed: 230,
  shotSpeed: 400,
  kickCooldownMs: 320,

  // Lunge: brief extra velocity in the kick direction right after kicking —
  // the body following through into the ball, mirroring Haxball's own
  // kickingAcceleration boost.
  lungeSpeed: 45,
  lungeDurationMs: 100,
} as const;

export const AI = {
  decisionEveryNFrames: 4,
};

export const CONTROLS = {
  joystickRadius: 55,
  joystickDeadzone: 8,
};
