
require.config({
	waitSeconds: 200,
	paths: {
		'async': 'js/vendor/async.min',
		'bootstrap': 'js/vendor/bootstrap-2.3.1.min',
		'bootstrap-clickover': 'js/vendor/bootstrapx-clickover-1.0',
		'chart': 'js/vendor/chart.min',
		'card': 'js/vendor/card',
		'chosen': 'js/vendor/jquery.chosen.min',
		'clipboard': 'js/vendor/clipboard.min',
		'crossroads': 'js/vendor/crossroads.min',
		'config': 'js/config',
		'dependClass': 'js/vendor/jquery.dependClass',
		'ddslick': 'js/vendor/jquery.ddslick.min',
		'drop': 'js/vendor/drop',
		'fileupload': 'js/lib/jquery.fileupload',
		'footable': 'js/vendor/footable.min',
		'form2object': 'js/vendor/form2object',
		'handlebars': 'js/vendor/handlebars-v4.0.5',
		'hasher': 'js/vendor/hasher.min',
		'hotkeys': 'js/vendor/jquery.hotkeys.min',
		'introJs': 'js/vendor/intro.min',
		'isotope': 'js/vendor/jquery.isotope.min',
		'jquery': 'js/vendor/jquery-1.9.1.min',
		'jqueryui': 'js/vendor/jquery-ui-1.10.3.custom.min',
		'jstz': 'js/vendor/jstz.min',
		'kazoo': 'js/lib/kazoo/kazoo',
		'kazoosdk': 'js/lib/jquery.kazoosdk',
		'mask': 'js/vendor/jquery.mask',
		'modernizr': 'js/vendor/modernizr-2.6.2.min',
		'monster': 'js/lib/monster',
		'monster-apps': 'js/lib/monster.apps',
		'monster-ui': 'js/lib/monster.ui',
		'monster-timezone': 'js/lib/monster.timezone',
		'monster-routing': 'js/lib/monster.routing',
		'monster-socket': 'js/lib/monster.socket',
		'monster-util': 'js/lib/monster.util',
		'monster-webphone': 'js/lib/monster.webphone',
		'mousetrap': 'js/vendor/mousetrap-1.5.3.min',
		'nicescroll': 'js/vendor/jquery.nicescroll.min',
		'plugins': 'js/plugins',
		'papaparse': 'js/vendor/papaparse-4.1.2.min',
		'postal': 'js/vendor/postal-0.8.2',
		'prettify':'js/vendor/prettify',
		'renderjson': 'js/vendor/renderjson',
		'reqwest': 'js/vendor/reqwest-0.7.3.min',
		'signals': 'js/vendor/signals.min',
		'slider': 'js/vendor/jquery.slider',
		'tether': 'js/vendor/tether.min',
		'timepicker': 'js/vendor/jquery.timepicker.min',
		'toastr': 'js/vendor/toastr-1.3.0',
		'touch-punch': 'js/vendor/jquery.ui.touch-punch.min',
		'underscore': 'js/vendor/underscore.min',
		'validate': 'js/vendor/jquery.validate.min',
		'vkbeautify':'js/vendor/vkbeautify',
		'wysiwyg': 'js/vendor/bootstrap.wysiwyg.min',
		'pdfjs-dist/build/pdf': 'js/vendor/pdfjs/build/pdf',
		'pdfjs-dist/build/pdf.worker': 'js/vendor/pdfjs/build/pdf.worker',
		'templates': 'js/templates'
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

require(['jquery', 'monster', 'modernizr', 'plugins', 'bootstrap', 'bootstrap-clickover', 'touch-punch'], function($, monster){
	$.support.cors = true;

	monster.initSDK();

	require(['monster-util', 'monster-ui', 'monster-apps', 'monster-routing', 'monster-socket', 'monster-timezone', 'monster-webphone', 'templates'], function(util, ui, apps, routing, socket, timezone, webphone, templates){
		monster.util = util;
		monster.ui = ui;
		monster.apps = apps;
		monster.routing = routing;
		monster.socket = socket;
		monster.timezone = timezone;
		monster.webphone = webphone;

		monster.util.setDefaultLanguage();

		monster.loadBuildConfig(function() {
			monster.apps.load('core', function(app){
				app.render($('.core-wrapper'));
			});
		});
	});
});
