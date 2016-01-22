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
  game.load.image('spring', 'assets/sprites/spring-4-small.png')
}

var playerLedges
var playerSprings
var playerSpring
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

//add tilemap and tilemap physics
  map = game.add.tilemap('map');
  map.addTilesetImage('kenney');
  layer = map.createLayer('Tile Layer 1');
  layer.resizeWorld();
  var slopeMap = { '32': 1, '77': 1, '95': 2, '36': 3, '137': 3, '140': 2 };
  tiles = game.physics.ninja.convertTilemap(map, layer, slopeMap);

//add player and initialize ninja physics on it
  player = game.add.sprite(0, 20, 'ball')

  game.physics.ninja.enable(player)

  player.body.collideWorldBounds = true;
  player.body.bounce = 0.2

//game camera follows player
  game.camera.follow(player)

//add cursors
  cursors = game.input.keyboard.createCursorKeys()
  switchButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)

  //add group for ground and standard ledges and config
    platforms = game.add.group();



    ledge = platforms.create(700, 400, 'ground');

    game.physics.ninja.enable(ledge);
    ledge.body.immovable = true;
    ledge.body.gravityScale = 0;

    ledge = platforms.create(-150, 250, 'ground');

    game.physics.ninja.enable(ledge);
    ledge.body.immovable = true;
    ledge.body.gravityScale = 0;

    //add playerSpring group and capabilites
    playerSprings = game.add.group()

}

function update(){

  //add collision for players, platforms, and playerSprings
    game.physics.ninja.collide(player, platforms)
    game.physics.ninja.collide(player, playerSprings, springAccel)


  for (var i = 0; i < tiles.length; i++)
    {
      player.body.aabb.collideAABBVsTile(tiles[i].tile);
    }

//add basic movement and jump to cursors
  if (cursors.left.isDown )
  {
     player.body.moveLeft(150);

  }
  if (cursors.right.isDown)
  {
     player.body.moveRight(150);

  }

  if (cursors.up.isDown && player.body.touching.down )
  {
     player.body.moveUp(350)
  }

  if (switchButton.isDown && player.body.touching.down ) {

     player.kill();

     px = player.body.x;
     py = player.body.y;

     playerSpring = playerSprings.create(px, py, 'spring')
     playerSprings.add(playerSpring);
     game.physics.ninja.enable(playerSpring);
     playerSpring.body.gravityScale = 0;

     playerSpring.body.immovable = true;
     killCount = 1;
  }

  if (cursors.down.isDown && killCount === 1  ) {
    player.revive();
    player.body.x = px;
    // player.body.position.y = game.world.height - 100;
    player.body.y = py;
    killCount = 0;
  }

  if (cursors.down.isDown && killCount === 1  ) {
    player.revive();
    player.body.x = px;
    // player.body.position.y = game.world.height - 100;
    player.body.y = py;
    killCount = 0;
  }

  function springAccel(){
    player.body.moveUp(1000)
  }

}
