let Phaser = window.Phaser
let { BALL, SPRING } = require("./enum")
let { getPlayer } = require("./player")
let { getGame } = require("./game")

let springs

const VERTICAL_SPRING_FORCE = 700
const HORIZONTAL_SPRING_FORCE = 700

function preload() {
	let game = getGame()

	game.load.image(SPRING, 'assets/sprites/spring-4-small.png')
}

function create() {
	let game = getGame()

	springs = game.add.group()
}

function update() {
	// Add collision for springs and propel the player if true
	collideSprings(getPlayer(), springs)
}

function createSpring(x, y, angle) {
	let game = getGame()
	let spring

	if (angle == null) {
		angle = 0
	}

	spring = springs.create(x, y, SPRING)
	spring.scale.y = 0.66
	spring.angle = angle

	springs.add(spring)

	game.physics.ninja.enable(spring)

	spring.body.gravityScale = 0
	spring.body.immovable = true

	return spring
}

function collideSprings(player, springs) {
	if (player.state === BALL) {
		springs.forEach((spring) => {
			if (Phaser.Rectangle.intersects(player.getBounds(), spring.getBounds())) {
				onSpringCollision(player, spring)
			}
		})
	}
}

// Rotation of springs
//       180
//       \/
// 90 ->   <- 270
//       /\
//       0
function onSpringCollision(player, spring) {
	let angle = spring.angle

	if (angle > -90 || angle < 90) {
		player.body.moveUp(VERTICAL_SPRING_FORCE)
	} else if (angle < -90 || angle > 90) {
		player.body.moveDown(VERTICAL_SPRING_FORCE)
	}

	if (angle > 0 && angle < 180) {
		player.body.moveRight(HORIZONTAL_SPRING_FORCE)
	} else if (angle < 0 && angle > -180) {
		player.body.moveLeft(HORIZONTAL_SPRING_FORCE)
	}
}

Object.assign(module.exports, {
	preload,
	create,
	update,
	createSpring
})
