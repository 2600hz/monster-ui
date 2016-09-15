// Plugins
var fs = require('fs'),
	path = require('path'),
	gulp = require('gulp'),
	sass = require('gulp-sass'),
	clean = require('gulp-clean'),
	livereload = require('gulp-livereload'),
	runSequence = require('run-sequence'),
	rjs = require('requirejs'),
	concatCss = require('gulp-concat-css'),
	cleanCSS = require('gulp-clean-css'),
	handlebars = require('gulp-handlebars'),
	wrap = require('gulp-wrap'),
	declare = require('gulp-declare'),
	concat = require('gulp-concat'),
	rename = require('gulp-rename'),
	jeditor = require('gulp-json-editor'),
	gutil = require('gulp-util'),
	uglify = require('gulp-uglify');

//require('require-dir')('./gulp-tasks');

function getDirectories(srcpath) {
	return fs.readdirSync(srcpath).filter(function(file) {
		return fs.statSync(path.join(srcpath, file)).isDirectory();
	});
}

function getAppsToInclude() {
	var apps = getDirectories('./src/apps'),
		appsToExclude = ['tutorial', 'skeleton', 'demo_done'],
		filteredApps = [];

	for(var i in apps) {
		if(appsToExclude.indexOf(apps[i]) < 0) {
			filteredApps.push(apps[i]);
		}
	}
	return filteredApps;
}

// Constants
var _dist_path = './dist',
	_dist_require_path = './distRequired',
	_src_path = './src/**/*',
	_scss_path = './src/**/*.scss';

var _require_js_paths = [],
	_concat_css_path = ['./dist/css/style.css'],
	_templates_html_path = [],
	appsToInclude = getAppsToInclude();

buildPaths();

function buildPaths(prefix) {
	for(var i in appsToInclude) {
		_require_js_paths.push('apps/' + appsToInclude[i] + '/app');
		_concat_css_path.push('./dist/apps/'+ appsToInclude[i] +'/style/*.css');
		_templates_html_path.push('./src/apps/' + appsToInclude[i] + '/views/*.html');
	}
}


gulp.task('concatCss', function() {
	return gulp.src(_concat_css_path)
				.pipe(concatCss('style-concat.css'))
				.pipe(gulp.dest('./dist/css/'))
});

gulp.task('minifyCss', function() {
	return gulp.src('./dist/css/style-concat.css')
		.pipe(cleanCSS())
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(gulp.dest('./dist/css/'));
});

gulp.task('removeCss', function() {
	return gulp.src(['./dist/css/style-concat.css', './dist/css/style.css'])
				.pipe(clean());
});

gulp.task('renameCss', function() {
	gulp.src('./dist/css/style-concat.min.css')
				.pipe(rename('style.css'))
				.pipe(gulp.dest('./dist/css/'));

	return gulp.src('./dist/css/style-concat.min.css').pipe(clean());
});

gulp.task('css', function(cb) {
	runSequence('concatCss', 'minifyCss', 'removeCss', 'renameCss', cb);
});

gulp.task('minifyJS', function() {
	return gulp.src(['./dist/js/main.js', './dist/js/templates.js'])
		.pipe(uglify())
		.pipe(gulp.dest('./dist/js/'));
});

gulp.task('minify-js-app', function() {
	var app = gutil.env.app;
	return gulp.src('./dist/apps/'+app+'/app.js')
			.pipe(uglify())
			.pipe(gulp.dest('./dist/apps/'+app));
});

var requireConfig = {  
	dir: 'distRequired',
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
				'templates'
			],
			include: _require_js_paths 
		}
	]
};

var getConfigRequire = function(mode, app) {
	var librariesToExclude = ['async','bootstrap','bootstrap-clickover','chart','card','chosen','crossroads','config','datatables','dependClass','ddslick','fileupload','footable','form2object','handlebars','hasher','hotkeys','introJs','isotope','jquery','jqueryui','jstz','kazoosdk','mask','modernizr','monster','monster-apps','monster-ui','monster-timezone','monster-routing','monster-ui','monster-util','mousetrap','nicescroll','plugins','papaparse','postal','prettify','renderjson','reqwest','signals','slider','timepicker','toastr','touch-punch','underscore','validate','vkbeautify','wysiwyg','pdfjs-dist/build/pdf','pdfjs-dist/build/pdf.worker', 'templates'];
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
				exclude: librariesToExclude
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
				include: _require_js_paths
			}
		];
	}

	var config = {  
		dir: 'distRequired',
		appDir: 'dist/',
		baseUrl:'./',
		mainConfigFile:'dist/js/main.js',
		fileExclusionRegExp: /^doc*|.*\.md|^\..*|^monster-ui\.build\.js$/,
		findNestedDependencies:true,
		preserveLicenseComments:false,
		removeCombined:true,
		optimize: 'none', // prevent optimization because we don't want to minify config.js and there's no way to single it out // we should optimize with gulp later
		modules: modules
	};
	console.log(config);

	return config;
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

gulp.task('clean-dist-dev', function() {
	return gulp.src('./dist-dev', {read: false})
			.pipe(clean());
});

gulp.task('clean-tmp', function() {
	return gulp.src('./tmp', {read: false})
		.pipe(clean());
});

