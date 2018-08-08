var gulp = require('gulp');
var uglify = require('gulp-uglify');
var eslint = require('gulp-eslint');

var paths = require('../paths.js');

function minifyJs() {
	return gulp
		.src([
			paths.tmp + '/js/main.js',
			paths.tmp + '/js/templates.js'
		])
		.pipe(uglify())
		.pipe(gulp.dest(paths.tmp + '/js/'));
}

function minifyJsApp() {
	return gulp
		.src(paths.app + 'app.js')
		.pipe(uglify())
		.pipe(gulp.dest(paths.app));
}

function lint() {
	return gulp
		.src([
			paths.src + '/**/*.js',
			'!'+ paths.src + '/js/vendor/**/*.js',
			'!'+ paths.src + '/js/lib/kazoo/dependencies/**/*.js'
		])
		.pipe(eslint())
		.pipe(eslint.format());
}

gulp.task('minify-js', minifyJs);
gulp.task('minify-js-app', minifyJsApp);
gulp.task('lint', lint);
