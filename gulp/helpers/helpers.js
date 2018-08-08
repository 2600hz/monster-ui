var path = require('path');
var fs = require('fs');
var gutil = require('gulp-util');
var paths = require('../paths.js')

function getAppsToExclude() {
	return ['tutorial', 'skeleton', 'demo_done'];
}

function getDirectories(pathToParse) {
	return fs.readdirSync(pathToParse).filter(function(file) {
		return fs.statSync(path.join(pathToParse, file)).isDirectory();
	});
}

module.exports = {
	listAllApps: function() {
		var apps = getDirectories(paths.src + '/apps');

		return apps;
	},
	getAppsToInclude: function() {
		var apps = getDirectories(paths.src + '/apps');
		var appsToExclude = getAppsToExclude();

		return apps.filter(function(app) {
			return appsToExclude.indexOf(app) < 0;
		});
	},
	getProApps: function() {
		return gutil.env.pro && gutil.env.pro.length
			? gutil.env.pro.split(',')
			: [];
	}
};
