var gulp = require('gulp');
var runSequence = require('run-sequence');
var requireDir = require('require-dir');


requireDir('./gulp/tasks', { recurse: true});

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
	runSequence(
		'move-files-to-tmp',
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