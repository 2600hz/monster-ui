import gulp from 'gulp';
import handlebars from 'gulp-handlebars';
import wrap from 'gulp-wrap';
import declare from 'gulp-declare';
import concat from 'gulp-concat';
import { env } from 'gulp-util';
import clean from 'gulp-clean';
import { sep } from 'path';
import { app, tmp } from '../paths.js';
import { getAppsToInclude } from '../helpers/helpers.js';

const mode = env.app
	? 'app'
	: 'whole';
const pathsTemplates = {
	whole: {
		src: getAppsToInclude().reduce((acc, item) => acc.concat([
			tmp + '/apps/' + item + '/views/*.html',
			tmp + '/apps/' + item + 'submodules/*/views/*.html'
		]), []),
		dest: tmp + '/js/',
		concatName: 'templates-compiled.js'
	},
	app: {
		src: [
			app + 'views/*.html',
			app + '/submodules/*/views/*.html'
		],
		dest: app + 'views/',
		concatName: 'templates.js'
	}
};

const compileTemples = () => gulp
	.src(pathsTemplates[mode].src)
	.pipe(handlebars({
		handlebars: require('handlebars')
	}))
	.pipe(wrap('Handlebars.template(<%= contents %>)'))
	.pipe(declare({
		namespace: 'monster.cache.templates',
		noRedeclare: true,
		processName: filePath => {
			const splits = filePath.split(sep);
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
					'._main',
					splits[splits.length - 1]
				);
			}
			return declare.processNameByPath(newName);
		}
	}))
	.pipe(concat(pathsTemplates[mode].concatName))
	.pipe(gulp.dest(pathsTemplates[mode].dest));

const concatTemplatesWhole = () => gulp
	.src([
		pathsTemplates.whole.dest + 'templates.js',
		pathsTemplates.whole.dest + pathsTemplates.whole.concatName
	])
	.pipe(concat('templates.js'))
	.pipe(gulp.dest(pathsTemplates.whole.dest));

const cleanTemplateWhole = () => gulp
	.src([
		...pathsTemplates.whole.src,
		pathsTemplates.whole.dest + pathsTemplates.whole.concatName
	], {
		read: false
	})
	.pipe(clean());

const concatJsApp = () => gulp
	.src([
		app + 'app.js',
		pathsTemplates.app.dest + pathsTemplates.app.concatName
	])
	.pipe(concat('app.js'))
	.pipe(gulp.dest(app));

const cleanTemplatesApp = () => gulp
	.src([
		...pathsTemplates.app.src,
		pathsTemplates.app.dest + pathsTemplates.app.concatName
	], {
		read: false
	})
	.pipe(clean());

gulp.task('templates', gulp.series(
	compileTemples,
	concatTemplatesWhole,
	cleanTemplateWhole
));
gulp.task('templates-app', gulp.series(
	compileTemples,
	concatJsApp,
	cleanTemplatesApp
));
