var gulp = require('gulp');
var fs = require('fs');
var gutil = require('gulp-util');
var jeditor = require('gulp-json-editor');

var paths = require('../paths');
var helpers = require('../helpers/helpers.js');

function writeFile(fileName, content) {
	var json = JSON.stringify(content);

	fs.writeFileSync(fileName, json);
}

function writeBulkAppsConfig() {
	var apps = helpers.listAllApps();
	var fileName;
	var content;

	for(var i in apps) {
		fileName = paths.tmp + '/apps/' + apps[i] + '/app-build-config.json';
		content = {
			version: helpers.getProApps().indexOf(apps[i]) >= 0 ? 'pro' : 'standard'
		};

		writeFile(fileName, content);
	}
}

function writeConfigProd() {
	var mainFileName = paths.tmp + '/build-config.json';
	var content = {
		type: 'production',
		preloadedApps: helpers.getAppsToInclude()
	};

	writeFile(mainFileName, content);

	writeBulkAppsConfig();

	return gulp.src(mainFileName);
}

function writeConfigDev() {
	var fileName = paths.tmp + '/build-config.json';
	var content = {
		type: 'development',
		preloadedApps: []
	};

	writeFile(fileName, content);

	writeBulkAppsConfig();

	return gulp.src(fileName);
}

function writeConfigApp() {
	var fileName = paths.app + 'app-build-config.json';
	var content = {
		version: gutil.env.pro ? 'pro' : 'standard'
	};

	writeFile(fileName, content);

	return gulp.src(fileName);
}

gulp.task('write-config-prod', writeConfigProd);
gulp.task('write-config-dev', writeConfigDev);
gulp.task('write-config-app', writeConfigApp);
