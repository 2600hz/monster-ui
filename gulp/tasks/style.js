var gulp = require('gulp');
var sass = require('gulp-sass');
var concatCss = require('gulp-concat-css');
var cleanCSS = require('gulp-clean-css');
var rename = require('gulp-rename');
var clean = require('gulp-clean');

var paths = require('../paths.js');
var helpers = require('../helpers/helpers.js');

var concatCssPaths = [ paths.tmp + '/css/style.css'];
	appsToInclude = helpers.getAppsToInclude();

for(var i in appsToInclude) {
	concatCssPaths.push(paths.tmp +'/apps/'+ appsToInclude[i] +'/style/*.css');
}

var concatName = 'style.css',
	cssDest = paths.tmp + '/css/';

gulp.task(
	'concat-css',
	function() {
		return gulp
			.src(concatCssPaths)
			.pipe(concatCss(concatName))
			.pipe(gulp.dest(cssDest))
	}
);

gulp.task(
	'minify-css',
	function() {
		return gulp
			.src(cssDest + concatName)
			.pipe(cleanCSS())
			.pipe(gulp.dest(cssDest));
	}
);

gulp.task(
	'minify-css-app',
	function() {
		return gulp
			.src(paths.app +'/style/app.css')
			.pipe(cleanCSS())
			.pipe(gulp.dest(paths.app + '/style'));
	}
);

// compile our scss files to css files
gulp.task(
	'sass',
	function() {
		return gulp
			.src(paths.tmp + '/**/*.scss') // Select all the scss files
			.pipe(sass().on('error', sass.logError)) // compile them using the sass plug-in
			.pipe(gulp.dest(paths.tmp)) // move them to the dist folder
	}
);

gulp.task(
	'css',
	gulp.series(
		'concat-css',
		'minify-css',
		function(done) {
			done();
		}
	)
);
