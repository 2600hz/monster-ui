var gulp = require('gulp');
var runSequence = require('run-sequence');
var handlebars = require('gulp-handlebars');
var wrap = require('gulp-wrap');
var declare = require('gulp-declare');
var concat = require('gulp-concat');
var gutil = require('gulp-util');
var clean = require('gulp-clean');
var path = require('path');

var paths = require('../paths.js');
var helpers = require('../helpers/helpers.js');

var tmpAppsHTML = [],
	appsToInclude = helpers.getAppsToInclude();

for(var i in appsToInclude) {
	tmpAppsHTML.push(paths.tmp + '/apps/' + appsToInclude[i] + '/views/*.html');
}

var pathsTemplates = {
	whole: {
		src: tmpAppsHTML,
		dest: paths.tmp + '/js/',
		concatName: 'templates-compiled.js'
	},
	app: {
		src: paths.app + 'views/*.html',
		dest: paths.app + 'views/',
		concatName: 'templates.js'
	}
};

gulp.task('compile-templates', function(){
	var mode = gutil.env.app ? 'app' : 'whole';
	return gulp.src(pathsTemplates[mode].src)
		.pipe(handlebars({
			handlebars: require('handlebars')
		}))
		.pipe(wrap('Handlebars.template(<%= contents %>)'))
		.pipe(declare({
			namespace: 'monster.cache.templates',
			noRedeclare: true, // Avoid duplicate declarations ,
			processName: function(filePath) {
				var splits = filePath.split(path.sep),
				//var splits = filePath.split('\\'),
					// our files are all in folder such as apps/accounts/views/test.html, so we want to extract the last and 2 before last parts to have the app name and the template name
					newName = splits[splits.length - 3] +'.' + splits[splits.length-1];

				return declare.processNameByPath(newName);
			}
		}))
		.pipe(concat(pathsTemplates[mode].concatName))
		.pipe(gulp.dest(pathsTemplates[mode].dest));
});

/*******************************************************************************************************************************/
/************************************************* WHOLE SPECIFIC **************************************************************/
gulp.task('templates', function(cb) {
	runSequence('compile-templates', 'concat-templates-whole', 'clean-template-whole', cb);
});

// Concats the existing templates.js with the compiledTemplates
gulp.task('concat-templates-whole', function() {
	var existingFile = 'templates.js';
	return gulp.src([pathsTemplates['whole'].dest + existingFile, pathsTemplates['whole'].dest + pathsTemplates['whole'].concatName])
		.pipe(concat(existingFile))
		.pipe(gulp.dest(pathsTemplates['whole'].dest));
});

gulp.task('clean-template-whole', function() {
	var filesToClean = (pathsTemplates['whole'].src).concat(pathsTemplates['whole'].dest + pathsTemplates['whole'].concatName);
	return gulp.src(filesToClean, {read: false})
		.pipe(clean());
});

/*******************************************************************************************************************************/
/************************************************* APP SPECIFIC ****************************************************************/
gulp.task('templates-app', function(cb) {
	runSequence('compile-templates', 'concat-js-app', 'clean-templates-app', cb);
});

gulp.task('concat-js-app', function() {
	var appFile = 'app.js';
	return gulp.src([ paths.app + appFile, pathsTemplates.app.dest + pathsTemplates.app.concatName])
		.pipe(concat(appFile))
		.pipe(gulp.dest(paths.app));
});

gulp.task('clean-templates-app', function() {
	return gulp.src([paths.app + 'views/*.html', pathsTemplates.app.dest + pathsTemplates.app.concatName], {read: false})
		.pipe(clean());
});