define(function(require){
	var $ = require("jquery"),
		_ = require("underscore"),
		monster = require("monster");

	var apps = {
		_loadApp: function(name, callback){
            var self = this,
                appPath = 'apps/' + name,
                path = appPath + '/app',
                css = path + '.css';

            require([path], function(app){
                _.extend(app, { appPath: appPath, data: {} }, monster.apps[name]);

                _.each(app.requests, function(request, id){
                    monster._defineRequest(id, request, app);
                });

                _.each(app.subscribe, function(callback, topic){
                    var cb = typeof callback === 'string' ? app[callback] : callback;

                    monster.sub(topic, cb, app);
                });

                _.extend(app.data, { i18n: {} });

                _.each(app.i18n, function(locale){
                    monster._loadLocale(app, locale)
                });

                monster.util.addCommonI18n(app);

                // add an active property method to the i18n array within the app.
                _.extend(app.i18n, {
                    active: function(){
                        return app.data.i18n[monster.config.i18n.active] || app.data.i18n['en-US'] || {}
                    }
                });

                app.apiUrl = app.apiUrl || monster.config.api.default;

                if(monster._fileExists(css)){
                    monster.css(css);
                }

                monster.apps[name] = app;

                app.load(callback);
			});
		},

		load: function(name, callback) {
			var self = this;

			if(!(name in monster.apps)) {
				self._loadApp(name, function(app) {
					console.log(app);
					callback && callback(app);
				});
			}
			else {
				console.log(monster.apps[name]);
				callback && callback(monster.apps[name]);
			}
		}
	};

	return apps;
});
