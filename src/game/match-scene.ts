import Phaser from "phaser";
import { AI, FIELD, PHYSICS } from "@/game/constants";
import type { PlayerSpawn, Role, Team } from "@/game/types";
import { TouchButton, VirtualJoystick } from "@/game/virtual-joystick";

/** Grass margin drawn outside the playable pitch rectangle, purely visual. */
const MARGIN = 40;
const CANVAS_W = FIELD.width + MARGIN * 2;
const CANVAS_H = FIELD.height + MARGIN * 2;
const FIELD_ORIGIN = { x: MARGIN, y: MARGIN };

interface KickKind {
  speed: number;
  isShot: boolean;
}

/**
 * One player: an invisible Arcade physics circle (the only thing with
 * velocity/collisions) + a Container (shadow + circle + number) that is
 * repositioned in sync every frame. Never a loose Arc/Graphics — those lose
 * render tracking and vanish once a second camera (the minimap) exists.
 */
class PlayerEntity {
  sprite: Phaser.Physics.Arcade.Sprite;
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
  aiThrottleOffset = Math.floor(Math.random() * AI.decisionEveryNFrames);

  constructor(scene: Phaser.Scene, spawn: PlayerSpawn, x: number, y: number) {
    this.team = spawn.team;
    this.role = spawn.role;
    this.isHuman = spawn.isHuman;
    this.spawnX = x;
    this.spawnY = y;
    this.facingAngle = spawn.team === "home" ? 0 : Math.PI;

    this.sprite = scene.physics.add.sprite(x, y, "");
    this.sprite.setVisible(false);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCircle(PHYSICS.playerRadius);
    body.setMass(PHYSICS.playerMass);
    body.setBounce(PHYSICS.playerBounce);
    body.setCollideWorldBounds(false);
    body.setMaxSpeed(420);

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

  syncVisual() {
    this.container.setPosition(this.sprite.x, this.sprite.y);
  }
}

class BallEntity {
  sprite: Phaser.Physics.Arcade.Sprite;
  container: Phaser.GameObjects.Container;
  graphic: Phaser.GameObjects.Graphics;
  lastTouchedBy: Team | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, "");
    this.sprite.setVisible(false);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCircle(PHYSICS.ballRadius);
    body.setMass(PHYSICS.ballMass);
    body.setBounce(PHYSICS.ballBounce);
    body.setMaxSpeed(900);

    this.graphic = scene.add.graphics();
    this.graphic.fillStyle(0xffffff, 1);
    this.graphic.lineStyle(1.5, 0x1a1a1a, 0.7);
    this.graphic.fillCircle(0, 0, PHYSICS.ballRadius);
    this.graphic.strokeCircle(0, 0, PHYSICS.ballRadius);

    this.container = scene.add.container(x, y, [this.graphic]);
    this.container.setDepth(20);
  }

  syncVisual() {
    this.container.setPosition(this.sprite.x, this.sprite.y);
  }
}

export interface MatchSceneEvents {
  onGoal?: (scoringTeam: Team, score: { home: number; away: number }) => void;
}

export class MatchScene extends Phaser.Scene {
  private players: PlayerEntity[] = [];
  private ball!: BallEntity;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private homeGoalZone!: Phaser.GameObjects.Zone;
  private awayGoalZone!: Phaser.GameObjects.Zone;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private passKey!: Phaser.Input.Keyboard.Key;
  private shootKey!: Phaser.Input.Keyboard.Key;

  private joystick: VirtualJoystick | null = null;
  private passButton: TouchButton | null = null;
  private shootButton: TouchButton | null = null;
  private wantPass = false;
  private wantShoot = false;

  private physicsAccumulator = 0;
  private frameCounter = 0;
  private score = { home: 0, away: 0 };
  private scoreText!: Phaser.GameObjects.Text;
  private events_: MatchSceneEvents;

  constructor(events: MatchSceneEvents = {}) {
    super("MatchScene");
    this.events_ = events;
  }

