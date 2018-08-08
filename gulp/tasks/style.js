var gulp = require('gulp');
var sass = require('gulp-sass');
var concatCss = require('gulp-concat-css');
var cleanCSS = require('gulp-clean-css');
var rename = require('gulp-rename');
var clean = require('gulp-clean');

var paths = require('../paths.js');
var helpers = require('../helpers/helpers.js');

var concatCssPaths = [ paths.tmp + '/css/style.css'];
var appsToInclude = helpers.getAppsToInclude();
var concatName = 'style.css';
var cssDest = paths.tmp + '/css/';

appsToInclude.forEach(function(app) {
	concatCssPaths.push(paths.tmp +'/apps/'+ app +'/style/*.css');
});

// compile our scss files to css files
function compileSass() {
	return gulp
		.src(paths.tmp + '/**/*.scss') // Select all the scss files
		.pipe(sass().on('error', sass.logError)) // compile them using the sass plug-in
		.pipe(gulp.dest(paths.tmp)) // move them to the dist folder
}

function minifyCssApp() {
	return gulp
		.src(paths.app +'/style/app.css')
		.pipe(cleanCSS())
		.pipe(gulp.dest(paths.app + '/style'));
}

function minifyCss() {
	return gulp
		.src(cssDest + concatName)
		.pipe(cleanCSS())
		.pipe(gulp.dest(cssDest));
}

function concatAllCss() {
	return gulp
		.src(concatCssPaths)
		.pipe(concatCss(concatName))
		.pipe(gulp.dest(cssDest))
}

gulp.task('css', gulp.series(concatAllCss, minifyCss));
gulp.task('minify-css-app', minifyCssApp);
gulp.task('sass', compileSass);
