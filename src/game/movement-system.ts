/**
 * MovementSystem
 * ------------------------------------------------------------------
 * Pure, allocation-free velocity update for a single body. Called once per
 * fixed Matter physics step (see match-scene.ts's `worldstep` handler).
 *
 * Model: velocity = velocity*damping + input*accel, then clamped to
 * maxSpeed. This is deliberately NOT force/impulse based — direct velocity
 * control is what gives HaxBall-style instant response (no perceptible
 * input lag, no "ice" sliding) while still letting Matter's solver own
 * collision response (it corrects velocity again on contact, after this
 * runs).
 *
 * `out` is mutated in place and returned to avoid per-tick allocations.
 */
export interface Vec2 {
  x: number;
  y: number;
}

export function stepPlayerVelocity(
  out: Vec2,
  currentVx: number,
  currentVy: number,
  inputX: number,
  inputY: number,
  damping: number,
  accelPerTick: number,
  maxSpeed: number,
): Vec2 {
  let vx = currentVx * damping + inputX * accelPerTick;
  let vy = currentVy * damping + inputY * accelPerTick;

  const speed = Math.hypot(vx, vy);
  if (speed > maxSpeed) {
    const scale = maxSpeed / speed;
    vx *= scale;
    vy *= scale;
  }

  out.x = vx;
  out.y = vy;
  return out;
}

export function stepBallVelocity(out: Vec2, currentVx: number, currentVy: number, damping: number, maxSpeed: number): Vec2 {
  let vx = currentVx * damping;
  let vy = currentVy * damping;

  const speed = Math.hypot(vx, vy);
  if (speed > maxSpeed) {
    const scale = maxSpeed / speed;
    vx *= scale;
    vy *= scale;
  }

  out.x = vx;
  out.y = vy;
  return out;
}

/** Normalizes a raw directional input (keyboard combo or joystick vector) to unit length (or zero). */
export function normalizeInput(out: Vec2, x: number, y: number): Vec2 {
  const len = Math.hypot(x, y);
  if (len < 1e-6) {
    out.x = 0;
    out.y = 0;
    return out;
  }
  out.x = x / len;
  out.y = y / len;
  return out;
}
