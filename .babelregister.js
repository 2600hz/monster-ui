const babelRc = require('./.babelrc.js');

// Force to load babelrc `only` options
require('babel-register')({
	only: babelRc.only
});

// Load ES2015+ polyfills
require('babel-polyfill');
