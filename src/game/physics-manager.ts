import type Phaser from "phaser";
import { FIELD } from "@/game/constants";

/** Grass margin drawn outside the playable pitch rectangle, purely visual. */
export const MARGIN = 40;
export const CANVAS_W = FIELD.width + MARGIN * 2;
export const CANVAS_H = FIELD.height + MARGIN * 2;
export const FIELD_ORIGIN = { x: MARGIN, y: MARGIN };

/**
 * PhysicsManager
 * ------------------------------------------------------------------
 * Owns world-level static geometry only: pitch boundary walls (split around
 * the goal openings), goal-back walls, and goal-detection zones. Built as
 * Phaser Zones with static Arcade bodies attached — Zones render nothing,
 * so there is zero visual footprint, only collision geometry.
 *
 * Player/ball bodies are built by player-physics.ts / ball-physics.ts.
 * Behavior in response to contacts (goal scoring, ball-touch tracking)
 * lives in collision-system.ts — this module only builds bodies.
 */
export class PhysicsManager {
  readonly wallZones: Phaser.GameObjects.Zone[] = [];

  constructor(private scene: Phaser.Scene) {}

  private addWall(x: number, y: number, w: number, h: number) {
    const zone = this.scene.add.zone(x, y, w, h);
    this.scene.physics.add.existing(zone, true);
    this.wallZones.push(zone);
  }

  buildWalls(): Phaser.GameObjects.Zone[] {
    const t = FIELD.wallThickness;
    const goalHalf = FIELD.goalWidth / 2;
    const midY = FIELD_ORIGIN.y + FIELD.height / 2;

    // Top / bottom
    this.addWall(FIELD_ORIGIN.x + FIELD.width / 2, FIELD_ORIGIN.y - t / 2, FIELD.width + t * 2, t);
    this.addWall(FIELD_ORIGIN.x + FIELD.width / 2, FIELD_ORIGIN.y + FIELD.height + t / 2, FIELD.width + t * 2, t);

    // Left wall, split around the goal opening
    const leftX = FIELD_ORIGIN.x - t / 2;
    const topSegH = midY - FIELD_ORIGIN.y - goalHalf;
    const botSegH = FIELD_ORIGIN.y + FIELD.height - (midY + goalHalf);
    this.addWall(leftX, FIELD_ORIGIN.y + topSegH / 2, t, topSegH);
    this.addWall(leftX, midY + goalHalf + botSegH / 2, t, botSegH);

    // Right wall, split around the goal opening
    const rightX = FIELD_ORIGIN.x + FIELD.width + t / 2;
    this.addWall(rightX, FIELD_ORIGIN.y + topSegH / 2, t, topSegH);
    this.addWall(rightX, midY + goalHalf + botSegH / 2, t, botSegH);

    // Goal back walls so the ball doesn't fly out forever once it's in the net.
    this.addWall(FIELD_ORIGIN.x - FIELD.goalDepth, midY, 4, FIELD.goalWidth);
    this.addWall(FIELD_ORIGIN.x + FIELD.width + FIELD.goalDepth, midY, 4, FIELD.goalWidth);

    return this.wallZones;
  }

  buildGoalZones(): { home: Phaser.GameObjects.Zone; away: Phaser.GameObjects.Zone } {
    const midY = FIELD_ORIGIN.y + FIELD.height / 2;

    const home = this.scene.add.zone(FIELD_ORIGIN.x - FIELD.goalDepth / 2, midY, FIELD.goalDepth, FIELD.goalWidth);
    this.scene.physics.add.existing(home, true);

    const away = this.scene.add.zone(
      FIELD_ORIGIN.x + FIELD.width + FIELD.goalDepth / 2,
      midY,
      FIELD.goalDepth,
      FIELD.goalWidth,
    );
    this.scene.physics.add.existing(away, true);

    return { home, away };
  }
}
