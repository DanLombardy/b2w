let Phaser = window.Phaser
let game

function initialize(preload, create, update) {
	game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO, '', { preload, create, update })
}

function create() {
	// Set up initial system environment
	game.physics.startSystem(Phaser.Physics.NINJA)
	game.stage.backgroundColor = 0x4488cc
}

Object.assign(module.exports, {
	initialize,
	create,
	getGame: () => { return game }
})
