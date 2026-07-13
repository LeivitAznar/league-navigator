import Phaser from "phaser";
import { buildGameConfig } from "@/game/config";
import { getCanvasSize, MatchScene, type MatchSceneEvents } from "@/game/match-scene";

/**
 * Boots a Phaser game instance (Matter physics) into the given parent
 * element. Uses Scale.FIT + CENTER_BOTH so the canvas scales to fill
 * `#match-canvas-root` (already sized to 100% of the match viewport by the
 * surrounding React layout).
 */
export function createMatchGame(parent: HTMLElement, events: MatchSceneEvents = {}): Phaser.Game {
  const { width, height } = getCanvasSize();
  return new Phaser.Game(buildGameConfig(parent, width, height, [new MatchScene(events)]));
}
