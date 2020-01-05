const GAME_WORLD_SIZE = 2048;
const HALF_GAME_WORLD_SIZE = GAME_WORLD_SIZE / 2;
const PLAYER_SPEED = 150;
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
    this.load.image("sword", "img/sword.png");
  }

  create() {
    this.scene.start("WorldScene");
    this.scene.start("HUDScene");
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

    this.mouseMoved = false;
    this.input.on("pointermove", () => {
      this.mouseMoved = true;
    });

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

    this.socket.on("playerMoved", (playerInfo) => {
      this.otherPlayers.getChildren().forEach((player) => {
        if (playerInfo.playerId === player.playerId) {
          player.setPosition(playerInfo.x, playerInfo.y);
        }
      });
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
    this.map = this.add.tileSprite(0, 0, GAME_WORLD_SIZE, GAME_WORLD_SIZE, "back1");

    // set world bounds
    this.physics.world.setBounds(
      -HALF_GAME_WORLD_SIZE,
      -HALF_GAME_WORLD_SIZE,
      GAME_WORLD_SIZE,
      GAME_WORLD_SIZE
    );
  }

  createPlayer(playerInfo) {
    this.container = this.add.container(playerInfo.x, playerInfo.y);
    this.physics.world.enable(this.container);
    this.container.setSize(60, 60);

    // our player sprite created through the physics system
    this.player = this.add.sprite(0, 0, "player");
    this.container.add(this.player);

    // add weapon
    this.weapon = this.add.sprite(0, -44, "sword");
    this.weapon.setScale(0.2);
    this.weapon.setSize(8, 8);
    this.physics.world.enable(this.weapon);

    this.container.add(this.weapon);
    this.attacking = false;
    this.input.on("pointerdown", () => {
      if (!this.attacking) {
        this.attacking = true;
        setTimeout(() => {
          this.attacking = false;
          this.weapon.angle = 0;
        }, 150);
      }
    });

    // update camera
    this.updateCamera();

    // don't go out of the map
    this.container.body.setCollideWorldBounds(true);
    // If you want collisions
    // this.physics.add.collider(this.container, this.spawns);
    this.physics.add.overlap(this.weapon, this.spawns, this.onMeetEnemy, false, this);
  }

  addOtherPlayer(playerInfo) {
    const otherPlayer = this.add.sprite(playerInfo.x, playerInfo.y, "player");
    otherPlayer.setTint(Math.random() * 0xffffff);
    otherPlayer.playerId = playerInfo.playerId;
    this.otherPlayers.add(otherPlayer);
  }

  updateCamera() {
    this.cameras.main.startFollow(this.container);
  }

  createOneEnemy(location) {
    const container = this.add.container(location.x, location.y);

    const sprite = this.add.sprite(0, 0, "enemy");
    container.setSize(sprite.width, sprite.height);
    container.add(sprite);

    container.health = 100;
    const healthBackground = this.add.rectangle(0, -50, 100, 30, 0xff0000);
    healthBackground.name = "healthBackground";
    container.add(healthBackground);
    const healthBar = this.add.rectangle(0, -50, 100, 30, 0x00ff00);
    healthBar.name = "healthBar";
    container.add(healthBar);

    return container;
  }

  createEnemies() {
    // create group for enemies
    this.spawns = this.physics.add.group();

    // spawn enemies
    for (let i = 0; i < 20; i++) {
      const location = this.getValidLocation();
      const enemy = this.createOneEnemy(location);
      this.spawns.add(enemy);

      this.physics.world.enable(enemy);
      enemy.body.setCollideWorldBounds(true);
    }

    // move enemies
    this.timedEvent = this.time.addEvent({
      delay: 1000,
      callback: this.moveEnemies,
      callbackScope: this,
      loop: true,
    });
  }

  getValidLocation() {
    let validLocation = false;
    let x, y;

    while (!validLocation) {
      x = Phaser.Math.RND.between(-HALF_GAME_WORLD_SIZE, HALF_GAME_WORLD_SIZE);
      y = Phaser.Math.RND.between(-HALF_GAME_WORLD_SIZE, HALF_GAME_WORLD_SIZE);

      let occupied = false;
      this.spawns.getChildren().forEach((enemy) => {
        // Need getFirst to use sprite and not container
        const enemyOrigin = enemy.getFirst().getTopLeft();
        const enemyWidth = enemy.getFirst().width;
        const enemyHeight = enemy.getFirst().height;
        const overlapRectangle = new Phaser.Geom.Rectangle(
          enemyOrigin.x - 1.5 * enemyWidth,
          enemyOrigin.y - 1.5 * enemyHeight,
          3 * enemyWidth,
          3 * enemyHeight
        );
        if (overlapRectangle.contains(x, y)) {
          occupied = true;
        }
      });
      if (!occupied) validLocation = true;
    }

    return { x, y };
  }

  moveEnemies() {
    this.spawns.getChildren().forEach((enemy) => {
      const randNumber = Math.floor(Math.random() * 4 + 1);

      switch (randNumber) {
        case 1:
          enemy.body.setVelocityX(50);
          break;
        case 2:
          enemy.body.setVelocityX(-50);
          break;
        case 3:
          enemy.body.setVelocityY(50);
          break;
        case 4:
          enemy.body.setVelocityY(50);
          break;
        default:
          enemy.body.setVelocityX(50);
      }
    });

    setTimeout(() => {
      this.spawns.setVelocityX(0);
      this.spawns.setVelocityY(0);
    }, 500);
  }

  onMeetEnemy(_player, enemy) {
    if (this.attacking && !enemy.hasBeenAttacked) {
      enemy.hasBeenAttacked = true;
      enemy.health -= 30;
      if (enemy.health <= 0) {
        enemy.destroy();
        this.events.emit("test");
        return;
      }

      const healthBar = enemy.getByName("healthBar");
      healthBar.width = enemy.health;
      setTimeout(() => {
        enemy.hasBeenAttacked = false;
      }, 150);
    }
  }

  update() {
    if (this.container) {
      this.container.body.setVelocity(0);

      // horizontal movement
      if (this.buttons.left.isDown) {
        this.container.body.setVelocityX(-PLAYER_SPEED);
      } else if (this.buttons.right.isDown) {
        this.container.body.setVelocityX(PLAYER_SPEED);
      }

      // vertical movement
      if (this.buttons.up.isDown) {
        this.container.body.setVelocityY(-PLAYER_SPEED);
      } else if (this.buttons.down.isDown) {
        this.container.body.setVelocityY(PLAYER_SPEED);
      }

      if (this.mouseMoved) {
        this.pointer.updateWorldPoint(this.cameras.main);
        const pointerPoint = {
          x: this.pointer.worldX,
          y: this.pointer.worldY,
        };
        const angleToPointer = Phaser.Math.Angle.BetweenPoints(this.container, pointerPoint);
        this.container.rotation = angleToPointer + Math.PI / 2;
      }

      if (this.attacking) {
        this.weapon.angle += 10;
      }

      // emit player movement
      const x = this.container.x;
      const y = this.container.y;
      if (
        this.container.oldPosition &&
        (x !== this.container.oldPosition.x || y !== this.container.oldPosition.y)
      ) {
        this.socket.emit("playerMovement", { x, y });
      }
      // save old position data
      this.container.oldPosition = {
        x: this.container.x,
        y: this.container.y,
      };
    }
  }

  getInput() {
    this.buttons = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.pointer = this.input.mousePointer;
  }
}

class HUDScene extends Phaser.Scene {
  constructor() {
    super({
      key: "HUDScene",
    });
  }

  create() {
    // Our Text object to display the Score
    const hp = this.add.rectangle(60, 25, 100, 30, 0x00ff00);
    const gold = this.add.text(10, 50, "Gold: 0", {
      font: "30px Arial",
      fill: "#ffffff",
    });

    // Grab a reference to the Game Scene
    const ourGame = this.scene.get("WorldScene");

    // Listen to events from the WorldScene
    ourGame.events.on("test", () => {
      get("/api/gold").then((data) => {
        console.log(data);
      });
    });
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
  scene: [BootScene, WorldScene, HUDScene],
};

const game = new Phaser.Game(gameConfig);

window.addEventListener("resize", () => {
  game.scale.setGameSize(window.innerWidth, window.innerHeight);
});
