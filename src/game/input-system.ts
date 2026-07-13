import Phaser from "phaser";
import { TouchButton, VirtualJoystick } from "@/game/virtual-joystick";

/**
 * InputSystem
 * ------------------------------------------------------------------
 * Single source of truth for "what does the human player want to do right
 * now". No smoothing, no interpolation — every read reflects the current
 * hardware state so control feels immediate. Desktop (WASD/arrows + X/Space)
 * and touch (joystick + two independently-bound buttons) both funnel into
 * the same `getMoveVector()` / `consumePass()` / `consumeShoot()` API so the
 * rest of the game never needs to know which input method is active.
 */
export class InputSystem {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private passKey?: Phaser.Input.Keyboard.Key;
  private shootKey?: Phaser.Input.Keyboard.Key;

  private joystick: VirtualJoystick | null = null;
  private passButton: TouchButton | null = null;
  private shootButton: TouchButton | null = null;
  private touchWantPass = false;
  private touchWantShoot = false;

  constructor(private scene: Phaser.Scene) {
    this.setupDesktop();
    this.setupTouchIfNeeded();
  }

  private setupDesktop() {
    const kb = this.scene.input.keyboard;
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

  private setupTouchIfNeeded() {
    const isTouch = this.scene.sys.game.device.input.touch;
    if (!isTouch) return;

    // Allow the joystick + a kick button to be held simultaneously.
    this.scene.input.addPointer(2);
    this.scene.sys.game.canvas.style.touchAction = "none";

    const canvasW = this.scene.sys.game.canvas.width;
    const canvasH = this.scene.sys.game.canvas.height;

    this.joystick = new VirtualJoystick(this.scene, 90, canvasH - 90);
    this.shootButton = new TouchButton(this.scene, canvasW - 60, canvasH - 100, 34, "TIRO", () => {
      this.touchWantShoot = true;
    });
    this.passButton = new TouchButton(this.scene, canvasW - 140, canvasH - 60, 28, "PASE", () => {
      this.touchWantPass = true;
    });
  }

  getMoveVector(): { x: number; y: number } {
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

  /** True while the shoot input is held (key or button). */
  wantsShoot(): boolean {
    const want = !!this.shootKey?.isDown || this.touchWantShoot;
    this.touchWantShoot = false;
    return want;
  }

  /** True while the pass input is held (key or button). */
  wantsPass(): boolean {
    const want = !!this.passKey?.isDown || this.touchWantPass;
    this.touchWantPass = false;
    return want;
  }

  destroy() {
    this.joystick?.destroy();
    this.passButton?.destroy();
    this.shootButton?.destroy();
  }
}
