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

    ball.sprite.setVelocity(vx, vy);
    ball.lastTouchedBy = player.team;

    player.lastKickAt = scene.time.now;
    player.lunge = {
      active: true,
      until: scene.time.now + PHYSICS.lungeDurationMs,
      vx: Math.cos(angle) * PHYSICS.lungeSpeed,
      vy: Math.sin(angle) * PHYSICS.lungeSpeed,
    };

    this.feedback.onKick(ball.sprite.x, ball.sprite.y, kind.isShot);
    return true;
  }
}
