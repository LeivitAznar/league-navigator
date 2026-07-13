import Phaser from "phaser";
import { MatchScene } from "@/game/match-scene";

/**
 * Boots a Phaser game instance into the given parent element.
 * Uses Scale.FIT + CENTER_BOTH so the canvas scales to fill
 * `#match-canvas-root` (which is already sized to 100% of the
 * match viewport by the surrounding React layout).
 */
export function createMatchGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1280,
    height: 720,
    backgroundColor: "#1f7a3d",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: { debug: false },
    },
    scene: [MatchScene],
  });
}
