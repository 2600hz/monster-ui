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

				/* en-US is the default language of Monster */
				var defaultLanguage = 'en-US',
					customLanguage = app.i18n.indexOf(monster.config.language) >= 0 ? monster.config.language : defaultLanguage;

                monster._loadLocale(app, defaultLanguage);

				/* If the app supports the custom language, then we load its json file if its not the default one */
                if(customLanguage !== defaultLanguage) {
                	monster._loadLocale(app, customLanguage);
                }

				/* Add global i18n to the i18n of this app */
                monster.util.addCoreI18n(app);

				/* Merge custom i18n into default i18n so that we don't display empty strings if the i18n is missing for a label */
				app.data.i18n[customLanguage] = $.extend(true, {}, app.data.i18n[defaultLanguage], app.data.i18n[customLanguage]);

                // add an active property method to the i18n array within the app.
                _.extend(app.i18n, {
                    active: function(){
                    	var language = app.i18n.indexOf(monster.config.language) >= 0 ? monster.config.language : defaultLanguage;

                        return app.data.i18n[language];
                    }
                });

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