// move all src files to dist, except scss files
gulp.task('move-files', ['clean-require', 'clean-dist'], function() {
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

gulp.task('require', function(cb) {
	runSequence('buildRequire', 'move-require', 'clean-require', cb);
});

gulp.task('require-app', function(cb) {
	runSequence('buildRequireApp', 'move-require', 'clean-require', cb);
});

gulp.task('buildRequire', function(cb){
	rjs.optimize(getConfigRequire('whole'), function(buildResponse){
		cb();
	}, cb);
});

gulp.task('buildRequireApp', function(cb){
	rjs.optimize(getConfigRequire('app', gutil.env.app), function(buildResponse){
		cb();
	}, cb);
});

gulp.task('move-require', ['clean-dist'], function() {
	return gulp.src(_dist_require_path + '/**/*')
		.pipe(gulp.dest('dist'));
});

gulp.task('move-dist-dev', ['clean-dist-dev'], function() {
	return gulp.src('./dist/**/*')
			.pipe(gulp.dest('dist-dev'));
});

gulp.task('compileTemplates', function(){
	var paths = {
			app: {
				src: './src/apps/'+gutil.env.app+'/views/*.html',
				dest: './dist/apps/'+gutil.env.app+'/views',
				concatName: 'templates.js'
			},
			whole: {
				src: _templates_html_path,
				dest: 'tmp/js/',
				concatName: 'templates-compiled.js'
			}
		},
		mode = gutil.env.app ? 'app' : 'whole';

	return gulp.src(paths[mode].src)
		.pipe(handlebars({
			handlebars: require('handlebars')
		}))
		.pipe(wrap('Handlebars.template(<%= contents %>)'))
		.pipe(declare({
			namespace: 'monster.cache.templates',
			noRedeclare: true, // Avoid duplicate declarations ,
			processName: function(filePath) {
				var splits = filePath.split('\\'),
					// our files are all in folder such as apps/accounts/views/test.html, so we want to extract the last and 2 before last parts to have the app name and the template name
					newName = splits[splits.length - 3] +'.' + splits[splits.length-1];
				return declare.processNameByPath(newName);
			}
		}))
		.pipe(concat(paths[mode].concatName))
		.pipe(gulp.dest(paths[mode].dest));
});

gulp.task('templates-app', function(cb) {
	runSequence('compileTemplates', 'concat-js-app', 'clean-templates-app', cb);
});

gulp.task('concat-js-app', function() {
	return gulp.src(['dist/apps/'+ gutil.env.app +'/app.js', 'dist/apps/'+ gutil.env.app +'/views/templates.js'])
		.pipe(concat('app.js'))
		.pipe(gulp.dest('dist/apps/'+ gutil.env.app +'/'));
});

gulp.task('clean-templates-app', function() {
	return gulp.src(['./dist/apps/'+gutil.env.app+'/views/*.html', './dist/apps/'+ gutil.env.app+'/views/templates.js'], {read: false})
		.pipe(clean());
});

gulp.task('templates', function(cb) {
	runSequence('removeDistTemplates', 'compileTemplates', 'concatTemplates', 'clean-tmp', cb);
});

gulp.task('concatTemplates', function() {
	return gulp.src(['src/js/templates.js', 'tmp/js/templates-compiled.js'])
		.pipe(concat('templates.js'))
		.pipe(gulp.dest('dist/js'));
});


gulp.task('removeDistTemplates', function() {
	return gulp.src('./dist/js/templates.js').pipe(clean());
});

// watch our scss files so that when we change a variable it reloads the browser with the new css
gulp.task('watch', function (){
	runSequence('build', function() {
		livereload.listen();

		gulp.watch(_scss_path, ['sass']);
	});
});

gulp.task('write-config', function() {
	fs.writeFileSync('build-config.json', '{}');

	return gulp.src('build-config.json')
			.pipe(jeditor({
				preloadedApps: gutil.env.env === 'prod' ? getAppsToInclude() : []
			}))
			.pipe(gulp.dest('./dist'));
});


gulp.task('build-all', function(cb) {
	runSequence( 
		'build-dev',
		'move-dist-dev',
		'build-prod',
		cb
	);
});

gulp.task('build-dev', function(cb) {
	gutil.env.env = 'dev';

	runSequence(
		'move-files',
		'sass',
		'write-config',
		cb
	);
});

gulp.task('build-prod', function(cb) {
	gutil.env.env = 'prod';

	runSequence( 
		'move-files', // moves all files to dist
		'sass', // compiles all scss files into css and moves them to dist
		'templates', // gets all the apps html templates and pre-compile them with handlebars, then append it to templates.js,
		'require', // from dist, run the optimizer and output it into dist
		'minifyJS', // minifies js/main.js, we don't use the optimize from requirejs as we don't want to minify config.js
		'css', // takes all the apps provided up top and concatenate and minify them
		'write-config', // writes a config file for monster to know which apps have been minified so it doesn't reload the assets
		cb
	);
});

gulp.task('build', function() {
	gutil.env.env = gutil.env.env || 'dev';
console.log(gutil.env.env);
	if(gutil.env.env === 'prod') {
		runSequence( 
			'build-prod'
		);
	}
	else {
		runSequence( 
			'build-dev'
		);
	}
});

gulp.task('build-app', function(cb) {
	runSequence( 
		'move-files', // moves all files but css to dist
		'sass', // compiles all scss files into css and moves them to dist
		'templates-app', // gets all the apps html templates and pre-compile them with handlebars, then append it to templates.js,
		'require-app', // from dist, run the optimizer and output it into dist
		'minify-js-app', // minifies js/main.js, we don't use the optimize from requirejs as we don't want to minify config.js
		//'css', // takes all the apps provided up top and concatenate and minify them
		//'write-config', // writes a config file for monster to know which apps have been minified so it doesn't reload the assets
		cb
	);
});

gulp.task('default', ['build']);