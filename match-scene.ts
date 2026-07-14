import Phaser from "phaser";
import { PHYSICS } from "@/game/constants";
import { AiSystem } from "@/game/ai-system";
import { BallEntity } from "@/game/ball-physics";
import { CollisionSystem } from "@/game/collision-system";
import { InputSystem } from "@/game/input-system";
import { KickSystem } from "@/game/kick-system";
import { normalizeInput, stepBallVelocity, stepPlayerVelocity, type Vec2 } from "@/game/movement-system";
import { CANVAS_H, CANVAS_W, FIELD_ORIGIN, PhysicsManager } from "@/game/physics-manager";
import { PlayerEntity } from "@/game/player-physics";
import type { PlayerSpawn, Role, Team } from "@/game/types";

export interface MatchSceneEvents {
  onGoal?: (scoringTeam: Team, score: { home: number; away: number }) => void;
}

/**
 * MatchScene
 * ------------------------------------------------------------------
 * Orchestrator only: builds the field/entities, wires the systems together,
 * and drives the per-tick loop. All actual behavior (movement math, input
 * reading, kicking, collision bookkeeping, AI decisions) lives in its own
 * module — this file should never grow game *logic*, only wiring.
 */
export class MatchScene extends Phaser.Scene {
  private players: PlayerEntity[] = [];
  private ball!: BallEntity;
  private physicsManager!: PhysicsManager;
  private inputSystem!: InputSystem;
  private kickSystem!: KickSystem;
  private aiSystem!: AiSystem;
  private collisionSystem!: CollisionSystem;

  private frameCounter = 0;
  private score = { home: 0, away: 0 };
  private scoreText!: Phaser.GameObjects.Text;
  private events_: MatchSceneEvents;

  // Reused scratch vectors (see performance notes: avoid per-tick allocation).
  private scratchVec: Vec2 = { x: 0, y: 0 };
  private scratchInput: Vec2 = { x: 0, y: 0 };

  constructor(events: MatchSceneEvents = {}) {
    super("MatchScene");
    this.events_ = events;
  }

  create() {
    this.matter.world.setBounds(0, 0, CANVAS_W, CANVAS_H);

    this.drawPitch();

    this.physicsManager = new PhysicsManager(this);
    this.physicsManager.buildWalls();
    const goalSensors = this.physicsManager.buildGoalSensors();

    this.spawnEntities();

    this.kickSystem = new KickSystem({
      onKick: (x, y, isShot) => this.kickFeedback(x, y, isShot),
    });
    this.aiSystem = new AiSystem(this.kickSystem);
    this.collisionSystem = new CollisionSystem(this, this.ball, this.players, goalSensors, {
      onGoal: (team) => this.onGoalScored(team),
    });
    this.inputSystem = new InputSystem(this);

    this.scoreText = this.add
      .text(CANVAS_W / 2, 14, "0 - 0", { fontSize: "16px", fontStyle: "bold", color: "#ffffff" })
      .setOrigin(0.5, 0)
      .setDepth(1000);

    // Fixed-timestep movement/damping, applied on every internal Matter
    // physics step (Matter world config pins this to 60Hz — see config.ts),
    // decoupled from render frame rate.
    this.matter.world.on("beforeupdate", this.onPhysicsStep, this);

    // Minimap: added last, after every player/ball container already
    // exists, per the known Phaser render-tracking bug when a second camera
    // is introduced before those objects exist.
    this.setupMinimap();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
  }

  private teardown() {
    this.matter.world.off("beforeupdate", this.onPhysicsStep, this);
    this.collisionSystem.destroy();
    this.inputSystem.destroy();
  }

