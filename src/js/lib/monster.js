define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		async = require('async'),
		card = require('card'),
		Cookies = require('cookies'),
		ddslick = require('ddslick'),
		fileupload = require('fileupload'),
		form2object = require('form2object'),
		handlebars = require('handlebars'),
		kazoosdk = require('kazoosdk'),
		libphonenumber = require('libphonenumber'),
		md5 = require('md5'),
		postal = require('postal');

	var defaultCountryCode = 'US';
	var defaultCurrencyCode = 'USD';
	var defaultLanguage = 'en-US';

	var supportedLanguages = [
		'de-DE',
		'en-US',
		'es-ES',
		'fr-FR',
		'nl-NL',
		'ru-RU'
	];

	var defaultConfig = {
		'api.default': [_.isString, window.location.protocol + '//' + window.location.hostname + ':8000/v2/'],
		currencyCode: [isCurrencyCode, defaultCurrencyCode],
		allowCrossSiteUsage: [_.isBoolean, false],
		'developerFlags.showAllCallflows': [_.isBoolean, false],
		'developerFlags.showJsErrors': [_.isBoolean, false],
		'port.loa': [_.isString, 'http://ui.zswitch.net/Editable.LOA.Form.pdf'],
		'port.resporg': [_.isString, 'http://ui.zswitch.net/Editable.Resporg.Form.pdf'],
		'whitelabel.acceptCharges.autoAccept': [_.isBoolean, false],
		'whitelabel.acceptCharges.showInvoiceSummary': [_.isBoolean, true],
		'whitelabel.allowAccessList': [_.isBoolean, false],
		'whitelabel.appLinks': [_.isPlainObject, {}],
		'whitelabel.applicationTitle': [_.isString, 'Monster UI'],
		'whitelabel.bookkeepers.braintree': [_.isBoolean, true],
		'whitelabel.bookkeepers.payphone': [_.isBoolean, true],
		'whitelabel.bookkeepers.iou': [_.isBoolean, true],
		'whitelabel.companyName': [_.isString, '2600Hz'],
		'whitelabel.disableNumbersFeatures': [_.isBoolean, false],
		'whitelabel.hideAppStore': [_.isBoolean, false],
		'whitelabel.hideBuyNumbers': [_.isBoolean, false],
		'whitelabel.hideNewAccountCreation': [_.isBoolean, false],
		'whitelabel.includes': [isArrayOfHttpUrls, []],
		'whitelabel.language': [_.isString, defaultLanguage, supportedLanguages],
		'whitelabel.logoutTimer': [_.isNumber, 15],
		'whitelabel.preventDIDFormatting': [_.isBoolean, false],
		'whitelabel.countryCode': [isCountryCode, defaultCountryCode],
		'whitelabel.showMediaUploadDisclosure': [_.isBoolean, false],
		'whitelabel.showPAssertedIdentity': [_.isBoolean, false],
		'whitelabel.useDropdownApploader': [_.isBoolean, false],
		bypassAppStorePermissions: [_.isBoolean, false],
		'whitelabel.disableFirstUseWalkthrough': [_.isBoolean, false],
		'whitelabel.invoiceRangeConfig': [_.isNumber, 6]
	};

	var featureSets = {
		config: {
			smartpbx: {
				28: {
					devices: {
						manage: false,
						settings: {
							name: {
								edit: false
							},
							callerId: {
								editWhenSetOnAccount: false
							},
							sip: {
								manage: false
							},
							codecs: {
								manage: false
							}
						}
					},
					groups: {
						manage: false
					},
					mainNumber: {
						mainConferenceNumber: {
							manage: false
						},
						incomingCallHandling: {
							virtualReceptionist: false
						}
					},
					numbers: {
						manage: false
					},
					users: {
						add: false,
						settings: {
							'delete': false,
							allowUserPrivLevel: false,
							fullName: {
								edit: false
							},
							mainExtensionNumber: {
								manage: false
							},
							credentials: {
								edit: false
							},
							utfExtensions: {
								show: false
							}
						},
						timezone: {
							edit: false
						},
						devices: {
							edit: false
						},
						phoneNumbers: {
							edit: false
						},
						features: {
							callerId: {
								edit: false,
								editWhenSetOnAccount: false
							},
							callRecording: {
								edit: false
							},
							conferencing: {
								edit: false
							},
							faxing: {
								i18nLabelPath: 'fax'
							},
							findMeFollowMe: {
								edit: false
							},
							vmbox: {
								edit: false,
								transcription: false,
								i18nLabelPath: 'voicemail'
							}
						}
					},
					vmboxes: {
						add: false,
						settings: {
							voicemailNumber: {
								manage: false
							},
							'delete': false
						}
					}
				}
			},
			callRecording: {
				28: {
					storageSettings: {
						manage: false
					},
					configuration: {
						manage: true,
						devices: {
							manage: false
						}
					}
				}
			}
		},
		entitlements: {
			'Virtual Receptionist': {
				smartpbx: {
					mainNumber: {
						incomingCallHandling: {
							virtualReceptionist: true
						}
					}
				}
			},
			'Caller-ID Number': {
				smartpbx: {
					users: {
						features: {
							callerId: {
								edit: true
							}
						}
					}
				}
			},
			groups: {
				smartpbx: {
					groups: {
						manage: true
					}
				}
			},
			'Customized Call Recording': {
				smartpbx: {
					users: {
						features: {
							callRecording: {
								edit: true
							}
						}
					}
				}
			},
			voicemail_transcription: {
				smartpbx: {
					users: {
						features: {
							vmbox: {
								transcription: true
							}
						}
					}
				}
			}
		}
	};

	var _privateFlags = {
		lockRetryAttempt: false,
		retryFunctions: [],
		unlockRetryFunctions: function() {
			_.each(this.retryFunctions, function(fun) {
				fun();
			});

			this.lockRetryAttempt = false;
			this.retryFunctions = [];
		},
		addRetryFunction: function(fun) {
			this.retryFunctions.push(fun);
		}
	};

	var monster = {
		_channel: postal.channel('monster'),

		_fileExists: function(url, success, error) {
			$.ajax({
				url: url,
				type: 'HEAD',
				error: function(status) {
					error && error();
				},
				success: function(status) {
					success && success();
				}
			});
		},

		_requests: {},

		_cacheString: function(request) {
			if (request.cache || request.type.toLowerCase() !== 'get') {
				return '';
			}

			var prepend = request.url.indexOf('?') >= 0 ? '&' : '?';

			return prepend + '_=' + (new Date()).getTime();
		},

		request: function(options) {
			var self = this,
				settings = _.extend({}, this._requests[options.resource]);

			if (!settings) {
				throw new Error('The resource requested could not be found.', options.resource);
			}

			settings.url = options.apiUrl || settings.url;

			if (options.data && 'filters' in options.data) {
				$.each(options.data.filters, function(filterKey, filterValue) {
					var valueArray = [].concat(filterValue);
					$.each(valueArray, function(key, value) {
						settings.url += (settings.url.indexOf('?') > 0 ? '&' : '?') + filterKey + '=' + encodeURIComponent(value);
					});
				});
			}

			settings.url += self._cacheString(settings);

			var mappedKeys = [],
				rurlData = /\{([^}]+)\}/g,
				data = _.extend({}, options.data || {});

			settings.url = settings.url.replace(rurlData, function(v, key) {
				if (key in data) {
					mappedKeys.push(key);
					return encodeURIComponent(data[key]);
				}
			});

			settings.error = function requestError(error) {
				var parsedError,
					handleError = function(error, requestOptions) {
						parsedError = error;

						var generateError = _.get(requestOptions, 'generateError', settings.customFlags.generateError);

						monster.pub('monster.requestEnd');

						if ('response' in error && error.response) {
							parsedError = $.parseJSON(error.response);
						}

						// If we have a 401 after being logged in, it means our session expired
						if (
							error.status === 401
							&& monster.util.isLoggedIn()
						) {
							error401Handler({
								requestHandler: self.request.bind(self),
								error: error,
								errorMessage: monster.apps.core.i18n.active().authenticationIssue,
								options: requestOptions
							});
						} else if (
							error.status === 402
							&& !_.has(options, 'acceptCharges')
						) {
							error402Handler({
								requestHandler: self.request.bind(self),
								error: error,
								options: options
							});
						} else {
							// Added this to be able to display more data in the UI
							error.monsterData = {
								url: settings.url,
								verb: settings.type
							};

							monster.error('api', error, generateError);
						}
					};

				handleError(error, options);

				if (!_.get(options, 'preventCallbackError', false)) {
					options.error && options.error(parsedError, error, handleError);
				}
			};

			settings.success = function requestSuccess(resp) {
				monster.pub('monster.requestEnd');

				options.success && options.success(resp);
			};

			// We delete the keys later so duplicates are still replaced
			_.each(mappedKeys, function(name, index) {
				delete data[name];
			});

			if (settings.type.toLowerCase() !== 'get') {
				var postData = data.data,
					envelopeKeys = {};

				if (data.hasOwnProperty('envelopeKeys')) {
					var protectedKeys = ['data', 'accept_charges'];

					_.each(data.envelopeKeys, function(value, key) {
						if (protectedKeys.indexOf(key) < 0) {
							envelopeKeys[key] = value;
						}
					});
				}

				if (settings.contentType === 'application/json') {
					var payload = $.extend(true, {
						data: data.data || {}
					}, envelopeKeys);

					if (!data.hasOwnProperty('removeMetadataAPI') || data.removeMetadataAPI === false) {
						payload.data.ui_metadata = {
							version: monster.util.getVersion(),
							ui: 'monster-ui'
						};
					}

					if (options.acceptCharges === true) {
						payload.accept_charges = true;
					}

					postData = JSON.stringify(payload);
				}

				settings = _.extend(settings, {
					data: postData
				});
			}

			return $.ajax(settings);
		},

		apps: {},

		cache: {
			templates: {}
		},

		logs: {
			error: []
		},

		cookies: getCookiesManager(),

		css: function(app, href) {
			$('<link/>', { rel: 'stylesheet', href: monster.util.cacheUrl(app, href) }).appendTo('head');
		},

		domain: function() {
			var matches = location.href.match(/^(?:https?:\/\/)*([^/?#]+).*$/);
			return matches.length > 1 ? matches[1] : '';
		},

		pub: function(topic, data) {
			postal.publish({
				channel: 'monster',
				topic: topic,
				data: data || {}
			});
		},

		sub: function(topic, callback, context) {
			if (typeof callback === 'undefined') {
				console.warn('The topic ' + topic + ' does not have a callback');
			} else {
				var sub = this._channel.subscribe(topic, callback);
				if (context) {
					sub.context(context);
				}

				return sub;
			}
		},

		unsub: function(subscription) {
			subscription.unsubscribe();
		},

		getTemplate: function(args) {
			var self = this,
				data = args.data || {},
				raw = args.hasOwnProperty('raw') ? args.raw : false,
				ignoreCache = args.hasOwnProperty('ignoreCache') ? args.ignoreCache : false,
				ignoreSpaces = args.hasOwnProperty('ignoreSpaces') ? args.ignoreSpaces : false,
				submodule = args.hasOwnProperty('submodule') ? args.submodule : 'main',
				_template = Handlebars.getTemplate(args.app, submodule, args.name, ignoreCache),
				result = self.getFormattedTemplate(_template, args.app, args.name, data, raw, ignoreSpaces);

			return result;
		},

		template: function(app, name, data, raw, ignoreCache, ignoreSpaces) {
			var self = this,
				raw = raw || false,
				ignoreCache = ignoreCache || false,
				ignoreSpaces = ignoreSpaces || false,
				_template = Handlebars.getTemplate(app, 'main', name, ignoreCache),
				result = self.getFormattedTemplate(_template, app, name, data, raw, ignoreSpaces);

			return result;
		},

		getFormattedTemplate: function(_template, app, name, data, raw, ignoreSpaces) {
			var self = this,
				result;

			if (!raw) {
				var i18n = app.i18n.active();

				var context = _.extend({}, data || {}, { i18n: i18n, _whitelabel: monster.config.whitelabel });

				result = _template(context);
			} else {
				result = _template;
			}

			if (!ignoreSpaces) {
				result = result.replace(/(\r\n|\n|\r|\t)/gm, '').trim();
			}

			if (name.substring(0, 1) !== '!') {
				result = monster.util.updateImagePath(result, app);
			}

			return result;
		},

		formatMonsterAPIError: function(error) {
			var self = this,
				parsedError = error,
				isParsable = error.hasOwnProperty('getResponseHeader') ? (error.getResponseHeader('content-type') === 'application/json') : typeof error === 'object' && 'responseText' in error;// for unknown reason hasOwnProperty returns false?

			isParsable = isParsable && error.responseText !== '';

			if (isParsable) {
				parsedError = $.parseJSON(error.responseText);
			}

			var errorsI18n = monster.apps.core.i18n.active().errors,
				errorMessage = errorsI18n.generic,
				errorNumber = error.status > 0 ? error.status : parseInt(error.error),
				customTitle;

			if (typeof parsedError.data === 'string' && typeof parsedError.message === 'string' && errorsI18n.errorMessages.hasOwnProperty(parsedError.message)) {
				errorMessage = errorsI18n.errorMessages[parsedError.message].text;
				customTitle = errorsI18n.errorMessages[parsedError.message].title;
			} else if ((errorNumber === 400 || errorNumber === 413) && 'data' in parsedError) {
				errorMessage = errorsI18n.invalidData.errorLabel;
				_.each(parsedError.data, function(fieldErrors, fieldKey) {
					if (typeof fieldErrors === 'string') {
						return;
					}

					_.each(fieldErrors, function(fieldError, fieldErrorKey) {
						if (typeof fieldError === 'string' || typeof fieldError === 'number') {
							errorMessage += '<br/>"' + fieldKey + '": ' + fieldError;
						} else if (fieldErrorKey in errorsI18n.invalidData) {
							errorMessage += '<br/>' + monster.template(monster.apps.core, '!' + errorsI18n.invalidData[fieldErrorKey], { field: fieldKey, value: fieldError.target });
						} else if ('message' in fieldError) {
							errorMessage += '<br/>"' + fieldKey + '": ' + fieldError.message;
						}
					});
				});
			} else if ((errorNumber === 409 || errorNumber === 500) && 'data' in parsedError) {
				var errMsg = '';

				_.each(parsedError.data, function(fieldError, fieldErrorKey) {
					if (fieldErrorKey in errorsI18n.errorMessages) {
						errMsg += errorsI18n.errorMessages[fieldErrorKey].text + '<br>';
					} else if (fieldError.hasOwnProperty('message')) {
						errMsg += fieldError.message + '<br>';
					}
				});

				if (errMsg) {
					errorMessage = errMsg;
				}
			} else if (errorsI18n.hasOwnProperty(errorNumber)) {
				errorMessage = errorsI18n[errorNumber];
			}

			var requestId = '',
				url = '',
				verb = '';

			if (parsedError.hasOwnProperty('request_id')) {
				requestId = parsedError.request_id;
			}

			if (error.hasOwnProperty('monsterData')) {
				url = error.monsterData.url;
				verb = error.monsterData.verb;
			}

			return {
				status: error.status,
				message: errorMessage,
				requestId: requestId || '',
				response: isParsable ? JSON.stringify($.parseJSON(error.responseText), null, 4) : JSON.stringify(error, null, 4),
				url: url || '',
				verb: verb || '',
				customTitle: customTitle,
				jsonResponse: isParsable ? $.parseJSON(error.responseText) : error
			};
		},

		error: function(type, data, showDialog) {
			var self = this,
				showDialog = showDialog === false ? false : true,
				monsterError = {
					type: type,
					timestamp: new Date(),
					data: {}
				};

			if (type === 'api') {
				monsterError.data = self.formatMonsterAPIError(data);
				if (showDialog) {
					monster.ui.requestErrorDialog(monsterError);
				}
			} else if (type === 'js') {
				monsterError.data = {
					title: data.message,
					file: data.fileName,
					line: data.lineNumber,
					column: data.columnNumber,
					stackTrace: data.error && data.error.hasOwnProperty('stack') ? data.error.stack : ''
				};

				if (monster.config.hasOwnProperty('developerFlags') && monster.config.developerFlags.showJSErrors && showDialog) {
					monster.ui.jsErrorDialog(monsterError);
				}
			}

			monster.logs.error.push(monsterError);
		},

		parallel: function(tasks, callback, pLimit) {
			var limit = pLimit && pLimit >= 1 ? pLimit : 5;

			async.parallelLimit(tasks, limit, callback);
		},

		series: async.series,
		waterfall: async.waterfall,

		shift: function(chain) {
			var next = chain.shift();
			next && next();
		},

		loadBuildConfig: function(callback) {
			var self = this,
				getVersion = _.flow(
					monster.parseVersionFile,
					_.partial(_.get, _, 'version'),
					_.partial(_.defaultTo, _, null)
				),
				getBuildConfig = _.partial(_.pick, _, [
					'type',
					'preloadedApps',
					'proApps'
				]);

			monster.parallel({
				version: function(next) {
					$.ajax({
						url: 'VERSION',
						cache: false,
						success: _.flow(
							getVersion,
							_.partial(next, null)
						),
						error: _.partial(next, null, null)
					});
				},
				buildFile: function(next) {
					$.ajax({
						url: 'build-config.json',
						dataType: 'json',
						cache: false,
						success: _.flow(
							getBuildConfig,
							_.partial(next, null)
						),
						error: _.partial(next, null, {})
					});
				}
			}, function(err, results) {
				monster.config.developerFlags.build = _.merge({}, results.buildFile, {
					version: results.version
				});

				callback && callback(monster.config.developerFlags.build);
			});
		},

		getScript: function(url, callback) {
			var self = this;

			$.getScript(url, callback);
		},

		querystring: function(key) {
			var re = new RegExp('(?:\\?|&)' + key + '=(.*?)(?=&|$)', 'gi'),
				results = [],
				match;
			while ((match = re.exec(document.location.search)) != null) {
				results.push(match[1]);
			}
			return results.length ? results[0] : null;
		},

		initSDK: function() {
			var self = this;

			self.kazooSdk = $.getKazooSdk({
				apiRoot: monster.config.api.default,
				onRequestStart: function(request, requestOptions) {
					monster.pub('monster.requestStart', requestOptions.requestEventParams);
				},
				onRequestEnd: function(request, requestOptions) {
					monster.pub('monster.requestEnd', requestOptions.requestEventParams);
				},
				onRequestError: function(error, requestOptions) {
					var requestOptions = requestOptions || { generateError: true };

					if (
						error.status === 401
						&& monster.util.isLoggedIn()
					) {
						error401Handler({
							requestHandler: monster.kazooSdk.request,
							error: error,
							options: requestOptions
						});
					} else if (
						error.status === 402
						&& !_.has(requestOptions, 'acceptCharges')
					) {
						error402Handler({
							requestHandler: monster.kazooSdk.request,
							error: error,
							options: requestOptions
						});
					} else {
						monster.error('api', error, requestOptions.generateError);
					}
				}
			});
		},

		hasProVersion: function(app) {
			var self = this;

			return monster.config.developerFlags.build.proApps.indexOf(app.name) >= 0;
		},

		md5: function(string) {
			return md5(string);
		},

		getFeatureSet: getFeatureSet
	};

	/**
	 * Returns wrapper over cookie management library.
	 * @private
	 * @returns {Object} Cookies manager module.
	 */
	function getCookiesManager() {
		var mergeAttributes = function(attributes) {
			var allowCrossSiteUsage = monster.config.allowCrossSiteUsage;
			var crossSiteAttributes = {
				samesite: 'none',
				secure: true
			};
			return _.merge(
				{},
				attributes,
				allowCrossSiteUsage && crossSiteAttributes
			);
		};

		return {
			set: function set(key, value, attributes) {
				var result;
				try {
					result = JSON.stringify(value);
				} catch (e) {
					return;
				}
				Cookies.set(key, result, mergeAttributes(attributes));
			},
			get: _.flow(
				Cookies.get,
				_.partial(_.defaultTo, _, null)
			),
			getJson: function getJson(key) {
				if (!this.has(key)) {
					return null;
				}
				var value = Cookies.get(key);
				try {
					return JSON.parse(value);
				} catch (e) {}
			},
			remove: Cookies.remove,
			has: _.flow(
				Cookies.get,
				_.negate(_.isUndefined)
			)
		};
	}

	function getFeatureSet(jwt) {
		var tokenPayload = monster.util.jwt_decode(jwt);
		var entitlementsFeatureSet = _
			.chain(tokenPayload)
			.get('bluejeans', [])
			.map(
				_.partial(_.ary(_.get, 2), featureSets.entitlements)
			)
			.filter(_.isObject)
			.reduce(
				_.ary(_.merge, 2), {}
			)
			.value();
		var configFeatureSet = _
			.chain(monster.config)
			.get('whitelabel')
			.mapValues(function(value, key) {
				var code = _.get(value, 'feature_set');
				return _.get(featureSets.config, [key, code]);
			})
			.pickBy(_.isObject)
			.value();

		return _.merge({},
			configFeatureSet,
			entitlementsFeatureSet
		);
	}

	/**
	 * @param  {String} id Resource identifier
	 * @param  {Object} request Request settings
	 * @param  {String} request.url
	 * @param  {Array} [request.removeHeaders
	 * @param  {String} [request.apiRoot]
	 * @param  {Boolean} [request.cache=false]
	 * @param  {String} [request.dataType='json']
	 * @param  {String} [request.verb='get']
	 * @param  {String} [request.type='application/json']
	 * @param  {Boolean} [request.generateError=true]
	 * @param  {Object} [request.headers]
	 * @param {Object} app Application context
	 */
	function defineRequest(id, request, app) {
		var headersToRemove = _.map(request.removeHeaders, _.toLower);
		var apiUrl = request.apiRoot || app.apiUrl || monster.config.api.default;
		var settings = {
			cache: _.get(request, 'cache', false),
			url: apiUrl + request.url,
			dataType: request.dataType || 'json',
			type: request.verb || 'get',
			contentType: _.includes(headersToRemove, 'content-type')
				? false
				: _.get(request, 'type', 'application/json'),
			crossDomain: true,
			processData: false,
			customFlags: {
				generateError: _.get(request, 'generateError', true)
			},
			beforeSend: function(jqXHR) {
				var headers = _
					.chain(request)
					.get('headers', {})
					.clone()
					.merge({
						'X-Auth-Token': app.getAuthToken()
					}, _.has(monster.config, 'kazooClusterId')
						? { 'X-Kazoo-Cluster-ID': monster.config.kazooClusterId }
						: {}
					)
					.omitBy(function(value, key) {
						return _.includes(headersToRemove, _.toLower(key));
					})
					.value();

				monster.pub('monster.requestStart');

				_.forEach(headers, function(value, key) {
					jqXHR.setRequestHeader(key, value);
				});
			}
		};

		_.set(monster, ['_requests', id], settings);
	}
	monster._defineRequest = defineRequest;

	/**
	 * @private
	 * @param  {Object} args
	 * @param  {Function} args.requestHandler
	 * @param  {Object} args.error
	 * @param  {String} [args.errorMessage]
	 * @param  {Object} args.options
	 */
	function error401Handler(args) {
		var requestHandler = args.requestHandler;
		var error = args.error;
		var errorMessage = _.get(args, 'errorMessage', monster.apps.core.i18n.active().invalidCredentialsMessage);
		var options = args.options;

		// If we have a 401 after being logged in, it means our session expired, or that it's a MFA denial of the relogin attempt
		// We don't want to show the normal error box for 401s, but still want to check the payload if they happen, via the error tool.
		monster.error('api', error, false);

		// the prevent callback error key is added by our code. We want to let the system automatically attempt to relogin once before sending the error callback
		// So to prevent the original error callback from being fired, we add that flag to the request when we attempt the request a second time
		if (_.get(options, 'preventCallbackError', false)) {
			monster.ui.alert('error', errorMessage, function() {
				monster.util.logoutAndReload();
			});
		// If it's a retryLoginRequest, we don't want to prevent the callback as it could be a MFA denial
		} else if (!_.get(options, 'isRetryLoginRequest', false)) {
			if (_privateFlags.lockRetryAttempt) {
				_privateFlags.addRetryFunction(function() {
					requestHandler(options);
				});
			} else {
				// We added a new locking mechanism. Basically if your module use a parallel request, you could have 5 requests ending in a 401. We don't want to automatically re-login 5 times, so we lock the system
				// Once the re-login is effective, we'll unlock it.
				_privateFlags.lockRetryAttempt = true;

				// Because onRequestError is executed before error in the JS SDK, we can set this flag to prevent the execution of the custom error callback
				// This way we can handle the 401 properly, try again with a new auth token, and continue the normal flow of the ui
				options.preventCallbackError = true;

				monster.pub('auth.retryLogin', {
					additionalArgs: {
						isRetryLoginRequest: true
					},
					success: function() {
						requestHandler($.extend(true, {}, options, {
							// Used to feed the updated token to the SDK (when requestHandler() references monster.kazooSdk.request())
							authToken: monster.util.getAuthToken(),
							// We setup the flag to false this time, so that if it errors out again, we properly log out of the UI
							preventCallbackError: false
						}));
						_privateFlags.unlockRetryFunctions();
					},
					error: function() {
						monster.ui.alert('error', errorMessage, function() {
							monster.util.logoutAndReload();
						});
					}
				});
			}
		}
	}

	/**
	 * @private
	 * @param  {Object} args
	 * @param  {Function} args.requestHandler
	 * @param  {Object} args.error
	 * @param  {Object} args.options
	 * @param  {Function} [args.options.onChargesCancelled]
	 */
	function error402Handler(args) {
		var requestHandler = args.requestHandler;
		var error = args.error;
		var options = args.options;
		var updatedOptions = _.merge({}, options, {
			acceptCharges: true,
			preventCallbackError: false
		});
		var responseText = _.get(error, 'responseText');
		var parsedError = responseText ? $.parseJSON(responseText) : error;
		var onChargesAccepted = _.partial(requestHandler, updatedOptions);
		var onChargesCancelled = _.isFunction(options.onChargesCancelled)
			? options.onChargesCancelled
			: function() {};

		// Prevent the execution of the custom error callback, as it is a charges notification that
		// will be handled here
		options.preventCallbackError = true;

		// Notify the user about the charges
		monster.ui.charges(parsedError.data, onChargesAccepted, onChargesCancelled);
	}

	/**
	 * Set missing/incorrect config.js properties required by the UI to function properly.
	 */
	function initConfig() {
		var config = require('config');
		var getValue = function(value, path) {
			var validator = value[0];
			var presetValue = _.cloneDeep(value[1]);
			var enumValues = value[2];
			var existingValue = _.get(config, path);
			var isExistingValueValid = validator(existingValue);
			var hasEnum = !_.isUndefined(enumValues);

			if (hasEnum) {
				return _.includes(enumValues, existingValue) ? existingValue : presetValue;
			}
			if (isExistingValueValid) {
				return existingValue;
			}
			return presetValue;
		};

		_.forEach(defaultConfig, function(value, path) {
			_.set(
				config,
				path,
				getValue(value, path)
			);
		});

		_.set(monster, 'config', config);
	}

	/**
	 * Validates `code` against ISO-3166 alpha-2 codes
	 * @private
	 * @param  {String}  code
	 * @return {Boolean}      Whether or not `code` is a valid country code
	 */
	function isCountryCode(code) {
		return libphonenumber.isSupportedCountry(code);
	}

	/**
	 * Validates `code` against ISO 4217 codes
	 * @private
	 * @param  {String}  code
	 * @return {Boolean}      Whether or not `code` is a valid currency code.
	 */
	function isCurrencyCode(code) {
		try {
			Intl.NumberFormat(defaultLanguage, {
				style: 'currency',
				currency: code
			});
			return true;
		} catch (e) {
			return false;
		}
	}

	/**
	 * Returns whether the running build is for a development environment.
	 * @return {Boolean} Whether the running build is for a development environment.
	 */
	function isDev() {
		return !_
			.chain(monster)
			.get('config.developerFlags.build.type')
			.isEqual('production')
			.value();
	}
	monster.isDev = isDev;

	function isArrayOfHttpUrls(input) {
		var isHttpUrl = function(string) {
			var url;
			try {
				url = new URL(string);
			} catch (error) {
				return false;
			}
			return /^(?:http)s?:/.test(url.protocol);
		};

		return _
			.chain([input])
			.flatten()
			.every(isHttpUrl)
			.value();
	}

	function normalizeUrlPathEnding(url) {
		if (!_.isString(url)) {
			return;
		}
		var isPathToFile = _
			.chain(url)
			.split('/')
			.last()
			.includes('.')
			.value();

		if (isPathToFile) {
			return url;
		}
		return _.endsWith(url, '/') ? url : url + '/';
	}
	monster.normalizeUrlPathEnding = normalizeUrlPathEnding;

	/**
	 * @param  {String} file String representation of VERSION file.
	 * @return {Object|Undefined}
	 */
	function parseVersionFile(file) {
		if (!_.isString(file)) {
			return;
		}
		var values = _
			.chain(file)
			.split(/\n/gm)
			.map(_.trim)
			.reject(_.isEmpty)
			.value();

		return _
			.chain([
				'version',
				'tag',
				'hash',
				'date',
				'source'
			])
			.zip(values)
			.keyBy(_.head)
			.mapValues(_.last)
			.value();
	}
	monster.parseVersionFile = parseVersionFile;

	/**
	 * Set the language on application startup.
	 *
	 * If the `monster-auth` cookie exists, the language defined in it will take precedence.
	 * When no cookie, the language will default to the UI's default language set by initConfig().
	 */
	function setDefaultLanguage() {
		var language = _.get(monster.cookies.getJson('monster-auth'), 'language');

		if (_.isUndefined(language)) {
			return;
		}

		_.set(monster.config.whitelabel, 'language', language);
	}

	monster.defaultLanguage = defaultLanguage;
	monster.initConfig = initConfig;
	monster.setDefaultLanguage = setDefaultLanguage;
	monster.supportedLanguages = supportedLanguages;

	// We added this so Google Maps could execute a callback in the global namespace
	// See example in Cluster Manager
	window.monster = monster;
	window.Handlebars = handlebars;

	return monster;
});
