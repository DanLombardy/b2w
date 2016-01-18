var game = new Phaser.Game(800, 750, Phaser.AUTO, '',{
  preload: preload, create: create, update, update
});

function preload(){
  game.load.image('ground', 'assets/sprites/platform.png')
  game.load.image('ball', 'assets/sprites/orb-blue.png')
  game.load.image('ball2', 'assets/sprites/orb-red.png')
  game.load.image('line', 'assets/sprites/line.PNG')
  game.load.image('star', 'assets/sprites/star.png')

}

var playerLedges
var playerLedge
var px
var py
var player
var platforms
var ledge
var cursors
var switchButton
var killCount = 0
var winText;
var winSpot;


function create(){

  game.physics.startSystem(Phaser.Physics.ARCADE)

  game.stage.backgroundColor = 0x4488cc

  platforms = game.add.group()

  platforms.enableBody = true

  var ground = platforms.create(0, game.world.height - 64, 'ground')

  ground.scale.setTo(2, 2)

  ground.body.immovable = true

  ledge = platforms.create(400, 400, 'ground')
  ledge.body.immovable = true

  ledge = platforms.create(-150, 250, 'ground')
	ledge.body.immovable = true


  player = game.add.sprite(32, game.world.height - 150, 'ball')

  game.physics.arcade.enable(player)

  player.body.bounce.y = .2
  player.body.gravity.y = 300
  player.body.collideWorldBounds = true

  cursors = game.input.keyboard.createCursorKeys()
  switchButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)

  playerLedges = game.add.group()

  winSpot = game.add.sprite(0, 100, 'star')

  game.physics.arcade.enable(winSpot)

  player.body.bounce.y = .2
  player.body.gravity.y = 300
  player.body.collideWorldBounds = true



}

function update(){
  game.physics.arcade.overlap(player, winSpot, win, null, this);

  game.physics.arcade.collide(player, platforms)
  game.physics.arcade.collide(player, playerLedges)

  player.body.velocity.x = 0

  if (playerLedge) playerLedge.body.velocity.x = 0
  if (switchButton.isDown && killCount === 0  ) {

   player.kill();


   px = player.body.position.x;
   py = player.body.position.y;

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
     player.body.position.x = 0;
     player.body.position.y = game.world.height - 100;
     killCount = 0;
   }

  if (cursors.left.isDown)
  {
     player.body.velocity.x = -150;

  }
  if (cursors.right.isDown)
  {
     player.body.velocity.x = 150;

  }

  if (cursors.up.isDown && player.body.touching.down)
  {
     player.body.velocity.y = -350;
  }
}

function win () {
  winText = game.add.text(16, 16, '', { fontSize: '32px', fill: '#000' });
  winText.text = "you win!"
}
