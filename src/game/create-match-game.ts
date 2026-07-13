import Phaser from "phaser";
import { getCanvasSize, MatchScene, type MatchSceneEvents } from "@/game/match-scene";

/**
 * Boots a Phaser game instance into the given parent element.
 * Uses Scale.FIT + CENTER_BOTH so the canvas scales to fill
 * `#match-canvas-root` (which is already sized to 100% of the
 * match viewport by the surrounding React layout).
 */
export function createMatchGame(parent: HTMLElement, events: MatchSceneEvents = {}): Phaser.Game {
  const { width, height } = getCanvasSize();

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width,
    height,
    backgroundColor: "#0b3d1f",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    input: {
      activePointers: 3,
    },
    scene: [new MatchScene(events)],
  });
}
