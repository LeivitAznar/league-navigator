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
 * and drives the fixed-timestep physics loop. All actual behavior (movement
 * math, input reading, kicking, collision bookkeeping, AI decisions) lives
 * in its own module — this file should never grow game *logic*, only wiring.
 *
 * Fixed timestep: `update(time, delta)` accumulates real elapsed time and
 * runs `fixedPhysicsUpdate()` in whole 1000/60ms chunks, so the Haxball-style
 * damping/acceleration recurrence is deterministic and decoupled from the
 * device's actual frame rate (a slow device just runs more chunks per
 * render frame, never a different simulation).
 */
export class MatchScene extends Phaser.Scene {
  private players: PlayerEntity[] = [];
  private ball!: BallEntity;
  private inputSystem!: InputSystem;
  private kickSystem!: KickSystem;
  private aiSystem!: AiSystem;
  private collisionSystem!: CollisionSystem;

  private physicsAccumulator = 0;
  private readonly FIXED_STEP = 1000 / 60;

  private frameCounter = 0;
  private score = { home: 0, away: 0 };
  private scoreText!: Phaser.GameObjects.Text;
  private events_: MatchSceneEvents;

  // Reused scratch vectors (avoid per-tick allocation / GC pressure).
  private scratchVec: Vec2 = { x: 0, y: 0 };
  private scratchInput: Vec2 = { x: 0, y: 0 };

  constructor(events: MatchSceneEvents = {}) {
    super("MatchScene");
    this.events_ = events;
  }

  create() {
    console.log("[match] MatchScene.create() starting");

    this.drawPitch();

    const physicsManager = new PhysicsManager(this);
    const wallZones = physicsManager.buildWalls();
    const goalZones = physicsManager.buildGoalZones();

    this.spawnEntities();

    this.kickSystem = new KickSystem({
      onKick: (x, y, isShot) => this.kickFeedback(x, y, isShot),
    });
    this.aiSystem = new AiSystem(this.kickSystem);
    this.collisionSystem = new CollisionSystem(this, this.ball, this.players, wallZones, goalZones, {
      onGoal: (team) => this.onGoalScored(team),
    });
    this.inputSystem = new InputSystem(this);

    this.scoreText = this.add
      .text(CANVAS_W / 2, 14, "0 - 0", { fontSize: "16px", fontStyle: "bold", color: "#ffffff" })
      .setOrigin(0.5, 0)
      .setDepth(1000);

    // Minimap added last, after every player/ball container already exists —
    // see PlayerEntity/BallEntity doc comments for the render-tracking bug
    // this avoids.
    this.setupMinimap();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());

    console.log("[match] MatchScene.create() finished — first scene started");
  }

  private teardown() {
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
    // 4v4: 1 GK + 3 field players per team, normalized formation mirrored for the away side.
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
   * Runs in fixed 1000/60ms chunks (see update() below). Applies the
   * Haxball-style manual damping+acceleration recurrence directly to each
   * body's velocity; Arcade's own per-frame integration and collision solver
   * take it from there (this function never touches position).
   */
  private fixedPhysicsUpdate() {
    const now = this.time.now;

    for (const p of this.players) {
      if (p.lunge.active && now >= p.lunge.until) {
        p.lunge.active = false;
      }

      stepPlayerVelocity(
        this.scratchVec,
        p.body.velocity.x,
        p.body.velocity.y,
        p.input.x,
        p.input.y,
        PHYSICS.playerDamping,
        PHYSICS.playerAccelPerTick,
      );

      let vx = this.scratchVec.x;
      let vy = this.scratchVec.y;
      if (p.lunge.active) {
        vx += p.lunge.vx;
        vy += p.lunge.vy;
      }

      p.body.setVelocity(vx, vy);
    }

    stepBallVelocity(this.scratchVec, this.ball.body.velocity.x, this.ball.body.velocity.y, PHYSICS.ballDamping);
    this.ball.body.setVelocity(this.scratchVec.x, this.scratchVec.y);
  }

  update(_time: number, delta: number) {
    this.frameCounter++;

    this.physicsAccumulator += delta;
    while (this.physicsAccumulator >= this.FIXED_STEP) {
      this.fixedPhysicsUpdate();
      this.physicsAccumulator -= this.FIXED_STEP;
    }

    const human = this.players.find((p) => p.isHuman);
    if (human) {
      const move = this.inputSystem.getMoveVector();
      normalizeInput(this.scratchInput, move.x, move.y);
      human.input.x = this.scratchInput.x;
      human.input.y = this.scratchInput.y;

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
      if (!p.body) continue;
      const v = p.body.velocity;
      if (!Number.isFinite(p.zone.x) || !Number.isFinite(p.zone.y) || !Number.isFinite(v.x) || !Number.isFinite(v.y)) {
        p.body.reset(p.spawnX, p.spawnY);
      }
    }
    if (!this.ball.body) return;
    const bv = this.ball.body.velocity;
    if (!Number.isFinite(this.ball.zone.x) || !Number.isFinite(this.ball.zone.y) || !Number.isFinite(bv.x) || !Number.isFinite(bv.y)) {
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
      if (!p.body) continue;
      p.body.reset(p.spawnX, p.spawnY);
      p.lunge.active = false;
    }
    this.resetBallToCenter();
  }

  private resetBallToCenter() {
    if (!this.ball.body) return;
    const fieldW = CANVAS_W - FIELD_ORIGIN.x * 2;
    const fieldH = CANVAS_H - FIELD_ORIGIN.y * 2;
    this.ball.body.reset(FIELD_ORIGIN.x + fieldW / 2, FIELD_ORIGIN.y + fieldH / 2);
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
