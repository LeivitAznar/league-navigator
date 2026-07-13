import Phaser from "phaser";

/**
 * MatchScene
 * ------------------------------------------------------------------
 * First pass at the real match gameplay scene. Renders a simple pitch,
 * a center circle and a ball so we have a live Phaser canvas mounted
 * inside the existing `#match-canvas-root` container. Gameplay
 * (player controllers, physics, AI, goal detection, etc.) gets built
 * out on top of this scene incrementally.
 */
export class MatchScene extends Phaser.Scene {
  constructor() {
    super("MatchScene");
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x1f7a3d);

    // Pitch markings: outer boundary + halfway line + center circle.
    const lines = this.add.graphics();
    lines.lineStyle(2, 0xffffff, 0.45);
    lines.strokeRect(20, 20, width - 40, height - 40);
    lines.lineBetween(width / 2, 20, width / 2, height - 20);
    lines.strokeCircle(width / 2, height / 2, Math.min(width, height) * 0.12);

    // Ball placeholder at kickoff position.
    this.add.circle(width / 2, height / 2, 8, 0xffffff).setStrokeStyle(1, 0x000000, 0.6);
  }
}