  create() {
    this.physics.world.setBounds(0, 0, CANVAS_W, CANVAS_H);

    this.drawPitch();
    this.buildWalls();
    this.buildGoalZones();
    this.spawnEntities();
    this.setupCollisions();
    this.setupDesktopControls();
    this.setupTouchControlsIfNeeded();

    this.scoreText = this.add
      .text(CANVAS_W / 2, 14, "0 - 0", { fontSize: "16px", fontStyle: "bold", color: "#ffffff" })
      .setOrigin(0.5, 0)
      .setDepth(1000);

    // Minimap: added last, after every player/ball container already exists,
    // per the known Phaser Arc/Graphics render-tracking bug when a second
    // camera is introduced before those objects exist.
    this.setupMinimap();
  }

  private drawPitch() {
    const g = this.add.graphics();
    g.fillStyle(0x0b3d1f, 1);
    g.fillRect(0, 0, CANVAS_W, CANVAS_H);

    g.fillStyle(0x145a2e, 1);
    g.fillRect(FIELD_ORIGIN.x, FIELD_ORIGIN.y, FIELD.width, FIELD.height);

    g.lineStyle(3, 0xffffff, 0.55);
    g.strokeRect(FIELD_ORIGIN.x, FIELD_ORIGIN.y, FIELD.width, FIELD.height);
    g.lineBetween(
      FIELD_ORIGIN.x + FIELD.width / 2,
      FIELD_ORIGIN.y,
      FIELD_ORIGIN.x + FIELD.width / 2,
      FIELD_ORIGIN.y + FIELD.height,
    );
    g.strokeCircle(FIELD_ORIGIN.x + FIELD.width / 2, FIELD_ORIGIN.y + FIELD.height / 2, 70);

    const boxW = 110;
    const boxH = 260;
    g.strokeRect(FIELD_ORIGIN.x, FIELD_ORIGIN.y + (FIELD.height - boxH) / 2, boxW, boxH);
    g.strokeRect(
      FIELD_ORIGIN.x + FIELD.width - boxW,
      FIELD_ORIGIN.y + (FIELD.height - boxH) / 2,
      boxW,
      boxH,
    );
  }

  private buildWalls() {
    this.walls = this.physics.add.staticGroup();
    const t = FIELD.wallThickness;
    const goalHalf = FIELD.goalWidth / 2;
    const midY = FIELD_ORIGIN.y + FIELD.height / 2;

    const addWall = (x: number, y: number, w: number, h: number) => {
      const rect = this.add.rectangle(x, y, w, h, 0x000000, 0);
      this.physics.add.existing(rect, true);
      this.walls.add(rect);
    };

    // Top / bottom
    addWall(FIELD_ORIGIN.x + FIELD.width / 2, FIELD_ORIGIN.y - t / 2, FIELD.width + t * 2, t);
    addWall(FIELD_ORIGIN.x + FIELD.width / 2, FIELD_ORIGIN.y + FIELD.height + t / 2, FIELD.width + t * 2, t);

    // Left wall, split around the goal opening
    const leftX = FIELD_ORIGIN.x - t / 2;
    addWall(leftX, FIELD_ORIGIN.y + (midY - FIELD_ORIGIN.y - goalHalf) / 2, t, midY - FIELD_ORIGIN.y - goalHalf);
    addWall(
      leftX,
      midY + goalHalf + (FIELD_ORIGIN.y + FIELD.height - (midY + goalHalf)) / 2,
      t,
      FIELD_ORIGIN.y + FIELD.height - (midY + goalHalf),
    );

    // Right wall, split around the goal opening
    const rightX = FIELD_ORIGIN.x + FIELD.width + t / 2;
    addWall(rightX, FIELD_ORIGIN.y + (midY - FIELD_ORIGIN.y - goalHalf) / 2, t, midY - FIELD_ORIGIN.y - goalHalf);
    addWall(
      rightX,
      midY + goalHalf + (FIELD_ORIGIN.y + FIELD.height - (midY + goalHalf)) / 2,
      t,
      FIELD_ORIGIN.y + FIELD.height - (midY + goalHalf),
    );

    // Goal back walls (so the ball doesn't fly out forever once it scores)
    addWall(FIELD_ORIGIN.x - FIELD.goalDepth, midY, 4, FIELD.goalWidth);
    addWall(FIELD_ORIGIN.x + FIELD.width + FIELD.goalDepth, midY, 4, FIELD.goalWidth);
  }

