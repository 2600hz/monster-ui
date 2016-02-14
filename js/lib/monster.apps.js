define(function(){
	var $ = require("jquery"),
		_ = require("underscore"),
		monster = require("monster");

	var apps = {
		defaultLanguage: 'en-US',

		// Global var used to show the loading gif
		uploadProgress: {
			amount: 0,
			active: false,
			runningApis: 0
		},

		monsterizeApp: function(app, callback) {
			var self = this,
				hasClusterFlag = monster.config.hasOwnProperty('kazooClusterId');

			_.each(app.requests, function(request, id){
				if(hasClusterFlag) {
					request.headers = request.headers || {};
					request.headers['X-Kazoo-Cluster-ID'] = monster.config.kazooClusterId;
				}

				monster._defineRequest(id, request, app);
			});

			_.each(app.subscribe, function(callback, topic){
				var cb = typeof callback === 'string' ? app[callback] : callback;

				monster.sub(topic, cb, app);
			});

			self._addAppCss(app);

			self._addAppI18n(app);

			app.uiFlags = {
				user: {
					set: function(flagName, value, user) {
						return monster.util.uiFlags.user.set(app.name, flagName, value, user);
					},
					get: function(flagName, user) {
						return monster.util.uiFlags.user.get(app.name, flagName, user);
					}
				},
				account: {
					set: function(flagName, value, account) {
						return monster.util.uiFlags.account.set(app.name, flagName, value, account);
					},
					get: function(flagName, account) {
						return monster.util.uiFlags.account.get(app.name, flagName, account);
					}
				}
			};

			// Active means it's in the DOM. It could be hidden by the Myaccount or apploader and still be "active".
			app.isActive = function() {
				return app.name === monster.apps.getActiveApp();
			};

			app.callApi = function(params) {
				var apiSplit = params.resource.split('.'),
					module = apiSplit[0],
					method = apiSplit[1],
					successCallback = params.success,
					errorCallback = params.error,
					cancelCall = false; //Used to cancel the Api Call before it is actually sent

				if(apiSplit.length === 2 && module in monster.kazooSdk && method in monster.kazooSdk[module]) {

					//Handling special cases:
					switch(params.resource) {
						case 'account.update':
							if(params.data.accountId === monster.apps.auth.currentAccount.id) {
								successCallback = function(data, status) {
									monster.apps.auth.currentAccount = data.data;
									monster.pub('auth.currentAccountUpdated', data.data);

									params.success && params.success(data, status);
								}
							}
							break;

						case 'user.update':
							// If we're updating the user we're logged in with
							if(params.data.userId === monster.apps.auth.userId) {
								successCallback = function(data, status) {
									monster.apps.auth.currentUser = data.data;
									monster.pub('auth.currentUserUpdated', data.data);

									var cookieData = $.parseJSON($.cookie('monster-auth'));

									// If the language stored in the cookie is not the same as the one we have in the updated data, we update the cookie.
									if(cookieData.language !== data.data.language) {
										cookieData.language = data.data.language;
										$.cookie('monster-auth', JSON.stringify(cookieData));
									}

									params.success && params.success(data, status);
								}
							}
							break;

						case 'balance.add':
						case 'billing.get':
						case 'billing.update':
							if(monster.config.disableBraintree) {
								cancelCall = true;
							}
							break;

						case 'whitelabel.getByDomain':
						case 'whitelabel.create':
						case 'whitelabel.update':
						case 'whitelabel.get':
							successCallback = function(data, status) {
								if(data && data.hasOwnProperty('data') && data.data.hasOwnProperty('domain') && window.location.hostname === data.data.domain.toLowerCase()) {
									var whitelabelData = data.data;
									// Merge the whitelabel info to replace the hardcoded info
									if(whitelabelData && whitelabelData.hasOwnProperty('company_name')) {
										whitelabelData.companyName = whitelabelData.company_name;
									}
									monster.config.whitelabel = $.extend(true, {}, monster.config.whitelabel, whitelabelData);
								}

								params.success && params.success(data, status);
							}
							break;

						// APIs that will trigger the upload progress bar
						case 'media.upload':
						case 'port.createAttachment':
						case 'port.updateAttachment':
						case 'whitelabel.updateLogo':
						case 'whitelabel.updateIcon':
							if(!params.data.hasOwnProperty('uploadProgress')) {
								self.uploadProgress.runningApis++;
								var progressId = "progress_" + Math.trunc(Math.random()*Math.pow(10,16)),
									container = $('#upload_progress'),
									hideContainer = function() {
										if(!self.uploadProgress.active && self.uploadProgress.runningApis === 0) {
											container.hide();
										}
									};

								params.data.uploadProgress = function(progress) {
									if(progress.lengthComputable) {
										var progressValue = progress.loaded/progress.total * 100,
											progressBar = container.find('#'+progressId);
										if(progressValue === 100) {
											if(self.uploadProgress.active && progressBar.length) {
												progressBar.children('div').width('99%')
																		   .html('99%');
												self.uploadProgress.amount--;
												if(self.uploadProgress.amount === 0) {
													self.uploadProgress.active = false;
													hideContainer();
												}
											}
										} else {
											if(!self.uploadProgress.active) {
												container.show();
												self.uploadProgress.active = true;
											}
											if(!progressBar.length) {
												progressBar = $('<div id="'+progressId+'" class="upload-progress-bar"><div>0%</div></div>');
												container.find('.upload-progress-content').append(progressBar);
												self.uploadProgress.amount++;
											}
											progressBar.children('div').width(progressValue+'%')
																	   .html(Math.floor(progressValue)+'%');
										}
									}
								}

								successCallback = function(data, status) {
									self.uploadProgress.runningApis--;
									container.find('#'+progressId).remove();
									hideContainer();
									params.success && params.success(data, status);
								}

								errorCallback = function(error, status) {
									self.uploadProgress.runningApis--;
									container.find('#'+progressId).remove();
									hideContainer();
									params.error && params.error(error, status);
								}
							}
							break;
					}

					if(cancelCall) {
						return errorCallback && errorCallback();
					} else {
						var apiSettings = $.extend({
								authToken: app.authToken,
								apiRoot: params.apiUrl || app.apiUrl,
								uiMetadata: {
									version: monster.config.version,
									ui: 'monster-ui',
									origin: app.name
								},
								success: successCallback,
								error: errorCallback,
								headers: {}
							}, params.data);

						if(monster.config.hasOwnProperty('kazooClusterId')) {
							apiSettings.headers['X-Kazoo-Cluster-ID'] = monster.config.kazooClusterId;
						}

						if (params.hasOwnProperty('onChargesCancelled')) {
							apiSettings.onChargesCancelled = params.onChargesCancelled;
						}

						return monster.kazooSdk[module][method](apiSettings);
					}
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

					monster._fileExists(fileName, function() {
						monster.css(fileName);
					},
					function() {
						console.info('File Name doesn\'t exist: ', fileName);
					});
				};

			// If the current UI Language is not the default of the Monster UI, see if we have a specific i18n file to load
			if(currentLanguage !== self.defaultLanguage) {
				if(app.i18n.hasOwnProperty(currentLanguage) && app.i18n[currentLanguage].customCss === true) {
					listCss.push('cssI18n/' + currentLanguage);
				}
			}

			_.each(listCss, function(fileName) {
				addCss(fileName);
			});
		},

		_addAppI18n: function(app) {
			var self = this;

			_.extend(app.data, { i18n: {} });

			// We'll merge the Core I18n once we're done loading the different I18n coming with the application
			var addCoreI18n = function() {
				if(monster.apps.hasOwnProperty('core')) {
					$.extend(true, app.data.i18n, monster.apps.core.data.i18n);
				}
			};

			// We automatically load the default language (en-US) i18n files
			self.loadLocale(app, self.defaultLanguage, function() {
				// If the preferred language of the user is supported by the application and different from the default language, we load its i18n files.
				if(monster.config.whitelabel.language.toLowerCase() !== self.defaultLanguage.toLowerCase()) {
					self.loadLocale(app, monster.config.whitelabel.language, function() {
						// We're done loading the i18n files for this app, so we just merge the Core I18n to it.
						addCoreI18n();
					});
				}
				else {
					// We're done loading the i18n files for this app, so we just merge the Core I18n to it.
					addCoreI18n();
				}
			});

			// add an active property method to the i18n array within the app.
			_.extend(app.i18n, {
				active: function(){
					var language = app.i18n.hasOwnProperty(monster.config.whitelabel.language) ? monster.config.whitelabel.language : self.defaultLanguage;

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
				externalUrl = options.sourceUrl || false,
				apiUrl = monster.config.api.default;

			/* If source_url is defined for an app, we'll load the templates, i18n and js from this url instead of localhost */
			if('auth' in monster.apps && 'installedApps' in monster.apps.auth) {
				var storedApp = _.find(monster.apps.auth.installedApps, function(installedApp) {
					return name === installedApp.name;
				});

				if(storedApp && 'source_url' in storedApp) {
					externalUrl = storedApp.source_url;
                                        if(externalUrl.substr(externalUrl.length-1) !== "/") {
                                                externalUrl += "/";
                                        }
				}

				if(storedApp && storedApp.hasOwnProperty('api_url')) {
					apiUrl = storedApp.api_url;
					if(apiUrl.substr(apiUrl.length-1) !== "/") {
                                                apiUrl += "/";
                                        }
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
				_.extend(app, { appPath: appPath, data: {} }, monster.apps[name], { apiUrl: apiUrl });

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


		// pChangeHash will change the URL of the browser if set to true. For some apps (like auth, apploader, core, we don't want that to happen, so that's why we need this)
		load: function(name, callback, options, pChangeHash) {
			var self = this,
				changeHash = pChangeHash === true ? true : false,
				afterLoad = function(app) {
					monster.apps.lastLoadedApp = app.name;

					callback && callback(app);
				};

			if(changeHash) {
				monster.routing.updateHash('apps/'+name);
			}

			if(!(name in monster.apps)) {
				self._loadApp(name, function(app) {
					afterLoad(app);
				}, options);
			}
			else {
				afterLoad(monster.apps[name]);
			}
		},

		getActiveApp: function() {
			return monster.apps.lastLoadedApp;
		},

		loadLocale: function(app, language, callback) {
			var self = this,
				// Automatic upper case for text after the hyphen (example: change en-us to en-US)
				language = language.replace(/-.*/,function(a){return a.toUpperCase();}),
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

			if(app.i18n.hasOwnProperty(language)) {
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
			else {
				console.info(language + ' isn\'t a supported language by this application: ' + app.name);

				callback && callback();
			}
		}
	};

	return apps;
});
