let startTime
let elapsedTime

function create() {
	startTime = Date.now()
	elapsedTime = 0
}

function update() {
	elapsedTime = Date.now() - startTime
}

Object.assign(module.exports, {
	create,
	update,
	getElapsedTime: () => { return elapsedTime }
})
