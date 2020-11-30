import { env, mode } from '../helpers/helpers.js';
import { join } from 'upath';
import gulp from 'gulp';
import uglify from 'gulp-uglify';
import eslint from 'gulp-eslint';
import { app, src, tmp } from '../paths.js';

const config = {
	app: {
		lint: [
			join(src, 'apps', env.app || '', 'app.js'),
			join(src, 'apps', env.app || '', 'submodules', '*', '*.js')
		],
		minify: {
			src: join(app, 'app.js'),
			dest: app
		}
	},
	whole: {
		lint: [
			join(src, '**', '*.js'),
			'!' + join(src, 'js', 'vendor', '**', '*.js'),
			'!' + join(src, 'js', 'lib', 'kazoo', 'dependencies', '**', '*.js')
		],
		minify: {
			src: [
				join(tmp, 'js', 'main.js'),
				join(tmp, 'js', 'templates.js')
			],
			dest: join(tmp, 'js')
		}
	}
};
const context = config[mode];

const handleUglifyError = error => {
	console.error(JSON.stringify(error, null, 4));
};

/**
 * Minifies js/main.js, we don't use the optimizer from requirejs as we don't
 * want to minify config.js
 */
export function minifyJs() {
	const { src, dest } = context.minify;

	return gulp
		.src(src)
		.pipe(uglify().on('error', handleUglifyError))
		.pipe(gulp.dest(dest));
}

/**
 * Show linting error
 */
export const lint = () => gulp
	.src(context.lint)
	.pipe(eslint())
	.pipe(eslint.format());
