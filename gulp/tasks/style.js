import gulp from 'gulp';
import sass from 'gulp-sass';
import concatCss from 'gulp-concat-css';
import cleanCss from 'gulp-clean-css';
import clean from 'gulp-clean';
import { app, tmp } from '../paths.js';
import { getAppsToInclude } from '../helpers/helpers.js';

const concatName = 'style.css';
const cssDest = tmp + '/css/';
const concatCssPaths = getAppsToInclude().reduce((acc, item) => [
	...acc,
	tmp + '/apps/' + item + '/style/*.css'
], [
	tmp + '/css/style.css'
]);

const compileSass = () => gulp
	.src(tmp + '/**/*.scss')
	.pipe(sass().on('error', sass.logError))
	.pipe(gulp.dest(tmp));

const minifyCssApp = () => gulp
	.src(app + '/style/app.css')
	.pipe(cleanCss())
	.pipe(gulp.dest(app + 'style'));

const minifyCss = () => gulp
	.src(cssDest + concatName)
	.pipe(cleanCss())
	.pipe(gulp.dest(cssDest));

const concatAllCss = () => gulp
	.src(concatCssPaths)
	.pipe(concatCss(concatName))
	.pipe(gulp.dest(cssDest));

gulp.task('css', gulp.series(concatAllCss, minifyCss));
gulp.task('minify-css-app', minifyCssApp);
gulp.task('sass', compileSass);
