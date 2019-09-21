const sceneConfig = {
  active: false,
  visible: false,
  key: "Game",
};

class GameScene extends Phaser.Scene {
  constructor() {
    super(sceneConfig);
  }

  create() {
    this.square = this.add.rectangle(400, 400, 100, 100, 0xffffff);
    this.physics.add.existing(this.square);
  }

  update() {
    const cursorKeys = this.input.keyboard.createCursorKeys();

    if (cursorKeys.up.isDown) {
      this.square.body.setVelocityY(-500);
    } else if (cursorKeys.down.isDown) {
      this.square.body.setVelocityY(500);
    } else {
      this.square.body.setVelocityY(0);
    }

    if (cursorKeys.right.isDown) {
      this.square.body.setVelocityX(500);
    } else if (cursorKeys.left.isDown) {
      this.square.body.setVelocityX(-500);
    } else {
      this.square.body.setVelocityX(0);
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
      debug: true,
    },
  },
  scene: GameScene,
};

const game = new Phaser.Game(gameConfig);

window.addEventListener("resize", () => {
  game.scale.setGameSize(window.innerWidth, window.innerHeight);
});
