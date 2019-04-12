import { join } from 'upath';
import gulp from 'gulp';
import sass from 'gulp-sass';
import concatCss from 'gulp-concat-css';
import cleanCss from 'gulp-clean-css';
import { app, tmp } from '../paths.js';
import { getAppsToInclude } from '../helpers/helpers.js';

const concatName = 'style.css';
const cssDest = tmp + '/css/';
const concatCssPaths = getAppsToInclude().reduce((acc, item) => [
	...acc,
	join(tmp, 'apps', item, 'style', '*.css')
], [
	join(tmp, 'css', 'style.css')
]);

const concatAllCss = () => gulp
	.src(concatCssPaths)
	.pipe(concatCss(concatName))
	.pipe(gulp.dest(cssDest));

const minifyCss = () => gulp
	.src(cssDest + concatName)
	.pipe(cleanCss())
	.pipe(gulp.dest(cssDest));

/**
 * concatAllCss
 * minifyCss
 *
 * Takes all the apps provided up top and concatenate and minify them
 */
export const css = gulp.series(
	concatAllCss,
	minifyCss
);

/**
 * Uglifies app.css
 */
export const minifyCssApp = () => gulp
	.src(join(app, 'style', 'app.css'))
	.pipe(cleanCss())
	.pipe(gulp.dest(app + 'style'));

/**
 * Compiles all .scss files into .css and moves them to dist folder
 */
export const compileSass = () => gulp
	.src(join(tmp, '**', '*.scss'))
	.pipe(sass().on('error', sass.logError))
	.pipe(gulp.dest(tmp));
