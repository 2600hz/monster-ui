import { join } from 'upath';
import gulp from 'gulp';
import sass from 'gulp-sass';
import concatCss from 'gulp-concat-css';
import cleanCss from 'gulp-clean-css';
import { app, tmp } from '../paths.js';
import { getAppsToExclude, isProdBuild, mode } from '../helpers/helpers.js';

const config = {
	app: {
		compile: {
			src: join(app, '**', '*.scss'),
			dest: app
		},
		concat: {
			src: join(app, 'style', '*.css'),
			output: 'app.css',
			dest: join(app, 'style')
		},
		minify: {
			src: join(app, 'style', 'app.css'),
			dest: join(app, 'style')
		}
	},
	whole: {
		compile: {
			src: [
				join(tmp, '**', '*.scss'),
				...(isProdBuild ? getAppsToExclude().map(
					app => '!' + join(tmp, 'apps', app, '**', '*.scss')
				) : [])
			],
			dest: tmp
		},
		concat: {
			src: [
				join(tmp, 'css', 'style.css'),
				...(isProdBuild ? getAppsToExclude().map(
					app => '!' + join(tmp, 'apps', app, 'style', '*.css')
				) : [])
			],
			output: 'style.css',
			dest: join(tmp, 'css')
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
