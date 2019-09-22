class BootScene extends Phaser.Scene {
  constructor() {
    super({
      key: "BootScene",
      active: true,
    });
  }

  preload() {
    // map tiles
    // this.load.image("tiles", "assets/map/spritesheet-extruded.png");
    // map in json format
    // this.load.tilemapTiledJSON("map", "assets/map/map.json");
    // our two characters
    // this.load.spritesheet("player", "assets/RPG_assets.png", {
    //   frameWidth: 16,
    //   frameHeight: 16,
    // });
    this.load.image("player", "img/think.png");
    this.load.image("back1", "img/back1.png");
  }

  create() {
    this.scene.start("WorldScene");
  }
}

class WorldScene extends Phaser.Scene {
  constructor() {
    super({
      key: "WorldScene",
    });
  }

  create() {
    this.socket = io();
    this.back = this.add.tileSprite(
      0,
      0,
      window.innerWidth,
      window.innerHeight,
      "back1"
    );

    this.player = this.physics.add.sprite(0, 0, "player");
    this.player.setScale(0.2);

    this.cameras.main.startFollow(this.player);

    // user input
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  update() {
    this.player.body.setVelocity(0);

    // Horizontal movement
    if (this.wasd.left.isDown) {
      this.player.body.setVelocityX(-80);
      console.log(this.back);
    } else if (this.wasd.right.isDown) {
      this.player.body.setVelocityX(80);
    }

    // Vertical movement
    if (this.wasd.up.isDown) {
      this.player.body.setVelocityY(-80);
    } else if (this.wasd.down.isDown) {
      this.player.body.setVelocityY(80);
    }
  }
}

const gameConfig = {
  title: "upgrade",
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        y: 0,
      },
      debug: true,
    },
  },
  scene: [BootScene, WorldScene],
};

const game = new Phaser.Game(gameConfig);

window.addEventListener("resize", () => {
  game.scale.setGameSize(window.innerWidth, window.innerHeight);
});
