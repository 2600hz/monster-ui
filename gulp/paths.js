// File globs.
var path = require('path');
var fs = require('fs');
var gutil = require('gulp-util');

var pathToThisFile = __dirname;
var root = path.dirname(pathToThisFile);
var distPath = root + '/dist/',
	tmpPath = root + '/tmp',
	requirePath = root + '/distRequired',
	srcPath = root + '/src',
	distDevPath = root + '/distDev';

var appPath = 'null';

if(gutil.env.app) {
	appPath = tmpPath + '/apps/' + gutil.env.app + '/';
}

module.exports = {
	src: srcPath,
	require: requirePath,
	dist: distPath,
	distDev: distDevPath,
	tmp: tmpPath,
	app: appPath
};
