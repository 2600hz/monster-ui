(function ( $ ) {
	var baseMethods = {
		auth: {
			userAuth: function(settings) {
				authFunction(settings, this.parent.defaultSettings, 'user_auth');
			},
			sharedAuth: function(settings) {
				authFunction(settings, this.parent.defaultSettings, 'shared_auth');
			},
			pinAuth: function(settings) {
				authFunction(settings, this.parent.defaultSettings, 'pin_auth');
			}
		}
	},
	methodsGenerator = {
		account: {
			'get': { verb: 'GET', url: 'accounts/{accountId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}' },
			'update': { verb: 'POST', url: 'accounts/{accountId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}' },
			'listDescendants': { verb: 'GET', url: 'accounts/{accountId}/descendants' },
			'listChildren': { verb: 'GET', url: 'accounts/{accountId}/children' },
			'listParents': { verb: 'GET', url: 'accounts/{accountId}/tree' },
			'searchByName': { verb: 'GET', url: 'search?t=account&q=name&v={accountName}'}
		},
		appsStore: {
			'get': { verb: 'GET', 'url': 'accounts/{accountId}/apps_store/{appId}' },
			'list': { verb: 'GET', 'url': 'accounts/{accountId}/apps_store' }
		},
		auth: {
			'recovery': { verb: 'PUT', url: 'user_auth/recovery' }
		},
		directory: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/directories/{directoryId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/directories' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/directories/{directoryId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/directories/{directoryId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/directories' }
		},
		channel: {
			'list': { verb: 'GET', url: 'accounts/{accountId}/channels' }
		},
		conference: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/conferences/{conferenceId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/conferences' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/conferences/{conferenceId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/conferences/{conferenceId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/conferences' },
			'getPins': { verb: 'GET', url: 'accounts/{accountId}/conferences/pins' },
			'view': { verb: 'GET', url: 'accounts/{accountId}/conferences/{conferenceId}/status' },
			'action': { verb: 'POST', url: 'accounts/{accountId}/conferences/{conferenceId}/{action}' },

			'getServer': { verb: 'GET', url: 'accounts/{accountId}/conferences_servers/{serverId}' },
			'createServer': { verb: 'PUT', url: 'accounts/{accountId}/conferences_servers' },
			'updateServer': { verb: 'POST', url: 'accounts/{accountId}/conferences_servers/{serverId}' },
			'deleteServer': { verb: 'DELETE', url: 'accounts/{accountId}/conferences_servers/{serverId}' },
			'listServers': { verb: 'GET', url: 'accounts/{accountId}/conferences_servers' },

			'addParticipant': { verb: 'POST', url: 'accounts/{accountId}/conferences/{conferenceId}/add_participant' },
			'muteParticipant': { verb: 'POST', url: 'accounts/{accountId}/conferences/{conferenceId}/mute/{participantId}' },
			'unmuteParticipant': { verb: 'POST', url: 'accounts/{accountId}/conferences/{conferenceId}/unmute/{participantId}' },
			'deafParticipant': { verb: 'POST', url: 'accounts/{accountId}/conferences/{conferenceId}/deaf/{participantId}' },
			'undeafParticipant': { verb: 'POST', url: 'accounts/{accountId}/conferences/{conferenceId}/undeaf/{participantId}' },
			'kickParticipant': { verb: 'POST', url: 'accounts/{accountId}/conferences/{conferenceId}/kick/{participantId}' },

			'createNotification': { verb: 'PUT', url: 'accounts/{accountId}/notify/conference_{notificationType}', type: 'text/html', dataType: 'text/html' },
			'getNotification': { verb: 'GET', url: 'accounts/{accountId}/notify/conference_{notificationType}/{contentType}', type: 'text/html', dataType: 'text/html' },
			'updateNotification': { verb: 'POST', url: 'accounts/{accountId}/notify/conference_{notificationType}', type: 'text/html', dataType: 'text/html' }
		},
		resourceTemplates: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/resource_templates/{resourceId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/resource_templates' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/resource_templates/{resourceId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/resource_templates/{resourceId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/resource_templates' }
		},
		localResources: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/resources/{resourceId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/resources' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/resources/{resourceId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/resources/{resourceId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/resources' },
			'updateCollection': { verb: 'POST', url: 'accounts/{accountId}/resources/collection' },
			'listJobs': { verb: 'GET', url: 'accounts/{accountId}/resources/jobs' },
			'getJob': { verb: 'GET', url: 'accounts/{accountId}/resources/jobs/{jobId}' },
			'createJob':  { verb: 'PUT', url: 'accounts/{accountId}/resources/jobs' }
		},
		globalResources: {
			'get': { verb: 'GET', url: 'resources/{resourceId}' },
			'create': { verb: 'PUT', url: 'resources' },
			'update': { verb: 'POST', url: 'resources/{resourceId}' },
			'delete': { verb: 'DELETE', url: 'resources/{resourceId}' },
			'list': { verb: 'GET', url: 'resources' },
			'updateCollection': { verb: 'POST', url: 'resources/collection' },
			'listJobs': { verb: 'GET', url: 'resources/jobs' },
			'getJob': { verb: 'GET', url: 'resources/jobs/{jobId}' },
			'createJob':  { verb: 'PUT', url: 'resources/jobs' }
		},
		ips: {
			'add': { verb: 'POST', url: 'accounts/{accountId}/ips/{ip}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/ips/{ip}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/ips?zone={zone}&quantity={quantity}' },
			'listAssigned': { verb: 'GET', url: 'accounts/{accountId}/ips/assigned' },
			'listZones': { verb: 'GET', url: 'accounts/{accountId}/ips/zones' }
		},
		inspector: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/call_inspector/{callId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/call_inspector' }
		},
		user: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/users/{userId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/users' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/users/{userId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/users/{userId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/users' },
			'quickcall': { verb: 'GET', url: 'accounts/{accountId}/users/{userId}/quickcall/{number}'},
			'hotdesks': { verb: 'GET', url: 'accounts/{accountId}/users/{userId}/hotdesks' }
		},
		group: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/groups/{groupId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/groups' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/groups/{groupId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/groups/{groupId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/groups' }
		},
		callflow: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/callflows/{callflowId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/callflows' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/callflows/{callflowId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/callflows/{callflowId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/callflows' },
			'searchByNameAndNumber': { verb: 'GET', url: 'accounts/{accountId}/search?t=callflow&q=name_and_number&v={value}'},
			'searchByNumber': { verb: 'GET', url: 'accounts/{accountId}/search?t=callflow&q=number&v={value}'}
		},
		clickToCall: {
			'create': { verb: 'PUT', url: 'accounts/{accountId}/clicktocall' },
			'get': { verb: 'GET',  url: 'accounts/{accountId}/clicktocall/{clickToCallId}' },
			'update': { verb: 'GET', url: 'accounts/{accountId}/clicktocall/{clickToCallId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/clicktocall/{clickToCallId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/clicktocall' },
			'connect': { verb: 'POST', url: 'accounts/{accountId}/clicktocall/{clickToCallId}/connect' }
		},
		pivot: {
			'listDebug': { verb: 'GET', url: 'accounts/{accountId}/pivot/debug' },
			'getDebug': { verb: 'GET', url: 'accounts/{accountId}/pivot/debug/{callId}' }
		},
		cdrs: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/cdrs/{cdrId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/cdrs' }
		},
		numbers: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/phone_numbers/{phoneNumber}' },
			'activate': { verb: 'PUT', url: 'accounts/{accountId}/phone_numbers/{phoneNumber}/activate' },
			'activateBlock': { verb: 'PUT', url: 'accounts/{accountId}/phone_numbers/collection/activate' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/phone_numbers/{phoneNumber}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/phone_numbers/{phoneNumber}' },
			'deleteBlock': { verb: 'DELETE', url: 'accounts/{accountId}/phone_numbers/collection' },
			'identify': { verb: 'GET', url: 'accounts/{accountId}/phone_numbers/{phoneNumber}/identify' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/phone_numbers' },
			'listClassifiers': { verb: 'GET', url: 'accounts/{accountId}/phone_numbers/classifiers' },
			'matchClassifier': { verb: 'GET', url: 'accounts/{accountId}/phone_numbers/classifiers/{phoneNumber}' },
			'search': { verb: 'GET', url: 'phone_numbers?prefix={pattern}&quantity={limit}&offset={offset}' },
			'searchBlocks': { verb: 'GET', url: 'phone_numbers?prefix={pattern}&quantity={size}&offset={offset}&blocks={limit}' },
			'searchCity': { verb: 'GET', url: 'phone_numbers/prefix?city={city}' },
			'sync': { verb: 'POST', url: 'accounts/{accountId}/phone_numbers/fix' }
		},
		device: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/devices/{deviceId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/devices' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/devices/{deviceId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/devices/{deviceId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/devices' },
			'getStatus': { verb: 'GET', url: 'accounts/{accountId}/devices/status' },
			'quickcall': { verb: 'GET', url: 'accounts/{accountId}/users/{deviceId}/quickcall/{number}'}
		},
		media: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/media/{mediaId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/media' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/media/{mediaId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/media/{mediaId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/media' },
			'upload': { verb: 'POST', url: 'accounts/{accountId}/media/{mediaId}/raw', type: 'application/x-base64' }
		},
		menu: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/menus/{menuId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/menus' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/menus/{menuId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/menus/{menuId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/menus' }
		},
		voicemail: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/vmboxes/{voicemailId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/vmboxes' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/vmboxes/{voicemailId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/vmboxes/{voicemailId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/vmboxes' }
		},
		faxbox: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/faxboxes/{faxboxId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/faxboxes/' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/faxboxes/{faxboxId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/faxboxes/{faxboxId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/faxboxes/' }
		},
		connectivity: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/connectivity/{connectivityId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/connectivity' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/connectivity/{connectivityId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/connectivity' }
		},
		temporalRule: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/temporal_rules/{ruleId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/temporal_rules' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/temporal_rules/{ruleId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/temporal_rules/{ruleId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/temporal_rules' }
		},
		servicePlan: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/service_plans/{planId}' },
			'add': { verb: 'POST', url: 'accounts/{accountId}/service_plans/{planId}' },
			'remove': { verb: 'DELETE', url: 'accounts/{accountId}/service_plans/{planId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/service_plans' },
			'listCurrent': { verb: 'GET', url: 'accounts/{accountId}/service_plans/current' },
			'getCsv': { verb: 'GET', url: 'accounts/{accountId}/service_plans/current?depth=4&identifier=items&accept=csv' },
			'listAvailable': { verb: 'GET', url: 'accounts/{accountId}/service_plans/available' },
			'getAvailable': { verb: 'GET', url: 'accounts/{accountId}/service_plans/available/{planId}' },
			'reconciliate': { verb: 'POST', url: 'accounts/{accountId}/service_plans/reconciliation' },
			'synchronize': { verb: 'POST', url: 'accounts/{accountId}/service_plans/synchronization' }
		},
		limits: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/limits' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/limits' }
		},
		balance: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/transactions/current_balance' },
			'getMonthly': { verb: 'GET', url: 'accounts/{accountId}/transactions/monthly_recurring?created_from={from}&created_to={to}' },
			'getCharges': { verb: 'GET', url: 'accounts/{accountId}/transactions?created_from={from}&created_to={to}&reason={reason}' },
			'getSubscriptions': { verb: 'GET', url: 'accounts/{accountId}/transactions/subscriptions' },
			'filtered': { verb: 'GET', url: 'accounts/{accountId}/transactions?created_from={from}&created_to={to}&reason={reason}' },
			'add': { verb: 'PUT', url: 'accounts/{accountId}/braintree/credits' }
		},
		billing: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/braintree/customer' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/braintree/customer' }
		},
		port: {
			'get': { verb: 'GET', url: 'accounts/{accountId}/port_requests/{portRequestId}' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/port_requests' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/port_requests/{portRequestId}' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/port_requests/{portRequestId}' },
			'list': { verb: 'GET', url: 'accounts/{accountId}/port_requests' },
			'listDescendants': { verb: 'GET', url: 'accounts/{accountId}/port_requests/descendants' },
			'listAttachments': { verb: 'GET', url: 'accounts/{accountId}/port_requests/{portRequestId}/attachments' },
			'getAttachment': { verb: 'GET', url: 'accounts/{accountId}/port_requests/{portRequestId}/attachments/{documentName}', type: 'application/pdf' },
			'createAttachment': { verb: 'PUT', url: 'accounts/{accountId}/port_requests/{portRequestId}/attachments?filename={documentName}', type: 'application/pdf' },
			'updateAttachment': { verb: 'POST', url: 'accounts/{accountId}/port_requests/{portRequestId}/attachments/{documentName}', type: 'application/pdf' },
			'deleteAttachment': { verb: 'DELETE', url: 'accounts/{accountId}/port_requests/{portRequestId}/attachments/{documentName}', type: 'application/pdf' },
			'changeState': { verb: 'POST', url: 'accounts/{accountId}/port_requests/{portRequestId}/{state}' }
		},
		registrations: {
			'list': { verb: 'GET', url: 'accounts/{accountId}/registrations' }
		},
		webhooks: {
			'get': { 'verb': 'GET', 'url': 'accounts/{accountId}/webhooks/{webhookId}' },
			'create': { 'verb': 'PUT', 'url': 'accounts/{accountId}/webhooks' },
			'update': { 'verb': 'POST', 'url': 'accounts/{accountId}/webhooks/{webhookId}' },
			'delete': { 'verb': 'DELETE', 'url': 'accounts/{accountId}/webhooks/{webhookId}' },
			'list': { 'verb': 'GET', 'url': 'accounts/{accountId}/webhooks' },
			'accountSummary': { 'verb': 'GET', 'url': 'accounts/{accountId}/webhooks/summary' },
			'summary': { 'verb': 'GET', 'url': 'accounts/{accountId}/webhooks/{webhookId}/summary' }
		},
		whitelabel: {
			'getByDomain': { verb: 'GET', url: 'whitelabel/{domain}' },
			'getLogoByDomain': { verb: 'GET', url: 'whitelabel/{domain}/logo' },
			'getWelcomeByDomain': { verb: 'GET', url: 'whitelabel/{domain}/welcome', type: 'text/html', dataType: 'html' },
			'get': { verb: 'GET', url: 'accounts/{accountId}/whitelabel' },
			'getLogo': { verb: 'GET', url: 'accounts/{accountId}/whitelabel/logo' },
			'getWelcome': { verb: 'GET', url: 'accounts/{accountId}/whitelabel/welcome', type: 'text/html', dataType: 'html' },
			'update': { verb: 'POST', url: 'accounts/{accountId}/whitelabel' },
			'updateLogo': { verb: 'POST', url: 'accounts/{accountId}/whitelabel/logo', type: 'application/x-base64' },
			'updateWelcome': { verb: 'POST', url: 'accounts/{accountId}/whitelabel/welcome', type: 'text/html', dataType: 'html' },
			'create': { verb: 'PUT', url: 'accounts/{accountId}/whitelabel' },
			'delete': { verb: 'DELETE', url: 'accounts/{accountId}/whitelabel' },
			'listNotifications': { verb: 'GET', url: 'accounts/{accountId}/notifications' },
			'getNotification': { verb: 'GET', url: 'accounts/{accountId}/notifications/{notificationId}' },
			'getNotificationText': { verb: 'GET', url: 'accounts/{accountId}/notifications/{notificationId}', type: 'text/plain', dataType: 'text' },
			'getNotificationHtml': { verb: 'GET', url: 'accounts/{accountId}/notifications/{notificationId}', type: 'text/html', dataType: 'html' },
			'updateNotification': { verb: 'POST', url: 'accounts/{accountId}/notifications/{notificationId}' },
			'updateNotificationText': { verb: 'POST', url: 'accounts/{accountId}/notifications/{notificationId}', type: 'text/plain', dataType: 'text' },
			'updateNotificationHtml': { verb: 'POST', url: 'accounts/{accountId}/notifications/{notificationId}', type: 'text/html', dataType: 'html' },
			'previewNotification': { verb: 'POST', url: 'accounts/{accountId}/notifications/{notificationId}/preview' },
			'deleteNotification': { verb: 'DELETE', url: 'accounts/{accountId}/notifications/{notificationId}' }
		}
	},
	authTokens = {};

	/* Available settings:
	 * - apiRoot: [REQUIRED]
	 * - onRequestStart: [OPTIONAL]
	 * - onRequestEnd: [OPTIONAL]
	 * - onRequestSuccess: [OPTIONAL]
	 * - onRequestError: [OPTIONAL]
	 * - uiMetadata: [OPTIONAL]
	 * - authToken: [OPTIONAL]
	**/
	$.getKazooSdk = function(settings) {
		if(settings && typeof settings === 'string') { settings = { apiRoot: settings }; }
		if(settings && settings.apiRoot) {
			var sdkMethods = $.extend({}, baseMethods);
			$.each(sdkMethods, function() {
				if(typeof this === 'object') { this.parent = sdkMethods; }
			});
			sdkMethods.defaultSettings = settings;
			sdkMethods.request = request;

			if('authToken' in settings && settings.authToken.length > 0) {
				authTokens[settings.apiRoot] = settings.authToken;
			}

			$.each(methodsGenerator, function(group, methods) {
				sdkMethods[group] = sdkMethods[group] || {};
				$.each(methods, function(methodName, methodInfo) {
					sdkMethods[group][methodName] = function(methodSettings) {
						var self = this,
							methodSettings = methodSettings || {},
							requestSettings = {
								url: (methodSettings.apiRoot || settings.apiRoot) + methodInfo.url,
								verb: methodInfo.verb,
								data: {}
							},
							ids = $.map(methodInfo.url.match(/\{([^\}]+)\}/g) || [], function(v) { return v.replace(/\{|\}/g, ''); });

						if('filters' in methodSettings) {
							$.each(methodSettings.filters, function(filterKey, filterValue) {
								var valueArray = [].concat(filterValue);
								$.each(valueArray, function(key, value) {
									requestSettings.url += (requestSettings.url.indexOf('?') > 0 ? '&' : '?') + filterKey + '=' + value;
								});
							});
						}

						if('type' in methodInfo) { requestSettings.type = methodInfo.type; }
						if('dataType' in methodInfo) { requestSettings.dataType = methodInfo.dataType; }
						if(methodInfo.verb.toLowerCase() === 'delete') {
							requestSettings.data.data = {};
						} else if(methodInfo.verb.toLowerCase() === 'post' || methodInfo.verb.toLowerCase() === 'put') {
							requestSettings.data.data = methodSettings.data;
							delete methodSettings.data;
						}

						$.each(ids, function(k, v) {
							if(methodInfo.verb.toLowerCase() === 'post' && k === ids.length-1 && !(v in methodSettings)) {
								requestSettings.data[v] = requestSettings.data.data.id;
							} else {
								requestSettings.data[v] = methodSettings[v];
								delete methodSettings[v];
							}
						});

						//These settings can not be overridden
						delete methodSettings.onRequestStart;
						delete methodSettings.onRequestEnd;
						delete methodSettings.onRequestSuccess;
						delete methodSettings.onRequestError;

						request($.extend({}, settings, methodSettings, requestSettings));
					}
				})
			});

			return sdkMethods;
		} else {
			throw('You must provide a valid apiRoot.');
		}
	};

	function authFunction(settings, defaultSettings, url) {
		var apiRoot = settings.apiRoot || defaultSettings.apiRoot;
		request($.extend({}, defaultSettings, {
			url: apiRoot + url,
			verb: 'PUT',
			data: {
				data: settings.data
			},
			success: function(data, status, jqXHR) {
				authTokens[apiRoot] = data.auth_token;
				settings.success && settings.success(data, status, jqXHR);
			},
			error: settings.error
		}));
	}

	function request(options) {
		var settings = {
				cache: options.cache || false,
				url: options.url,
				dataType: options.dataType || 'json',
				type: options.verb || 'get',
				contentType: options.type || 'application/json',
				processData: false,
				beforeSend: function(jqXHR, settings) {
					options.onRequestStart && options.onRequestStart(jqXHR, options);

					jqXHR.setRequestHeader('X-Auth-Token', options.authToken || authTokens[options.apiRoot]);
					$.each(options.headers || [], function(key, val) {
						jqXHR.setRequestHeader(key, val);
					});
				}
			},
			mappedKeys = [],
			rurlData = /\{([^\}]+)\}/g,
			data = $.extend({}, options.data);

		settings.error = function requestError (error, status) {
			options.onRequestEnd && options.onRequestEnd(error, options);

			var parsedError = error;

			if('responseText' in error && error.responseText && error.getResponseHeader('content-type') === 'application/json') {
				parsedError = $.parseJSON(error.responseText);
			}

			options.onRequestError && options.onRequestError(error, options);

			options.error && options.error(parsedError, error, options.onRequestError);
		};

		settings.success = function requestSuccess(responseData, status, jqXHR) {
			options.onRequestEnd && options.onRequestEnd(responseData, options);

			options.onRequestSuccess && options.onRequestSuccess(responseData, options);

			options.success && options.success(responseData, options.onRequestSuccess);
		};

		settings.url = settings.url.replace(rurlData, function (m, key) {
			if (key in data) {
				mappedKeys.push(key);
				return data[key];
			}
		});

		// We delete the keys later so duplicates are still replaced
		$.each(mappedKeys, function(index, name) {
			delete data[name];
		});

		if(settings.type.toLowerCase() !== 'get'){
			var postData = data.data;

			if(settings.contentType === 'application/json') {
				var payload = {
					data: data.data || {}
				};

				if('uiMetadata' in options) {
					payload.data.ui_metadata = options.uiMetadata;
				}

				if(options.acceptCharges === true) {
					payload.accept_charges = true;
				}

				postData = JSON.stringify(payload);
			}

			settings = $.extend(settings, {
				data: postData
			});
		}

		return $.ajax(settings);
	}

}( jQuery ));
