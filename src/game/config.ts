import Phaser from "phaser";

/**
 * Matter world configuration. Gravity is off (top-down field). Iteration
 * counts are raised above Matter's defaults (6/4/2) so contact resolution
 * stays stable under fast player/ball collisions — this is what the spec
 * calls out explicitly ("iteraciones del solver") to avoid jitter, tunneling,
 * or bodies getting stuck against each other.
 */
export const MATTER_WORLD_CONFIG = {
  gravity: { x: 0, y: 0 },
  debug: false,
  enableSleeping: false, // bodies must always be responsive, never idle-sleep
  positionIterations: 10,
  velocityIterations: 10,
  constraintIterations: 4,
  fps: 60,
} as const;

export function buildGameConfig(
  parent: HTMLElement,
  width: number,
  height: number,
  scenes: Phaser.Scene[],
): Phaser.Types.Core.GameConfig {
  return {
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
      default: "matter",
      matter: MATTER_WORLD_CONFIG,
    },
    input: {
      activePointers: 3,
    },
    scene: scenes,
  };
}
