const path = require( 'path' );

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

module.exports = {
	entry: './src/index.js',
	output: {
		filename: 'bundle.js',
		path: path.resolve( __dirname, 'dist' )
	},
	devtool: false,
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [ 'babel-preset-react-app' ],
					},
				},
			},
		],
	},
	externals: {
		'react': 'commonjs react',
		'react-redux': 'commonjs react-redux',
	},
};
