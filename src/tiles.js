let { getGame } = require("./game")
let player = require("./player")
let { getPlayer } = player

// Resolve cyclical reference
if (getPlayer == null) {
	setTimeout(() => { getPlayer = player.getPlayer }, 0)
}

let tiles
let collisions

function preload() {
	let game = getGame()

	game.load.tilemap('map', 'assets/tilemaps/maps/ninja-tilemap.json', null, Phaser.Tilemap.TILED_JSON)
	game.load.image('kenney', 'assets/tilemaps/tiles/kenney.png')
}

function create() {
	let game = getGame()

	let map
	let layer
	let slopeMap

	// Add tilemap and tilemap physics
	map = game.add.tilemap('map')
	map.addTilesetImage('kenney')
	layer = map.createLayer('Tile Layer 1')
	layer.resizeWorld()
	slopeMap = { '32': 1, '77': 1, '95': 2, '36': 3, '137': 3, '140': 2 }
	tiles = game.physics.ninja.convertTilemap(map, layer, slopeMap)

	return tiles
}

function update() {
	collideTiles(getPlayer())
}

function collideTiles(player) {
	let angle
	let collision

	collisions = tiles.reduce((accumulator, tileBody, index) => {
		collision = player.body.aabb.collideAABBVsTile(tileBody.tile)

		if (collision !== false) {
			angle = collisionAngle(player, tileBody.tile.id)

			if (angle != null) {
				accumulator.push({ tile: tileBody.tile, angle })
			}
		}

		return accumulator
	}, [])

	return collisions
}

function collisionAngle(player, tileId) {
	switch (tileId) {
		case 1:
			if (player.body.touching.down) {
				return 0
			}

			if (player.body.touching.left) {
				return 90
			}

			if (player.body.touching.up) {
				return 180
			}

			if (player.body.touching.right) {
				return 270
			}

			// throw new Error('Your player isn\'t touching!' + JSON.stringify(player.body.touching))

		case 2:
			return 45

		case 3:
			return 315

		case 4:
			return 225

		case 5:
			return 135

		return null
	}
}

Object.assign(module.exports, {
	preload,
	create,
	update,
	getCollisions: () => { return collisions }
})