  private buildGoalZones() {
    const midY = FIELD_ORIGIN.y + FIELD.height / 2;
    this.homeGoalZone = this.add.zone(
      FIELD_ORIGIN.x - FIELD.goalDepth / 2,
      midY,
      FIELD.goalDepth,
      FIELD.goalWidth,
    );
    this.awayGoalZone = this.add.zone(
      FIELD_ORIGIN.x + FIELD.width + FIELD.goalDepth / 2,
      midY,
      FIELD.goalDepth,
      FIELD.goalWidth,
    );
    this.physics.add.existing(this.homeGoalZone, true);
    this.physics.add.existing(this.awayGoalZone, true);
  }

  private formationSpawns(): PlayerSpawn[] {
    // Normalized positions for the home side (x<0 = home's defensive half);
    // mirrored (negated nx) for away. One human per team.
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
    const usableX = FIELD.width / 2 - PHYSICS.playerRadius - 10;
    const usableY = FIELD.height / 2 - PHYSICS.playerRadius - 10;
    return {
      x: FIELD_ORIGIN.x + FIELD.width / 2 + nx * usableX,
      y: FIELD_ORIGIN.y + FIELD.height / 2 + ny * usableY,
    };
  }

  private spawnEntities() {
    for (const spawn of this.formationSpawns()) {
      const { x, y } = this.toPixel(spawn.nx, spawn.ny);
      this.players.push(new PlayerEntity(this, spawn, x, y));
    }
    this.ball = new BallEntity(this, FIELD_ORIGIN.x + FIELD.width / 2, FIELD_ORIGIN.y + FIELD.height / 2);
  }

