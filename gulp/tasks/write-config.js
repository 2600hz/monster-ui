var gulp = require('gulp');
var fs = require('fs');
var gutil = require('gulp-util');
var jeditor = require('gulp-json-editor');

var paths = require('../paths');
var helpers = require('../helpers/getAppsToInclude.js');

gulp.task('write-config-prod', function() {
	var fileName = paths.tmp + '/build-config.json';

	fs.writeFileSync(fileName, '{}');

	return gulp.src(fileName)
			.pipe(jeditor({
				preloadedApps: helpers.getAppsToInclude()
			}))
			.pipe(gulp.dest(paths.tmp));
});

gulp.task('write-config-dev', function() {
	var fileName = paths.tmp + '/build-config.json';

	fs.writeFileSync(fileName, '{}');

	return gulp.src(fileName)
			.pipe(jeditor({
				preloadedApps: []
			}))
			.pipe(gulp.dest(paths.tmp));
});