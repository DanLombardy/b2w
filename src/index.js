var game = new Phaser.Game(800, 750, Phaser.AUTO, '',{
  preload: preload, create: create, update, update
})

function preload(){
  game.load.image('ground', 'assets/sprites/platform.png')
  game.load.image('ball', 'assets/sprites/orb-blue.png', 50, 50)
  game.load.image('ball2', 'assets/sprites/orb-red.png', 50, 50)
  game.load.image('line', 'assets/sprites/line.PNG', 200, 4)
  game.load.tilemap('map', 'assets/tilemaps/maps/ninja-tilemap.json', null, Phaser.Tilemap.TILED_JSON);
  game.load.image('kenney', 'assets/tilemaps/tiles/kenney.png');
}

var playerLedges
var playerLedge
var px
var py
var player
var platforms
var ground
var ledge
var cursors
var switchButton
var killCount = 0
var map
var tiles
var layer

function create(){
//set up initial system environment
  game.physics.startSystem(Phaser.Physics.NINJA)
  game.stage.backgroundColor = 0x4488cc

//add group for ground and standard ledges and config
  platforms = game.add.group();

  ground = platforms.create(0, game.world.height - 64, 'ground');
  ground.scale.setTo(2, 2);

  game.physics.ninja.enable(ground);
  ground.body.immovable = true;
  ground.body.gravityScale = 0;

  ledge = platforms.create(400, 400, 'ground');

  game.physics.ninja.enable(ledge);
  ledge.body.immovable = true;
  ledge.body.gravityScale = 0;

  ledge = platforms.create(-150, 250, 'ground');

  game.physics.ninja.enable(ledge);
  ledge.body.immovable = true;
  ledge.body.gravityScale = 0;
//add player and initialize ninja physics on it
  player = game.add.sprite(0, 20, 'ball')
  game.physics.ninja.enable(player)
  // game.physics.ninja.enableCircle(player,player.width/2)


  player.body.collideWorldBounds = true;
  player.body.bounce = 0.2
//game camera follows player
  game.camera.follow(player)
//add playerLedge group and capabilites
  playerLedges = game.add.group()

  //add cursors
  cursors = game.input.keyboard.createCursorKeys()
  switchButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)

}

function update(){
//add collision for players, platforms, and playerLedges
  game.physics.ninja.collide(player, platforms)
  game.physics.ninja.collide(player, playerLedges)


//add basic movement and jump to cursors
  if (cursors.left.isDown)
  {
     player.body.moveLeft(150);

  }
  if (cursors.right.isDown)
  {
     player.body.moveRight(150);

  }

  if (cursors.up.isDown && player.body.touching.down)
  {
     player.body.moveUp(350)
  }
  if (switchButton.isDown && killCount === 0  ) {

     player.kill();



     px = player.body.x;
     py = player.body.y;

     // playerledge = game.add.sprite(px + i*60, py, 'playerledge');
     playerLedge = playerLedges.create(px, py, 'line')
     playerLedges.add(playerLedge);
     game.physics.arcade.enable(playerLedge);
     playerLedge.body.gravity.y = 0;
     playerLedge.body.immovable = true;
     killCount = 1;
  }
     if (cursors.down.isDown && killCount === 1  ) {
       player.revive();
       player.body.x = 0;
       // player.body.position.y = game.world.height - 100;
       player.body.y = 0;
       killCount = 0;
     }

  }
