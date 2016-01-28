let { getGame } = require("./game")
let { getCollisions } = require("./tiles")
let { BALL, SPRING } = require("./enum")
let ghosts = require("./ghosts")
let { saveState, saveSessionAndRestart } = ghosts

// Resolve cyclical reference
if (saveState == null || saveSessionAndRestart == null) {
	setTimeout(() => {
		saveState = ghosts.saveState
		saveSessionAndRestart = ghosts.saveSessionAndRestart
	}, 0)
}

let player
let cursors
let transformButton

// Starting Coordinates
let startPosition = [0, 20]

const GROUND_MOVEMENT_FORCE = 40
const AIR_MOVEMENT_FORCE = 10

const MAXIMUM_PLAYER_VELOCITY = 6
const MINIMUM_PLAYER_VELOCITY = -1 * MAXIMUM_PLAYER_VELOCITY

function preload() {
	let game = getGame()

	game.load.image('red-ball', 'assets/sprites/orb-red.png', 50, 50)
}

function create() {
	let game = getGame()

	// Add player and initialize ninja physics on it
	player = createPlayer.apply(null, startPosition)

	// Game camera follows player
	game.camera.follow(player)

	// Add cursors
	cursors = game.input.keyboard.createCursorKeys()
	transformButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)

	return player
}

function createPlayer(x, y) {
	let game = getGame()
	let player = game.add.sprite(x, y, 'red-ball')

	game.physics.ninja.enable(player)

	player.body.collideWorldBounds = true
	player.body.bounce = 0.2

	player.state = BALL
	player.isTouchingSurface = false

	return player
}

function update() {
	// TODO: Detect whether the collided tile is actually touching the player
	// or if they're simply intersecting
	let isPlayerColliding = getCollisions().length > 0
	player.isTouchingSurface = isPlayerColliding || player.body.touching.down || player.body.touching.up || player.body.touching.left || player.body.touching.right

	updateMovement()
	updatePlayerActions()
}

function updateMovement() {
	// Add basic movement for the ground and mid-air
	if (cursors.left.isDown && player.body.deltaX() < MAXIMUM_PLAYER_VELOCITY) {
		if (player.isTouchingSurface) {
			player.body.moveLeft(GROUND_MOVEMENT_FORCE)
		} else {
			player.body.moveLeft(AIR_MOVEMENT_FORCE)
		}
	} else if (cursors.right.isDown && player.body.deltaX() > MINIMUM_PLAYER_VELOCITY) {
		if (player.isTouchingSurface) {
			player.body.moveRight(GROUND_MOVEMENT_FORCE)
		} else {
			player.body.moveRight(AIR_MOVEMENT_FORCE)
		}
	}
}

function updatePlayerActions() {
	// Transform Player to Spring
	if (player.state === BALL && transformButton.isDown && player.isTouchingSurface) {
		player.kill()
		player.state = SPRING

		let position = { x: player.x, y: player.y }
		let angle = 0
		let collisions = getCollisions()

		if (collisions.length > 0) {
			angle = collisions[0].angle

			// Adjust spring location on slopes
			// TODO: Center the spring sprite and use the player's radius to position it
			switch (angle) {
				case 0:
					position.x -= 16
					break

				case 45:
					position.x -= 38
					position.y -= 11
					break

				case 315:
					position.x += 2
					position.y -= 9
					break
			}
		}

		console.log(collisions[0])

		saveState({ x: position.x, y: position.y, angle, state: SPRING })
		saveSessionAndRestart()
	}
}

Object.assign(module.exports, {
	preload,
	create,
	update,
	getPlayer: () => { return player }
})
