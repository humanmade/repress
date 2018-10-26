const path = require( 'path' );

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

module.exports = {
	mode: 'production',
	entry:  './src/index.js',
	output: {
		filename:      'bundle.js',
		path:          path.resolve( __dirname, 'dist' ),
		libraryTarget: 'umd',
	},
	devtool: false,
	module:  {
		rules: [
			{
				test:    /\.js$/,
				exclude: /node_modules/,
				use:     {
					loader:  'babel-loader',
					options: { presets: [ 'react-app' ] },
				},
			},
		],
	},
	externals: {
		'react':       'commonjs react',
		'react-redux': 'commonjs react-redux',
	},
};
