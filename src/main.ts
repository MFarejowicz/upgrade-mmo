import * as Phaser from "phaser";
import Scenes from "./scenes";

const gameConfig: Phaser.Types.Core.GameConfig = {
  title: "Sample",

  type: Phaser.AUTO,

  width: window.innerWidth,
  height: window.innerHeight,

  physics: {
    default: "arcade",
    arcade: {
      debug: true,
    },
  },

  scene: Scenes,

  parent: "game",
  backgroundColor: "#000000",
};

export const game = new Phaser.Game(gameConfig);
