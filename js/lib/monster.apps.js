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
            	/* If source_url is defined for an app, we'll load the templates, i18n and js from this url instead of localhost */
				if('auth' in monster.apps && 'installedApps' in monster.apps.auth) {
					_.each(monster.apps.auth.installedApps, function(storedApp) {
						if(app.name === storedApp.name && storedApp.source_url) {
							app.sourceUrl = storedApp.source_url;
							appPath = app.sourceUrl + '/' + appPath;
						}
					});
				}
				/* End Snippet */

                _.extend(app, { appPath: appPath, data: {} }, monster.apps[name]);

                _.each(app.requests, function(request, id){
                    monster._defineRequest(id, request, app);
                });

                _.each(app.subscribe, function(callback, topic){
                    var cb = typeof callback === 'string' ? app[callback] : callback;

                    monster.sub(topic, cb, app);
                });

                _.extend(app.data, { i18n: {} });

				/* en-US is the default language of Monster, Deal with it! */
                monster._loadLocale(app, 'en-US');

				/* If the app supports the "active" language, then we load its json file if its not the default one */
                if(monster.config.i18n.active !== 'en-US' && app.i18n.indexOf(monster.config.i18n.active) >= 0) {
                	monster._loadLocale(app, monster.config.i18n.active);
                }

                monster.util.addCoreI18n(app);

                // add an active property method to the i18n array within the app.
                _.extend(app.i18n, {
                    active: function(){
                        return app.data.i18n[monster.config.i18n.active] || app.data.i18n['en-US'] || {};
                    }
                });

				app.data.i18n[monster.config.i18n.active] = $.extend(true, {}, app.data.i18n['en-US'], app.data.i18n[monster.config.i18n.active]);

				/* common is loaded once the user is logged in, and once he's logged in, we know his language, so we need to override the i18n for the common elements like the confirm box and such */
                if(app.name === 'common') {
					monster.apps['core'].data.i18n = $.extend(true, {}, monster.apps['core'].data.i18n, app.data.i18n);
                }

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
					callback && callback(app);
				});
			}
			else {
				callback && callback(monster.apps[name]);
			}
		}
	};

	return apps;
});
