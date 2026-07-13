import type Phaser from "phaser";
import { COLLISION, FIELD, PHYSICS } from "@/game/constants";

/** Grass margin drawn outside the playable pitch rectangle, purely visual. */
export const MARGIN = 40;
export const CANVAS_W = FIELD.width + MARGIN * 2;
export const CANVAS_H = FIELD.height + MARGIN * 2;
export const FIELD_ORIGIN = { x: MARGIN, y: MARGIN };

/**
 * PhysicsManager
 * ------------------------------------------------------------------
 * Owns world-level setup: static geometry (walls, goal-back walls, goal
 * sensors). Player/ball bodies are built by player-physics.ts /
 * ball-physics.ts. Kept separate from CollisionSystem, which only wires up
 * *behavior* in response to contacts — this module only builds bodies.
 */
export class PhysicsManager {
  constructor(private scene: Phaser.Scene) {}

  buildWalls(): void {
    const t = FIELD.wallThickness;
    const goalHalf = FIELD.goalWidth / 2;
    const midY = FIELD_ORIGIN.y + FIELD.height / 2;

    const addWall = (x: number, y: number, w: number, h: number) => {
      const rect = this.scene.matter.add.rectangle(x, y, w, h, {
        isStatic: true,
        friction: PHYSICS.friction,
        frictionStatic: PHYSICS.frictionStatic,
        restitution: PHYSICS.ballRestitutionWall,
        collisionFilter: {
          category: COLLISION.WALL,
          mask: COLLISION.PLAYER | COLLISION.BALL,
        },
      });
      return rect;
    };

    // Top / bottom
    addWall(FIELD_ORIGIN.x + FIELD.width / 2, FIELD_ORIGIN.y - t / 2, FIELD.width + t * 2, t);
    addWall(FIELD_ORIGIN.x + FIELD.width / 2, FIELD_ORIGIN.y + FIELD.height + t / 2, FIELD.width + t * 2, t);

    // Left wall, split around the goal opening
    const leftX = FIELD_ORIGIN.x - t / 2;
    const topSegH = midY - FIELD_ORIGIN.y - goalHalf;
    const botSegH = FIELD_ORIGIN.y + FIELD.height - (midY + goalHalf);
    addWall(leftX, FIELD_ORIGIN.y + topSegH / 2, t, topSegH);
    addWall(leftX, midY + goalHalf + botSegH / 2, t, botSegH);

    // Right wall, split around the goal opening
    const rightX = FIELD_ORIGIN.x + FIELD.width + t / 2;
    addWall(rightX, FIELD_ORIGIN.y + topSegH / 2, t, topSegH);
    addWall(rightX, midY + goalHalf + botSegH / 2, t, botSegH);

    // Goal back walls so the ball doesn't fly out forever once it's in the net.
    addWall(FIELD_ORIGIN.x - FIELD.goalDepth, midY, 4, FIELD.goalWidth);
    addWall(FIELD_ORIGIN.x + FIELD.width + FIELD.goalDepth, midY, 4, FIELD.goalWidth);
  }

  buildGoalSensors(): { home: MatterJS.BodyType; away: MatterJS.BodyType } {
    const midY = FIELD_ORIGIN.y + FIELD.height / 2;

    const home = this.scene.matter.add.rectangle(
      FIELD_ORIGIN.x - FIELD.goalDepth / 2,
      midY,
      FIELD.goalDepth,
      FIELD.goalWidth,
      {
        isStatic: true,
        isSensor: true,
        collisionFilter: { category: COLLISION.GOAL_SENSOR, mask: COLLISION.BALL },
      },
    );
    const away = this.scene.matter.add.rectangle(
      FIELD_ORIGIN.x + FIELD.width + FIELD.goalDepth / 2,
      midY,
      FIELD.goalDepth,
      FIELD.goalWidth,
      {
        isStatic: true,
        isSensor: true,
        collisionFilter: { category: COLLISION.GOAL_SENSOR, mask: COLLISION.BALL },
      },
    );

    return { home, away };
  }
}
