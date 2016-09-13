// Plugins
var gulp = require('gulp'),
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

// Constants
var _dist_path = './dist',
	_dist_require_path = './distRequired',
	_src_path = './src/**/*',
	_scss_path = './src/**/*.scss';

var environment = gutil.env.env || 'dev',
	_require_js_paths = [],
	_concat_css_path = [
		'./dist/css/style.css'
	],
	coreApps = [
		// core apps
		'core',
		'auth',
		'common',
		'myaccount',
		'apploader',
		'appstore'
	],
	otherApps = [
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
	],
	appsToInclude = coreApps.concat(otherApps);

function getAppsToInclude() {
	var apps = [];

	if(environment === 'prod') {
		apps = coreApps.concat(otherApps);
	}

	return apps;
}

for(var i in appsToInclude) {
	_require_js_paths.push('apps/' + appsToInclude[i] + '/app');
}

for(var i in appsToInclude) {
	_concat_css_path.push('./dist/apps/'+ appsToInclude[i] +'/style/*.css');
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

gulp.task('compressJs', function() {
	return gulp.src('./dist/js/main.js')
		.pipe(uglify())
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(gulp.dest('./dist/js/'));
});

gulp.task('removeJs', function() {
	return gulp.src(['./dist/js/main.js'])
				.pipe(clean());
});

gulp.task('renameJs', function() {
	gulp.src('./dist/js/main.min.js')
		.pipe(rename('main.js'))
		.pipe(gulp.dest('./dist/js/'));

	return gulp.src('./dist/js/main.min.js').pipe(clean());
});

gulp.task('js', function(cb) {
	runSequence('compressJs', 'removeJs', 'renameJs', cb);
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
				'config'
			],
			include: _require_js_paths 
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
})

gulp.task('buildRequire', function(cb){
	rjs.optimize(requireConfig, function(buildResponse){
		cb();
	}, cb);
});

gulp.task('move-require', ['clean-dist'], function() {
	return gulp.src(_dist_require_path + '/**/*')
		.pipe(gulp.dest('dist'));
});

gulp.task('build', function() {
	if(environment === 'prod') {
		runSequence( 
			'move-files', // moves all files to dist
			'sass', // compiles all scss files into css and moves them to dist
			'require', // from dist, run the optimizer and output it into dist
			'js', // minifies js/main.js
			'css', // takes all the apps provided up top and concatenate and minify them
			'write-config' // writes a config file for monster to know which apps have been minified so it doesn't reload the assets
		);
	}
	else {
		runSequence(
			'move-files',
			'sass',
			'write-config'
		);
	}
})

gulp.task('templates', function(){
	gulp.src('src/apps/*/views/*.html')
		.pipe(handlebars())
		.pipe(wrap('Handlebars.template(<%= contents %>)'))
		.pipe(declare({
			namespace: 'monster.cache.templates',
			noRedeclare: true, // Avoid duplicate declarations ,
			processName: function(filePath) {
				// Allow nesting based on path using gulp-declare's processNameByPath()
				// You can remove this option completely if you aren't using nested folders
				// Drop the client/templates/ folder from the namespace path by removing it from the filePath
				//return declare.processNameByPath(filePath.replace('client/templates/', ''));
				var splits = filePath.split('\\');
				var newName = splits[splits.length - 3] +'.' + splits[splits.length-1];
				//console.log(newName);
				return declare.processNameByPath(newName);
			}
		}))
		.pipe(concat('templates.js'))
		.pipe(gulp.dest(_dist_path +'/js/'));
});

// watch our scss files so that when we change a variable it reloads the browser with the new css
gulp.task('watch', function (){
	runSequence('build', function() {
		livereload.listen();

		gulp.watch(_scss_path, ['sass']);
	});
});

gulp.task('write-config', function() {
	require('fs').writeFileSync('build-config.json', '{}');

	gulp.src('build-config.json')
		.pipe(jeditor({
			preloadedApps: getAppsToInclude()
		}))
		.pipe(gulp.dest('./dist'))
});

gulp.task('default', ['buildProd']);