// File is written using JS Standard Style with the exception that indentation
// should be *tabs*. Set your preferred number of spaces in your editor, not the
// source file.
//
// https://github.com/JedWatson/happiness

/* TODO: Playback Tasks
	Add the spring from a previous session into the current session
	Wire the playback of previously known states to play on top of the current session
	Rewind functionality
*/

// Prevent global leakage
(function() {
	// Expose Phaser to the local context
	// TODO: Convert this to a require statement once Phaser supports it - https://github.com/photonstorm/phaser/issues/1974
	let Phaser = window.Phaser
	let game = require("./game")
	let ghosts = require("./ghosts")
	let player = require("./player")
	let springs = require("./springs")
	let tiles = require("./tiles")
	let timer = require("./timer")

	let debugKey

	window.onload = initializeGame

	function initializeGame() {
		if (window.innerWidth === 0 || window.innerHeight === 0) {
			return setTimeout(initializeGame, 16)
		}

		game.initialize(preload, create, update)
	}

	function preload() {
		tiles.preload()
		player.preload()
		ghosts.preload()
		springs.preload()
	}

	function create() {
		game.create()
		tiles.create()
		ghosts.create()
		springs.create()
		player.create()
		timer.create()

		debugKey = game.getGame().input.keyboard.addKey(Phaser.KeyCode.W)
	}

	function update() {
		timer.update()
		ghosts.update()
		springs.update()
		tiles.update()
		player.update()

		ghosts.savePlayerState()

		if (debugKey.isDown === true) {
			debugger

			debugKey.isDown = false
		}
	}
})()
