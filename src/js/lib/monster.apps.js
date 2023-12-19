define(function() {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster');

	var baseApps = [
		'auth',
		'core'
	];

	var apps = {
		// Global var used to show the loading gif
		uploadProgress: {
			amount: 0,
			active: false,
			runningApis: 0
		},

		monsterizeApp: function(app, callback) {
			var self = this;

			app.css = _
				.chain([
					'app',
					_.isArray(app.css) ? app.css : []
				])
				.flatten()
				.uniq()
				.value();
			app.i18n = _
				.chain({})
				.set(monster.defaultLanguage, {
					customCss: false
				})
				.merge(_.isPlainObject(app.i18n) ? app.i18n : {})
				.value();

			if (!_.includes(baseApps, app.name)) {
				app.initApp = _.flow(
					_.partial(_.set, { app: app }, 'callback'),
					_.partial(monster.pub, 'auth.initApp')
				);
				app.load = function(callback) {
					app.initApp(function() {
						if (app.name === 'myaccount') {
							app.render();
						}
						callback && callback(app);
					});
				};
			}

			_.each(app.requests, function(request, id) {
				monster._defineRequest(id, request, app);
			});

			_.each(app.subscribe, function(callback, topic) {
				var cb = typeof callback === 'string' ? app[callback] : callback;

				monster.sub(topic, cb, app);
			});

			self._addAppCss(app);

			app.uiFlags = {
				user: {
					set: function(flagName, value, user) {
						return monster.util.uiFlags.user.set(user, app.name, flagName, value);
					},
					get: function(flagName, user) {
						return monster.util.uiFlags.user.get(user, app.name, flagName);
					},
					destroy: function(flagName, user) {
						return monster.util.uiFlags.user.destroy(user, app.name, flagName);
					}
				},
				account: {
					set: function(flagName, value, account) {
						return monster.util.uiFlags.account.set(account, app.name, flagName, value);
					},
					get: function(flagName, account) {
						return monster.util.uiFlags.account.get(account, app.name, flagName);
					},
					destroy: function(flagName, account) {
						return monster.util.uiFlags.account.destroy(account, app.name, flagName);
					}
				}
			};

			app.getTemplate = function(args) {
				args.app = app;

				return monster.getTemplate(args);
			};

			// Active means it's in the DOM. It could be hidden by the Myaccount or apploader and still be "active".
			app.isActive = function() {
				return app.name === monster.apps.getActiveApp();
			};

			/**
			 * @param  {Object} params
			 * @param  {String} [params.accountId]
			 * @param  {String} params.binding
			 * @param  {Function} params.callback
			 * @param  {jQuery} [params.requiredElement]
			 */
			app.subscribeWebSocket = function(params) {
				var accountId = app.accountId || params.accountId,
					requiredElement = params.hasOwnProperty('requiredElement') ? params.requiredElement : false;

				var unsubscribe = monster.socket.bind({
					binding: params.binding,
					accountId: accountId,
					callback: params.callback,
					source: app.name
				});

				if (requiredElement) {
					requiredElement.on('remove', unsubscribe);
				}
			};

			/**
			 * @param  {Object} params
			 * @param  {String} [params.accountId]
			 * @param  {String} params.binding
			 */
			app.unsubscribeWebSocket = function(params) {
				var accountId = app.accountId || params.accountId;

				monster.socket.unbind({
					binding: params.binding,
					accountId: accountId,
					source: app.name
				});
			};

			/**
			 * @param  {Object} args
			 * @param  {Function} args.callback
			 * @param  {Function} [args.error]
			 */
			app.enforceWebSocketsConnection = function(args) {
				app.requiresWebSockets = true;

				monster.pub('core.socket.showDisconnectToast');

				if (
					!monster.socket.getInfo().isConnected
					&& _.isFunction(args.error)
				) {
					args.error();
				} else {
					args.callback();
				}
			};

			app.callApi = function(params) {
				var apiSplit = params.resource.split('.'),
					module = apiSplit[0],
					method = apiSplit[1],
					successCallback = params.success,
					errorCallback = params.error,
					cancelCall = false; //Used to cancel the Api Call before it is actually sent

				if (apiSplit.length === 2 && module in monster.kazooSdk && method in monster.kazooSdk[module]) {
					//Handling special cases:
					switch (params.resource) {
						case 'account.update':
						case 'account.patch':
							successCallback = function(data, status) {
								if (params.data.accountId === monster.apps.auth.currentAccount.id) {
									monster.apps.auth.currentAccount = data.data;
									monster.pub('auth.currentAccountUpdated', data.data);
								}

								if (params.data.accountId === monster.apps.auth.originalAccount.id) {
									monster.apps.auth.originalAccount = data.data;
									monster.pub('auth.originalAccountUpdated', data.data);
								}

								params.success && params.success(data, status);
							};

							break;

						case 'user.list':
							successCallback = function(data, status) {
								data.data.sort(function(a, b) {
									return monster.util.cmp(a.first_name.toLowerCase(), b.first_name.toLowerCase()) || monster.util.cmp(a.last_name.toLowerCase(), b.last_name.toLowerCase());
								});

								params.success && params.success(data, status);
							};
							break;

						case 'conference.get':
							successCallback = function(data, status) {
								if (data.data.member.numbers.length && data.data.conference_numbers.length === 0) {
									data.data.conference_numbers = data.data.member.numbers;
									data.data.member.numbers = [];

									app.callApi({
										resource: 'conference.update',
										data: {
											accountId: app.accountId,
											conferenceId: data.data.id,
											data: data.data
										},
										success: function(data, status) {
											params.success && params.success(data, status);
										}
									});
								} else {
									params.success && params.success(data, status);
								}
							};
							break;

						case 'user.update':
						case 'user.patch':
							// If we're updating the user we're logged in with
							if (params.data.userId === monster.apps.auth.userId) {
								successCallback = function(data, status) {
									monster.parallel([
										function(next) {
											monster.pub('auth.currentUser.updated', {
												response: data.data,
												callback: next
											});
										}
									], function() {
										params.success && params.success(data, status);
									});
								};
							}
							break;

						case 'billing.get':
						case 'billing.update':
							if (monster.config.disableBraintree) {
								cancelCall = true;
							}
							break;

						case 'numbers.get':
							// MIGRATION AWAY FROM PROVIDER SPECIFIC e911
							successCallback = function(data, status) {
								if (data.data.hasOwnProperty('dash_e911') && !data.data.hasOwnProperty('e911')) {
									data.data.e911 = data.data.dash_e911;
									delete data.data.dash_e911;
								}

								params.success && params.success(data, status);
							};
							break;
						case 'numbers.update':
							// MIGRATION AWAY FROM PROVIDER SPECIFIC e911
							if (params.data.data.hasOwnProperty('dash_e911')) {
								if (!params.data.data.hasOwnProperty('e911')) {
									params.data.data.e911 = $.extend(true, params.data.data.dash_e911);
								}

								delete params.data.data.dash_e911;
							}
							break;

						case 'whitelabel.getByDomain':
						case 'whitelabel.create':
						case 'whitelabel.update':
						case 'whitelabel.get':
							successCallback = function(data, status) {
								if (data && data.hasOwnProperty('data') && data.data.hasOwnProperty('domain') && window.location.hostname === data.data.domain.toLowerCase()) {
									var whitelabelData = data.data;

									// Merge the whitelabel info to replace the hardcoded info
									if (whitelabelData && whitelabelData.hasOwnProperty('company_name')) {
										whitelabelData.companyName = whitelabelData.company_name;
									}

									monster.config.whitelabel = $.extend(true, {}, monster.config.whitelabel, whitelabelData);
								}

								params.success && params.success(data, status);
							};
							break;

						// APIs that will trigger the upload progress bar
						case 'media.upload':
						case 'port.createAttachment':
						case 'port.updateAttachment':
						case 'whitelabel.updateLogo':
						case 'whitelabel.updateIcon':
							if (!params.data.hasOwnProperty('uploadProgress')) {
								self.uploadProgress.runningApis++;
								var progressId = 'progress_' + Math.trunc(Math.random() * Math.pow(10, 16)),
									container = $('#upload_progress'),
									hideContainer = function() {
										if (!self.uploadProgress.active && self.uploadProgress.runningApis === 0) {
											container.hide();
										}
									};

								params.data.uploadProgress = function(progress) {
									if (progress.lengthComputable) {
										var progressValue = progress.loaded / progress.total * 100,
											progressBar = container.find('#' + progressId);
										if (progressValue === 100) {
											if (self.uploadProgress.active && progressBar.length) {
												progressBar
													.children('div')
														.width('99%')
														.html('99%');
												self.uploadProgress.amount--;
												if (self.uploadProgress.amount === 0) {
													self.uploadProgress.active = false;
													hideContainer();
												}
											}
										} else {
											if (!self.uploadProgress.active) {
												container.show();
												self.uploadProgress.active = true;
											}
											if (!progressBar.length) {
												progressBar = $('<div id="' + progressId + '" class="upload-progress-bar"><div>0%</div></div>');
												container.find('.upload-progress-content').append(progressBar);
												self.uploadProgress.amount++;
											}
											progressBar
												.children('div')
													.width(progressValue + '%')
													.html(Math.floor(progressValue) + '%');
										}
									}
								};

								successCallback = function(data, status) {
									self.uploadProgress.runningApis--;
									container.find('#' + progressId).remove();
									hideContainer();
									params.success && params.success(data, status);
								};

								errorCallback = function(error, status) {
									self.uploadProgress.runningApis--;
									self.uploadProgress.active = false;
									container.find('#' + progressId).remove();
									hideContainer();
									params.error && params.error(error, status);
								};
							}
							break;

						case 'appsStore.list':
							if (params.data.accountId === _.get(monster.apps.auth, monster.util.isMasquerading() ? 'originalAccount.id' : 'accountId')) {
								successCallback = function(data, status) {
									monster.pub('auth.currentAppsStore.fetched', {
										response: data.data,
										callback: function() {
											params.success && params.success(data, status);
										}
									});
								};
							}
							break;

						case 'appsStore.add':
						case 'appsStore.update':
							if (params.data.accountId === _.get(monster.apps.auth, monster.util.isMasquerading() ? 'originalAccount.id' : 'accountId')) {
								successCallback = function(data, status) {
									monster.pub('auth.currentAppsStore.updated', {
										request: params.data,
										callback: function() {
											params.success && params.success(data, status);
										}
									});
								};
							}
							break;

						case 'appsStore.delete':
							if (params.data.accountId === _.get(monster.apps.auth, monster.util.isMasquerading() ? 'originalAccount.id' : 'accountId')) {
								successCallback = function(data, status) {
									monster.pub('auth.currentAppsStore.deleted', {
										request: params.data,
										callback: function() {
											params.success && params.success(data, status);
										}
									});
								};
							}
							break;
					}

					if (cancelCall) {
						return errorCallback && errorCallback();
					} else {
						var apiSettings = _.assignIn({	// lodash#assignIn is used here to have a shallow merge (only top level properties)
							authToken: params.authToken || app.getAuthToken(),
							apiRoot: params.apiUrl || app.apiUrl,
							uiMetadata: {
								version: monster.util.getVersion(),
								ui: 'monster-ui',
								origin: app.name
							},
							success: successCallback,
							error: errorCallback,
							headers: {},
							requestEventParams: _.pick(params, 'bypassProgressIndicator')
						},
						params.data,
						monster.config.whitelabel.acceptCharges.autoAccept ? {
							acceptCharges: monster.config.whitelabel.acceptCharges.autoAccept
						} : {},
						_.pick(params, 'onChargesCancelled')
						);

						if (_.has(monster.config, 'kazooClusterId')) {
							apiSettings.headers['X-Kazoo-Cluster-ID'] = monster.config.kazooClusterId;
						}

						return monster.kazooSdk[module][method](apiSettings);
					}
				} else {
					console.error('This api does not exist. Module: ' + module + ', Method: ' + method);
				}
			};

			// We want to abstract this function at the app layer in case we'd need to check things like masquerading here.
			app.getAuthToken = function(connectionName) {
				return monster.util.getAuthToken(connectionName);
			};

			app.getStore = _.get(
				app,
				'getStore',
				/**
				 * Store getter
				 * @param  {Array|String} [path]
				 * @param  {*} [defaultValue]
				 * @return {*}
				 */
				function getStore(path, defaultValue) {
					var store = ['data', 'store'];
					return _.get(
						app,
						_.isUndefined(path)
							? store
							: _.flatten([store, _.isString(path) ? path.split('.') : path]),
						defaultValue
					);
				}
			);

			app.setStore = _.get(
				app,
				'setStore',
				/**
				 * Store setter
				 * @param {Array|String} [path]
				 * @param {*} [value]
				 * @return {*} Modified value at `path`.
				 */
				function setStore(path, value) {
					var hasValue = _.toArray(arguments).length === 2,
						store = ['data', 'store'],
						resolvedPath = hasValue
							? _.flatten([store, _.isString(path) ? path.split('.') : path])
							: store;
					_.set(
						app,
						resolvedPath,
						hasValue ? value : path
					);
					return app.getStore(resolvedPath);
				}
			);

			self._addAppI18n(app, function(err) {
				if (err) {
					return callback(err);
				}
				monster.apps[app.name] = app;

				callback(null, app);
			});
		},

		/**
		 * @param  {Object} app
		 * @param  {Function} [globalCallback]
		 */
		loadDependencies: function(app, globalCallback) {
			var self = this,
				currentUser = _.get(monster, 'apps.auth.currentUser', {}),
				dependencies = _
					.chain(app)
					.get('externalScripts', [])
					.map(function(dependency) {
						return function(callback) {
							monster.getScript(
								app.appPath + '/external/' + dependency + '.js',
								_.partial(callback, null)
							);
						};
					})
					.value(),
				isAppAlreadyLoaded = _.partial(_.has, monster.apps),
				isUserPermittedApp = _.partial(monster.util.isUserPermittedApp, currentUser),
				shouldLoadApp = _.overSome(
					isAppAlreadyLoaded,
					_.flow(
						monster.util.getAppStoreMetadata,
						_.negate(isUserPermittedApp)
					)
				),
				extensions = _
					.chain(app.name)
					.thru(monster.util.getAppStoreMetadata)
					.get('extensions', [])
					.reject(shouldLoadApp)
					.map(function(extension) {
						return function(callback) {
							self._loadApp(extension, callback);
						};
					})
					.value();

			monster.parallel(_.concat(
				dependencies,
				extensions
			), function(err) {
				globalCallback(err, app);
			});
		},

		_addAppCss: function(app) {
			var self = this,
				listCss = [],
				currentLanguage = monster.config.whitelabel.language,
				addCss = function(fileName) {
					fileName = app.appPath + '/style/' + fileName + '.css';

					monster.css(app, fileName);
				};

			// If the app wasn't already loaded by our build (it minifies and concatenate some apps)
			if ((monster.config.developerFlags.build.preloadedApps || []).indexOf(app.name) < 0) {
				listCss = app.css;
			}

			// If the current UI Language is not the default of the Monster UI, see if we have a specific i18n file to load
			if (currentLanguage !== monster.defaultLanguage) {
				if (app.i18n.hasOwnProperty(currentLanguage) && app.i18n[currentLanguage].customCss === true) {
					listCss.push('cssI18n/' + currentLanguage);
				}
			}

			_.each(listCss, function(fileName) {
				addCss(fileName);
			});
		},

		_addAppI18n: function(app, mainCallback) {
			var self = this,
				loadDefaultLanguage = _.bind(self.loadLocale, self, app, monster.defaultLanguage),
				maybeLoadPreferredLanguage = function maybeLoadPreferredLanguage(app, language, callback) {
					if (language.toLowerCase() === monster.defaultLanguage.toLowerCase()) {
						return callback(null);
					}
					if (!_.has(app.i18n, language)) {
						if (_.includes(window.location.hash, app.appPath)) {
							monster.ui.toast({
								type: 'info',
								message: 'The default language isn\'t supported for the selected app, switching automatically to ' + monster.defaultLanguage
							});
						}
						console.info(language + ' isn\'t a supported language by this application: ' + app.name);
						return callback(null);
					}
					// If the preferred language of the user is supported by the application and different from the default language, we load its i18n files.
					self.loadLocale(
						app,
						language,
						// Prepend null as we don't care if it errors out, the app can still load
						_.partial(callback, null)
					);
				};

			_.extend(app.data, { i18n: {} });

			monster.waterfall([
				loadDefaultLanguage,
				_.partial(maybeLoadPreferredLanguage, app, monster.config.whitelabel.language)
			], function augmentI18n(err) {
				if (err) {
					return mainCallback && mainCallback(err);
				}

				var loadedLanguages = _.keys(app.data.i18n);

				// We'll merge the Core I18n once we're done loading the different I18n coming with the application
				if (monster.apps.hasOwnProperty('core')) {
					$.extend(true, app.data.i18n, monster.apps.core.data.i18n);
				}

				// add an active property method to the i18n array within the app.
				_.extend(app.i18n, {
					active: function() {
						var language = _.find([
							monster.config.whitelabel.language,
							monster.defaultLanguage
						], _.partial(_.includes, loadedLanguages));

						return app.data.i18n[language];
					}
				});

				mainCallback && mainCallback(null);
			});
		},

		/**
		 * @param  {String}   name
		 * @param  {Function} [callback]
		 * @param  {Object}   [options={}]
		 * @param  {String}   [options.sourceUrl]
		 * @param  {String}   [options.apiUrl]
		 */
		_loadApp: function(name, mainCallback, pOptions) {
			var self = this,
				options = pOptions || {},
				getValidUrl = _.flow(
					_.partial(_.map, _, monster.normalizeUrlPathEnding),
					_.partial(_.find, _, _.isString)
				),
				removeTrailingSlash = function(url) {
					// Remove trailing '/'
					return _.endsWith(url, '/') ? url.slice(0, -1) : url;
				},
				metadata = monster.util.getAppStoreMetadata(name),
				externalUrl = _.flow(
					getValidUrl,
					removeTrailingSlash
				)([
					_.get(metadata, 'source_url'),
					_.get(options, 'sourceUrl')
				]),
				hasExternalUrlConfigured = !_.isUndefined(externalUrl),
				pathConfig = hasExternalUrlConfigured ? {
					directory: externalUrl,
					moduleRoot: 'apps/' + name,
					module: 'apps/' + name + '/app'
				} : {
					directory: 'apps/' + name,
					moduleRoot: 'apps/' + name,
					module: 'apps/' + name + '/app'
				},
				apiUrl = getValidUrl([
					_.get(options, 'apiUrl'),
					_.get(metadata, 'api_url'),
					monster.config.api.default
				]),
				requireApp = _.partial(function(moduleId, pathToDirectory, name, apiUrl, version, callback) {
					require([moduleId], function(app) {
						_.extend(app, {
							appPath: pathToDirectory,
							data: {
								version: version
							}
						}, monster.apps[name], {
							apiUrl: apiUrl,
							// we don't want the name to be set by the js, instead we take the name supplied in the app.json
							name: name
						});

						callback(null, app);
					}, callback);
				}, pathConfig.module, pathConfig.directory, name, apiUrl),
				maybeRetrieveBuildConfig = function maybeRetrieveBuildConfig(app, callback) {
					var callbackForConfig = _.partial(_.ary(callback, 3), null, app),
						callbackWithoutConfig = _.partial(callbackForConfig, {});

					if (!app.hasConfigFile) {
						return callbackWithoutConfig();
					}
					$.ajax({
						url: app.appPath + '/app-build-config.json',
						dataType: 'json',
						beforeSend: _.partial(monster.pub, 'monster.requestStart'),
						complete: _.partial(monster.pub, 'monster.requestEnd'),
						success: callbackForConfig,
						error: callbackWithoutConfig
					});
				},
				applyConfig = function(app, config, callback) {
					app.buildConfig = config;

					if (app.buildConfig.version === 'pro') {
						if (!app.hasOwnProperty('subModules')) {
							app.subModules = [];
						}

						app.subModules.push('pro');
					}

					callback(null, app);
				},
				requireSubModule = _.partial(function(appRoot, app, subModule, callback) {
					var pathSubModule = appRoot + '/submodules/',
						path = pathSubModule + subModule + '/' + subModule;

					require([path], function(module) {
						/* We need to be able to subscribe to the same event with many callbacks, so we can't merge the subscribes key together, or it would override some valid callbacks */
						var oldSubscribes = $.extend(true, {}, app.subscribe);
						$.extend(true, app, module);
						app.subscribe = oldSubscribes;

						_.each(module.subscribe, function(callback, topic) {
							var cb = typeof callback === 'string' ? app[callback] : callback;

							monster.sub(topic, cb, app);
						});

						callback(null);
					}, callback);
				}, pathConfig.moduleRoot),
				loadSubModules = function loadSubModules(app, callback) {
					monster.parallel(_
						.chain(app)
						.get('subModules', [])
						.map(function(subModule) {
							return _.partial(requireSubModule, app, subModule);
						})
						.value()
					, function(err) {
						callback(err, app);
					});
				},
				loadVersion = _.partial(function(name, pathToFolder, callback) {
					var success = _.partial(_.ary(callback, 2), null),
						successWithDynamicVersion = _.partial(success, _.toString(new Date().getTime()));

					if (monster.isDev()) {
						return successWithDynamicVersion();
					}
					var preloadedApps = _.get(monster, 'config.developerFlags.build.preloadedApps', []),
						successWithFrameworkVersion = _.partial(success, monster.util.getVersion());

					if (_.includes(preloadedApps, name)) {
						return successWithFrameworkVersion();
					}
					$.ajax({
						url: pathToFolder + '/VERSION',
						success: _.flow(
							monster.parseVersionFile,
							_.partial(_.get, _, 'version'),
							success
						),
						error: successWithDynamicVersion
					});
				}, name, pathConfig.directory),
				loadApp = function loadApp(callback) {
					monster.waterfall([
						loadVersion,
						requireApp,
						maybeRetrieveBuildConfig,
						applyConfig,
						loadSubModules,
						_.bind(self.monsterizeApp, self)
					], callback);
				},
				initializeApp = function initializeApp(app, callback) {
					try {
						app.load(_.partial(callback, null));
					} catch (error) {
						callback(error);
					}
				};

			if (hasExternalUrlConfigured) {
				require.config(
					_.set({}, ['paths', pathConfig.moduleRoot], pathConfig.directory)
				);
			}

			monster.waterfall([
				loadApp,
				_.bind(self.loadDependencies, self),
				initializeApp
			], mainCallback);
		},

		/**
		 * @param  {String}   name
		 * @param  {Function} [callback]
		 * @param  {Object}   [options]
		 */
		load: function(name, mainCallback, options) {
			var self = this,
				maybeLoadApp = function maybeLoadApp(name, options, callback) {
					if (_.has(monster.apps, name)) {
						return callback(null, monster.apps[name]);
					}
					self._loadApp(name, callback, options);
				};

			monster.waterfall([
				_.partial(maybeLoadApp, name, options)
			], function afterAppLoad(err, app) {
				if (err) {
					return mainCallback && mainCallback(err);
				}
				monster.apps.lastLoadedApp = app.name;

				self.changeAppShortcuts(app);

				mainCallback && mainCallback(null, app);
			});
		},

		changeAppShortcuts: function(app) {
			monster.ui.removeShortcut('appSpecific');

			var i18nShortcuts = app.i18n.active().shortcuts;

			if (app.hasOwnProperty('shortcuts')) {
				_.each(app.shortcuts, function(event, key) {
					monster.ui.addShortcut({
						category: 'appSpecific',
						key: 'alt+' + key,
						callback: function() {
							monster.pub(event);
						},
						title: i18nShortcuts && i18nShortcuts.hasOwnProperty(key) ? i18nShortcuts[key] : event
					});
				});
			}
		},

		getActiveApp: function() {
			return monster.apps.lastLoadedApp;
		},

		loadLocale: function(app, language, mainCallback) {
			var self = this,
				// Automatic upper case for text after the hyphen (example: change en-us to en-US)
				language = language.replace(/-.*/, _.toUpper),
				loadFile = function loadFile(app, language, callback) {
					$.ajax({
						url: monster.util.cacheUrl(app, app.appPath + '/i18n/' + language + '.json'),
						dataType: 'json',
						beforeSend: _.partial(monster.pub, 'monster.requestStart'),
						complete: _.partial(monster.pub, 'monster.requestEnd'),
						success: _.partial(callback, null),
						error: function(data, status, error) {
							callback(true);
						}
					});
				};

			monster.waterfall([
				_.partial(loadFile, app, language)
			], function applyI18n(err, i18n) {
				var data = i18n || {};

				// If we're loading the default language, then we add it, and also merge the core i18n to it
				if (language === monster.defaultLanguage) {
					app.data.i18n[language] = data;
				} else {
					// Otherwise, if we load a custom language, we merge the translation to the en-one
					app.data.i18n[language] = $.extend(true, app.data.i18n[language] || {}, app.data.i18n[monster.defaultLanguage], data);
				}

				mainCallback && mainCallback(err);
			});
		}
	};

	return apps;
});
