import Phaser from "phaser";
import { AI, FIELD, PHYSICS } from "@/game/constants";
import { FIELD_ORIGIN } from "@/game/physics-manager";
import type { PlayerEntity } from "@/game/player-physics";
import type { BallEntity } from "@/game/ball-physics";
import type { KickSystem } from "@/game/kick-system";
import type { Team } from "@/game/types";

/**
 * AiSystem
 * ------------------------------------------------------------------
 * Decisions run every `AI.decisionEveryNFrames` real frames (not physics
 * ticks) to keep CPU cost down; movement input derived from those decisions
 * is still applied every frame via the normal MovementSystem path, so AI
 * players accelerate/decelerate with the same feel as the human.
 *
 * Nearest-to-ball-per-team is precomputed once per decision cycle into a
 * Map *before* the per-player loop, so a player never compares distances
 * against itself or re-derives a stale "nearest" mid-loop.
 */
export class AiSystem {
  constructor(private kickSystem: KickSystem) {}

  runDecisions(scene: Phaser.Scene, players: PlayerEntity[], ball: BallEntity, frameCounter: number): void {
    if (frameCounter % AI.decisionEveryNFrames !== 0) return;

    const nearestByTeam = new Map<Team, PlayerEntity>();
    for (const team of ["home", "away"] as Team[]) {
      let best: PlayerEntity | null = null;
      let bestDist = Infinity;
      for (const p of players) {
        if (p.team !== team) continue;
        const dx = ball.sprite.x - p.sprite.x;
        const dy = ball.sprite.y - p.sprite.y;
        const d = Math.hypot(dx, dy);
        if (Number.isFinite(d) && d < bestDist) {
          bestDist = d;
          best = p;
        }
      }
      if (best) nearestByTeam.set(team, best);
    }

    for (const p of players) {
      if (p.isHuman) continue;
      if (p.role === "GK") {
        this.goalkeeper(scene, p, ball);
      } else if (nearestByTeam.get(p.team) === p) {
        this.chase(scene, p, ball);
      } else {
        this.support(p, ball);
      }
    }
  }

  private goalkeeper(scene: Phaser.Scene, p: PlayerEntity, ball: BallEntity) {
    const midY = FIELD_ORIGIN.y + FIELD.height / 2;
    const ownGoalX = p.team === "home" ? FIELD_ORIGIN.x + 26 : FIELD_ORIGIN.x + FIELD.width - 26;
    const ballInBox =
      p.team === "home" ? ball.sprite.x < FIELD_ORIGIN.x + 130 : ball.sprite.x > FIELD_ORIGIN.x + FIELD.width - 130;

    const targetX = ballInBox ? Phaser.Math.Linear(ownGoalX, ball.sprite.x, 0.35) : ownGoalX;
    const targetY = Phaser.Math.Clamp(ball.sprite.y, midY - FIELD.goalWidth / 2 + 10, midY + FIELD.goalWidth / 2 - 10);

    this.moveToward(p, targetX, targetY);

    if (ballInBox) this.kickSystem.tryKick(scene, p, ball, { speed: PHYSICS.passSpeed, isShot: false });
  }

  private chase(scene: Phaser.Scene, p: PlayerEntity, ball: BallEntity) {
    this.moveToward(p, ball.sprite.x, ball.sprite.y);

    const opponentGoalX = p.team === "home" ? FIELD_ORIGIN.x + FIELD.width : FIELD_ORIGIN.x;
    const midY = FIELD_ORIGIN.y + FIELD.height / 2;
    const distToBall = Math.hypot(ball.sprite.x - p.sprite.x, ball.sprite.y - p.sprite.y);
    if (distToBall <= PHYSICS.kickRange + PHYSICS.playerRadius + PHYSICS.ballRadius) {
      const distToGoal = Math.hypot(opponentGoalX - p.sprite.x, midY - p.sprite.y);
      const shooting = distToGoal < 320;
      p.facingAngle = Math.atan2(midY - p.sprite.y, opponentGoalX - p.sprite.x);
      this.kickSystem.tryKick(
        scene,
        p,
        ball,
        shooting ? { speed: PHYSICS.shotSpeed, isShot: true } : { speed: PHYSICS.passSpeed, isShot: false },
      );
    }
  }

  private support(p: PlayerEntity, ball: BallEntity) {
    const possession = ball.lastTouchedBy;
    const attacking = possession === p.team;
    const baseX =
      p.team === "home"
        ? FIELD_ORIGIN.x + FIELD.width * (attacking ? 0.55 : 0.3)
        : FIELD_ORIGIN.x + FIELD.width * (attacking ? 0.45 : 0.7);
    const roleOffsetY = p.role === "DEF" ? -60 : p.role === "MID" ? 0 : 60;
    const targetY = Phaser.Math.Clamp(ball.sprite.y + roleOffsetY, FIELD_ORIGIN.y + 40, FIELD_ORIGIN.y + FIELD.height - 40);
    this.moveToward(p, baseX, targetY);
  }

  private moveToward(p: PlayerEntity, targetX: number, targetY: number) {
    const dx = targetX - p.sprite.x;
    const dy = targetY - p.sprite.y;
    const dist = Math.hypot(dx, dy);

    if (!Number.isFinite(dist) || dist < 4) {
      p.input.x = 0;
      p.input.y = 0;
      return;
    }

    const angle = Math.atan2(dy, dx);
    if (!Number.isFinite(angle)) {
      p.input.x = 0;
      p.input.y = 0;
      return;
    }

    p.facingAngle = angle;
    p.input.x = Math.cos(angle);
    p.input.y = Math.sin(angle);
  }
}
