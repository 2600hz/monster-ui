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
		var apps = getDirectories(paths.src + '/apps'),
			appsToExclude = getAppsToExclude(),
			filteredApps = [];

		for(var i in apps) {
			if(appsToExclude.indexOf(apps[i]) < 0) {
				filteredApps.push(apps[i]);
			}
		}
		return filteredApps;
	},
	getProApps: function() {
		var apps = [];
		if(gutil.env.pro && gutil.env.pro.length) {
			var apps = gutil.env.pro.split(',');
		}
		return apps;
	}
};