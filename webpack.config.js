const path = require('path');

module.exports = {
  entry: './example/app.js',
  output: {
		path: path.resolve(__dirname, 'dist'),
    filename: './example/app.bundle.js'
  },
  optimization: {
    minimize: false
  }
};
