import gulp from 'gulp';
import uglify from 'gulp-uglify';
import eslint from 'gulp-eslint';
import { app, src, tmp } from '../paths.js';

const handleUglifyError = error => {
	console.error(JSON.stringify(error, null, 4));
};

/**
 * Minifies js/main.js, we don't use the optimizer from requirejs as we don't
 * want to minify config.js
 */
export const minifyJs = () => gulp
	.src([
		tmp + '/js/main.js',
		tmp + '/js/templates.js'
	])
	.pipe(uglify().on('error', handleUglifyError))
	.pipe(gulp.dest(tmp + '/js/'));

/**
 * Minifies app.js
 */
export const minifyJsApp = () => gulp
	.src(app + 'app.js')
	.pipe(uglify().on('error', handleUglifyError))
	.pipe(gulp.dest(app));

/**
 * Show linting error
 */
export const lint = () => gulp
	.src([
		src + '/**/*.js',
		'!'+ src + '/js/vendor/**/*.js',
		'!'+ src + '/js/lib/kazoo/dependencies/**/*.js'
	])
	.pipe(eslint())
	.pipe(eslint.format());
