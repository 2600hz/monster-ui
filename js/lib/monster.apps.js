define(function(){
	var $ = require("jquery"),
		_ = require("underscore"),
		monster = require("monster");

	var apps = {
		defaultLanguage: 'en-US',

		monsterizeApp: function(app, callback) {
			var self = this,
            	css = app.appPath + '/app.css';

            _.each(app.requests, function(request, id){
                monster._defineRequest(id, request, app);
            });

            _.each(app.subscribe, function(callback, topic){
                var cb = typeof callback === 'string' ? app[callback] : callback;

                monster.sub(topic, cb, app);
            });

            if(monster._fileExists(css)){
                monster.css(css);
            }

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

            monster.apps[app.name] = app;

            app.load(callback);
		},

		_loadApp: function(name, callback){
            var self = this,
                appPath = 'apps/' + name,
                customKey = 'app-' + name,
                requirePaths = {};

            /* If source_url is defined for an app, we'll load the templates, i18n and js from this url instead of localhost */
			if('auth' in monster.apps && 'installedApps' in monster.apps.auth) {
				_.each(monster.apps.auth.installedApps, function(storedApp) {
					if(storedApp.name === name && 'source_url' in storedApp) {
						appPath = storedApp.source_url;

						/* If a file is hosted on a different server, its path needs to be added to the require config in order to be used later */
						requirePaths[customKey] = storedApp.source_url + '/app.js';

						require.config({
							paths: requirePaths
						});
					}
				});
			}

            var path = appPath + '/app';

			if(customKey in requirePaths) {
				path = requirePaths[customKey];
			}

            require([path], function(app){
				_.extend(app, { appPath: appPath, data: {} }, monster.apps[name]);

				if('subModules' in app && app.subModules.length > 0) {
					var toInit = app.subModules.length,
						loadModule = function(subModule, callback) {
							var pathSubModule = app.appPath + '/submodules/',
								key = 'app-' + app.name + '-' + subModule,
								path = pathSubModule + subModule + '/' + subModule,
								paths = {};

							paths[key] = path;

							require.config({
								paths: paths
							});

							require([key], function(module) {
								$.extend(true, app, module);

								callback && callback();
							});
						};

					_.each(app.subModules, function(subModule) {
						loadModule(subModule, function() {
							toInit--;

							if(toInit === 0) {
								self.monsterizeApp(app, callback);
							}
						});
					});
				}
				else {
					self.monsterizeApp(app, callback);
				}
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
