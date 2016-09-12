// Plugins
var gulp = require('gulp'),
	sass = require('gulp-sass'),
	clean = require('gulp-clean'),
	livereload = require('gulp-livereload'),
	runSequence = require('run-sequence'),
	rjs = require('requirejs');

// Constants
var _dist_path = './dist',
	_dist_require_path = './distRequired',
	_src_path = './src/**/*.*',
	_scss_path = './src/**/*.scss';

var paths = [],
	appsToInclude = [
		// core apps
		'core',
		'myaccount',
		'common',
		'apploader',
		'appstore',
		'auth',
		// apps
		'accounts',
		'branding',
		'callflows',
		'carriers',
		'cluster',
		'conferences',
		'debug',
		'dialplans',
		'fax',
		'inspector',
		'migration',
		'mobile',
		'numbers',
		'pbxs',
		'pivot',
		'port',
		'provisioner',
		'tasks',
		'userportal',
		'voicemails',
		'voip',
		'webhooks',
		'websockets'
	];

for(var i in appsToInclude) {
	paths.push('apps/' + appsToInclude[i] + '/app');
}

var requireConfig = {  
	dir:'distRequired',
	appDir: 'dist/',
	baseUrl:'./',
	mainConfigFile:'dist/js/main.js',
	fileExclusionRegExp: /^doc*|.*\.md|^\..*|^monster-ui\.build\.js$/,
	findNestedDependencies:true,
	preserveLicenseComments:false,
	removeCombined:true,
	optimize: 'none', // prevent optimization because we don't want to minify config.js and there's no way to single it out // we should optimize with gulp later
	modules:[
		{
			name:'js/main',
			exclude:[
				'config',
			],
			include: paths 
		}
	]
};

// Tasks
// remove all files in dist
gulp.task('clean-require', function() {
	return gulp.src(_dist_require_path, {read: false})
		.pipe(clean());
});

gulp.task('clean-dist', function() {
	return gulp.src(_dist_path, {read: false})
		.pipe(clean());
});

// move all src files to dist, except scss files
gulp.task('build', ['clean-require', 'clean-dist'], function() {
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

gulp.task('buildRequire', function(cb){
	rjs.optimize(requireConfig, function(buildResponse){
		cb();
	}, cb);
});

gulp.task('buildProd', function() {
	runSequence('build', 'sass', 'buildRequire', function() {

	});
});

// watch our scss files so that when we change a variable it reloads the browser with the new css
gulp.task('watch', function (){
	runSequence('build', 'sass', function() {
		livereload.listen();

		gulp.watch(_scss_path, ['sass']);
	});
});

gulp.task('default', ['watch']);