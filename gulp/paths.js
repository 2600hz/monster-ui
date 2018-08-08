// File globs.
var path = require('path');
var fs = require('fs');
var gutil = require('gulp-util');

var pathToThisFile = __dirname;
var root = path.dirname(pathToThisFile);
var distPath = root + '/dist/';
var tmpPath = root + '/tmp';
var requirePath = root + '/distRequired';
var srcPath = root + '/src';
var distDevPath = root + '/distDev';
var appPath = gutil.env.app
	? tmpPath + '/apps/' + gutil.env.app + '/'
	: 'null';

module.exports = {
	src: srcPath,
	require: requirePath,
	dist: distPath,
	distDev: distDevPath,
	tmp: tmpPath,
	app: appPath
};
