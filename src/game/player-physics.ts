import Phaser from "phaser";
import { COLLISION, PHYSICS } from "@/game/constants";
import type { PlayerSpawn, Role, Team } from "@/game/types";

/**
 * PlayerPhysics
 * ------------------------------------------------------------------
 * One player: a Matter Sprite (invisible — it's the physics body only) +
 * a Container (shadow + circle + jersey number) repositioned from the body
 * every render frame. Never a loose Arc/Graphics: those lose render
 * tracking once a second camera (minimap) exists in Phaser 3.90.
 *
 * Rotation is locked (`setFixedRotation`) — these are top-down circles with
 * zero surface friction, so spin has no gameplay purpose and would only add
 * visual/physical noise.
 */
export class PlayerEntity {
  sprite: Phaser.Physics.Matter.Sprite;
  container: Phaser.GameObjects.Container;
  team: Team;
  role: Role;
  isHuman: boolean;
  spawnX: number;
  spawnY: number;
  facingAngle = 0;
  input = { x: 0, y: 0 };
  lastKickAt = -Infinity;
  lunge = { active: false, until: 0, vx: 0, vy: 0 };

  constructor(scene: Phaser.Scene, spawn: PlayerSpawn, x: number, y: number) {
    this.team = spawn.team;
    this.role = spawn.role;
    this.isHuman = spawn.isHuman;
    this.spawnX = x;
    this.spawnY = y;
    this.facingAngle = spawn.team === "home" ? 0 : Math.PI;

    this.sprite = scene.matter.add.sprite(x, y, "", undefined, {
      shape: { type: "circle", radius: PHYSICS.playerRadius },
      friction: PHYSICS.friction,
      frictionStatic: PHYSICS.frictionStatic,
      frictionAir: 0,
      restitution: PHYSICS.playerRestitution,
      collisionFilter: {
        category: COLLISION.PLAYER,
        mask: COLLISION.PLAYER | COLLISION.BALL | COLLISION.WALL,
      },
    });
    this.sprite.setVisible(false);
    this.sprite.setFixedRotation();
    this.sprite.setMass(PHYSICS.playerMass);

    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(2, PHYSICS.playerRadius * 0.7, PHYSICS.playerRadius * 1.6, PHYSICS.playerRadius * 0.8);
    g.fillStyle(spawn.color, 1);
    g.lineStyle(2, spawn.isHuman ? 0xffe066 : 0x0a0a0a, spawn.isHuman ? 1 : 0.6);
    g.fillCircle(0, 0, PHYSICS.playerRadius);
    g.strokeCircle(0, 0, PHYSICS.playerRadius);

    const number = scene.add
      .text(0, 0, String(spawn.number), { fontSize: "12px", fontStyle: "bold", color: "#ffffff" })
      .setOrigin(0.5);

    this.container = scene.add.container(x, y, [g, number]);
    this.container.setDepth(spawn.isHuman ? 12 : 10);
  }

  get body(): MatterJS.BodyType {
    return this.sprite.body as MatterJS.BodyType;
  }

  syncVisual(): void {
    this.container.setPosition(this.sprite.x, this.sprite.y);
  }
}
