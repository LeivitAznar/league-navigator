import type Phaser from "phaser";
import { COLLISION } from "@/game/constants";
import type { BallEntity } from "@/game/ball-physics";
import type { PlayerEntity } from "@/game/player-physics";
import type { Team } from "@/game/types";

export interface CollisionCallbacks {
  onGoal: (scoringTeam: Team) => void;
}

/**
 * CollisionSystem
 * ------------------------------------------------------------------
 * Wires up Matter's `collisionstart` event (fired once per contact pair,
 * not every overlapping frame — cheap and avoids double-counting a single
 * touch) to game behavior:
 *  - track last player to touch the ball (used by AI possession logic).
 *  - detect the ball entering a goal sensor and report a goal.
 *
 * Actual bounce/push physics (player vs player, player vs ball, ball vs
 * wall) is entirely delegated to Matter's own solver via the
 * restitution/friction/mass set on each body in player-physics.ts /
 * ball-physics.ts / physics-manager.ts — this module only reacts to
 * contacts for gameplay bookkeeping, it never touches velocity.
 */
export class CollisionSystem {
  private bodyToPlayer = new Map<number, PlayerEntity>();
  private ballBodyId: number | null = null;
  private goalSensorTeam = new Map<number, Team>();

  constructor(
    private scene: Phaser.Scene,
    private ball: BallEntity,
    players: PlayerEntity[],
    goalSensors: { home: MatterJS.BodyType; away: MatterJS.BodyType },
    private callbacks: CollisionCallbacks,
  ) {
    for (const p of players) this.bodyToPlayer.set(p.body.id, p);
    this.ballBodyId = ball.body.id;
    // homeGoalZone is scored by the AWAY team (ball entered home's own net).
    this.goalSensorTeam.set(goalSensors.home.id, "away");
    this.goalSensorTeam.set(goalSensors.away.id, "home");

    this.scene.matter.world.on("collisionstart", this.handleCollisionStart, this);
  }

  private handleCollisionStart(event: Phaser.Physics.Matter.Events.CollisionStartEvent) {
    for (const pair of event.pairs) {
      const { bodyA, bodyB } = pair;
      this.checkBallPlayerTouch(bodyA, bodyB);
      this.checkGoal(bodyA, bodyB);
    }
  }

  private checkBallPlayerTouch(a: MatterJS.BodyType, b: MatterJS.BodyType) {
    if (a.id !== this.ballBodyId && b.id !== this.ballBodyId) return;
    const playerBody = a.id === this.ballBodyId ? b : a;
    const player = this.bodyToPlayer.get(playerBody.id);
    if (player) this.ball.lastTouchedBy = player.team;
  }

  private checkGoal(a: MatterJS.BodyType, b: MatterJS.BodyType) {
    if (a.id !== this.ballBodyId && b.id !== this.ballBodyId) return;
    const sensorBody = a.id === this.ballBodyId ? b : a;
    if ((sensorBody.collisionFilter.category ?? 0) !== COLLISION.GOAL_SENSOR) return;
    const scoringTeam = this.goalSensorTeam.get(sensorBody.id);
    if (scoringTeam) this.callbacks.onGoal(scoringTeam);
  }

  destroy() {
    this.scene.matter.world.off("collisionstart", this.handleCollisionStart, this);
  }
}
