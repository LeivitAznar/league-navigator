import Phaser from "phaser";

/** Top-down field: no gravity. Debug off (visual physics outlines add noise). */
export const ARCADE_WORLD_CONFIG: Phaser.Types.Physics.Arcade.ArcadeWorldConfig = {
  gravity: { x: 0, y: 0 },
  debug: false,
};

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
      default: "arcade",
      arcade: ARCADE_WORLD_CONFIG,
    },
    input: {
      activePointers: 3,
    },
    scene: scenes,
  };
}
