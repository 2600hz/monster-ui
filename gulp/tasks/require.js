import gulp from 'gulp';
import rjs from 'requirejs';
import del from 'del';
import vinylPaths from 'vinyl-paths';
import { require, tmp } from '../paths.js';
import { env, getProApps, getAppsToInclude } from '../helpers/helpers.js';
import { cleanTmp } from './clean-move.js';

const standardFilesToExclude = [
	'config',
	'templates'
];

const libsToExcludeFromWhole = [
	'pdfjs-dist/build/pdf',
	'pdfjs-dist/build/pdf.worker'
];

const libsToExcludeFromApp = [
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

const getConfigRequire = () => ({
	dir: require, // direction
	appDir: tmp, // origin
	baseUrl:'./',
	mainConfigFile: tmp + '/js/main.js',
	fileExclusionRegExp: /^doc*|.*\.md|^\..*|^monster-ui\.build\.js$/,
	findNestedDependencies:true,
	preserveLicenseComments:false,
	removeCombined:true,
	/**
	 * Prevent optimization because we don't want to minify config.js and there
	 * is no way to single it out, we should optimize with gulp later.
	 * @type {String}
	 */
	optimize: 'none',
	modules: env.hasOwnProperty('app')
		? [
			{
				name:'js/main',
				exclude: standardFilesToExclude
			},
			{
				name: 'apps/' + env.app + '/app',
				exclude: libsToExcludeFromApp,
				include: env.hasOwnProperty('pro')
					? ['apps/' + env.app + '/submodules/pro/pro']
					: []
			}
		]
		: [
			{
				name:'js/main',
				exclude: [
					...standardFilesToExclude,
					...libsToExcludeFromWhole
				],
				include: getAppsToInclude().reduce((acc, item) => [
					...acc,
					'apps/' + item + '/app',
					...(getProApps().includes(item)
						? ['apps/' + item + '/submodules/pro/pro']
						: [])
				], [])
			}
		]
});

const buildRequire = done => {
	rjs.optimize(getConfigRequire(), function(buildResponse){
		done();
	}, done);
};

const moveRequire = () => gulp
	.src(require  + '/**/*')
	.pipe(gulp.dest(tmp));

const cleanRequire = () => gulp
	.src(require, {
		allowEmpty: true,
		read: false
	})
	.pipe(vinylPaths(del));

/**
 * buildRequire
 * cleanTmp
 * moveRequire
 * cleanRequire
 *
 * For `whole`: from dist, run the optimizer and output it into dist
 *
 * For `app`: require whole directory, skipping all the optimizing of the core
 * modules, but focusing on the specific app
 */
export default gulp.series(
	buildRequire,
	cleanTmp,
	moveRequire,
	cleanRequire
);
