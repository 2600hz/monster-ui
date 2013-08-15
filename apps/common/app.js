define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),

		controls = {
			'accountDropdown': require('./controls/accountDropdown/accountDropdown'),
			'numbers': require('./controls/numbers/numbers')
		}

	var app = {
		name: 'common',

		i18n: [ 'en-US' ],

		requests: {},
		subscribe: {},

		load: function(callback){
            var self = this;

            self.initApp(function() {
                callback && callback(self);
            });
        },

        initApp: function(callback) {
            var self = this;

            monster.pub('auth.initApp', {
                app: self,
                callback: callback
            });
        }
	};

	$.each(controls, function(k, control) {
		/*app[k] = control;

		$.each(control.subscribe, function(nameEvent, nameFunction) {
			app.subscribe[nameEvent] = control[nameFunction];
		});

		$.extend(true, app.requests, control.requests);*/
		$.extend(true, app, control);
	});

	console.log(app);

	return app;
});
