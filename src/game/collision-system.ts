import type Phaser from "phaser";
import type { BallEntity } from "@/game/ball-physics";
import type { PlayerEntity } from "@/game/player-physics";
import type { Team } from "@/game/types";

export interface CollisionCallbacks {
  onGoal: (scoringTeam: Team) => void;
}

/**
 * CollisionSystem
 * ------------------------------------------------------------------
 * Registers all Arcade colliders/overlaps once at match start:
 *  - player vs player, player vs wall, ball vs wall, player vs ball: real
 *    colliders — Arcade's own solver (mass, bounce) owns the actual
 *    bounce/push physics from here on. This module never touches velocity
 *    directly except to record which player last touched the ball.
 *  - ball vs goal zone: overlap only (no physical response), used purely
 *    to detect a goal.
 */
export class CollisionSystem {
  private zoneToPlayer = new Map<Phaser.GameObjects.Zone, PlayerEntity>();

  constructor(
    scene: Phaser.Scene,
    private ball: BallEntity,
    players: PlayerEntity[],
    wallZones: Phaser.GameObjects.Zone[],
    goalZones: { home: Phaser.GameObjects.Zone; away: Phaser.GameObjects.Zone },
    private callbacks: CollisionCallbacks,
  ) {
    for (const p of players) this.zoneToPlayer.set(p.zone, p);

    const playerZones = players.map((p) => p.zone);

    scene.physics.add.collider(playerZones, playerZones);
    scene.physics.add.collider(playerZones, wallZones);
    scene.physics.add.collider(ball.zone, wallZones);
    scene.physics.add.collider(playerZones, ball.zone, (a, b) => this.onPlayerBallContact(a, b));

    // Home goal conceded → away scores, and vice versa.
    scene.physics.add.overlap(ball.zone, goalZones.home, () => this.callbacks.onGoal("away"));
    scene.physics.add.overlap(ball.zone, goalZones.away, () => this.callbacks.onGoal("home"));
  }

  private onPlayerBallContact(a: unknown, b: unknown) {
    const playerZone = (a === this.ball.zone ? b : a) as Phaser.GameObjects.Zone;
    const player = this.zoneToPlayer.get(playerZone);
    if (player) this.ball.lastTouchedBy = player.team;
  }
}
