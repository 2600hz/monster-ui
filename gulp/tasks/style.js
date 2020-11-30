import { join } from 'upath';
import gulp from 'gulp';
import sass from 'gulp-sass';
import concatCss from 'gulp-concat-css';
import cleanCss from 'gulp-clean-css';
import { app, tmp } from '../paths.js';
import { getAppsToInclude, mode } from '../helpers/helpers.js';

const config = {
	app: {
		compile: {
			src: join(app, '**', '*.scss'),
			dest: app
		},
		concat: {
			src: join(app, 'style', '*.css'),
			dest: join(app, 'style'),
			output: 'app.css'
		},
		minify: {
			src: join(app, 'style', 'app.css'),
			dest: join(app, 'style')
		}
	},
	whole: {
		compile: {
			src: join(tmp, '**', '*.scss'),
			dest: tmp
		},
		concat: {
			src: getAppsToInclude().reduce((acc, item) => [
				...acc,
				join(tmp, 'apps', item, 'style', '*.css')
			], [
				join(tmp, 'css', 'style.css')
			]),
			dest: join(tmp, 'css'),
			output: 'style.css'
		},
		minify: {
			src: join(tmp, 'css', 'style.css'),
			dest: join(tmp, 'css')
		}
	}
};
const context = config[mode];

const concatStyles = () => gulp
	.src(context.concat.src)
	.pipe(concatCss(context.concat.output))
	.pipe(gulp.dest(context.concat.dest));

const minifyStyles = () => gulp
	.src(context.minify.src)
	.pipe(cleanCss())
	.pipe(gulp.dest(context.minify.dest));

/**
 * Takes all the apps provided up top and concatenate and minify them
 */
export const minifyCss = gulp.series(
	concatStyles,
	minifyStyles
);

/**
 * Compiles all .scss files into .css and moves them to dist folder
 */
export const compileSass = () => gulp
	.src(context.compile.src)
	.pipe(sass().on('error', sass.logError))
	.pipe(gulp.dest(context.compile.dest));