  private drawPitch() {
    const g = this.add.graphics();
    g.fillStyle(0x0b3d1f, 1);
    g.fillRect(0, 0, CANVAS_W, CANVAS_H);

    g.fillStyle(0x145a2e, 1);
    g.fillRect(FIELD_ORIGIN.x, FIELD_ORIGIN.y, CANVAS_W - FIELD_ORIGIN.x * 2, CANVAS_H - FIELD_ORIGIN.y * 2);

    const fieldW = CANVAS_W - FIELD_ORIGIN.x * 2;
    const fieldH = CANVAS_H - FIELD_ORIGIN.y * 2;

    g.lineStyle(3, 0xffffff, 0.55);
    g.strokeRect(FIELD_ORIGIN.x, FIELD_ORIGIN.y, fieldW, fieldH);
    g.lineBetween(FIELD_ORIGIN.x + fieldW / 2, FIELD_ORIGIN.y, FIELD_ORIGIN.x + fieldW / 2, FIELD_ORIGIN.y + fieldH);
    g.strokeCircle(FIELD_ORIGIN.x + fieldW / 2, FIELD_ORIGIN.y + fieldH / 2, 70);

    const boxW = 110;
    const boxH = 260;
    g.strokeRect(FIELD_ORIGIN.x, FIELD_ORIGIN.y + (fieldH - boxH) / 2, boxW, boxH);
    g.strokeRect(FIELD_ORIGIN.x + fieldW - boxW, FIELD_ORIGIN.y + (fieldH - boxH) / 2, boxW, boxH);
  }

  private formationSpawns(): PlayerSpawn[] {
    const layout: { role: Role; nx: number; ny: number }[] = [
      { role: "GK", nx: -0.92, ny: 0 },
      { role: "DEF", nx: -0.5, ny: 0 },
      { role: "MID", nx: -0.15, ny: -0.38 },
      { role: "FWD", nx: -0.15, ny: 0.38 },
    ];

    const spawns: PlayerSpawn[] = [];
    let number = 1;
    for (const side of ["home", "away"] as Team[]) {
      const mirror = side === "away" ? -1 : 1;
      for (const slot of layout) {
        spawns.push({
          team: side,
          role: slot.role,
          nx: slot.nx * mirror,
          ny: slot.ny,
          number: number++,
          isHuman: side === "home" && slot.role === "FWD",
          color: side === "home" ? 0xdc2626 : 0x2563eb,
        });
      }
    }
    return spawns;
  }

  private toPixel(nx: number, ny: number) {
    const fieldW = CANVAS_W - FIELD_ORIGIN.x * 2;
    const fieldH = CANVAS_H - FIELD_ORIGIN.y * 2;
    const usableX = fieldW / 2 - PHYSICS.playerRadius - 10;
    const usableY = fieldH / 2 - PHYSICS.playerRadius - 10;
    return {
      x: FIELD_ORIGIN.x + fieldW / 2 + nx * usableX,
      y: FIELD_ORIGIN.y + fieldH / 2 + ny * usableY,
    };
  }

  private spawnEntities() {
    for (const spawn of this.formationSpawns()) {
      const { x, y } = this.toPixel(spawn.nx, spawn.ny);
      this.players.push(new PlayerEntity(this, spawn, x, y));
    }
    const fieldW = CANVAS_W - FIELD_ORIGIN.x * 2;
    const fieldH = CANVAS_H - FIELD_ORIGIN.y * 2;
    this.ball = new BallEntity(this, FIELD_ORIGIN.x + fieldW / 2, FIELD_ORIGIN.y + fieldH / 2);
  }

  /**
   * Runs once per fixed Matter physics step (independent of render FPS).
   * This is where MovementSystem applies input+damping to every body's
   * velocity, right before Matter integrates positions and resolves
   * collisions for this step.
   */
  private onPhysicsStep = () => {
    for (const p of this.players) {
      let ix = p.input.x;
      let iy = p.input.y;

      stepPlayerVelocity(
        this.scratchVec,
        p.body.velocity.x,
        p.body.velocity.y,
        ix,
        iy,
        PHYSICS.playerDamping,
        PHYSICS.playerBrakeDamping,
        PHYSICS.playerAccelPerTick,
        PHYSICS.playerMaxSpeed,
      );

      p.sprite.setVelocity(this.scratchVec.x, this.scratchVec.y);
    }

    stepBallVelocity(this.scratchVec, this.ball.body.velocity.x, this.ball.body.velocity.y, PHYSICS.ballDamping, PHYSICS.ballMaxSpeed);
    this.ball.sprite.setVelocity(this.scratchVec.x, this.scratchVec.y);
  };

