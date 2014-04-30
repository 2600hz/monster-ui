define(function(require){
	var $ = require("jquery"),
		_ = require("underscore"),
		monster = require("monster");

	var apps = {
		defaultLanguage: 'en-US',

		_loadApp: function(name, callback){
            var self = this,
                appPath = 'apps/' + name;

			/* Tempo hack while API not working */
			var externalApps = ['accounts', 'conferences', 'mobile', 'numbers', 'pbxs', 'port', 'provisioner', 'voip'];
            /* If source_url is defined for an app, we'll load the templates, i18n and js from this url instead of localhost */
			if('auth' in monster.apps && 'installedApps' in monster.apps.auth) {
				_.each(monster.apps.auth.installedApps, function(storedApp) {
					/* Tempo hack while API not working */
					if($.inArray(storedApp.name, externalApps) > -1) {
						storedApp.source_url = 'http://webdev/monster-modules/'+storedApp.name || storedApp.source_url;
					}

					if(storedApp.name === name && 'source_url' in storedApp) {
						appPath = storedApp.source_url;
					}
				});
			}
			/* End Snippet */

            var path = appPath + '/app.js',
            	css = appPath + '/app.css';

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

				/* en-US is the default language of Monster */
				var customLanguage = app.i18n.indexOf(monster.config.language) >= 0 ? monster.config.language : self.defaultLanguage;

                self.loadLocale(app, self.defaultLanguage);

				/* If the app supports the custom language, then we load its json file if its not the default one */
                if(customLanguage !== self.defaultLanguage) {
                	self.loadLocale(app, customLanguage);
                }

                // add an active property method to the i18n array within the app.
                _.extend(app.i18n, {
                    active: function(){
                    	var language = app.i18n.indexOf(monster.config.language) >= 0 ? monster.config.language : self.defaultLanguage;

                        return app.data.i18n[language];
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
					callback && callback(app);
				});
			}
			else {
				callback && callback(monster.apps[name]);
			}
		},

		loadLocale: function(app, language, callback) {
			var self = this,
				loadFile = function(afterLoading) {
					$.ajax({
						url: app.appPath + '/i18n/' + language + '.json',
						dataType: 'json',
						async: false,
						success: function(data){
							afterLoading && afterLoading(data);
						},
						error: function(data, status, error){
							afterLoading && afterLoading({});

							console.log('_loadLocale error: ', status, error);
						}
					});
				};

			loadFile(function(data) {
				// If we're loading the default language, then we add it, and also merge the core i18n to it
				if(language === self.defaultLanguage) {
					app.data.i18n[language] = data;

					// We merge the core data, which needs to be shared between apps, to the i18n of every app
					if('core' in monster.apps) {
						$.extend(true, app.data.i18n, monster.apps.core.data.i18n);
					}
				}
				else {
					// Otherwise, if we load a custom language, we merge the translation to the en-one
					app.data.i18n[language] = $.extend(true, app.data.i18n[language] || {}, app.data.i18n[self.defaultLanguage], data);
				}

				callback && callback();
			});
		}
	};

	return apps;
});
