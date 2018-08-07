var gulp = require('gulp');
var fs = require('fs');
var gutil = require('gulp-util');
var jeditor = require('gulp-json-editor');

var paths = require('../paths');
var helpers = require('../helpers/helpers.js');

var writeFile = function(fileName, content) {
		var json = JSON.stringify(content);

		fs.writeFileSync(fileName, json);
	},
	writeBulkAppsConfig = function() {
		var apps = helpers.listAllApps(),
			fileName,
			content;

		for(var i in apps) {
			fileName = paths.tmp + '/apps/' + apps[i] + '/app-build-config.json';
			content = {
				version: helpers.getProApps().indexOf(apps[i]) >= 0 ? 'pro' : 'standard'
			};

			writeFile(fileName, content);
		};
	};

gulp.task(
	'write-config-prod',
	function() {
		var mainFileName = paths.tmp + '/build-config.json',
			content = {
				type: 'production',
				preloadedApps: helpers.getAppsToInclude()
			};

		writeFile(mainFileName, content);

		writeBulkAppsConfig();

		return gulp.src(mainFileName);
	}
);

gulp.task(
	'write-config-dev',
	function() {
		var fileName = paths.tmp + '/build-config.json',
			content = {
				type: 'development',
				preloadedApps: []
			};

		writeFile(fileName, content);

		writeBulkAppsConfig();

		return gulp.src(fileName);
	}
);

gulp.task(
	'write-config-app',
	function() {
		var fileName = paths.app + 'app-build-config.json',
			content = {
				version: gutil.env.pro ? 'pro' : 'standard'
			};

		writeFile(fileName, content);

		return gulp.src(fileName);
	}
);
