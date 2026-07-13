import Phaser from "phaser";
import { CONTROLS } from "@/game/constants";

/**
 * Simple on-screen virtual joystick (Mamoball-style): a fixed base circle +
 * a thumb that follows the pointer within a max radius, exposing a
 * normalized {x, y} vector in [-1, 1]. Bound to its own pointer id once
 * pressed so it doesn't get hijacked by other simultaneous touches — the
 * scene must call `this.input.addPointer(2)` so the joystick and a kick
 * button can be held at the same time.
 */
export class VirtualJoystick {
  private scene: Phaser.Scene;
  private base: Phaser.GameObjects.Arc;
  private thumb: Phaser.GameObjects.Arc;
  private originX: number;
  private originY: number;
  private activePointerId: number | null = null;
  private vector = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.originX = x;
    this.originY = y;

    this.base = scene.add
      .circle(x, y, CONTROLS.joystickRadius, 0x000000, 0.28)
      .setStrokeStyle(2, 0xffffff, 0.35)
      .setScrollFactor(0)
      .setDepth(1000);
    this.thumb = scene.add
      .circle(x, y, CONTROLS.joystickRadius * 0.45, 0xffffff, 0.55)
      .setScrollFactor(0)
      .setDepth(1001);

    scene.input.on("pointerdown", this.onPointerDown, this);
    scene.input.on("pointermove", this.onPointerMove, this);
    scene.input.on("pointerup", this.onPointerUp, this);
    scene.input.on("pointerupoutside", this.onPointerUp, this);
  }

  private withinBase(pointer: Phaser.Input.Pointer) {
    return Phaser.Math.Distance.Between(pointer.x, pointer.y, this.originX, this.originY) <=
      CONTROLS.joystickRadius * 1.6;
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    if (this.activePointerId !== null) return;
    if (!this.withinBase(pointer)) return;
    this.activePointerId = pointer.id;
    this.updateFromPointer(pointer);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (this.activePointerId !== pointer.id) return;
    this.updateFromPointer(pointer);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (this.activePointerId !== pointer.id) return;
    this.activePointerId = null;
    this.vector.x = 0;
    this.vector.y = 0;
    this.thumb.setPosition(this.originX, this.originY);
  }

  private updateFromPointer(pointer: Phaser.Input.Pointer) {
    const dx = pointer.x - this.originX;
    const dy = pointer.y - this.originY;
    const dist = Math.hypot(dx, dy);

    if (dist < CONTROLS.joystickDeadzone) {
      this.vector.x = 0;
      this.vector.y = 0;
      this.thumb.setPosition(this.originX, this.originY);
      return;
    }

    const clamped = Math.min(dist, CONTROLS.joystickRadius);
    const nx = dx / dist;
    const ny = dy / dist;
    this.thumb.setPosition(this.originX + nx * clamped, this.originY + ny * clamped);

    // Normalize against full radius so max deflection = magnitude 1.
    this.vector.x = Phaser.Math.Clamp(dx / CONTROLS.joystickRadius, -1, 1);
    this.vector.y = Phaser.Math.Clamp(dy / CONTROLS.joystickRadius, -1, 1);
  }

  getVector() {
    return this.vector;
  }

  destroy() {
    this.scene.input.off("pointerdown", this.onPointerDown, this);
    this.scene.input.off("pointermove", this.onPointerMove, this);
    this.scene.input.off("pointerup", this.onPointerUp, this);
    this.scene.input.off("pointerupoutside", this.onPointerUp, this);
    this.base.destroy();
    this.thumb.destroy();
  }
}

/**
 * A round on-screen button bound to its own pointer id (independent from
 * the joystick's), so both can be held simultaneously.
 */
export class TouchButton {
  private scene: Phaser.Scene;
  private circle: Phaser.GameObjects.Arc;
  private label: Phaser.GameObjects.Text;
  private activePointerId: number | null = null;
  private pressed = false;
  private onPress: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, radius: number, text: string, onPress: () => void) {
    this.scene = scene;
    this.onPress = onPress;
    this.circle = scene.add
      .circle(x, y, radius, 0xffffff, 0.18)
      .setStrokeStyle(2, 0xffffff, 0.45)
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive({ useHandCursor: true });
    this.label = scene.add
      .text(x, y, text, { fontSize: "13px", fontStyle: "bold", color: "#ffffff" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1001);

    this.circle.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.activePointerId !== null) return;
      this.activePointerId = pointer.id;
      this.pressed = true;
      this.circle.setFillStyle(0xffffff, 0.4);
      this.onPress();
    });
    this.circle.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (this.activePointerId !== pointer.id) return;
      this.release();
    });
    this.circle.on("pointerupoutside", (pointer: Phaser.Input.Pointer) => {
      if (this.activePointerId !== pointer.id) return;
      this.release();
    });
  }

  private release() {
    this.activePointerId = null;
    this.pressed = false;
    this.circle.setFillStyle(0xffffff, 0.18);
  }

  isPressed() {
    return this.pressed;
  }

  destroy() {
    this.circle.destroy();
    this.label.destroy();
  }
}
