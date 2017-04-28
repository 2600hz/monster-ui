
require.config({
	waitSeconds: 200,
	paths: {
		'config': 'js/config',

		/**
		 * custom libraries
		 */
		'kazoo': 'js/lib/kazoo/kazoo',
		'fileupload': 'js/lib/jquery.fileupload',
		'kazoosdk': 'js/lib/jquery.kazoosdk',
		'monster-apps': 'js/lib/monster.apps',
		'monster': 'js/lib/monster',
		'monster-routing': 'js/lib/monster.routing',
		'monster-socket': 'js/lib/monster.socket',
		'monster-timezone': 'js/lib/monster.timezone',
		'monster-ua': 'js/lib/monster.ua',
		'monster-ui': 'js/lib/monster.ui',
		'monster-webphone': 'js/lib/monster.webphone',
		'templates': 'js/templates',

		/**
		 * vendor libraries
		 */

		// same version: v2.1.4 (from source)
		'async': 'node_modules/async/dist/async.min',

		// same version: v2.3.1 (from source), installed as a tar
		'bootstrap': 'node_modules/bootstrap/docs/assets/js/bootstrap.min',

		// unused?
		'bootstrap-clickover': 'js/vendor/bootstrapx-clickover-1.0',

		// same version: v1.0.0-beta2 (assumed from commit history)
		'card': 'node_modules/card/lib/js/card',

		// v1.0.1-beta.2 (closest available) instead of v0.2.0 (assumed from commit history)
		'chart': 'node_modules/chart.js/Chart.min',

		// v1.5.1 (closest available) instead of v1.0.0 (from source)
		'chosen': 'node_modules/chosen-js/chosen.jquery',

		// same version: v1.5.15 (from source)
		'clipboard': 'node_modules/clipboard/dist/clipboard',

		// same version: v0.12.2 (from source)
		'crossroads': 'node_modules/crossroads/dist/crossroads.min',

		// can't find valid package
		'dependClass': 'js/vendor/jquery.dependClass',

		// v1.0.0 (unknown current)
		'ddslick': 'node_modules/ddslick/dist/jquery.ddslick.min',

		// same version: v1.4.1 (from source)
		'drop': 'node_modules/tether-drop/dist/js/drop.min',

		// same version: latest, no releases
		'duo': 'node_modules/duo_web/js/Duo-Web-v1',

		// not declared as a package
		'footable': 'js/vendor/footable.min',

		// v1.0.0 (unknown current)
		'form2object': 'node_modules/form2js/src/form2js',

		// same version: v4.0.5 (from source)
		'handlebars': 'node_modules/handlebars/dist/handlebars',

		// same version: v1.2.0 (from source)
		'hasher': 'node_modules/hasher/dist/js/hasher',

		// v0.2.2 (unknown current)
		'hotkeys': 'node_modules/jquery-hotkeys/jquery-hotkeys',

		// v1.1.0 instead of v1.0.0 (assumed from commit history)
		'introJs': 'node_modules/intro.js/intro',

		// v2.1.0 (closest available) instead of v1.5.25 (from source)
		'isotope': 'node_modules/isotope-layout/js/isotope',

		// same version: v1.9.1 (from source)
		'jquery': 'node_modules/jquery/jquery',

		// v1.10.4 (closest available) instead of v1.10.3 (from source)
		'jqueryui': 'node_modules/jquery-ui/jquery-ui',

		// can't find valid package
		'jstz': 'js/vendor/jstz.min',

		// latest packaged version not working
		'libphonenumber': 'js/vendor/libphonenumber-js.min',

		// same version: v1.13.9 (from source)
		'mask': 'node_modules/jquery-mask-plugin/dist/jquery.mask',

		// v3.0.0 (closest stable) instead of v2.6.2 (from source)
		'modernizr': 'js/vendor/modernizr-2.6.2.min',

		// need to build source
		'monster-util': 'js/lib/monster.util',

		// same version: v1.5.3 (from source)
		'mousetrap': 'node_modules/mousetrap/mousetrap',

		// v3.6.8 (closest available) instead of v3.2.0 (from source)
		'nicescroll': 'node_modules/jquery.nicescroll/jquery.nicescroll',

		//
		'plugins': 'js/plugins',

		// same version: v4.1.2 (from source)
		'papaparse': 'node_modules/papaparse/papaparse',

		// same version: v0.8.2 (from source)
		'postal': 'node_modules/postal/lib/postal',

		// same version: v1.2.0 (from source)
		'renderjson': 'node_modules/renderjson/renderjson',

		// same version: v0.7.3 (from source)
		'reqwest': 'node_modules/reqwest/reqwest',

		// same version: v1.0.0 (from source)
		'signals': 'node_modules/signals/dist/signals',

		// not a package
		'slider': 'js/vendor/jquery.slider',

		// same version: v1.3.7 (from source)
		'tether': 'node_modules/tether/dist/js/tether',

		// v1.6.2 (closest available) instead of v1.1.8 (assumed from commit history)
		'timepicker': 'node_modules/timepicker/jquery.timepicker',

		// v2.0.3 (closest) instead of v1.3.0 (from source)
		'toastr': 'node_modules/toastr/toastr',

		// v0.2.3 (closest available) instead of v0.2.2 (from source)
		'touch-punch': 'node_modules/jquery-ui-touch-punch/jquery.ui.touch-punch',

		// same version: v1.8.2 (from source)
		'underscore': 'node_modules/underscore/underscore',

		// same version: v1.11.1 (from source), installed as a tar
		'validate': 'node_modules/jquery-validation/jquery.validate',

		// not a package
		'wysiwyg': 'js/vendor/bootstrap.wysiwyg.min',

		// same version: v1.5.389 (azzumed from commit history)
		'pdfjs-dist/build/pdf': 'node_modules/pdfjs-dist/build/pdf',
		'pdfjs-dist/build/pdf.worker': 'node_modules/pdfjs-dist/build/pdf.worker'
	},
	shim: {
		'card': ['jquery'],
		'chosen': ['jquery'],
		'ddslick': ['jquery'],
		'fileupload': ['jquery'],
		'drop': ['tether'],
		'footable-sort': ['footable'],
		'footable-filter': ['footable'],
		'bootstrap': ['jqueryui'],
		'bootstrap-clickover': ['bootstrap'],
		'jqueryui': ['jquery'],
		'crossroads': ['signals'],
		'hasher': ['signals'],
		'slider': ['dependClass'],
		'plugins': ['jquery'],
		'kazoosdk': ['jquery'],
		'touch-punch': ['jqueryui'],
		'footable': {
			'exports': 'FooTable'
		},
		'underscore': {
			'exports': '_'
		},
		'kazoo': {
			'exports': 'kazoo'
		}
	},
	urlArgs: 'bust=' + (new Date()).getTime()
});

require(['jquery', 'monster', 'modernizr', 'plugins', 'bootstrap', 'bootstrap-clickover', 'touch-punch'], function($, monster) {
	$.support.cors = true;

	monster.initSDK();

	require(['monster-util', 'monster-ui', 'monster-ua', 'monster-apps', 'monster-routing', 'monster-socket', 'monster-timezone', 'monster-webphone', 'templates'], function(util, ui, ua, apps, routing, socket, timezone, webphone, templates) {
		monster.util = util;
		monster.ui = ui;
		monster.ua = ua;
		monster.apps = apps;
		monster.routing = routing;
		monster.socket = socket;
		monster.timezone = timezone;
		monster.webphone = webphone;

		monster.util.setDefaultLanguage();

		monster.loadBuildConfig(function() {
			monster.apps.load('core', function(app) {
				app.render($('.core-wrapper'));
			});
		});
	});
});
