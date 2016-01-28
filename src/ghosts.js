// Third Party
let { List, Stack } = require("immutable")
let simplifySpline = require("simplify-js")
let sampleSize = require("lodash/sampleSize")
let sortBy = require("lodash/sortBy")
let unionWith = require("lodash/unionWith")

// First Party
let { getGame } = require("./game")
let { getPlayer } = require("./player")
let { createSpring } = require("./springs")
let { getElapsedTime } = require("./timer")
let { BALL } = require("./enum")

let identicalComparator = (a, b) => {
	a === b
}

let playerSessions = new List()
let currentGhostSessions = new List()

let positionStack
let guaranteedStack

let ghosts

function preload() {
	let game = getGame()

	game.load.image('blue-ball', 'assets/sprites/orb-blue.png', 50, 50)
}

function create() {
	let game = getGame()
	let player = getPlayer()

	positionStack = new Stack()
	guaranteedStack = new Stack()

	saveState({ t: 0, x: 0, y: 0 })

	// Create the ghosted player objects
	ghosts = game.add.group()

	currentGhostSessions = playerSessions
	currentGhostSessions.forEach((session) => {
		let position = session.first()
		let ghost = ghosts.create(position.x, position.y, 'blue-ball')
		ghost.anchor.x = 0.5
		ghost.anchor.y = 0.5
	})
}

function update() {
	updateGhosts(getElapsedTime())
}

function computeSession(time, session, index) {
	let returnSession = session

	let nextState
	let previousState
	let derivedState
	let deltaTimeToNextState
	let deltaPercentage

	nextState = session.first()

	if (nextState === undefined) {
		return returnSession
	}

	// Handle a perfect time match
	if (nextState.t === time) {
		applyState(index, nextState)
		return returnSession
	}

	// Find the next and previous ghost states
	while (nextState != null && nextState.t < time) {
		// Always apply state changes
		if (previousState != null && previousState.state != null) {
			applyState(index, previousState)
		}

		previousState = nextState

		returnSession = session
		session = session.shift()
		nextState = session.first()
	}

	// Handle the end of the Stack
	if (nextState == null) {
		applyState(index, previousState)
		return session
	}

	// Handle a perfect time match
	if (nextState.t === time) {
		applyState(index, nextState)
		return returnSession
	}

	// Interpolate the current ghost position
	deltaTimeToNextState = nextState.t - time
	deltaPercentage = 1 - (deltaTimeToNextState / (nextState.t - previousState.t))

	derivedState = { x: previousState.x + ((nextState.x - previousState.x) * deltaPercentage), y: previousState.y + ((nextState.y - previousState.y) * deltaPercentage), t: time }

	applyState(index, derivedState)
	return returnSession
}

function updateGhosts(time) {
	// Update the ghosted player objects' positions
	currentGhostSessions.forEach((session, index) => {
		session = computeSession(time, session, index)
		currentGhostSessions = currentGhostSessions.set(index, session)
	})
}

function savePlayerState(player) {
	if (player == null) {
		player = getPlayer()
	}

	saveState({ t: getElapsedTime(), x: player.x, y: player.y })
}

function applyState(index, state) {
	let ghost = ghosts.getChildAt(index)

	if (state.state == null || state.state === BALL) {
		ghost.visible = true
		ghost.x = state.x
		ghost.y = state.y
	} else {
		ghost.visible = false
		createSpring(state.x, state.y, state.angle)
	}
}

function saveState(state) {
	if (state.x == null || state.y == null) {
		throw new Error("States must have an `x` and `y` property defined.")
	}

	let firstPosition
	let secondPosition
	let shiftedSession

	if (state.t == null) {
		state.t = getElapsedTime()
	}

	// If the state is defined then store it in the uncompressed Stack
	if (state.state != null) {
		guaranteedStack = guaranteedStack.unshift(state)
		return
	}

	firstPosition = positionStack.first()

	// Check if the ball isn't moving
	if (firstPosition != null && firstPosition.x === state.x && firstPosition.y === state.y) {
		shiftedSession = positionStack.shift()
		secondPosition = shiftedSession.first()

		if (secondPosition != null && firstPosition.x === secondPosition.x && firstPosition.y === secondPosition.y) {
			// Replace the most recent duplicated position with the new timestamp
			positionStack = shiftedSession.unshift(state)
			return
		}
	}

	positionStack = positionStack.unshift(state)
}

function saveSessionAndRestart() {
	let game = getGame()

	let positionArray
	let sampledPositions
	let simplifiedPositions
	let blendedStates
	let sortedStates

	// Convert the session to an Array - TODO: Should the current session always be stored as an Array and then converted to a Stack?
	positionArray = positionStack.toArray()
	// Sample 33.3% of the session to add detail back into the spline to help with linear surfaces
	sampledPositions = sampleSize(positionArray, positionArray.length * 0.333)
	// Simplify the spline
	simplifiedPositions = simplifySpline(positionArray, 0.3)
	// Blend the simplified spline with the sampled spline
	blendedStates = unionWith(sampledPositions, simplifiedPositions, guaranteedStack.toArray(), identicalComparator)
	// Sort the spline based on time
	sortedStates = sortBy(blendedStates, "t")
	// Convert the spline to a Stack and store for future playback
	playerSessions = playerSessions.push(new Stack(sortedStates))

	// Restart the game
	game.state.restart(true, true)
}

Object.assign(module.exports, {
	preload,
	create,
	update,
	saveState,
	savePlayerState,
	saveSessionAndRestart
})
