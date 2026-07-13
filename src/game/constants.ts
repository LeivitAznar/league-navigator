/**
 * Tunable constants for the match engine, calibrated against Haxball's
 * documented "Classic" stadium physics (60Hz fixed tick, multiplicative
 * per-tick damping) but tuned for a faster, more arcade feel (Mamoball-style
 * controls) per product spec.
 */

export const FIELD = {
  width: 1000,
  height: 600,
  wallThickness: 20,
  goalWidth: 160, // vertical opening on each end
  goalDepth: 34, // how far the goal sensor extends past the goal line
};

export const PHYSICS = {
  FIXED_STEP_MS: 1000 / 60,

  playerRadius: 15,
  ballRadius: 10,

  // Haxball ratio: player mass : ball mass ~= 2:1
  playerMass: 2.2,
  ballMass: 1,

  // Multiplicative per-tick damping (velocity *= damping each 1/60s tick) —
  // NOT Arcade's linear setDrag(). This is what gives the Haxball-style
  // "decays fast, then eases off" brake curve.
  playerDamping: 0.96,
  ballDamping: 0.99,

  // Steady-state velocity = accelPerTick / (1 - damping). With damping 0.96,
  // accelPerTick 8 gives a ~200px/s steady-state run speed.
  playerAccelPerTick: 8,

  playerBounce: 0.08,
  ballBounce: 0.68,
  wallBounce: 0.7,

  kickRange: 35,
  passSpeed: 300,
  shotSpeed: 580,
  kickCooldownMs: 350,

  // Lunge: brief extra impulse in the kick direction, simulating the body
  // lunging into the ball (Haxball's kickingAcceleration), applied on top of
  // normal movement for a short window after a kick.
  lungeSpeed: 75,
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
