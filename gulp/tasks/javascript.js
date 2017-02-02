var gulp = require('gulp');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');

var paths = require('../paths.js');

gulp.task('minify-js', function() {
	return gulp.src([paths.tmp + '/js/main.js', paths.tmp + '/js/templates.js'])
		.pipe(uglify())
		.pipe(gulp.dest(paths.tmp + '/js/'));
});

gulp.task('minify-js-app', function() {
	return gulp.src(paths.app + 'app.js')
			.pipe(uglify())
			.pipe(gulp.dest(paths.app));
});

gulp.task('lint', function() {
	return gulp.src([paths.src + '/**/*.js', '!'+ paths.src + '/js/vendor/**/*.js', '!'+ paths.src + '/js/lib/kazoo/dependencies/**/*.js'])
				.pipe(jshint())
				.pipe(jshint.reporter(stylish));
});