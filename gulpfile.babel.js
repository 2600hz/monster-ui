import gulp from 'gulp';
import requireDir from 'require-dir';
import { create } from 'browser-sync';

const server = create();

requireDir('./gulp/tasks', { recurse: true });

const serve = done => {
	server.init({
		server: {
			baseDir: './dist'
		}
	});
	done();
}

const buildProd = gulp.series(
	'move-files-to-tmp', // moves all files to tmp
	'sass', // compiles all scss files into css and moves them to dist
	'templates', // gets all the apps html templates and pre-compile them with handlebars, then append it to templates.js,
	'require', // from dist, run the optimizer and output it into dist
	'minify-js', // minifies js/main.js, we don't use the optimize from requirejs as we don't want to minify config.js
	'css', // takes all the apps provided up top and concatenate and minify them
	'write-config-prod', // writes a config file for monster to know which apps have been minified so it doesn't reload the assets
	'write-version', // writes version file to display in monster
	'clean-folders', // moves tmp to dist and removes tmp after that
	done => {
		done();
	}
);

const buildDev = gulp.series(
	'move-files-to-tmp',
	//'lint', // Show linting error
	'sass',
	'write-config-dev',
	'write-version', // writes version file to display in monster
	'clean-folders',
	done => {
		done();
	}
);

gulp.task('build-prod', buildProd);
gulp.task('serve-prod', gulp.series(buildProd, serve));

gulp.task('build-dev', buildDev);
gulp.task('serve-dev', gulp.series(buildDev, serve));

gulp.task('build-app', gulp.series(
	'move-files-to-tmp', // moves all files but css to dist
	'sass', // compiles all scss files into css and moves them to dist
	'templates-app', // gets all the apps html templates and pre-compile them with handlebars, then append it to templates.js, also removes all the html files from the folder
	'require', // require whole directory, skipping all the optimizing of the core modules, but focusing on the specific app
	'minify-js-app', // minifies app.js
	'minify-css-app', // uglifies app.css
	'write-config-app', // add flags if needed, like pro/lite version
	'clean-folders'
));
gulp.task('build-all', gulp.series(buildDev, 'move-dist-dev', buildProd));

gulp.task('default', gulp.series('serve-dev'));
