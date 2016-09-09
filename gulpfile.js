// Plugins
var gulp = require('gulp'),
	sass = require('gulp-sass'),
	clean = require('gulp-clean'),
	livereload = require('gulp-livereload'),
	runSequence = require('run-sequence');

// Constants
var _dist_path = './dist',
	_src_path = './src/**/*.*',
	_scss_path = './src/**/*.scss';

// Tasks
// remove all files in dist
gulp.task('clean-all', function () {
	return gulp.src(_dist_path, { read: false })
		.pipe(clean());
});

// move all src files to dist, except scss files
gulp.task('build', ['clean-all'], function() {
	return gulp.src([
			'!'+_scss_path, // remove scss files from the move since we'll use the sass operations on them to compile them and use them in css
			_src_path // specify everything else
		])
		.pipe(gulp.dest(_dist_path)); // Move the files selected to the dist path
});

// compile our scss files to css files
gulp.task('sass', function() {
	return gulp.src(_scss_path) // Select all the scss files
		.pipe(sass().on('error', sass.logError)) // compile them using the sass plug-in
		.pipe(gulp.dest(_dist_path)) // move them to the dist folder
		.pipe(livereload()); // reload browser
});

// watch our scss files so that when we change a variable it reloads the browser with the new css
gulp.task('watch', function (){
	runSequence('build', 'sass', function() {
		livereload.listen();

		gulp.watch(_scss_path, ['sass']);
	});
});

gulp.task('default', ['watch']);