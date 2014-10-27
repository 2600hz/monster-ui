define(function(){
	var $ = require("jquery"),
		_ = require("underscore"),
		monster = require("monster");

	var apps = {
		defaultLanguage: 'en-US',

		monsterizeApp: function(app, callback) {
			var self = this;

			_.each(app.requests, function(request, id){
				monster._defineRequest(id, request, app);
			});

			_.each(app.subscribe, function(callback, topic){
				var cb = typeof callback === 'string' ? app[callback] : callback;

				monster.sub(topic, cb, app);
			});

			self._addAppCss(app);

			self._addAppI18n(app);

			app.apiUrl = app.apiUrl || monster.config.api.default;

			app.callApi = function(params) {
				var apiSplit = params.resource.split('.'),
					module = apiSplit[0],
					method = apiSplit[1],
					successCallback = params.success,
					errorCallback = params.error;
					
				if(apiSplit.length === 2 && module in monster.kazooSdk && method in monster.kazooSdk[module]) {

					//Handling special cases:
					switch(params.resource) {
						case 'account.update': {
							if(params.data.accountId === monster.apps['auth'].currentAccount.id) {
								successCallback = function(data, status) {
									monster.apps['auth'].currentAccount = data.data;
									monster.pub('auth.currentAccountUpdated', data.data);

									params.success && params.success(data, status);
								}
							}
							break;
						}
					}

					var apiSettings = $.extend({
							authToken: app.authToken,
							apiRoot: params.apiUrl || app.apiUrl || monster.config.api.default,
							uiMetadata: {
								version: monster.config.version,
								ui: 'monster-ui'
							},
							success: successCallback,
							error: errorCallback
						}, params.data);

					return monster.kazooSdk[module][method](apiSettings);
				} else {
					console.error('This api does not exist. Module: ' + module + ', Method: ' + method);
				}
			};

			monster.apps[app.name] = app;

			self.loadDependencies(app, function() {
				app.load(callback);
			});
		},

		loadDependencies: function(app, globalCallback) {
			var self = this,
				listRequests = {},
				externalPath = app.appPath + '/external/',
				deps = app.externalScripts || [];

			if(deps.length > 0) {
				_.each(deps, function(name) {
					listRequests[name] = function(callback) {
						monster.getScript(externalPath + name + '.js', function() {
							callback(null, {});
						});
					}
				});

				monster.parallel(listRequests, function(err, results) {
					globalCallback && globalCallback();
				});
			}
			else {
				globalCallback && globalCallback();
			}
		},

		_addAppCss: function(app) {
			var self = this,
				listCss = app.css || [],
				currentLanguage = monster.config.whitelabel.language,
				addCss = function(fileName) {
					fileName = app.appPath + '/style/' + fileName + '.css';

					if(monster._fileExists(fileName)){
						monster.css(fileName);
					}
					else {
						console.info('File Name doesn\'t exist: ', fileName);
					}
				};

			// If the current UI Language is not the default of the Monster UI, see if we have a specific i18n file to load
			if(currentLanguage !== self.defaultLanguage) {
				if(currentLanguage in app.i18n && app.i18n[currentLanguage].customCss === true) {
					listCss.push('cssI18n/' + currentLanguage);
				}
			}

			_.each(listCss, function(fileName) {
				addCss(fileName);
			});
		},

		_addAppI18n: function(app) {
			var self = this,
				currentLanguage = monster.config.whitelabel.language;

			_.extend(app.data, { i18n: {} });

			// en-US is the default language of Monster
			var customLanguage = currentLanguage in app.i18n >= 0 ? currentLanguage : self.defaultLanguage,
				// Once all the different i18n files are loaded, we need to append the core i18n to the app
				addCoreI18n = function() {
					if('core' in monster.apps) {
						$.extend(true, app.data.i18n, monster.apps.core.data.i18n);
					}
				};

			self.loadLocale(app, self.defaultLanguage, function() {
				// If the app supports the custom language, then we load its json file if its not the default one
				if(customLanguage !== self.defaultLanguage) {
					self.loadLocale(app, customLanguage, function() {
						addCoreI18n();
					});
				}
				else {
					addCoreI18n();
				}
			});

			// add an active property method to the i18n array within the app.
			_.extend(app.i18n, {
				active: function(){
					var language = currentLanguage in app.i18n ? currentLanguage : self.defaultLanguage;
					return app.data.i18n[language];
				}
			});
		},

		_loadApp: function(name, callback, options){
			var self = this,
				appPath = 'apps/' + name,
				customKey = 'app-' + name,
				requirePaths = {},
				options = options || {},
				externalUrl = options.sourceUrl || false;

			/* If source_url is defined for an app, we'll load the templates, i18n and js from this url instead of localhost */
			if('auth' in monster.apps && 'installedApps' in monster.apps.auth) {
				var storedApp = _.find(monster.apps.auth.installedApps, function(installedApp) {
					return name === installedApp.name;
				});

				if(storedApp && 'source_url' in storedApp) {
					externalUrl = storedApp.source_url;
				}
			}

			if(externalUrl) {
				appPath = externalUrl;

				requirePaths[customKey] = externalUrl + '/app';

				require.config({
					paths: requirePaths
				});
			}

			var path = customKey in requirePaths ? customKey : appPath + '/app';

			require([path], function(app){
				_.extend(app, { appPath: appPath, data: {} }, monster.apps[name]);

				if(options && 'apiUrl' in options) {
					app.apiUrl = options.apiUrl;
				}

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
								/* We need to be able to subscribe to the same event with many callbacks, so we can't merge the subscribes key together, or it would override some valid callbacks */
								var oldSubscribes = $.extend(true, {}, app.subscribe);
								$.extend(true, app, module);
								app.subscribe = oldSubscribes;

								_.each(module.subscribe, function(callback, topic){
									var cb = typeof callback === 'string' ? app[callback] : callback;

									monster.sub(topic, cb, app);
								});

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

		load: function(name, callback, options) {
			var self = this;

			if(!(name in monster.apps)) {
				self._loadApp(name, function(app) {
					callback && callback(app);
				}, options);
			}
			else {
				callback && callback(monster.apps[name]);
			}
		},

		loadLocale: function(app, language, callback) {
			var self = this,
				loadFile = function(afterLoading) {
					monster.pub('monster.requestStart');

					$.ajax({
						url: app.appPath + '/i18n/' + language + '.json',
						dataType: 'json',
						async: false,
						success: function(data){
							afterLoading && afterLoading(data);

							monster.pub('monster.requestEnd');
						},
						error: function(data, status, error){
							afterLoading && afterLoading({});

							monster.pub('monster.requestEnd')
							
							console.log('_loadLocale error: ', status, error);
						}
					});
				};

			loadFile(function(data) {
				// If we're loading the default language, then we add it, and also merge the core i18n to it
				if(language === self.defaultLanguage) {
					app.data.i18n[language] = data;
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
