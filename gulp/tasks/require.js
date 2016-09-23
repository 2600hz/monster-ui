var gulp = require('gulp');
var runSequence = require('run-sequence');
var rjs = require('requirejs');
var helpers = require('../helpers/helpers.js');
var clean = require('gulp-clean');
var gutil = require('gulp-util');

var paths = require('../paths.js');


var requireJsAppsToInclude = [],
	appsToInclude = helpers.getAppsToInclude(),
	proApps = helpers.getProApps();

for(var i in appsToInclude) {
	requireJsAppsToInclude.push('apps/' + appsToInclude[i] + '/app');

	if(proApps.indexOf(appsToInclude[i]) >= 0) {
		requireJsAppsToInclude.push('apps/' + appsToInclude[i] + '/submodules/pro/pro');
	}
}

var getConfigRequire = function(mode, app) {
	var	librariesToExclude = ['async','bootstrap','bootstrap-clickover','chart','card','chosen','crossroads','config','datatables','dependClass','ddslick', 'drop', 'fileupload','footable','form2object','handlebars','hasher','hotkeys','introJs','isotope','jquery','jqueryui','jstz','kazoosdk','mask','modernizr','monster','monster-apps','monster-ui','monster-timezone','monster-routing','monster-ui','monster-util','mousetrap','nicescroll','plugins','papaparse','postal','prettify','renderjson','reqwest','signals','slider', 'tether', 'timepicker','toastr','touch-punch','underscore','validate','vkbeautify','wysiwyg','pdfjs-dist/build/pdf','pdfjs-dist/build/pdf.worker', 'templates'];

	if(mode === 'app') {
		modules = [
			{
				name:'js/main',
				exclude:[
					'config',
					'templates'
				]
			},
			{
				name: 'apps/' + app + '/app',
				exclude: librariesToExclude,
				include: gutil.env.pro ? ['apps/' + app + '/submodules/pro/pro'] : []
			}
		];
	}
	else if(mode === 'whole') {
		modules = [
			{
				name:'js/main',
				exclude:[
					'config',
					'templates'
				],
				include: requireJsAppsToInclude
			}
		];
	}

	var config = {  
		dir: paths.require, // direction
		appDir: paths.tmp, // origin
		baseUrl:'./',
		mainConfigFile: paths.tmp + '/js/main.js',
		fileExclusionRegExp: /^doc*|.*\.md|^\..*|^monster-ui\.build\.js$/,
		findNestedDependencies:true,
		preserveLicenseComments:false,
		removeCombined:true,
		optimize: 'none', // prevent optimization because we don't want to minify config.js and there's no way to single it out // we should optimize with gulp later
		modules: modules
	};

	return config;
};

gulp.task('require', function(cb) {
	runSequence('build-require', 'move-require', 'clean-require', cb);
});

gulp.task('require-app', function(cb) {
	runSequence('build-require-app', 'move-require', 'clean-require', cb);
});


gulp.task('build-require', function(cb){
	rjs.optimize(getConfigRequire('whole'), function(buildResponse){
		cb();
	}, cb);
});

gulp.task('build-require-app', function(cb){
	rjs.optimize(getConfigRequire('app', gutil.env.app), function(buildResponse){
		cb();
	}, cb);
});

gulp.task('clean-require', function() {
	return gulp.src(paths.require, {read: false})
			.pipe(clean());
});

gulp.task('move-require', ['clean-tmp'], function() {
	return gulp.src(paths.require  + '/**/*')
		.pipe(gulp.dest(paths.tmp));
});