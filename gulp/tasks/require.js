var gulp = require('gulp');
var rjs = require('requirejs');
var helpers = require('../helpers/helpers.js');
var clean = require('gulp-clean');
var gutil = require('gulp-util');

var paths = require('../paths.js');


function getConfigRequire(mode, app) {
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
		'file-saver',
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
	];
	var librariesToExcludeFromWhole = [
		'pdfjs-dist/build/pdf',
		'pdfjs-dist/build/pdf.worker'
	];
	var standardFilesToExclude = [
		'config',
		'templates'
	];
	var appsToInclude = helpers.getAppsToInclude();
	var proApps = helpers.getProApps();
	var requireJsAppsToInclude;
	var excludeFromWhole;
	var modules;
	var config;

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
	} else if(mode === 'whole') {
		excludeFromWhole = standardFilesToExclude.concat(librariesToExcludeFromWhole);

		requireJsAppsToInclude = appsToInclude.reduce(function(acc, app) {
			acc.push('apps/' + app + '/app');
			if(proApps.indexOf(app) >= 0) {
				acc.push('apps/' + app + '/submodules/pro/pro');
			}
			return acc;
		}, []);

		modules = [
			{
				name:'js/main',
				exclude: excludeFromWhole,
				include: requireJsAppsToInclude
			}
		];
	}

	config = {
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
}

function moveRequire() {
	return gulp
		.src(paths.require  + '/**/*')
		.pipe(gulp.dest(paths.tmp));
}

function cleanRequire() {
	return gulp
		.src(paths.require, {
			allowEmpty: true,
			read: false
		})
		.pipe(clean());
}

function buildRequireApp(done) {
	rjs.optimize(getConfigRequire('app', gutil.env.app), function(buildResponse){
		done();
	}, done);
}

function buildRequire(done) {
	rjs.optimize(getConfigRequire('whole'), function(buildResponse){
		done();
	}, done);
}

gulp.task('require', gulp.series(buildRequire, 'clean-tmp', moveRequire, cleanRequire));
gulp.task('require-app', gulp.series(buildRequireApp, 'clean-tmp', moveRequire, cleanRequire));
