// File is written using JS Standard Style with the exception that indentation
// should be *tabs*. Set your preferred number of spaces in your editor, not the
// source file.
//
// https://github.com/JedWatson/happiness

// Prevent global leakage
(function() {
	// Expose Phaser to the local context
	// TODO: Convert this to a require statement once Phaser supports it - https://github.com/photonstorm/phaser/issues/1974
	let Phaser = window.Phaser
	let { List, Record, Stack } = require("immutable")
	let simplifySpline = require("simplify-js")
	let sampleSize = require("lodash/sampleSize")
	let sortBy = require("lodash/sortBy")
	let unionWith = require("lodash/unionWith")
	let identicalComparator = (a, b) => {
		a === b
	}

	let playerSessions = new List()
	let currentGhostSessions = new List()
	let currentSession

	let game
	let debugKey
	let springs
	let player
	let platforms
	let ghosts
	let ground
	let ledge
	let cursors
	let switchButton
	let map
	let tiles
	let layer
	let gameStartTime

	// Starting Coordinates
	let startPosition = [0, 20]

	// Player states
	const BALL = 'ball'
	const SPRING = 'spring'
	let playerState = BALL

	// Spring behavior
	const VERTICAL_SPRING_FORCE = 700
	const HORIZONTAL_SPRING_FORCE = 700

	// Player behavior
	const GROUND_MOVEMENT_FORCE = 40
	const AIR_MOVEMENT_FORCE = 10

	const MAXIMUM_PLAYER_VELOCITY = 6
	const MINIMUM_PLAYER_VELOCITY = -1 * MAXIMUM_PLAYER_VELOCITY

	window.onload = initializeGame

	function initializeGame() {
		if (window.innerWidth === 0 || window.innerHeight === 0) {
			return setTimeout(initializeGame, 16)
		}

		game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO, '', { preload, create, update })
	}

	function preload() {
		game.load.image('ground', 'assets/sprites/platform.png')
		game.load.image('ball', 'assets/sprites/orb-blue.png', 50, 50)
		game.load.image('ball2', 'assets/sprites/orb-red.png', 50, 50)
		game.load.image('line', 'assets/sprites/line.PNG', 200, 4)
		game.load.tilemap('map', 'assets/tilemaps/maps/ninja-tilemap.json', null, Phaser.Tilemap.TILED_JSON)
		game.load.image('kenney', 'assets/tilemaps/tiles/kenney.png')
		game.load.image('spring', 'assets/sprites/spring-4-small.png')
	}

	function create() {
		// Set up initial system environment
		game.physics.startSystem(Phaser.Physics.NINJA)
		game.stage.backgroundColor = 0x4488cc

		// Add tilemap and tilemap physics
		map = game.add.tilemap('map')
		map.addTilesetImage('kenney')
		layer = map.createLayer('Tile Layer 1')
		layer.resizeWorld()
		let slopeMap = { '32': 1, '77': 1, '95': 2, '36': 3, '137': 3, '140': 2 }
		tiles = game.physics.ninja.convertTilemap(map, layer, slopeMap)

		// Add player and initialize ninja physics on it
		player = game.add.sprite.apply(game.add, startPosition.concat('ball'))

		game.physics.ninja.enable(player)

		player.body.collideWorldBounds = true
		player.body.bounce = 0.2

		// Game camera follows player
		game.camera.follow(player)

		// Add cursors
		cursors = game.input.keyboard.createCursorKeys()
		debugKey = game.input.keyboard.addKey(Phaser.KeyCode.W)
		switchButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)

		// Add group for ground and standard ledges and config
		platforms = game.add.group()

		// Add springs group and capabilites
		springs = game.add.group()

		currentSession = new Stack()
		currentSession = currentSession.unshift({ t: 0, x: player.x, y: player.y, state: BALL })

		// Create the ghosted player objects
		ghosts = game.add.group()

		currentGhostSessions = playerSessions
		currentGhostSessions.forEach((p_session) => {
			let position = p_session.first()
			let ghost = ghosts.create(position.x, position.y, 'ball')
			ghost.anchor.x = 0.5
			ghost.anchor.y = 0.5
		})

		gameStartTime = Date.now()
	}

	function update() {
		let now = getElapsedTime()

		// Update the ghosted player objects' positions
		currentGhostSessions.forEach((p_session, p_index) => {
			let nextPosition
			let previousPosition
			let deltaTimeToNextState
			let deltaPercentage
			let ghostPosition
			let ghost

			ghost = ghosts.getChildAt(p_index)

			nextPosition = p_session.first()

			if (nextPosition === undefined) {
				currentGhostSessions = currentGhostSessions.splice(p_index, 1)
				return
			}

			p_session = p_session.shift()

			// Check if the position
			if (nextPosition.t === now) {
				applyState(ghost, nextPosition)

				currentGhostSessions.set(p_index, p_session)
				return
			}

			// Find the next and previous ghost states
			while (nextPosition !== undefined && nextPosition.t < now) {
				previousPosition = nextPosition
				nextPosition = p_session.first()
				p_session = p_session.shift()
			}

			// Handle the end of the Stack
			if (nextPosition === undefined) {
				applyState(ghost, previousPosition)

				currentGhostSessions = currentGhostSessions.splice(p_index, 1)
				return
			}

			// Handle a perfect match
			if (nextPosition.t === now) {
				applyState(ghost, nextPosition)

				currentGhostSessions.set(p_index, p_session)
				return
			}

			// Interpolate the current ghost position
			deltaTimeToNextState = nextPosition.t - now
			deltaPercentage = 1 - (deltaTimeToNextState / (nextPosition.t - previousPosition.t))

			ghostPosition = { x: previousPosition.x + ((nextPosition.x - previousPosition.x) * deltaPercentage), y: previousPosition.y + ((nextPosition.y - previousPosition.y) * deltaPercentage), t: now }

			applyState(ghost, ghostPosition)
			currentGhostSessions.set(p_index, p_session)
		})

		// Add collision for platforms
		game.physics.ninja.collide(player, platforms)

		// Add collision for springs and propel the player if true
		if (playerState === BALL) {
			springs.forEach((spring) => {
				if (Phaser.Rectangle.intersects(player.getBounds(), spring.getBounds())) {
					onSpringCollision(player, spring)
				}
			})
		}

		// Add collision for springs and store a reference to the tile that collides
		let collidedTiles = tiles.reduce((accumulator, tileBody, index) => {
			let collision = player.body.aabb.collideAABBVsTile(tileBody.tile)

			if (collision !== false) {
				accumulator.push(tileBody.tile)
			}

			return accumulator
		}, [])

		// TODO: Detect whether the collided tile is actually touching the player
		// or if they're simply intersecting
		let isPlayerColliding = collidedTiles.length > 0
		let isPlayerGrounded = isPlayerColliding || player.body.touching.down

		// Add basic movement for the ground and mid-air
		if (cursors.left.isDown && player.body.deltaX() < MAXIMUM_PLAYER_VELOCITY) {
			if (isPlayerGrounded) {
				player.body.moveLeft(GROUND_MOVEMENT_FORCE)
			} else {
				player.body.moveLeft(AIR_MOVEMENT_FORCE)
			}
		} else if (cursors.right.isDown && player.body.deltaX() > MINIMUM_PLAYER_VELOCITY) {
			if (isPlayerGrounded) {
				player.body.moveRight(GROUND_MOVEMENT_FORCE)
			} else {
				player.body.moveRight(AIR_MOVEMENT_FORCE)
			}
		}

		// Transform Player to Spring
		if (playerState === BALL && switchButton.isDown && isPlayerGrounded) {
			currentSession = currentSession.unshift({ t: now, x: player.x, y: player.y, state: SPRING })

			saveSessionAndRestart()

			return

			player.kill()
			playerState = SPRING

			let springPosition = [player.body.x, player.body.y]
			let springAngle = 0

			if (collidedTiles.length > 0) {
				springAngle = mapCollisionToSpringRotation(player.body.touching, collidedTiles[0].id)

				// Adjust spring location on slopes
				switch (springAngle) {
					case 0:
						springPosition[0] -= 16
						break

					case 45:
						springPosition[0] -= 38
						springPosition[1] -= 11
						break

					case 315:
						springPosition[0] += 2
						springPosition[1] -= 9
						break
				}
			}

			let spring = springs.create.apply(springs, springPosition.concat('spring'))
			spring.scale.y = 0.66
			spring.angle = springAngle

			springs.add(spring)
			game.physics.ninja.enable(spring)
			spring.body.gravityScale = 0

			spring.body.immovable = true
		}

		if (debugKey.isDown === true) {
			debugger

			debugKey.isDown = false
		}

		saveState(now, player.x, player.y)
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

	function mapCollisionToSpringRotation(playerTouching, tileId) {
		switch (tileId) {
			case 1:
				if (playerTouching.down) {
					return 0
				}

				if (playerTouching.left) {
					return 90
				}

				if (playerTouching.up) {
					return 180
				}

				if (playerTouching.right) {
					return 270
				}

				throw new Error('Your player isn\'t touching!' + JSON.stringify(playerTouching))

			case 2:
				return 45

			case 3:
				return 315

			case 4:
				return 225

			case 5:
				return 135
		}
	}

	function applyState(ghost, state) {
		// TODO: Handle changing into a spring
		ghost.x = state.x
		ghost.y = state.y
	}

	function saveState(t, x, y) {
		let firstPosition
		let secondPosition
		let shiftedSession

		firstPosition = currentSession.first()

		// Check if the ball isn't moving
		if (firstPosition != null && firstPosition.x === x && firstPosition.y === y) {
			shiftedSession = currentSession.shift()
			secondPosition = shiftedSession.first()

			if (secondPosition != null && firstPosition.x === secondPosition.x && firstPosition.y === secondPosition.y) {
				// Replace the most recent duplicated position with the new timestamp
				currentSession = shiftedSession.unshift({ t, x, y })
			}
		}

		currentSession = currentSession.unshift({ t, x, y })
	}

	function saveSessionAndRestart() {
		// Convert the session to an Array - TODO: Should the current session always be stored as an Array and then converted to a Stack?
		let sessionArray = currentSession.reverse().toArray()
		// Sample 33.3% of the session to add detail back into the spline to help with linear surfaces
		let sampledSession = sampleSize(sessionArray, sessionArray.length * 0.333)
		// Simplify the spline
		let simplifiedSession = simplifySpline(sessionArray, 0.3)
		// Blend the simplified spline with the sampled spline
		let blendedSession = unionWith(sampledSession, simplifiedSession, identicalComparator)
		// Sort the spline based on time
		let sortedSession = sortBy(blendedSession, "t")
		// Convert the spline to a Stack and store for future playback
		playerSessions = playerSessions.push(new Stack(sortedSession))
		// Restart the game
		game.state.restart(true, true)
	}

	function getElapsedTime() {
		return Date.now() - gameStartTime
	}
})()
