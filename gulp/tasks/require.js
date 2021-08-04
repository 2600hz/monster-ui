import { join } from 'upath';
import gulp from 'gulp';
import rjs from 'requirejs';
import del from 'del';
import vinylPaths from 'vinyl-paths';
import { require, tmp } from '../paths.js';
import { env, getProApps, getAppsToInclude, mode } from '../helpers/helpers.js';
import { cleanTmp } from './clean-move.js';

const standardFilesToExclude = [
	'config',
	'templates'
];

const libsToExcludeFromWhole = [
	'pdfjs-dist/build/pdf',
	'pdfjs-dist/build/pdf.worker',
	'pdfmake',
	'vfs_fonts'
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
	'date-holidays',
	'ddslick',
	'disableAutoFill',
	'drop',
	'duo',
	'file-saver',
	'fileupload',
	'footable',
	'form2object',
	'handlebars',
	'hasher',
	'hotkeys',
	'image-select',
	'introJs',
	'isotope',
	'jquery',
	'jqueryui',
	'jsoneditor',
	'jstz',
	'jszip',
	'kazoo',
	'kazoosdk',
	'libphonenumber',
	'lodash',
	'mask',
	'md5',
	'modernizr',
	'moment',
	'moment-timezone',
	'monster',
	'monster-apps',
	'monster-routing',
	'monster-socket',
	'monster-timezone',
	'monster-ua',
	'monster-ui',
	'monster-util',
	'monster-webphone',
	'monthpicker',
	'mousetrap',
	'papaparse',
	'pdfjs-dist/build/pdf',
	'pdfjs-dist/build/pdf.worker',
	'pdfmake',
	'popup-redirect',
	'postal',
	'randomColor',
	'renderjson',
	'signals',
	'simplemde',
	'sugar-date',
	'templates',
	'tether',
	'timepicker',
	'toastr',
	'touch-punch',
	'validate',
	'vfs_fonts',
	'wysiwyg'
];

const modulesPerMode = {
	app: [
		{
			name: join('js', 'main'),
			exclude: standardFilesToExclude
		},
		{
			name: join('apps', (env.app || ''), 'app'),
			exclude: libsToExcludeFromApp,
			include: env.hasOwnProperty('pro')
				? [join('apps', (env.app || ''), 'submodules', 'pro',  'pro')]
				: []
		}
	],
	whole: [
		{
			name: join('js', 'main'),
			exclude: [
				...standardFilesToExclude,
				...libsToExcludeFromWhole
			],
			include: getAppsToInclude().flatMap(
				app => [
					join('apps', app, 'app'),
					...(getProApps().includes(app)
						? [join('apps', app, 'submodules', 'pro', 'pro')]
						: [])
				]
			)
		}
	]
};
const modules = modulesPerMode[mode];

const buildRequire = done => {
	rjs.optimize({
		dir: require, // direction
		appDir: tmp, // origin
		baseUrl:'.',
		mainConfigFile: join(tmp, 'js', 'main.js'),
		fileExclusionRegExp: /^doc*|.*\.md|^\..*|^monster-ui\.build\.js$/,
		findNestedDependencies:true,
		preserveLicenseComments:false,
		removeCombined:true,
		/**
		 * Prevent optimization because we don't want to minify config.js and
		 * there is no way to single it out, we should optimize with gulp later.
		 * @type {String}
		 */
		optimize: 'none',
		modules: modules
	}, function() {
		done();
	}, done);
};

const moveRequire = () => gulp
	.src(join(require , '**', '*'))
	.pipe(gulp.dest(tmp));

const cleanRequire = () => gulp
	.src(require, {
		allowEmpty: true,
		read: false
	})
	.pipe(vinylPaths(del));

/**
 * For `whole`: from dist, run the optimizer and output it into dist
 *
 * For `app`: require whole directory, skipping all the optimizing of the core
 * modules, but focusing on the specific app
 */
export default gulp.series(
	buildRequire,
	moveRequire,
	cleanRequire
);
