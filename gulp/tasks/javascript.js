import { join } from 'upath';
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
		join(tmp, 'js', 'main.js'),
		join(tmp, 'js', 'templates.js')
	])
	.pipe(uglify().on('error', handleUglifyError))
	.pipe(gulp.dest(join(tmp, 'js')));

/**
 * Minifies app.js
 */
export const minifyJsApp = () => gulp
	.src(join(app, 'app.js'))
	.pipe(uglify().on('error', handleUglifyError))
	.pipe(gulp.dest(app));

/**
 * Show linting error
 */
export const lint = () => gulp
	.src([
		join(src, '**', '*.js'),
		'!' + join(src, 'js', 'vendor', '**', '*.js'),
		'!' + join(src, 'js', 'lib', 'kazoo', 'dependencies', '**', '*.js')
	])
	.pipe(eslint())
	.pipe(eslint.format());
