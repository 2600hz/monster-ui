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
	var	librariesToExcludeFromAppBuild = [
			'async',
			'bootstrap',
			'card',
			'chart',
			'chosen',
			'clipboard',
			'config',
			'cookies',
			'crossroads',
			'ddslick',
			'drop',
			'fileupload',
			'footable',
			'form2object',
			'handlebars',
			'hasher',
			'hotkeys',
			'introJs',
			'isotope',
			'jquery',
			'jqueryui',
			'jstz',
			'kazoosdk',
			'lodash',
			'mask',
			'modernizr',
			'monster',
			'monster-apps',
			'monster-routing',
			'monster-timezone',
			'monster-ui',
			'monster-util',
			'mousetrap',
			'nicescroll',
			'papaparse',
			'pdfjs-dist/build/pdf',
			'pdfjs-dist/build/pdf.worker',
			'postal',
			'randomColor',
			'renderjson',
			'reqwest',
			'signals',
			'templates',
			'tether',
			'timepicker',
			'toastr',
			'touch-punch',
			'validate',
			'wysiwyg'
		],
		librariesToExcludeFromWhole = [
			'pdfjs-dist/build/pdf',
			'pdfjs-dist/build/pdf.worker'
		],
		standardFilesToExclude = [
			'config',
			'templates'
		];

	if(mode === 'app') {
		modules = [
			{
				name:'js/main',
				exclude: standardFilesToExclude
			},
			{
				name: 'apps/' + app + '/app',
				exclude: librariesToExcludeFromAppBuild,
				include: gutil.env.pro ? ['apps/' + app + '/submodules/pro/pro'] : []
			}
		];
	}
	else if(mode === 'whole') {
		var excludeFromWhole = standardFilesToExclude.concat(librariesToExcludeFromWhole);

		modules = [
			{
				name:'js/main',
				exclude: excludeFromWhole,
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