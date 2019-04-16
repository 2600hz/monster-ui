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

const pathsTemplates = {
	whole: {
		src: getAppsToInclude().reduce((acc, item) => acc.concat([
			join(tmp, 'apps', item, 'views', '*.html'),
			join(tmp, 'apps', item, 'submodules', '*', 'views', '*.html')
		]), []),
		dest: join(tmp, 'js'),
		concatName: 'templates-compiled.js'
	},
	app: {
		src: [
			join(app, 'views', '*.html'),
			join(app, 'submodules', '*', 'views','*.html')
		],
		dest: join(app, 'views'),
		concatName: 'templates.js'
	}
};

const compileTemplates = () => gulp
	.src(pathsTemplates[mode].src)
	.pipe(handlebars())
	.pipe(wrap('Handlebars.template(<%= contents %>)'))
	.pipe(declare({
		namespace: 'monster.cache.templates',
		noRedeclare: true,
		processName: filePath => {
			const splits = normalize(filePath).split(sep);
			const indexSub = splits.indexOf('submodules');
			let newName;
			if (indexSub >= 0) {
				newName = splits[splits.length - 5].concat(
					'._',
					splits[splits.length - 3],
					'.',
					splits[splits.length - 1]
				);
			} else {
				newName = splits[splits.length - 3].concat(
					'._main.',
					splits[splits.length - 1]
				);
			}
			return declare.processNameByPath(newName);
		}
	}))
	.pipe(concat(pathsTemplates[mode].concatName))
	.pipe(gulp.dest(pathsTemplates[mode].dest));

const concatTemplatesApp = () => gulp
	.src([
		join(app, 'app.js'),
		join(pathsTemplates.app.dest, pathsTemplates.app.concatName)
	])
	.pipe(concat('app.js'))
	.pipe(gulp.dest(app));

const concatTemplatesWhole = () => gulp
	.src([
		join(pathsTemplates.whole.dest, 'templates.js'),
		join(pathsTemplates.whole.dest, pathsTemplates.whole.concatName)
	])
	.pipe(concat('templates.js'))
	.pipe(gulp.dest(pathsTemplates.whole.dest));

const cleanTemplates = () => gulp
	.src([
		...pathsTemplates[mode].src,
		join(pathsTemplates[mode].dest, pathsTemplates[mode].concatName)
	], {
		read: false
	})
	.pipe(vinylPaths(del));

/**
 * compileTemplates
 * concatTemplatesWhole
 * cleanTemplates
 *
 * Get all the apps .html files and pre-compile them with handlebars, then
 * append it to template.js
 */
export const templates = gulp.series(
	compileTemplates,
	concatTemplatesWhole,
	cleanTemplates
);

/**
 * compileTemplates
 * concatJsApp
 * cleamTemplates
 *
 * Gets all apps .html templates and pre-compile them with handlebars, then
 * append it to templates.js, also removes all the .html files from the folder
 */
export const templatesApp = gulp.series(
	compileTemplates,
	concatTemplatesApp,
	cleanTemplates
);