  update(_time: number, _delta: number) {
    this.frameCounter++;

    const human = this.players.find((p) => p.isHuman);
    if (human) {
      const move = this.inputSystem.getMoveVector();
      normalizeInput(this.scratchInput, move.x, move.y);
      // Joystick already reports a magnitude-aware vector (partial
      // deflection = partial speed); keyboard is always full magnitude.
      // Use the raw vector's magnitude when it's a joystick read (<=1) but
      // never let a keyboard diagonal exceed unit length (handled by
      // InputSystem itself), so just reuse `move` directly instead of the
      // forcibly-normalized one for magnitude-sensitive joystick control.
      human.input.x = move.x;
      human.input.y = move.y;

      if (move.x !== 0 || move.y !== 0) {
        human.facingAngle = Math.atan2(move.y, move.x);
      }

      if (this.inputSystem.wantsShoot()) {
        this.kickSystem.tryKick(this, human, this.ball, { speed: PHYSICS.shotSpeed, isShot: true });
      } else if (this.inputSystem.wantsPass()) {
        this.kickSystem.tryKick(this, human, this.ball, { speed: PHYSICS.passSpeed, isShot: false });
      }
    }

    this.aiSystem.runDecisions(this, this.players, this.ball, this.frameCounter);

    this.sanitizeBodies();
    this.syncVisuals();
  }

  private syncVisuals() {
    for (const p of this.players) p.syncVisual();
    this.ball.syncVisual();
  }

  /** Safety net: recover any body that went NaN/Infinity back to its spawn. */
  private sanitizeBodies() {
    for (const p of this.players) {
      const v = p.body.velocity;
      if (!Number.isFinite(p.sprite.x) || !Number.isFinite(p.sprite.y) || !Number.isFinite(v.x) || !Number.isFinite(v.y)) {
        p.sprite.setPosition(p.spawnX, p.spawnY);
        p.sprite.setVelocity(0, 0);
      }
    }
    const bv = this.ball.body.velocity;
    if (!Number.isFinite(this.ball.sprite.x) || !Number.isFinite(this.ball.sprite.y) || !Number.isFinite(bv.x) || !Number.isFinite(bv.y)) {
      this.resetBallToCenter();
    }
  }

  private kickFeedback(x: number, y: number, isShot: boolean) {
    const ring = this.add.circle(x, y, PHYSICS.ballRadius, 0xffffff, 0).setStrokeStyle(2, 0xffffff, 0.8);
    ring.setDepth(30);
    this.tweens.add({
      targets: ring,
      radius: PHYSICS.ballRadius * 2.6,
      alpha: 0,
      duration: 220,
      onComplete: () => ring.destroy(),
    });

    this.ball.container.setScale(1.25, 0.8);
    this.tweens.add({
      targets: this.ball.container,
      scaleX: 1,
      scaleY: 1,
      duration: 260,
      ease: Phaser.Math.Easing.Back.Out,
    });

    if (isShot) this.cameras.main.shake(80, 0.005);
  }

  private onGoalScored(scoringTeam: Team) {
    this.score[scoringTeam]++;
    this.scoreText.setText(`${this.score.home} - ${this.score.away}`);
    this.events_.onGoal?.(scoringTeam, { ...this.score });
    this.resetKickoff();
  }

  private resetKickoff() {
    for (const p of this.players) {
      if (!p.sprite.body) continue;
      p.sprite.setPosition(p.spawnX, p.spawnY);
      p.sprite.setVelocity(0, 0);
    }
    this.resetBallToCenter();
  }

  private resetBallToCenter() {
    if (!this.ball.sprite.body) return;
    const fieldW = CANVAS_W - FIELD_ORIGIN.x * 2;
    const fieldH = CANVAS_H - FIELD_ORIGIN.y * 2;
    this.ball.sprite.setPosition(FIELD_ORIGIN.x + fieldW / 2, FIELD_ORIGIN.y + fieldH / 2);
    this.ball.sprite.setVelocity(0, 0);
    this.ball.lastTouchedBy = null;
  }

  private setupMinimap() {
    const mapW = 150;
    const mapH = 90;
    const minimapCam = this.cameras
      .add(CANVAS_W - mapW - 10, 10, mapW, mapH)
      .setZoom(mapW / CANVAS_W)
      .setBackgroundColor(0x0b3d1f)
      .setName("minimap");
    minimapCam.centerOn(CANVAS_W / 2, CANVAS_H / 2);
    minimapCam.ignore(this.scoreText);
  }
}

export function getCanvasSize() {
  return { width: CANVAS_W, height: CANVAS_H };
}
