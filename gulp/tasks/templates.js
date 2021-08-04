import { join, normalize, sep } from 'upath';
import gulp from 'gulp';
import handlebars from 'gulp-handlebars';
import wrap from 'gulp-wrap';
import declare from 'gulp-declare';
import concat from 'gulp-concat';
import del from 'del';
import vinylPaths from 'vinyl-paths';
import { app, tmp } from '../paths.js';
import { env, getAppsToInclude, mode } from '../helpers/helpers.js';

const config = {
	app: {
		compile: {
			src: [
				join(app, 'views', '*.html'),
				join(app, 'submodules', '*', 'views', '*.html')
			],
			output: 'templates.js',
			dest: join(app, 'views')
		},
		concat: {
			src: [
				join(app, 'app.js'),
				join(app, 'views', 'templates.js')
			],
			output: 'app.js',
			dest: app
		}
	},
	whole: {
		compile: {
			src: getAppsToInclude().flatMap(
				app => [
					join(tmp, 'apps', app, 'views', '*.html'),
					join(tmp, 'apps', app, 'submodules', '*', 'views', '*.html'),
				]
			),
			output: 'templates-compiled.js',
			dest: join(tmp, 'js')
		},
		concat: {
			src: [
				join(tmp, 'js', 'templates.js'),
				join(tmp, 'js', 'templates-compiled.js')
			],
			output: 'templates.js',
			dest: join(tmp, 'js')
		}
	}
};
const context = config[mode];

const compileTemplates = () => gulp
	.src(context.compile.src)
	.pipe(handlebars())
	.pipe(wrap('Handlebars.template(<%= contents %>)'))
	.pipe(declare({
		namespace: 'monster.cache.templates',
		noRedeclare: true,
		processName: filePath => {
			const splits = normalize(filePath).split(sep);
			const isSubmodule = splits.indexOf('submodules') > -1;
			const appName = splits[splits.length - (isSubmodule ? 5 : 3)];
			const moduleName = isSubmodule ? splits[splits.length - 3] : 'main';
			const templateName = splits[splits.length - 1];
			const newPath = [
				appName,
				'_' + moduleName,
				templateName
			].join('.');

			return declare.processNameByPath(newPath);
		}
	}))
	.pipe(concat(context.compile.output))
	.pipe(gulp.dest(context.compile.dest));

const concatTemplates = () => gulp
	.src(context.concat.src)
	.pipe(concat(context.concat.output))
	.pipe(gulp.dest(context.concat.dest));

const cleanTemplates = () => gulp
	.src([
		...context.compile.src,
		join(context.compile.dest, context.compile.output)
	], {
		read: false
	})
	.pipe(vinylPaths(del));

/**
 * Gets all apps .html templates and pre-compile them with handlebars, then
 * append it to templates.js, also removes all the .html files from the folder
 */
export const templates = gulp.series(
	compileTemplates,
	concatTemplates,
	cleanTemplates
);
