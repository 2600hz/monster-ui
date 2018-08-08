var gulp = require('gulp');
var fs = require('fs');
var paths = require('../paths');
var package = require('../../package.json');

function writeVersion() {
	var version = package.version;
	var fileName = paths.tmp + '/VERSION';

	fs.writeFileSync(fileName, version);

	return gulp.src(fileName);
}

gulp.task('write-version', writeVersion);
