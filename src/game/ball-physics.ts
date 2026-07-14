import type Phaser from "phaser";
import { PHYSICS } from "@/game/constants";
import type { Team } from "@/game/types";

/**
 * BallEntity
 * ------------------------------------------------------------------
 * Same invisible-Zone + visual-Container split as PlayerEntity (see that
 * file's doc comment for why). `lastTouchedBy` is used by AiSystem for
 * possession-aware positioning and updated by CollisionSystem on contact.
 */
export class BallEntity {
  readonly zone: Phaser.GameObjects.Zone;
  readonly container: Phaser.GameObjects.Container;
  lastTouchedBy: Team | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.zone = scene.add.zone(x, y, PHYSICS.ballRadius * 2, PHYSICS.ballRadius * 2);
    scene.physics.add.existing(this.zone);

    const body = this.body;
    body.setCircle(PHYSICS.ballRadius);
    body.mass = PHYSICS.ballMass;
    body.setBounce(PHYSICS.ballBounceWall);
    body.setAllowGravity(false);

    const shadow = scene.add.ellipse(0, 4, PHYSICS.ballRadius * 1.5, PHYSICS.ballRadius * 0.7, 0x000000, 0.3);
    const disc = scene.add.circle(0, 0, PHYSICS.ballRadius, 0xffffff).setStrokeStyle(1.5, 0x111111, 0.6);

    this.container = scene.add.container(x, y, [shadow, disc]);
    this.container.setDepth(25);
  }

  get body(): Phaser.Physics.Arcade.Body {
    return this.zone.body as Phaser.Physics.Arcade.Body;
  }

  syncVisual(): void {
    this.container.setPosition(this.zone.x, this.zone.y);
  }

  destroy(): void {
    this.zone.destroy();
    this.container.destroy();
  }
}
