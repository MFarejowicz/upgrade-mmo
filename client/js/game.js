const GAME_WORLD_SIZE = 2048;
const HALF_GAME_WORLD_SIZE = GAME_WORLD_SIZE / 2;
const PLAYER_SPEED = 100;

class BootScene extends Phaser.Scene {
  constructor() {
    super({
      key: "BootScene",
      active: true,
    });
  }

  preload() {
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

    this.createMap();
    this.createPlayer();
    this.updateCamera();
    this.createEnemies();
    this.getInput();
  }

  createMap() {
    // set world texture
    this.map = this.add.tileSprite(
      0,
      0,
      GAME_WORLD_SIZE,
      GAME_WORLD_SIZE,
      "back1"
    );

    // set world bounds
    this.physics.world.setBounds(
      -HALF_GAME_WORLD_SIZE,
      -HALF_GAME_WORLD_SIZE,
      GAME_WORLD_SIZE,
      GAME_WORLD_SIZE
    );
  }

  createPlayer() {
    // set player sprite
    this.player = this.physics.add.sprite(0, 0, "player");
    // set player scale
    this.player.setScale(0.2);
    // ensure player stops at world bounds
    this.player.setCollideWorldBounds(true);
  }

  updateCamera() {
    // ensure camera stops at world bounds
    this.cameras.main.setBounds(
      -HALF_GAME_WORLD_SIZE,
      -HALF_GAME_WORLD_SIZE,
      GAME_WORLD_SIZE,
      GAME_WORLD_SIZE
    );
    // set camera to follow player
    this.cameras.main.startFollow(this.player);
  }

  createEnemies() {
    // create group for enemies
    this.spawns = this.physics.add.group({
      classType: Phaser.GameObjects.Zone,
    });

    // spawn enemies
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.RND.between(
        -HALF_GAME_WORLD_SIZE,
        HALF_GAME_WORLD_SIZE
      );
      const y = Phaser.Math.RND.between(
        -HALF_GAME_WORLD_SIZE,
        HALF_GAME_WORLD_SIZE
      );

      this.spawns.create(x, y, 20, 20);
    }

    // set colliding function
    this.physics.add.overlap(
      this.player,
      this.spawns,
      this.onMeetEnemy,
      false,
      this
    );
  }

  onMeetEnemy(player, enemy) {
    // move the enemy to another location
    enemy.x = Phaser.Math.RND.between(
      -HALF_GAME_WORLD_SIZE,
      HALF_GAME_WORLD_SIZE
    );
    enemy.y = Phaser.Math.RND.between(
      -HALF_GAME_WORLD_SIZE,
      HALF_GAME_WORLD_SIZE
    );
  }

  update() {
    this.player.body.setVelocity(0);

    // horizontal movement
    if (this.wasd.left.isDown) {
      this.player.body.setVelocityX(-PLAYER_SPEED);
    } else if (this.wasd.right.isDown) {
      this.player.body.setVelocityX(PLAYER_SPEED);
    }

    // vertical movement
    if (this.wasd.up.isDown) {
      this.player.body.setVelocityY(-PLAYER_SPEED);
    } else if (this.wasd.down.isDown) {
      this.player.body.setVelocityY(PLAYER_SPEED);
    }
  }

  getInput() {
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
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