  private setupCollisions() {
    for (const p of this.players) {
      this.physics.add.collider(p.sprite, this.walls);
      this.physics.add.collider(p.sprite, this.ball.sprite, () => {
        this.ball.lastTouchedBy = p.team;
      });
    }
    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        this.physics.add.collider(this.players[i].sprite, this.players[j].sprite);
      }
    }
    this.physics.add.collider(this.ball.sprite, this.walls);

    this.physics.add.overlap(this.ball.sprite, this.homeGoalZone, () => this.onGoalScored("away"));
    this.physics.add.overlap(this.ball.sprite, this.awayGoalZone, () => this.onGoalScored("home"));
  }

  private setupDesktopControls() {
    const kb = this.input.keyboard;
    if (!kb) return;
    this.cursors = kb.createCursorKeys();
    this.wasd = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.passKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.shootKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  private setupTouchControlsIfNeeded() {
    const isTouch = this.sys.game.device.input.touch;
    if (!isTouch) return;

    // Allow the joystick + a kick button to be held down simultaneously.
    this.input.addPointer(2);

    const canvas = this.sys.game.canvas;
    canvas.style.touchAction = "none";

    this.joystick = new VirtualJoystick(this, 90, CANVAS_H - 90);
    this.shootButton = new TouchButton(this, CANVAS_W - 60, CANVAS_H - 100, 34, "TIRO", () => {
      this.wantShoot = true;
    });
    this.passButton = new TouchButton(this, CANVAS_W - 140, CANVAS_H - 60, 28, "PASE", () => {
      this.wantPass = true;
    });
  }

  private getHumanMoveVector(): { x: number; y: number } {
    if (this.joystick) {
      const v = this.joystick.getVector();
      if (v.x !== 0 || v.y !== 0) return v;
    }
    let x = 0;
    let y = 0;
    if (this.cursors?.left.isDown || this.wasd?.left.isDown) x -= 1;
    if (this.cursors?.right.isDown || this.wasd?.right.isDown) x += 1;
    if (this.cursors?.up.isDown || this.wasd?.up.isDown) y -= 1;
    if (this.cursors?.down.isDown || this.wasd?.down.isDown) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.SQRT2;
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  update(_time: number, delta: number) {
    this.frameCounter++;

    const human = this.players.find((p) => p.isHuman);
    if (human) {
      human.input = this.getHumanMoveVector();
      if (human.input.x !== 0 || human.input.y !== 0) {
        human.facingAngle = Math.atan2(human.input.y, human.input.x);
      }
      if (this.shootKey?.isDown || this.wantShoot) {
        this.tryKick(human, { speed: PHYSICS.shotSpeed, isShot: true });
        this.wantShoot = false;
      } else if (this.passKey?.isDown || this.wantPass) {
        this.tryKick(human, { speed: PHYSICS.passSpeed, isShot: false });
        this.wantPass = false;
      }
    }

    this.runAi();

    this.physicsAccumulator += delta;
    while (this.physicsAccumulator >= PHYSICS.FIXED_STEP_MS) {
      this.fixedPhysicsUpdate();
      this.physicsAccumulator -= PHYSICS.FIXED_STEP_MS;
    }

    this.sanitizeBodies();
    this.syncVisuals();
  }

  private fixedPhysicsUpdate() {
    const now = this.time.now;

    for (const p of this.players) {
      const body = p.sprite.body as Phaser.Physics.Arcade.Body;

      body.velocity.x *= PHYSICS.playerDamping;
      body.velocity.y *= PHYSICS.playerDamping;

      if (p.lunge.active) {
        if (now >= p.lunge.until) {
          p.lunge.active = false;
        } else {
          body.velocity.x += p.lunge.vx;
          body.velocity.y += p.lunge.vy;
        }
      }

      body.velocity.x += p.input.x * PHYSICS.playerAccelPerTick;
      body.velocity.y += p.input.y * PHYSICS.playerAccelPerTick;
    }

    const ballBody = this.ball.sprite.body as Phaser.Physics.Arcade.Body;
    ballBody.velocity.x *= PHYSICS.ballDamping;
    ballBody.velocity.y *= PHYSICS.ballDamping;
  }

  private syncVisuals() {
    for (const p of this.players) p.syncVisual();
    this.ball.syncVisual();
  }

  /** Safety net: recover any body that went NaN/Infinity back to its spawn. */
  private sanitizeBodies() {
    for (const p of this.players) {
      const b = p.sprite.body as Phaser.Physics.Arcade.Body;
      if (!Number.isFinite(p.sprite.x) || !Number.isFinite(p.sprite.y) || !Number.isFinite(b.velocity.x) || !Number.isFinite(b.velocity.y)) {
        p.sprite.setPosition(p.spawnX, p.spawnY);
        b.setVelocity(0, 0);
      }
    }
    const bb = this.ball.sprite.body as Phaser.Physics.Arcade.Body;
    if (!Number.isFinite(this.ball.sprite.x) || !Number.isFinite(this.ball.sprite.y) || !Number.isFinite(bb.velocity.x) || !Number.isFinite(bb.velocity.y)) {
      this.resetBallToCenter();
    }
  }

  private tryKick(p: PlayerEntity, kind: KickKind) {
    if (this.time.now - p.lastKickAt < PHYSICS.kickCooldownMs) return;

    const dx = this.ball.sprite.x - p.sprite.x;
    const dy = this.ball.sprite.y - p.sprite.y;
    const dist = Math.hypot(dx, dy);
    if (!Number.isFinite(dist) || dist > PHYSICS.kickRange + PHYSICS.playerRadius + PHYSICS.ballRadius) return;

    const angle = p.facingAngle;
    const vx = Math.cos(angle) * kind.speed;
    const vy = Math.sin(angle) * kind.speed;
    if (!Number.isFinite(vx) || !Number.isFinite(vy)) return;

    const ballBody = this.ball.sprite.body as Phaser.Physics.Arcade.Body;
    ballBody.setVelocity(vx, vy);
    this.ball.lastTouchedBy = p.team;

    p.lastKickAt = this.time.now;
    p.lunge = {
      active: true,
      until: this.time.now + PHYSICS.lungeDurationMs,
      vx: Math.cos(angle) * PHYSICS.lungeSpeed * (PHYSICS.FIXED_STEP_MS / 1000) * 4,
      vy: Math.sin(angle) * PHYSICS.lungeSpeed * (PHYSICS.FIXED_STEP_MS / 1000) * 4,
    };

    this.kickFeedback(this.ball.sprite.x, this.ball.sprite.y, kind.isShot);
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

    if (isShot) {
      this.cameras.main.shake(80, 0.005);
    }
  }

  private runAi() {
    if (this.frameCounter % AI.decisionEveryNFrames !== 0) return;

    const nearestByTeam = new Map<Team, PlayerEntity>();
    for (const team of ["home", "away"] as Team[]) {
      let best: PlayerEntity | null = null;
      let bestDist = Infinity;
      for (const p of this.players) {
        if (p.team !== team) continue;
        const dx = this.ball.sprite.x - p.sprite.x;
        const dy = this.ball.sprite.y - p.sprite.y;
        const d = Math.hypot(dx, dy);
        if (Number.isFinite(d) && d < bestDist) {
          bestDist = d;
          best = p;
        }
      }
      if (best) nearestByTeam.set(team, best);
    }

    for (const p of this.players) {
      if (p.isHuman) continue;
      if (p.role === "GK") {
        this.aiGoalkeeper(p);
      } else if (nearestByTeam.get(p.team) === p) {
        this.aiChase(p);
      } else {
        this.aiSupport(p);
      }
    }
  }

  private aiGoalkeeper(p: PlayerEntity) {
    const midY = FIELD_ORIGIN.y + FIELD.height / 2;
    const ownGoalX = p.team === "home" ? FIELD_ORIGIN.x + 26 : FIELD_ORIGIN.x + FIELD.width - 26;
    const ballInBox =
      p.team === "home"
        ? this.ball.sprite.x < FIELD_ORIGIN.x + 130
        : this.ball.sprite.x > FIELD_ORIGIN.x + FIELD.width - 130;

    const targetX = ballInBox ? Phaser.Math.Linear(ownGoalX, this.ball.sprite.x, 0.35) : ownGoalX;
    const targetY = Phaser.Math.Clamp(this.ball.sprite.y, midY - FIELD.goalWidth / 2 + 10, midY + FIELD.goalWidth / 2 - 10);

    this.aiMoveToward(p, targetX, targetY);

    if (ballInBox) this.tryKick(p, { speed: PHYSICS.passSpeed, isShot: false });
  }

  private aiChase(p: PlayerEntity) {
    this.aiMoveToward(p, this.ball.sprite.x, this.ball.sprite.y);

    const opponentGoalX = p.team === "home" ? FIELD_ORIGIN.x + FIELD.width : FIELD_ORIGIN.x;
    const midY = FIELD_ORIGIN.y + FIELD.height / 2;
    const distToBall = Math.hypot(this.ball.sprite.x - p.sprite.x, this.ball.sprite.y - p.sprite.y);
    if (distToBall <= PHYSICS.kickRange + PHYSICS.playerRadius + PHYSICS.ballRadius) {
      const distToGoal = Math.hypot(opponentGoalX - p.sprite.x, midY - p.sprite.y);
      const shooting = distToGoal < 320;
      p.facingAngle = Math.atan2(midY - p.sprite.y, opponentGoalX - p.sprite.x);
      this.tryKick(p, shooting ? { speed: PHYSICS.shotSpeed, isShot: true } : { speed: PHYSICS.passSpeed, isShot: false });
    }
  }

  private aiSupport(p: PlayerEntity) {
    const possession = this.ball.lastTouchedBy;
    const attacking = possession === p.team;
    const baseX = p.team === "home" ? FIELD_ORIGIN.x + FIELD.width * (attacking ? 0.55 : 0.3) : FIELD_ORIGIN.x + FIELD.width * (attacking ? 0.45 : 0.7);
    const roleOffsetY = p.role === "DEF" ? -60 : p.role === "MID" ? 0 : 60;
    const targetY = Phaser.Math.Clamp(
      this.ball.sprite.y + roleOffsetY,
      FIELD_ORIGIN.y + 40,
      FIELD_ORIGIN.y + FIELD.height - 40,
    );
    this.aiMoveToward(p, baseX, targetY);
  }

  private aiMoveToward(p: PlayerEntity, targetX: number, targetY: number) {
    const dx = targetX - p.sprite.x;
    const dy = targetY - p.sprite.y;
    const dist = Math.hypot(dx, dy);

    if (!Number.isFinite(dist) || dist < 4) {
      p.input = { x: 0, y: 0 };
      return;
    }

    const angle = Math.atan2(dy, dx);
    if (!Number.isFinite(angle)) {
      p.input = { x: 0, y: 0 };
      return;
    }

    p.facingAngle = angle;
    p.input = { x: Math.cos(angle), y: Math.sin(angle) };
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
      (p.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      p.lunge.active = false;
    }
    this.resetBallToCenter();
  }

  private resetBallToCenter() {
    if (!this.ball.sprite.body) return;
    this.ball.sprite.setPosition(FIELD_ORIGIN.x + FIELD.width / 2, FIELD_ORIGIN.y + FIELD.height / 2);
    (this.ball.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
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
