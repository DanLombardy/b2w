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

//add tilemap and tilemap physics
  map = game.add.tilemap('map');
  map.addTilesetImage('kenney');
  layer = map.createLayer('Tile Layer 1');
  layer.resizeWorld();
  var slopeMap = { '32': 1, '77': 1, '95': 2, '36': 3, '137': 3, '140': 2 };
  tiles = game.physics.ninja.convertTilemap(map, layer, slopeMap);

//add player and initialize ninja physics on it
  player = game.add.sprite(0, 20, 'ball')
  game.physics.ninja.enableCircle(player,player.width/2)
  player.body.collideWorldBounds = true;
  player.body.bounce = 0.2

//game camera follows player
  game.camera.follow(player)

//add cursors
  cursors = game.input.keyboard.createCursorKeys()

}

function update(){

  for (var i = 0; i < tiles.length; i++)
    {
        player.body.circle.collideCircleVsTile(tiles[i].tile);

    }

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


}
