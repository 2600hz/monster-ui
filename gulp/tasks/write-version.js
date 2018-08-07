var gulp = require('gulp');
var fs = require('fs');
var paths = require('../paths');
var package = require('../../package.json');

gulp.task(
	'write-version',
	function() {
		var version = package.version,
			fileName = paths.tmp + '/VERSION';

		fs.writeFileSync(fileName, version);

		return gulp.src(fileName);
	}
);
