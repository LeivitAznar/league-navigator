export interface Vec2 {
  x: number;
  y: number;
}

/**
 * MovementSystem
 * ------------------------------------------------------------------
 * Pure, allocation-free functions implementing Haxball's per-tick velocity
 * recurrence by hand: `v = v*damping + input*accel`. Called once per fixed
 * 60Hz step from MatchScene.fixedPhysicsUpdate(), never per render frame —
 * this is what makes the feel independent of device frame rate.
 *
 * These mutate a caller-supplied `out` vector instead of returning a new
 * object, so the per-tick hot path never allocates (avoids GC pauses during
 * a match).
 */
export function stepPlayerVelocity(
  out: Vec2,
  vx: number,
  vy: number,
  inputX: number,
  inputY: number,
  damping: number,
  accelPerTick: number,
): void {
  const nx = vx * damping + inputX * accelPerTick;
  const ny = vy * damping + inputY * accelPerTick;
  out.x = Number.isFinite(nx) ? nx : 0;
  out.y = Number.isFinite(ny) ? ny : 0;
}

export function stepBallVelocity(out: Vec2, vx: number, vy: number, damping: number): void {
  const nx = vx * damping;
  const ny = vy * damping;
  out.x = Number.isFinite(nx) ? nx : 0;
  out.y = Number.isFinite(ny) ? ny : 0;
}

/** Clamp a raw input vector to unit length without exceeding it (keyboard = always 1; joystick = partial deflection preserved). */
export function normalizeInput(out: Vec2, x: number, y: number): void {
  const len = Math.hypot(x, y);
  if (len < 1e-6) {
    out.x = 0;
    out.y = 0;
    return;
  }
  const scale = Math.min(1, len) / len;
  out.x = x * scale;
  out.y = y * scale;
}
