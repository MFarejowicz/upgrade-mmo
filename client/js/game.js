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
    this.load.image("back1", "img/back1.png");
    this.load.image("player", "img/think.png");
    this.load.image("enemy", "img/angry.png");
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
    this.otherPlayers = this.physics.add.group();

    this.createMap();
    this.createEnemies();
    this.getInput();

    // listen for web socket events
    this.socket.on("currentPlayers", (players) => {
      Object.keys(players).forEach((id) => {
        if (players[id].playerId === this.socket.id) {
          this.createPlayer(players[id]);
        } else {
          this.addOtherPlayer(players[id]);
        }
      });
    });

    this.socket.on("newPlayer", (playerInfo) => {
      this.addOtherPlayer(playerInfo);
    });

    this.socket.on("disconnect", (playerId) => {
      this.otherPlayers.getChildren().forEach((player) => {
        if (playerId === player.playerId) {
          player.destroy();
        }
      });
    });
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

  createPlayer(playerInfo) {
    // our player sprite created through the physics system
    this.player = this.add.sprite(0, 0, "player");

    this.container = this.add.container(playerInfo.x, playerInfo.y);
    this.container.setSize(64, 64);
    this.physics.world.enable(this.container);
    this.container.add(this.player);

    // update camera
    this.updateCamera();

    // don't go out of the map
    this.container.body.setCollideWorldBounds(true);
    this.physics.add.collider(this.container, this.spawns);
  }

  addOtherPlayer(playerInfo) {
    const otherPlayer = this.add.sprite(playerInfo.x, playerInfo.y, "player");
    otherPlayer.setTint(Math.random() * 0xffffff);
    otherPlayer.playerId = playerInfo.playerId;
    this.otherPlayers.add(otherPlayer);
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
    this.cameras.main.startFollow(this.container);
  }

  createEnemies() {
    // create group for enemies
    this.spawns = this.physics.add.group();

    // spawn enemies
    for (let i = 0; i < 20; i++) {
      const location = this.getValidLocation();
      const enemy = this.spawns.create(location.x, location.y, "enemy");
      enemy.body.setCollideWorldBounds(true);
      enemy.body.setImmovable();
    }
  }

  getValidLocation() {
    let validLocation = false;
    let x, y;

    while (!validLocation) {
      x = Phaser.Math.RND.between(-HALF_GAME_WORLD_SIZE, HALF_GAME_WORLD_SIZE);
      y = Phaser.Math.RND.between(-HALF_GAME_WORLD_SIZE, HALF_GAME_WORLD_SIZE);

      let occupied = false;
      this.spawns.getChildren().forEach((child) => {
        const childOrigin = child.getTopLeft();
        const childWidth = child.width;
        const childHeight = child.height;
        const overlapRectangle = new Phaser.Geom.Rectangle(
          childOrigin.x - 1.5 * childWidth,
          childOrigin.y - 1.5 * childHeight,
          3 * childWidth,
          3 * childHeight
        );
        if (overlapRectangle.contains(x, y)) {
          occupied = true;
        }
      });
      if (!occupied) validLocation = true;
    }

    return { x, y };
  }

  // onMeetEnemy(player, enemy) {
  //   // move the enemy to another location
  //   enemy.x = Phaser.Math.RND.between(
  //     -HALF_GAME_WORLD_SIZE,
  //     HALF_GAME_WORLD_SIZE
  //   );
  //   enemy.y = Phaser.Math.RND.between(
  //     -HALF_GAME_WORLD_SIZE,
  //     HALF_GAME_WORLD_SIZE
  //   );
  // }

  update() {
    if (this.container) {
      this.container.body.setVelocity(0);

      // horizontal movement
      if (this.wasd.left.isDown) {
        this.container.body.setVelocityX(-PLAYER_SPEED);
      } else if (this.wasd.right.isDown) {
        this.container.body.setVelocityX(PLAYER_SPEED);
      }

      // vertical movement
      if (this.wasd.up.isDown) {
        this.container.body.setVelocityY(-PLAYER_SPEED);
      } else if (this.wasd.down.isDown) {
        this.container.body.setVelocityY(PLAYER_SPEED);
      }
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
