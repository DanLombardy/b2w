var path = require('path')

module.exports = {
	context: __dirname,
	entry: './src/index2.js',
	output: {
		path: path.resolve(__dirname, '/build'),
		filename: 'b2w.js'
	},
	module: {
		loaders: [
			{
				test: /\.jsx?$/,
				exclude: /(node_modules|bower_components)/,
				loader: 'babel',
				query: {
					presets: ['es2015']
				}
			}
		]
	}
}
