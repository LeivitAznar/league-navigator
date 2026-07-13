import Phaser from "phaser";
import { COLLISION, PHYSICS } from "@/game/constants";
import type { Team } from "@/game/types";

/**
 * BallPhysics
 * ------------------------------------------------------------------
 * The ball: a Matter Sprite (physics only) + Container (white disc). Same
 * fixed-rotation treatment as players, for the same reason (no rendered
 * spin, so no gameplay reason to allow it, and it removes a class of
 * spin-driven instability from the solver).
 *
 * Wall/player restitution differ (see constants.ts), so the ball is created
 * with the *wall* restitution by default; the collision system nudges the
 * effective bounce for player contacts if needed (kept simple: a single
 * restitution value is used, tuned as a compromise, since Matter applies
 * one restitution per contact — see collision-system.ts for the split
 * approach if finer control is required later).
 */
export class BallEntity {
  sprite: Phaser.Physics.Matter.Sprite;
  container: Phaser.GameObjects.Container;
  lastTouchedBy: Team | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.matter.add.sprite(x, y, "", undefined, {
      shape: { type: "circle", radius: PHYSICS.ballRadius },
      friction: PHYSICS.friction,
      frictionStatic: PHYSICS.frictionStatic,
      frictionAir: 0,
      restitution: PHYSICS.ballRestitutionWall,
      collisionFilter: {
        category: COLLISION.BALL,
        mask: COLLISION.PLAYER | COLLISION.WALL | COLLISION.GOAL_SENSOR,
      },
    });
    this.sprite.setVisible(false);
    this.sprite.setFixedRotation();
    this.sprite.setMass(PHYSICS.ballMass);

    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.lineStyle(1.5, 0x1a1a1a, 0.7);
    g.fillCircle(0, 0, PHYSICS.ballRadius);
    g.strokeCircle(0, 0, PHYSICS.ballRadius);

    this.container = scene.add.container(x, y, [g]);
    this.container.setDepth(20);
  }

  get body(): MatterJS.BodyType {
    return this.sprite.body as MatterJS.BodyType;
  }

  syncVisual(): void {
    this.container.setPosition(this.sprite.x, this.sprite.y);
  }
}
