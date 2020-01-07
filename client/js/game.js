const GAME_WORLD_SIZE = 2048;
const HALF_GAME_WORLD_SIZE = GAME_WORLD_SIZE / 2;
const PLAYER_SPEED = 150;
const SHOP_RANGE = 200;

const distanceBetween = (r1, r2) => {
  const dx = r1.x - r2.x;
  const dy = r1.y - r2.y;
  return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
};
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
    this.load.image("shop", "img/wink.png");
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
    this.createShop();
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
    this.playerContainer = this.add.container(playerInfo.x, playerInfo.y);
    this.physics.world.enable(this.playerContainer);

    // our player sprite created through the physics system
    this.player = this.add.sprite(0, 0, "player");
    this.playerContainer.setSize(this.player.width, this.player.height);
    this.playerContainer.add(this.player);

    // add weapon
    this.weapon = this.add.sprite(0, -44, "sword");
    this.weapon.setScale(0.3);
    this.physics.world.enable(this.weapon);

    this.playerContainer.add(this.weapon);
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
    this.playerContainer.body.setCollideWorldBounds(true);
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
    this.cameras.main.startFollow(this.playerContainer);
  }

  createOneEnemy(location) {
    const enemyContainer = this.add.container(location.x, location.y);

    const enemySprite = this.add.sprite(0, 0, "enemy");
    enemyContainer.setSize(enemySprite.width, enemySprite.height);
    enemyContainer.add(enemySprite);

    enemyContainer.health = 100;
    const healthBackground = this.add.rectangle(0, -50, 100, 30, 0xff0000);
    healthBackground.name = "healthBackground";
    enemyContainer.add(healthBackground);
    const healthBar = this.add.rectangle(0, -50, 100, 30, 0x00ff00);
    healthBar.name = "healthBar";
    enemyContainer.add(healthBar);

    return enemyContainer;
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

  createShop() {
    this.add.circle(0, 0, SHOP_RANGE, 0x00ff00, 200);

    this.shopContainer = this.add.container(0, 0);

    // our player sprite created through the physics system
    const shopSprite = this.add.sprite(0, 0, "shop");
    this.shopContainer.add(shopSprite);

    this.shopVisible = false;
  }

  handleShopToggle = () => {
    const distanceToShop = distanceBetween(this.playerContainer, this.shopContainer);
    if (distanceToShop < SHOP_RANGE && !this.shopVisible) {
      this.scene.launch("ShopScene");
      this.shopVisible = true;
    } else {
      this.scene.stop("ShopScene");
      this.shopVisible = false;
    }
  };

  update() {
    if (this.playerContainer) {
      this.playerContainer.body.setVelocity(0);

      // horizontal movement
      if (!this.shopVisible) {
        if (this.buttons.left.isDown) {
          this.playerContainer.body.setVelocityX(-PLAYER_SPEED);
        } else if (this.buttons.right.isDown) {
          this.playerContainer.body.setVelocityX(PLAYER_SPEED);
        }

        // vertical movement
        if (this.buttons.up.isDown) {
          this.playerContainer.body.setVelocityY(-PLAYER_SPEED);
        } else if (this.buttons.down.isDown) {
          this.playerContainer.body.setVelocityY(PLAYER_SPEED);
        }

        if (this.mouseMoved) {
          this.pointer.updateWorldPoint(this.cameras.main);
          const pointerPoint = {
            x: this.pointer.worldX,
            y: this.pointer.worldY,
          };
          const angleToPointer = Phaser.Math.Angle.BetweenPoints(
            this.playerContainer,
            pointerPoint
          );
          this.playerContainer.rotation = angleToPointer + Math.PI / 2;
        }
      }

      if (this.attacking) {
        this.weapon.angle += 10;
      }

      // emit player movement
      const x = this.playerContainer.x;
      const y = this.playerContainer.y;
      if (
        this.playerContainer.oldPosition &&
        (x !== this.playerContainer.oldPosition.x || y !== this.playerContainer.oldPosition.y)
      ) {
        this.socket.emit("playerMovement", { x, y });
      }
      // save old position data
      this.playerContainer.oldPosition = {
        x: this.playerContainer.x,
        y: this.playerContainer.y,
      };
    }
  }

  getInput() {
    this.buttons = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      shop: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    };
    this.pointer = this.input.mousePointer;
    this.buttons.shop.on("down", this.handleShopToggle);
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

class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: "ShopScene" });
  }

  create() {
    const test = this.add.text(200, 200, "MENU!", {
      font: "30px Arial",
      fill: "#ffffff",
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
  scene: [BootScene, WorldScene, HUDScene, ShopScene],
};

const game = new Phaser.Game(gameConfig);

window.addEventListener("resize", () => {
  game.scale.setGameSize(window.innerWidth, window.innerHeight);
});
