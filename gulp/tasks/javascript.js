var gulp = require('gulp');
var uglify = require('gulp-uglify');
var eslint = require('gulp-eslint');

var paths = require('../paths.js');

gulp.task('minify-js', function() {
	return gulp.src([paths.tmp + '/js/main.js', paths.tmp + '/js/templates.js'])
		.pipe(uglify().on('error', handleUglifyError))
		.pipe(gulp.dest(paths.tmp + '/js/'));
});

gulp.task('minify-js-app', function() {
	return gulp.src(paths.app + 'app.js')
			.pipe(uglify().on('error', handleUglifyError))
			.pipe(gulp.dest(paths.app));
});

gulp.task('lint', function() {
	var pathToLint = [paths.src + '/**/*.js', '!'+ paths.src + '/js/vendor/**/*.js', '!'+ paths.src + '/js/lib/kazoo/dependencies/**/*.js'];

	return gulp.src(pathToLint)
				.pipe(eslint())
				.pipe(eslint.format());
});

function handleUglifyError(error) {
	console.error(JSON.stringify(error, null, 4));
}
