import Phaser from "phaser";
import { buildGameConfig } from "@/game/config";
import { getCanvasSize, MatchScene, type MatchSceneEvents } from "@/game/match-scene";

/**
 * Boots a Phaser game instance (Arcade physics) into the given parent
 * element. Uses Scale.FIT + CENTER_BOTH so the canvas scales to fill
 * `#match-canvas-root`. Callers are responsible for the mount/unmount
 * lifecycle (single-instance guard, destroy(true) on unmount) — see
 * MatchViewport in src/routes/match.tsx.
 */
export function createMatchGame(parent: HTMLElement, events: MatchSceneEvents = {}): Phaser.Game {
  const { width, height } = getCanvasSize();
  return new Phaser.Game(buildGameConfig(parent, width, height, [new MatchScene(events)]));
}
