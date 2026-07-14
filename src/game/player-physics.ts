import type Phaser from "phaser";
import { PHYSICS } from "@/game/constants";
import type { Vec2 } from "@/game/movement-system";
import type { PlayerSpawn, Role, Team } from "@/game/types";

export interface LungeState {
  active: boolean;
  until: number;
  vx: number;
  vy: number;
}

/**
 * PlayerEntity
 * ------------------------------------------------------------------
 * Physics side: an invisible Zone with a circular Arcade body — a Zone
 * renders nothing itself, so there's no risk of the known Phaser 3.90 bug
 * where bare Arc/Graphics game objects lose render tracking once a second
 * camera (the minimap) is added after creation.
 *
 * Visual side: a Container (shadow + colored circle + jersey number) that
 * is repositioned every render frame with a single `setPosition` call
 * mirroring the physics body — see `syncVisual()`. The Container is what
 * actually renders; it's immune to the bug above because it's always
 * treated as one atomic render unit.
 */
export class PlayerEntity {
  readonly team: Team;
  readonly role: Role;
  readonly isHuman: boolean;
  readonly zone: Phaser.GameObjects.Zone;
  readonly container: Phaser.GameObjects.Container;
  readonly spawnX: number;
  readonly spawnY: number;

  /** Last movement direction, kept even while stationary — kicks always fire along this. */
  facingAngle = 0;
  lastKickAt = -Infinity;
  lunge: LungeState = { active: false, until: 0, vx: 0, vy: 0 };
  /** Normalized desired movement direction, written by InputSystem/AiSystem, read by MatchScene's fixed step. */
  input: Vec2 = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene, spawn: PlayerSpawn, x: number, y: number) {
    this.team = spawn.team;
    this.role = spawn.role;
    this.isHuman = spawn.isHuman;
    this.spawnX = x;
    this.spawnY = y;

    this.zone = scene.add.zone(x, y, PHYSICS.playerRadius * 2, PHYSICS.playerRadius * 2);
    scene.physics.add.existing(this.zone);

    const body = this.body;
    body.setCircle(PHYSICS.playerRadius);
    body.mass = PHYSICS.playerMass;
    body.setBounce(PHYSICS.playerBounce);
    body.setAllowGravity(false);
    // Drag stays at Arcade's default (0) deliberately: all damping is
    // applied by hand, once per fixed tick, in MatchScene — see constants.ts.

    const shadow = scene.add.ellipse(0, 6, PHYSICS.playerRadius * 1.6, PHYSICS.playerRadius * 0.8, 0x000000, 0.35);
    const circle = scene.add.circle(0, 0, PHYSICS.playerRadius, spawn.color).setStrokeStyle(2, 0xffffff, 0.85);
    const numberText = scene.add
      .text(0, 0, String(spawn.number), { fontSize: "12px", fontStyle: "bold", color: "#ffffff" })
      .setOrigin(0.5);

    this.container = scene.add.container(x, y, [shadow, circle, numberText]);
    this.container.setDepth(20);
  }

  get body(): Phaser.Physics.Arcade.Body {
    return this.zone.body as Phaser.Physics.Arcade.Body;
  }

  /** Mirrors the physics body's position onto the visible Container. Call once per render frame. */
  syncVisual(): void {
    this.container.setPosition(this.zone.x, this.zone.y);
  }

  destroy(): void {
    this.zone.destroy();
    this.container.destroy();
  }
}
