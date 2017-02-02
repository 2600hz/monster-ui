var gulp = require('gulp');
var runSequence = require('run-sequence');
var requireDir = require('require-dir');
var cache = require('gulp-cached');
var sass = require('gulp-sass');

var paths = require('./gulp/paths.js');


requireDir('./gulp/tasks', { recurse: true});

var browserSync = require('browser-sync').create();
var reload      = browserSync.reload;

gulp.task('build-prod', function(cb) {
	runSequence( 
		'move-files-to-tmp', // moves all files to tmp
		'sass', // compiles all scss files into css and moves them to dist
		'templates', // gets all the apps html templates and pre-compile them with handlebars, then append it to templates.js,
		'require', // from dist, run the optimizer and output it into dist
		'minify-js', // minifies js/main.js, we don't use the optimize from requirejs as we don't want to minify config.js
		'css', // takes all the apps provided up top and concatenate and minify them
		'write-config-prod', // writes a config file for monster to know which apps have been minified so it doesn't reload the assets
		'clean-folders', // moves tmp to dist and removes tmp after that
		cb
	);
});

gulp.task('build-dev', function(cb) {
	return runSequence(
		'move-files-to-tmp',
		//'lint', // Show linting error
		'sass',
		'write-config-dev',
		'clean-folders',
		cb
	);
});

gulp.task('build-app', function(cb) {
	runSequence( 
		'move-files-to-tmp', // moves all files but css to dist
		'sass', // compiles all scss files into css and moves them to dist
		'templates-app', // gets all the apps html templates and pre-compile them with handlebars, then append it to templates.js, also removes all the html files from the folder
		'require-app', // require whole directory, skipping all the optimizing of the core modules, but focusing on the specific app
		'minify-js-app', // minifies app.js
		'minify-css-app', // uglifies app.css
		'write-config-app', // add flags if needed, like pro/lite version
		'clean-folders',
		cb
	);
});


gulp.task('build-all', function(cb) {
	runSequence( 
		'build-dev',
		'move-dist-dev',
		'build-prod',
		cb
	);
});

gulp.task('default', ['serve']);

gulp.task('serve', ['build-dev'], function() {
	browserSync.init({
		server: {
			baseDir: './dist'
		}
	});

	gulp.watch(paths.src + '/**/*.scss', ['watch:sass']);
	gulp.watch(paths.src + '/**/*.css', ['watch:css']);
	gulp.watch(paths.src + '/**/*.html', ['watch:html']);
	gulp.watch(paths.src + '/**/*.js', ['watch:js']);
	gulp.watch(paths.src + '/**/*.json', ['watch:json']);
});

// compile our scss files to css files
gulp.task('watch:sass', function() {
	return gulp.src(paths.src + '/**/*.scss') // Select all the scss files
		//.pipe(cache('sass')) // when we cache it seems to not reload the files
		.pipe(sass().on('error', sass.logError)) // compile them using the sass plug-in
		.pipe(gulp.dest(paths.dist)) // move them to the dist folder
		.pipe(reload({stream: true}));
});

// compile our scss files to css files
gulp.task('watch:css', function() {
	return gulp.src(paths.src + '/**/*.css') // Select all the scss files
		.pipe(gulp.dest(paths.dist)) // move them to the dist folder
		.pipe(reload({stream: true}));
});

gulp.task('watch:js', function() {
	return gulp.src(paths.src + '/**/*.js') // Select all the scss files
		.pipe(cache('js'))
		.pipe(gulp.dest(paths.dist)) // move them to the dist folder
		.pipe(reload({stream: true}));
});

gulp.task('watch:html', function() {
	return gulp.src(paths.src + '/**/*.html') // Select all the scss files
		.pipe(cache('html'))
		.pipe(gulp.dest(paths.dist)) // move them to the dist folder
		.pipe(reload({stream: true}));
});

gulp.task('watch:json', function() {
	return gulp.src(paths.src + '/**/*.json') // Select all the scss files
		.pipe(cache('json'))
		.pipe(gulp.dest(paths.dist)) // move them to the dist folder
		.pipe(reload({stream: true}));
});