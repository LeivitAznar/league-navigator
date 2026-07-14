import Phaser from "phaser";
import { PHYSICS } from "@/game/constants";
import type { BallEntity } from "@/game/ball-physics";
import type { PlayerEntity } from "@/game/player-physics";

export interface KickKind {
  speed: number;
  isShot: boolean;
}

export interface KickFeedback {
  onKick: (x: number, y: number, isShot: boolean) => void;
}

/**
 * KickSystem
 * ------------------------------------------------------------------
 * Deliberate pass/shot action (as opposed to the ambient push/deflect that
 * just happens from Matter's collision solver on any player-ball contact).
 * Always fired along the player's stored `facingAngle` — never auto-aimed
 * at goal or toward a pointer — plus a short lunge velocity boost in the
 * same direction so the kick has physical follow-through.
 *
 * Same reproducible-outcome requirement as collisions: given the same
 * distance/angle/cooldown state, a kick always produces the same ball
 * velocity — no randomness anywhere in this path.
 */
export class KickSystem {
  constructor(private feedback: KickFeedback) {}

  tryKick(scene: Phaser.Scene, player: PlayerEntity, ball: BallEntity, kind: KickKind): boolean {
    if (scene.time.now - player.lastKickAt < PHYSICS.kickCooldownMs) return false;

    const dx = ball.sprite.x - player.sprite.x;
    const dy = ball.sprite.y - player.sprite.y;
    const dist = Math.hypot(dx, dy);
    if (!Number.isFinite(dist) || dist > PHYSICS.kickRange + PHYSICS.playerRadius + PHYSICS.ballRadius) {
      return false;
    }

    const angle = player.facingAngle;
    const vx = Math.cos(angle) * kind.speed;
    const vy = Math.sin(angle) * kind.speed;
    if (!Number.isFinite(vx) || !Number.isFinite(vy)) return false;

    // Kick as an impulse instead of replacing velocity outright. This keeps
    // passes, blocks and shots while running physically consistent.
    const nextVx = ball.body.velocity.x * PHYSICS.kickBallCarry + player.body.velocity.x * PHYSICS.kickPlayerCarry + vx;
    const nextVy = ball.body.velocity.y * PHYSICS.kickBallCarry + player.body.velocity.y * PHYSICS.kickPlayerCarry + vy;
    const speed = Math.hypot(nextVx, nextVy);
    const scale = speed > PHYSICS.ballMaxSpeed ? PHYSICS.ballMaxSpeed / speed : 1;
    ball.sprite.setVelocity(nextVx * scale, nextVy * scale);
    ball.lastTouchedBy = player.team;

    player.lastKickAt = scene.time.now;
    this.feedback.onKick(ball.sprite.x, ball.sprite.y, kind.isShot);
    return true;
  }
}
