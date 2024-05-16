
require.config({
	waitSeconds: 200,
	paths: {
		'async': 'js/vendor/async.min',
		'bootstrap': 'js/vendor/bootstrap-2.3.1.min',
		'braintree-client': 'js/vendor/braintree.client.min',
		'braintree-hosted-fields': 'js/vendor/braintree.hosted-fields.min',
		'braintree-us-bank-account': 'js/vendor/braintree.us-bank-account.min',
		'braintree-vault-manager': 'js/vendor/braintree.vault-manager.min',
		'card': 'js/vendor/card',
		'chart': 'js/vendor/Chart.min',
		'chosen': 'js/vendor/jquery.chosen.min',
		'clipboard': 'js/vendor/clipboard.min',
		'config': 'js/config',
		'cookies': 'js/vendor/js.cookie.min',
		'crossroads': 'js/vendor/crossroads.min',
		'date-holidays': 'js/vendor/date-holidays.min',
		'ddslick': 'js/vendor/jquery.ddslick.min',
		'disableAutoFill': 'js/vendor/jquery.disableAutoFill',
		'drop': 'js/vendor/drop',
		'duo': 'js/vendor/duo.min',
		'file-saver': 'js/vendor/file-saver-1.3.2.min',
		'fileupload': 'js/lib/jquery.fileupload',
		'footable': 'js/vendor/footable.min',
		'form2object': 'js/vendor/form2object',
		'handlebars': 'js/vendor/handlebars-v4.7.7',
		'hasher': 'js/vendor/hasher.min',
		'hotkeys': 'js/vendor/jquery.hotkeys.min',
		'image-select': 'js/vendor/ImageSelect.jquery',
		'introJs': 'js/vendor/intro.min',
		'isotope': 'js/vendor/jquery.isotope.min',
		'jquery': 'js/vendor/jquery-1.9.1.min',
		'jqueryui': 'js/vendor/jquery-ui-1.10.3.custom.min',
		'jsoneditor': 'js/vendor/jsoneditor/jsoneditor-8.6.8.min',
		'jstz': 'js/vendor/jstz.min',
		'jszip': 'js/vendor/jszip.min',
		'kazoo': 'js/lib/kazoo/kazoo',
		'kazoosdk': 'js/lib/jquery.kazoosdk',
		'libphonenumber': 'js/vendor/libphonenumber-js.min',
		'lodash': 'js/vendor/lodash-4.17.4',
		'marked': 'js/vendor/marked.min',
		'mask': 'js/vendor/jquery.mask',
		'md5': 'js/vendor/md5',
		'modernizr': 'js/vendor/modernizr-2.6.2.min',
		'moment': 'js/vendor/moment',
		'moment-timezone': 'js/vendor/moment-timezone',
		'monster': 'js/lib/monster',
		'monster-apps': 'js/lib/monster.apps',
		'monster-routing': 'js/lib/monster.routing',
		'monster-socket': 'js/lib/monster.socket',
		'monster-timezone': 'js/lib/monster.timezone',
		'monster-ua': 'js/lib/monster.ua',
		'monster-ui': 'js/lib/monster.ui',
		'monster-util': 'js/lib/monster.util',
		'monster-webphone': 'js/lib/monster.webphone',
		'mousetrap': 'js/vendor/mousetrap-1.5.3.min',
		'monthpicker': 'js/vendor/jquery.monthpicker',
		'papaparse': 'js/vendor/papaparse-4.1.2.min',
		'pdfjs-dist/build/pdf': 'js/vendor/pdfjs/build/pdf',
		'pdfjs-dist/build/pdf.worker': 'js/vendor/pdfjs/build/pdf.worker',
		'pdfmake': 'js/vendor/pdfmake/build/pdfmake.min',
		'vfs_fonts': 'js/vendor/pdfmake/build/vfs_fonts',
		'postal': 'js/vendor/postal-2.0.4',
		'popup-redirect': 'js/vendor/popup-redirect',
		'randomColor': 'js/vendor/randomColor',
		'renderjson': 'js/vendor/renderjson',
		'signals': 'js/vendor/signals.min',
		'simplemde': 'js/vendor/simplemde.min',
		'sugar-date': 'js/vendor/sugar-custom.min',
		'templates': 'js/templates',
		'tether': 'js/vendor/tether.min',
		'timepicker': 'js/vendor/jquery.timepicker.min',
		'toastr': 'js/vendor/toastr-1.3.0',
		'touch-punch': 'js/vendor/jquery.ui.touch-punch.min',
		'validate': 'js/vendor/jquery.validate.min',
		'wysiwyg': 'js/vendor/bootstrap.wysiwyg.min'
	},
	shim: {
		'bootstrap': ['jqueryui'],
		'card': ['jquery'],
		'chosen': ['jquery'],
		'crossroads': ['signals'],
		'ddslick': ['jquery'],
		'drop': ['tether'],
		'fileupload': ['jquery'],
		'footable': {
			'exports': 'FooTable'
		},
		'footable-filter': ['footable'],
		'footable-sort': ['footable'],
		form2object: {
			exports: 'form2object'
		},
		'hasher': ['signals'],
		'image-select': ['chosen'],
		'jqueryui': ['jquery'],
		'jstz': {
			exports: 'jstz'
		},
		'kazoo': {
			'exports': 'kazoo'
		},
		'kazoosdk': ['jquery'],
		'lodash': {
			'exports': '_'
		},
		'moment-timezone': ['moment'],
		'popup-redirect': {
			exports: 'Popup'
		},
		renderjson: {
			exports: 'renderjson'
		},
		'touch-punch': ['jqueryui'],
		vfs_fonts: ['pdfmake']
	},
	urlArgs: 'bust=' + (new Date()).getTime()
});

require([
	'jquery',
	'monster',

	'bootstrap',
	'modernizr',
	'touch-punch'
], function($, monster) {
	$.support.cors = true;

	monster.initConfig();
	monster.initSDK();

	monster.setDefaultLanguage();

	require([
		'monster-apps',
		'monster-routing',
		'monster-socket',
		'monster-timezone',
		'monster-ua',
		'monster-ui',
		'monster-util',
		'monster-webphone',
		'templates'
	], function(
		apps,
		routing,
		socket,
		timezone,
		ua,
		ui,
		util,
		webphone,
		templates
	) {
		monster.apps = apps;
		monster.routing = routing;
		monster.socket = socket;
		monster.timezone = timezone;
		monster.ua = ua;
		monster.ui = ui;
		monster.util = util;
		monster.webphone = webphone;

		monster.routing.init();

		monster.loadBuildConfig(function() {
			monster.apps.load('core', function(err, app) {
				app.render($('.core-wrapper'));
			});
		});
	});
});
