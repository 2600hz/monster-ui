(function($) {
	var baseMethods = {
			auth: {
				pinAuth: function(settings) {
					authFunction(settings, this.parent.defaultSettings, 'pin_auth');
				},
				sharedAuth: function(settings) {
					authFunction(settings, this.parent.defaultSettings, 'shared_auth');
				},
				userAuth: function(settings) {
					authFunction(settings, this.parent.defaultSettings, 'user_auth');
				},
				callback: function(settings) {
					authFunction(settings, this.parent.defaultSettings, 'auth/callback');
				}
			}
		},
		methodsGenerator = {
			system: {
				'dialplans': { verb: 'GET', url: 'accounts/{accountId}/dialplans' },
				'about': { verb: 'GET', url: 'about' }
			},
			accessLists: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/access_lists' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/access_lists' }
			},
			account: {
				'get': { verb: 'GET', url: 'accounts/{accountId}' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}' },
				'update': { verb: 'POST', url: 'accounts/{accountId}' },
				'patch': { verb: 'PATCH', url: 'accounts/{accountId}' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}' },
				'listDescendants': { verb: 'GET', url: 'accounts/{accountId}/descendants' },
				'listChildren': { verb: 'GET', url: 'accounts/{accountId}/children?ascending=true' },
				'listParents': { verb: 'GET', url: 'accounts/{accountId}/tree' },
				'searchByName': { verb: 'GET', url: 'search?t=account&q=name&v={accountName}' },
				'searchAll': { verb: 'GET', url: 'search/multi?t=account&by_name={searchValue}&by_realm={searchValue}&by_id={searchValue}' },
				'promote': { verb: 'PUT', url: 'accounts/{accountId}/reseller' },
				'demote': { verb: 'DELETE', url: 'accounts/{accountId}/reseller' }
			},
			alert: {
				'list': { verb: 'GET', url: 'accounts/{accountId}/alerts' }
			},
			apiKey: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/api_key' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/api_key' }
			},
			appsStore: {
				'get': { verb: 'GET', 'url': 'accounts/{accountId}/apps_store/{appId}' },
				'list': { verb: 'GET', 'url': 'accounts/{accountId}/apps_store' },
				'getIcon': { verb: 'GET', 'url': 'accounts/{accountId}/apps_store/{appId}/icon', dataType: 'text' },
				'update': { verb: 'POST', 'url': 'accounts/{accountId}/apps_store/{appId}' },
				'add': { verb: 'PUT', 'url': 'accounts/{accountId}/apps_store/{appId}' },
				'delete': { verb: 'DELETE', 'url': 'accounts/{accountId}/apps_store/{appId}' },
				'getBlacklist': { verb: 'GET', 'url': 'accounts/{accountId}/apps_store/blacklist' },
				'updateBlacklist': { verb: 'POST', 'url': 'accounts/{accountId}/apps_store/blacklist' },
				'updateIcon': { verb: 'POST', 'url': 'accounts/{accountId}/apps_store/{appId}/override/icon' },
				'getOverride': { verb: 'GET', 'url': 'accounts/{accountId}/apps_store/{appId}/override' },
				'createOverride': { verb: 'PUT', 'url': 'accounts/{accountId}/apps_store/{appId}/override' },
				'updateOverride': { verb: 'POST', 'url': 'accounts/{accountId}/apps_store/{appId}/override' },
				'deleteOverride': { verb: 'DELETE', 'url': 'accounts/{accountId}/apps_store/{appId}/override' }
			},
			auth: {
				'get': { verb: 'GET', url: 'auth/tokeninfo?token={token}', removeHeaders: ['X-Auth-Token'] },
				'postTokenInfo': { verb: 'POST', url: 'auth/tokeninfo', removeHeaders: ['X-Auth-Token'] },
				'recovery': { verb: 'PUT', url: 'user_auth/recovery' },
				'recoveryResetId': { verb: 'POST', url: 'user_auth/recovery' },
				'link': { verb: 'PUT', url: 'auth/links/{auth_id}' },
				'unlink': { verb: 'DELETE', url: 'auth/links/{auth_id}' },
				'getLink': { verb: 'GET', url: 'accounts/{accountId}/auth/links/{auth_id}' },
				'impersonate': { verb: 'PUT', url: 'accounts/{accountId}/users/{userId}/user_auth' }
			},
			billing: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/braintree/customer' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/braintree/customer' },
				'deleteCard': { verb: 'DELETE', url: 'accounts/{accountId}/braintree/cards/{cardId}' },
				'getToken': { verb: 'GET', url: 'accounts/{accountId}/braintree/client_token' }
			},
			blacklist: {
				'list': { verb: 'GET', url: 'accounts/{accountId}/blacklists' },
				'get': { verb: 'GET', url: 'accounts/{accountId}/blacklists/{blacklistId}' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/blacklists' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/blacklists/{blacklistId}' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/blacklists/{blacklistId}' }
			},
			callflow: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/callflows/{callflowId}' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/callflows' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/callflows/{callflowId}' },
				'patch': { verb: 'PATCH', url: 'accounts/{accountId}/callflows/{callflowId}' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/callflows/{callflowId}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/callflows' },
				'searchByNameAndNumber': { verb: 'GET', url: 'accounts/{accountId}/search?t=callflow&q=name_and_number&v={value}' },
				'searchByNumber': { verb: 'GET', url: 'accounts/{accountId}/search?t=callflow&q=number&v={value}' }
			},
			cdrs: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/cdrs/{cdrId}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/cdrs' },
				'listByInteractionUser': { verb: 'GET', url: 'accounts/{accountId}/users/{userId}/cdrs/interaction' },
				'listByUser': { verb: 'GET', url: 'accounts/{accountId}/users/{userId}/cdrs' },
				'listByInteraction': { verb: 'GET', url: 'accounts/{accountId}/cdrs/interaction' },
				'listLegs': { verb: 'GET', url: 'accounts/{accountId}/cdrs/legs/{callId}' }
			},
			cdrPushOnebill: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/cdr_push_onebill' },
				'post': { verb: 'POST', url: 'accounts/{accountId}/cdr_push_onebill' }
			},
			channel: {
				'list': { verb: 'GET', url: 'accounts/{accountId}/channels' },
				'action': { verb: 'PUT', url: 'accounts/{accountId}/channels/{callId}', removeMetadataAPI: true }
			},
			clickToCall: {
				'create': { verb: 'PUT', url: 'accounts/{accountId}/clicktocall' },
				'get': { verb: 'GET', url: 'accounts/{accountId}/clicktocall/{clickToCallId}' },
				'update': { verb: 'GET', url: 'accounts/{accountId}/clicktocall/{clickToCallId}' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/clicktocall/{clickToCallId}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/clicktocall' },
				'connect': { verb: 'POST', url: 'accounts/{accountId}/clicktocall/{clickToCallId}/connect' }
			},
			conference: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/conferences/{conferenceId}' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/conferences' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/conferences/{conferenceId}' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/conferences/{conferenceId}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/conferences' },
				'action': { verb: 'PUT', url: 'accounts/{accountId}/conferences/{conferenceId}' },
				'participantsList': { verb: 'GET', url: 'accounts/{accountId}/conferences/{conferenceId}/participants' },
				'participantsBulkAction': { verb: 'PUT', url: 'accounts/{accountId}/conferences/{conferenceId}/participants' },
				'participantsAction': { verb: 'PUT', url: 'accounts/{accountId}/conferences/{conferenceId}/participants/{participantId}' }
			},
			connectivity: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/connectivity/{connectivityId}' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/connectivity' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/connectivity/{connectivityId}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/connectivity' }
			},
			contactList: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/contact_list' }
			},
			crm: {
				'getIntegration': { verb: 'GET', url: 'accounts/{accountId}/crm_integration' },
				'createIntegration': { verb: 'PUT', url: 'accounts/{accountId}/crm_integration' },
				'getTrigger': { verb: 'GET', url: 'accounts/{accountId}/crm_integration/triggers/{triggerId}' },
				'listTriggers': { verb: 'GET', url: 'accounts/{accountId}/crm_integration/triggers' },
				'createTrigger': { verb: 'PUT', url: 'accounts/{accountId}/crm_integration/triggers' },
				'updateTrigger': { verb: 'POST', url: 'accounts/{accountId}/crm_integration/triggers/{triggerId}' },
				'patchTrigger': { verb: 'PATCH', url: 'accounts/{accountId}/crm_integration/triggers/{triggerId}' },
				'deleteTrigger': { verb: 'DELETE', url: 'accounts/{accountId}/crm_integration/triggers/{triggerId}' },
				'listMappings': { verb: 'GET', url: 'accounts/{accountId}/crm_integration/mappings' },
				'getMapping': { verb: 'GET', url: 'accounts/{accountId}/crm_integration/mappings/{mappingId}' },
				'createMapping': { verb: 'PUT', url: 'accounts/{accountId}/crm_integration/mappings' },
				'updateMapping': { verb: 'POST', url: 'accounts/{accountId}/crm_integration/mappings/{mappingId}' },
				'patchMapping': { verb: 'PATCH', url: 'accounts/{accountId}/crm_integration/mappings/{mappingId}' },
				'deleteMapping': { verb: 'DELETE', url: 'accounts/{accountId}/crm_integration/mappings/{mappingId}' },
				'getCallLog': { verb: 'GET', url: 'accounts/{accountId}/crm_integration/call_logs' }
			},
			dashboards: {
				'getEnsureStarted': { verb: 'GET', url: 'accounts/{accountId}/dashboards/ensure_started' },
				'getQueueDetails': { verb: 'POST', url: 'accounts/{accountId}/dashboards/queue_details/{queueId}' },
				'getQueueOverview': { verb: 'POST', url: 'accounts/{accountId}/dashboards/queue_overview' },
				'getRecipientOverview': { verb: 'GET', url: 'accounts/{accountId}/dashboards/recipient_overview' },
				'getRecipientPerformance': { verb: 'GET', url: 'accounts/{accountId}/dashboards/recipient_performance' },
				'getActivityLog': { verb: 'POST', url: 'accounts/{accountId}/dashboards/activity_log' }
			},
			desktop: {
				'getWindows': { verb: 'GET', url: 'accounts/{accountId}/desktop/windows' },
				'getMac': { verb: 'GET', url: 'accounts/{accountId}/desktop/mac' },
				'getLinux': { verb: 'GET', url: 'accounts/{accountId}/desktop/linux' }
			},
			device: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/devices/{deviceId}' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/devices' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/devices/{deviceId}' },
				'patch': { verb: 'PATCH', url: 'accounts/{accountId}/devices/{deviceId}' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/devices/{deviceId}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/devices' },
				'getStatus': { verb: 'GET', url: 'accounts/{accountId}/devices/status' },
				'quickcall': { verb: 'GET', url: 'accounts/{accountId}/devices/{deviceId}/quickcall/{number}' },
				'restart': { verb: 'POST', url: 'accounts/{accountId}/devices/{deviceId}/sync' },
				'updatePresence': { verb: 'POST', url: 'accounts/{accountId}/device/{deviceId}/presence' }
			},
			directory: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/directories/{directoryId}' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/directories' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/directories/{directoryId}' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/directories/{directoryId}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/directories' }
			},
			externalNumbers: {
				get: { verb: 'GET', url: 'accounts/{accountId}/external_numbers/{numberId}' },
				create: { verb: 'PUT', url: 'accounts/{accountId}/external_numbers' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/external_numbers/{numberId}' },
				list: { verb: 'GET', url: 'accounts/{accountId}/external_numbers' },
				verify: { verb: 'PUT', url: 'accounts/{accountId}/external_numbers/{numberId}/verify' },
				submitPin: { verb: 'POST', url: 'accounts/{accountId}/external_numbers/{numberId}/verify' }
			},
			faxbox: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/faxboxes/{faxboxId}' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/faxboxes' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/faxboxes/{faxboxId}' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/faxboxes/{faxboxId}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/faxboxes' }
			},
			smtpLogs: {
				'list': { verb: 'GET', url: 'accounts/{accountId}/notifications/smtplog' },
				'get': { verb: 'GET', url: 'accounts/{accountId}/notifications/smtplog/{logId}' }
			},
			faxes: {
				'send': { verb: 'PUT', url: 'accounts/{accountId}/faxes' },
				'sendAsMultipart': { verb: 'PUT', url: 'accounts/{accountId}/faxes', type: 'multipart/mixed' },

				'getLogs': { verb: 'GET', url: 'accounts/{accountId}/faxes/smtplog' },
				'getLogDetails': { verb: 'GET', url: 'accounts/{accountId}/faxes/smtplog/{logId}' },

				'listInbound': { verb: 'GET', url: 'accounts/{accountId}/faxes/inbox' },
				'getDetailsInbound': { verb: 'GET', url: 'accounts/{accountId}/faxes/inbox/{faxId}' },
				'getAttachmentInbound': { verb: 'GET', url: 'accounts/{accountId}/faxes/inbox/{faxId}/attachment', dataType: 'text' },
				'updateInbound': { verb: 'PUT', url: 'accounts/{accountId}/faxes/inbox/{faxId}' },
				'deleteInbound': { verb: 'DELETE', url: 'accounts/{accountId}/faxes/inbox/{faxId}' },

				'listOutbound': { verb: 'GET', url: 'accounts/{accountId}/faxes/outbox' },
				'getDetailsOutbound': { verb: 'GET', url: 'accounts/{accountId}/faxes/outbox/{faxId}' },
				'getAttachmentOutbound': { verb: 'GET', url: 'accounts/{accountId}/faxes/outbox/{faxId}/attachment', dataType: 'text' },
				'updateOutbound': { verb: 'PUT', url: 'accounts/{accountId}/faxes/outbox/{faxId}' },
				'deleteOutbound': { verb: 'DELETE', url: 'accounts/{accountId}/faxes/outbox/{faxId}' }
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
				'createJob': { verb: 'PUT', url: 'resources/jobs' }
			},
			group: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/groups/{groupId}' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/groups' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/groups/{groupId}' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/groups/{groupId}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/groups' }
			},
			inspector: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/call_inspector/{callId}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/call_inspector' }
			},
			ips: {
				'add': { verb: 'POST', url: 'accounts/{accountId}/ips/{ip}' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/ips/{ip}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/ips?zone={zone}&quantity={quantity}' },
				'listAssigned': { verb: 'GET', url: 'accounts/{accountId}/ips/assigned' },
				'listZones': { verb: 'GET', url: 'accounts/{accountId}/ips/zones' }
			},
			ledgers: {
				'list': { verb: 'GET', url: 'accounts/{accountId}/ledgers' },
				'get': { verb: 'GET', url: 'accounts/{accountId}/ledgers/{ledgerId}' },
				'getDetails': { verb: 'GET', url: 'accounts/{accountId}/ledgers/{ledgerId}/{id}' },
				'listAvailable': { verb: 'GET', url: 'accounts/{accountId}/ledgers/available' },
				'total': { verb: 'GET', url: 'accounts/{accountId}/ledgers/total' },
				'credit': { verb: 'PUT', url: 'accounts/{accountId}/ledgers/credit' },
				'debit': { verb: 'PUT', url: 'accounts/{accountId}/ledgers/debit' },
				'summaryPerMonth': { verb: 'GET', url: 'accounts/{accountId}/ledgers/summary/{modbSuffix}' }
			},
			limits: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/limits' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/limits' }
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
				'createJob': { verb: 'PUT', url: 'accounts/{accountId}/resources/jobs' }
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
			metaflow: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/metaflows' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/metaflows' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/metaflows' }
			},
			multifactor: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/multi_factor/{mfaId}' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/multi_factor' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/multi_factor/{mfaId}' },
				'patch': { verb: 'PATCH', url: 'accounts/{accountId}/multi_factor/{mfaId}' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/multi_factor/{mfaId}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/multi_factor' },
				'listAttempts': { verb: 'GET', url: 'accounts/{accountId}/multi_factor/attempts' },
				'getAttempt': { verb: 'GET', url: 'accounts/{accountId}/multi_factor/attempts/{attemptId}' }
			},
			numbers: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/phone_numbers/{phoneNumber}' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/phone_numbers/{phoneNumber}' },
				'createBlock': { verb: 'PUT', url: 'accounts/{accountId}/phone_numbers/collection' },
				'activate': { verb: 'PUT', url: 'accounts/{accountId}/phone_numbers/{phoneNumber}/activate' },
				'activateBlock': { verb: 'PUT', url: 'accounts/{accountId}/phone_numbers/collection/activate' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/phone_numbers/{phoneNumber}' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/phone_numbers/{phoneNumber}' },
				'deleteBlock': { verb: 'DELETE', url: 'accounts/{accountId}/phone_numbers/collection' },
				'identify': { verb: 'GET', url: 'accounts/{accountId}/phone_numbers/{phoneNumber}/identify' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/phone_numbers?filter_state=' + encodeURIComponent('["in_service","port_in"]') },
				'listAll': { verb: 'GET', url: 'accounts/{accountId}/phone_numbers' },
				'listClassifiers': { verb: 'GET', url: 'accounts/{accountId}/phone_numbers/classifiers' },
				'matchClassifier': { verb: 'GET', url: 'accounts/{accountId}/phone_numbers/classifiers/{phoneNumber}' },
				'search': { verb: 'GET', url: 'accounts/{accountId}/phone_numbers?prefix={pattern}&quantity={limit}&offset={offset}' },
				'searchBlocks': { verb: 'GET', url: 'accounts/{accountId}/phone_numbers?prefix={pattern}&quantity={size}&offset={offset}&blocks={limit}' },
				'searchCity': { verb: 'GET', url: 'accounts/{accountId}/phone_numbers/prefix?city={city}' },
				'sync': { verb: 'POST', url: 'accounts/{accountId}/phone_numbers/fix' },
				'syncOne': { verb: 'POST', url: 'accounts/{accountId}/phone_numbers/fix/{number}' },
				'getCarrierInfo': { verb: 'GET', url: 'accounts/{accountId}/phone_numbers/carriers_info' },
				'patch': { verb: 'PATCH', url: 'accounts/{accountId}/phone_numbers/{phoneNumber}' }
			},
			parkedCalls: {
				'list': { verb: 'GET', url: 'accounts/{accountId}/parked_calls' }
			},
			pivot: {
				'listDebug': { verb: 'GET', url: 'accounts/{accountId}/pivot/debug' },
				'getDebug': { verb: 'GET', url: 'accounts/{accountId}/pivot/debug/{callId}' }
			},
			port: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/port_requests/{portRequestId}' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/port_requests' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/port_requests/{portRequestId}' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/port_requests/{portRequestId}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/port_requests' },
				'listByState': { verb: 'GET', url: 'accounts/{accountId}/port_requests/{state}' },
				'listDescendants': { verb: 'GET', url: 'accounts/{accountId}/descendants/port_requests' },
				'listDescendantsByState': { verb: 'GET', url: 'accounts/{accountId}/descendants/port_requests/{state}' },
				'listAttachments': { verb: 'GET', url: 'accounts/{accountId}/port_requests/{portRequestId}/attachments' },
				'getAttachment': { verb: 'GET', url: 'accounts/{accountId}/port_requests/{portRequestId}/attachments/{documentName}', dataType: 'text' },
				'createAttachment': { verb: 'PUT', url: 'accounts/{accountId}/port_requests/{portRequestId}/attachments?filename={documentName}', type: 'application/pdf' },
				'updateAttachment': { verb: 'POST', url: 'accounts/{accountId}/port_requests/{portRequestId}/attachments/{documentName}', type: 'application/pdf' },
				'deleteAttachment': { verb: 'DELETE', url: 'accounts/{accountId}/port_requests/{portRequestId}/attachments/{documentName}' },
				'changeState': { verb: 'PATCH', url: 'accounts/{accountId}/port_requests/{portRequestId}/{state}' },
				'listComments': { verb: 'GET', url: 'accounts/{accountId}/port_requests/{portRequestId}/comments' },
				'getComment': { verb: 'GET', url: 'accounts/{accountId}/port_requests/{portRequestId}/comments/{commentId}' },
				'addComment': { verb: 'PUT', url: 'accounts/{accountId}/port_requests/{portRequestId}/comments' },
				'updateComment': { verb: 'POST', url: 'accounts/{accountId}/port_requests/{portRequestId}/comments/{commentId}' },
				'deleteComment': { verb: 'DELETE', url: 'accounts/{accountId}/port_requests/{portRequestId}/comments/{commentId}' },
				'deleteAllComments': { verb: 'DELETE', url: 'accounts/{accountId}/port_requests/{portRequestId}/comments' },
				'getTimeline': { verb: 'GET', url: 'accounts/{accountId}/port_requests/{portRequestId}/timeline' },
				'listLastSubmitted': { verb: 'GET', url: 'accounts/{accountId}/port_requests/last_submitted' },
				'searchNumber': { verb: 'GET', url: 'accounts/{accountId}/port_requests?by_number={number}' },
				'searchNumberByDescendants': { verb: 'GET', url: 'accounts/{accountId}/descendants/port_requests?by_number={number}' },
				'portabilityLookup': { verb: 'POST', url: 'accounts/{accountId}/port_requests/lnp_lookup' },
				'listPortAuthority': { verb: 'GET', url: 'port_requests' }
			},
			presence: {
				'list': { verb: 'GET', url: 'accounts/{accountId}/presence' },
				'get': { verb: 'GET', url: 'accounts/{accountId}/presence/{presenceId}' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/presence/{presenceId}' }
			},
			qubicleQueues: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/qubicle_queues/{queueId}' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/qubicle_queues' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/qubicle_queues/{queueId}' },
				'patch': { verb: 'PATCH', url: 'accounts/{accountId}/qubicle_queues/{queueId}' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/qubicle_queues/{queueId}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/qubicle_queues' },
				'listAllRecipients': { verb: 'GET', url: 'accounts/{accountId}/qubicle_queues/recipients' },
				'listRecipients': { verb: 'GET', url: 'accounts/{accountId}/qubicle_queues/{queueId}/recipients' },
				'updateRecipients': { verb: 'POST', url: 'accounts/{accountId}/qubicle_queues/{queueId}/recipients' },
				'deleteRecipients': { verb: 'DELETE', url: 'accounts/{accountId}/qubicle_queues/{queueId}/recipients' },
				'getStatus': { verb: 'GET', url: 'accounts/{accountId}/qubicle_queues/{queueId}/status' },
				'listStatus': { verb: 'GET', url: 'accounts/{accountId}/qubicle_queues/status' },
				'updateRoles': { verb: 'POST', url: 'accounts/{accountId}/qubicle_queues/{queueId}/roles' },
				'updateSessions': { verb: 'POST', url: 'accounts/{accountId}/qubicle_queues/{queueId}/sessions/{sessionId}' },
				'getEnsureStarted': { verb: 'GET', url: 'accounts/{accountId}/qubicle_queues/ensure_started' }
			},
			qubicleRecipients: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/qubicle_recipients/{userId}' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/qubicle_recipients/{userId}' },
				'updateDisable': { verb: 'POST', url: 'accounts/{accountId}/qubicle_recipients/{userId}/disable' },
				'updateEnable': { verb: 'POST', url: 'accounts/{accountId}/qubicle_recipients/{userId}/enable' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/qubicle_recipients' },
				'getStatus': { verb: 'GET', url: 'accounts/{accountId}/qubicle_recipients/{userId}/status' },
				'listStatus': { verb: 'POST', url: 'accounts/{accountId}/qubicle_recipients/status' },
				'updateStatus': { verb: 'POST', url: 'accounts/{accountId}/qubicle_recipients/{userId}/status' },
				'updateState': { verb: 'POST', url: 'accounts/{accountId}/qubicle_recipients/{userId}' },
				'updateRoles': { verb: 'POST', url: 'accounts/{accountId}/qubicle_recipients/{userId}/roles' },
				'getQueueMembership': { verb: 'POST', url: 'accounts/{accountId}/qubicle_recipients/queue_membership' }
			},
			qubicleRoles: {
				'list': { verb: 'GET', url: 'accounts/{accountId}/qubicle_roles' }
			},
			qubicleReports: {
				'get': { verb: 'POST', url: 'accounts/{accountId}/qubicle_reports' }
			},
			qubicleSkills: {
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/qubicle_skills/{skillId}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/qubicle_skills' },
				'patch': { verb: 'PATCH', url: 'accounts/{accountId}/qubicle_skills/{skillId}' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/qubicle_skills/{skillId}' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/qubicle_skills' }
			},
			recordings: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/recordings/{recordingId}' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/recordings/{resourceId}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/recordings' }
			},
			registrations: {
				'list': { verb: 'GET', url: 'accounts/{accountId}/registrations' }
			},
			resourceTemplates: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/resource_templates/{resourceId}' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/resource_templates' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/resource_templates/{resourceId}' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/resource_templates/{resourceId}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/resource_templates' }
			},
			schemas: {
				'list': { verb: 'GET', url: 'schemas' },
				'get': { verb: 'GET', url: 'schemas/{schemaId}' }
			},
			security: {
				'listModules': { verb: 'GET', url: 'security' },
				'get': { verb: 'GET', url: 'accounts/{accountId}/security' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/security' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/security' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/security' },
				'listAttempts': { verb: 'GET', url: 'accounts/{accountId}/security/attempts' },
				'getAttempt': { verb: 'GET', url: 'accounts/{accountId}/security/attempts/{attemptId}' }
			},
			servicePlan: {
				'create': { verb: 'PUT', url: 'accounts/{accountId}/service_plans' },
				'get': { verb: 'GET', url: 'accounts/{accountId}/service_plans/{planId}' },
				'add': { verb: 'POST', url: 'accounts/{accountId}/service_plans/{planId}' },
				'addMany': { verb: 'POST', url: 'accounts/{accountId}/service_plans/' },
				'remove': { verb: 'DELETE', url: 'accounts/{accountId}/service_plans/{planId}' },
				'removeMany': { verb: 'DELETE', url: 'accounts/{accountId}/service_plans/' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/service_plans/{planId}' },
				'addManyOverrides': { verb: 'POST', url: 'accounts/{accountId}/service_plans/override' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/service_plans' },
				'listCurrent': { verb: 'GET', url: 'accounts/{accountId}/service_plans/current' },
				'getCsv': { verb: 'GET', url: 'accounts/{accountId}/service_plans/current?depth=4&identifier=items&accept=csv' },
				'listAvailable': { verb: 'GET', url: 'accounts/{accountId}/service_plans/available' },
				'getAvailable': { verb: 'GET', url: 'accounts/{accountId}/service_plans/available/{planId}' },
				'reconciliate': { verb: 'POST', url: 'accounts/{accountId}/service_plans/reconciliation' },
				'synchronize': { verb: 'POST', url: 'accounts/{accountId}/service_plans/synchronization' }
			},
			services: {
				'listAssigned': { verb: 'GET', url: 'accounts/{accountId}/services' },
				'bulkChange': { verb: 'POST', url: 'accounts/{accountId}/services/' },
				'getSummary': { verb: 'GET', url: 'accounts/{accountId}/services/summary' },
				'getAuditSummary': { verb: 'GET', url: 'accounts/{accountId}/services/audit_summary' },
				'listAvailable': { verb: 'GET', url: 'accounts/{accountId}/services/available' },
				'quote': { verb: 'POST', url: 'accounts/{accountId}/services/quote' },
				'topup': { verb: 'POST', url: 'accounts/{accountId}/services/topup' },
				'listEditable': { verb: 'GET', url: 'accounts/{accountId}/services/editable' },
				'listOverrides': { verb: 'GET', url: 'accounts/{accountId}/services/overrides' },
				'updateManualQuantities': { verb: 'POST', url: 'accounts/{accountId}/services/manual' }
			},
			slackIntegration: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/slack_integration' },
				'listUsers': { verb: 'GET', url: 'accounts/{accountId}/slack_integration/user_listing' }
			},
			storage: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/storage' },
				'add': { verb: 'PUT', url: 'accounts/{accountId}/storage' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/storage' },
				'patch': { verb: 'PATCH', url: 'accounts/{accountId}/storage' }
			},
			tasks: {
				'summary': { verb: 'GET', url: 'tasks' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/tasks' },
				'add': { verb: 'PUT', url: 'accounts/{accountId}/tasks?category={category}&action={action}' },
				'get': { verb: 'GET', url: 'accounts/{accountId}/tasks/{taskId}' },
				'start': { verb: 'PATCH', url: 'accounts/{accountId}/tasks/{taskId}' },
				'stop': { verb: 'PATCH', url: 'accounts/{accountId}/tasks/{taskId}/stop' },
				'getOutput': { verb: 'GET', url: 'accounts/{accountId}/tasks/{taskId}/output', type: 'text/csv', dataType: 'text' },
				'getInput': { verb: 'GET', url: 'accounts/{accountId}/tasks/{taskId}/input', type: 'text/csv', dataType: 'text' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/tasks/{taskId}' }
			},
			temporalRule: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/temporal_rules/{ruleId}' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/temporal_rules' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/temporal_rules/{ruleId}' },
				'patch': { verb: 'PATCH', url: 'accounts/{accountId}/temporal_rules/{ruleId}' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/temporal_rules/{ruleId}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/temporal_rules' }
			},
			temporalSet: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/temporal_rules_sets/{setId}' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/temporal_rules_sets' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/temporal_rules_sets/{setId}' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/temporal_rules_sets/{setId}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/temporal_rules_sets' }
			},
			transactions: {
				'list': { verb: 'GET', url: 'accounts/{accountId}/transactions' }
			},
			user: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/users/{userId}' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/users' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/users/{userId}' },
				'patch': { verb: 'PATCH', url: 'accounts/{accountId}/users/{userId}' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/users/{userId}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/users' },
				'quickcall': { verb: 'GET', url: 'accounts/{accountId}/users/{userId}/quickcall/{number}' },
				'hotdesks': { verb: 'GET', url: 'accounts/{accountId}/users/{userId}/hotdesks' },
				'updatePresence': { verb: 'POST', url: 'accounts/{accountId}/users/{userId}/presence' },
				'listDevices': { verb: 'GET', url: 'accounts/{accountId}/users/{userId}/devices' },
				'updateChatStatus': { verb: 'PATCH', url: 'accounts/{accountId}/users/{userId}/getstream' },
				'listUsersWithChat': { verb: 'GET', url: 'accounts/{accountId}/users/getstream' },
			},
			voicemail: {
				'get': { verb: 'GET', url: 'accounts/{accountId}/vmboxes/{voicemailId}' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/vmboxes' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/vmboxes/{voicemailId}' },
				'patch': { verb: 'PATCH', url: 'accounts/{accountId}/vmboxes/{voicemailId}' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/vmboxes/{voicemailId}' },
				'list': { verb: 'GET', url: 'accounts/{accountId}/vmboxes' },
				'listMessages': { verb: 'GET', url: 'accounts/{accountId}/vmboxes/{voicemailId}/messages' },
				'updateMessages': { verb: 'POST', url: 'accounts/{accountId}/vmboxes/{voicemailId}/messages' },
				'deleteMessages': { verb: 'DELETE', url: 'accounts/{accountId}/vmboxes/{voicemailId}/messages' }
			},
			webhooks: {
				'get': { 'verb': 'GET', 'url': 'accounts/{accountId}/webhooks/{webhookId}' },
				'create': { 'verb': 'PUT', 'url': 'accounts/{accountId}/webhooks' },
				'update': { 'verb': 'POST', 'url': 'accounts/{accountId}/webhooks/{webhookId}' },
				'delete': { 'verb': 'DELETE', 'url': 'accounts/{accountId}/webhooks/{webhookId}' },
				'list': { 'verb': 'GET', 'url': 'accounts/{accountId}/webhooks' },
				'listAccountAttempts': { 'verb': 'GET', 'url': 'accounts/{accountId}/webhooks/attempts' },
				'listAttempts': { 'verb': 'GET', 'url': 'accounts/{accountId}/webhooks/{webhookId}/attempts' },
				'listAvailable': { 'verb': 'GET', 'url': 'webhooks' },
				'patch': { 'verb': 'PATCH', 'url': 'accounts/{accountId}/webhooks/{webhookId}' },
				'patchAll': { 'verb': 'PATCH', 'url': 'accounts/{accountId}/webhooks' }
			},
			websockets: {
				'listEvents': { 'verb': 'GET', 'url': 'websockets' },
				'list': { 'verb': 'GET', 'url': 'accounts/{accountId}/websockets' },
				'listBindings': { 'verb': 'GET', 'url': 'accounts/{accountId}/websockets/{websocketId}' }
			},
			whitelabel: {
				'getByDomain': { verb: 'GET', url: 'whitelabel/{domain}' },
				'getLogoByDomain': { verb: 'GET', url: 'whitelabel/{domain}/logo' },
				'getIconByDomain': { verb: 'GET', url: 'whitelabel/{domain}/icon' },
				'getWelcomeByDomain': { verb: 'GET', url: 'whitelabel/{domain}/welcome', type: 'text/html', dataType: 'html' },
				'get': { verb: 'GET', url: 'accounts/{accountId}/whitelabel' },
				'getLogo': { verb: 'GET', url: 'accounts/{accountId}/whitelabel/logo' },
				'getIcon': { verb: 'GET', url: 'accounts/{accountId}/whitelabel/icon' },
				'getWelcome': { verb: 'GET', url: 'accounts/{accountId}/whitelabel/welcome', type: 'text/html', dataType: 'html' },
				'update': { verb: 'POST', url: 'accounts/{accountId}/whitelabel' },
				'updateLogo': { verb: 'POST', url: 'accounts/{accountId}/whitelabel/logo', type: 'application/x-base64' },
				'updateIcon': { verb: 'POST', url: 'accounts/{accountId}/whitelabel/icon', type: 'application/x-base64' },
				'updateWelcome': { verb: 'POST', url: 'accounts/{accountId}/whitelabel/welcome', type: 'text/html', dataType: 'html' },
				'create': { verb: 'PUT', url: 'accounts/{accountId}/whitelabel' },
				'delete': { verb: 'DELETE', url: 'accounts/{accountId}/whitelabel' },
				'listNotifications': { verb: 'GET', url: 'accounts/{accountId}/notifications' },
				'getSystemNotification': { verb: 'GET', url: 'notifications/{notificationId}' },
				'getSystemNotificationText': { verb: 'GET', url: 'notifications/{notificationId}', type: 'text/plain', dataType: 'text' },
				'getSystemNotificationHtml': { verb: 'GET', url: 'notifications/{notificationId}', type: 'text/html', dataType: 'html' },
				'getNotification': { verb: 'GET', url: 'accounts/{accountId}/notifications/{notificationId}' },
				'getNotificationText': { verb: 'GET', url: 'accounts/{accountId}/notifications/{notificationId}', type: 'text/plain', dataType: 'text' },
				'getNotificationHtml': { verb: 'GET', url: 'accounts/{accountId}/notifications/{notificationId}', type: 'text/html', dataType: 'html' },
				'updateNotification': { verb: 'POST', url: 'accounts/{accountId}/notifications/{notificationId}' },
				'updateNotificationText': { verb: 'POST', url: 'accounts/{accountId}/notifications/{notificationId}', type: 'text/plain', dataType: 'text' },
				'updateNotificationHtml': { verb: 'POST', url: 'accounts/{accountId}/notifications/{notificationId}', type: 'text/html', dataType: 'html' },
				'previewNotification': { verb: 'POST', url: 'accounts/{accountId}/notifications/{notificationId}/preview' },
				'deleteNotification': { verb: 'DELETE', url: 'accounts/{accountId}/notifications/{notificationId}' },
				'getDnsEntries': { verb: 'GET', url: 'accounts/{accountId}/whitelabel/domains' },
				'checkDnsEntries': { verb: 'POST', url: 'accounts/{accountId}/whitelabel/domains?domain={domain}&use_tcp={useTcp}' }
			},
			matchList: {
				'list': { 'verb': 'GET', 'url': 'accounts/{accountId}/match_lists/' },
				'create': { 'verb': 'PUT', 'url': 'accounts/{accountId}/match_lists' },
				'get': { 'verb': 'GET', 'url': 'accounts/{accountId}/match_lists/{matchListId}' },
				'update': { 'verb': 'POST', 'url': 'accounts/{accountId}/match_lists/{matchListId}' },
				'patch': { 'verb': 'PATCH', 'url': 'accounts/{accountId}/match_lists/{matchListId}' },
				'delete': { 'verb': 'DELETE', 'url': 'accounts/{accountId}/match_lists/{matchListId}' }
			},
			configs: {
				'get': { 'verb': 'GET', 'url': 'accounts/{accountId}/configs/{endpoint}' }
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
		if (settings && typeof settings === 'string') { settings = { apiRoot: settings }; }
		if (settings && settings.apiRoot) {
			var sdkMethods = $.extend({}, baseMethods);
			$.each(sdkMethods, function() {
				if (typeof this === 'object') { this.parent = sdkMethods; }
			});
			sdkMethods.defaultSettings = settings;
			sdkMethods.request = request;

			if ('authToken' in settings && settings.authToken.length > 0) {
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
							ids = $.map(methodInfo.url.match(/{([^}]+)}/g) || [], function(v) { return v.replace(/{|}/g, ''); });

						if ('filters' in methodSettings) {
							requestSettings.url += (requestSettings.url.indexOf('?') > 0 ? '&' : '?') + parametersToQueryString(methodSettings.filters);
						}

						if (methodInfo.hasOwnProperty('type')) { requestSettings.type = methodInfo.type; }
						if (methodInfo.hasOwnProperty('dataType')) { requestSettings.dataType = methodInfo.dataType; }
						if (methodInfo.hasOwnProperty('removeMetadataAPI')) { requestSettings.removeMetadataAPI = methodInfo.removeMetadataAPI; }
						if (methodInfo.hasOwnProperty('removeHeaders')) { requestSettings.removeHeaders = methodInfo.removeHeaders; }

						if (['post', 'delete', 'put', 'patch'].indexOf(methodInfo.verb.toLowerCase()) >= 0) {
							requestSettings.data.data = methodSettings.data || {};
							delete methodSettings.data;
						}

						// We extend methodSettings into a new map that we'll use to map the value with the right variable
						// With a URL like /accounts/search={test}&name={test}, if we don't use a new map, then the {test} variable is set to undefined during the second iteration
						// after we delete it from methodSettings a few line below, which creates a bug as the new URL will be /accounts/search=undefined&name=undefined.
						var staticValues = $.extend(true, {}, methodSettings);

						$.each(ids, function(k, v) {
							if (methodInfo.verb.toLowerCase() === 'post' && k === ids.length - 1 && !(v in methodSettings)) {
								requestSettings.data[v] = requestSettings.data.data.id;
							} else {
								requestSettings.data[v] = staticValues[v];
								checkReservedKeywords(v, requestSettings);
								delete methodSettings[v];
							}
						});

						//These settings can not be overridden
						delete methodSettings.onRequestStart;
						delete methodSettings.onRequestEnd;
						delete methodSettings.onRequestSuccess;
						delete methodSettings.onRequestError;

						request($.extend({}, settings, methodSettings, requestSettings));
					};
				});
			});

			return sdkMethods;
		} else {
			throw new Error('You must provide a valid apiRoot.');
		}
	};

	function parametersToQueryString(params) {
		var keyPrefixesSupportingJSONArrayValues = /(?:^filter_(?:any|array_intersect_(?:any|none|all)|none)_.+)|^fields$/;
		return Object
			.keys(params)
			.map(function(key) {
				var values = [].concat(params[key]);
				var formattedValues = keyPrefixesSupportingJSONArrayValues.test(key) ? [
					JSON.stringify(values)
				] : values;
				return formattedValues
					.map(function(value) {
						return [key, encodeURIComponent(value)].join('=');
					})
					.join('&');
			})
			.join('&');
	}

	function authFunction(settings, defaultSettings, url) {
		var apiRoot = settings.apiRoot || defaultSettings.apiRoot;
		request(_.mergeWith({}, defaultSettings, {
			url: apiRoot + url,
			verb: 'PUT',
			data: {
				data: settings.data
			},
			removeHeaders: ['X-Auth-Token'],
			generateError: settings.hasOwnProperty('generateError') ? settings.generateError : true,
			isRetryLoginRequest: settings.hasOwnProperty('isRetryLoginRequest') ? settings.isRetryLoginRequest : false,
			success: function(data, status, jqXHR) {
				authTokens[apiRoot] = data.auth_token;
				settings.success && settings.success(data, status, jqXHR);
			},
			error: settings.error
		}, function(dest, src) {
			return _.every([dest, src], _.isArray)
				? _.chain(dest).concat(src).uniq().value()
				: undefined;
		}));
	}

	function checkReservedKeywords(key, request) {
		var reservedKeys = [ 'apiRoot', 'authToken', 'cache', 'url', 'dataType', 'verb', 'type', 'dataType', 'onRequestStart', 'onRequestEnd', 'onRequestEnd', 'onRequestSuccess', 'uploadProgress' ];

		if (reservedKeys.indexOf(key) >= 0) {
			console.warn('URL Parameter "' + key + '" is overriding a core option of the AJAX request - ' + request.url);
		}
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

					if (!options.hasOwnProperty('removeHeaders') || options.removeHeaders.indexOf('X-Auth-Token') < 0) {
						jqXHR.setRequestHeader('X-Auth-Token', options.authToken || authTokens[options.apiRoot]);
					}

					$.each(options.headers || [], function(key, val) {
						if (!options.hasOwnProperty('removeHeaders') || options.removeHeaders.indexOf(key) < 0) {
							jqXHR.setRequestHeader(key, val);
						}
					});
				}
			},
			mappedKeys = [],
			rurlData = /{([^}]+)}/g,
			data = $.extend({}, options.data);

		if (options.hasOwnProperty('uploadProgress')) {
			settings.xhr = function() {
				var xhr = new window.XMLHttpRequest();
				//Upload progress
				xhr.upload.addEventListener('progress', options.uploadProgress, false);
				return xhr;
			};
		}

		settings.url = settings.url.replace(rurlData, function(match, key) {
			if (key in data) {
				mappedKeys.push(key);
				return encodeURIComponent(data[key]);
			}
		});

		settings.error = function requestError(error, status) {
			options.onRequestEnd && options.onRequestEnd(error, options);

			var parsedError = error;

			if ('responseText' in error && error.responseText && error.getResponseHeader('content-type') === 'application/json') {
				parsedError = $.parseJSON(error.responseText);
				parsedError.httpErrorStatus = error.status;
			}

			// Added this to be able to display more data in the UI
			error.monsterData = {
				url: settings.url,
				verb: settings.type
			};

			options.onRequestError && options.onRequestError(error, options);

			if (!options.hasOwnProperty('preventCallbackError') || options.preventCallbackError === false) {
				options.error && options.error(parsedError, error, options.onRequestError);
			}
		};

		settings.success = function requestSuccess(responseData, status) {
			options.onRequestEnd && options.onRequestEnd(responseData, options);

			options.onRequestSuccess && options.onRequestSuccess(responseData, options);

			options.success && options.success(responseData, options.onRequestSuccess);
		};

		// We delete the keys later so duplicates are still replaced
		$.each(mappedKeys, function(index, name) {
			delete data[name];
		});

		if (settings.type.toLowerCase() !== 'get') {
			var postData = data.data,
				envelopeKeys = {};

			if (options.hasOwnProperty('envelopeKeys')) {
				var protectedKeys = ['data', 'accept_charges'];

				_.each(options.envelopeKeys, function(value, key) {
					if (protectedKeys.indexOf(key) < 0) {
						envelopeKeys[key] = value;
					}
				});
			};

			if (settings.contentType === 'application/json') {
				var payload = $.extend(true, {
					data: data.data || {}
				}, envelopeKeys);

				// If the metadata is set, and the removeMetadataAPI key is either missing or set to false then we set the metadata
				if (options.hasOwnProperty('uiMetadata') && (!options.hasOwnProperty('removeMetadataAPI') || options.removeMetadataAPI === false)) {
					payload.data.ui_metadata = options.uiMetadata;
				}

				if (options.acceptCharges === true) {
					payload.accept_charges = true;
				}

				postData = JSON.stringify(payload);
			} else if (settings.contentType === 'multipart/mixed') {
				var boundary = 'multipart-message-boundary',
					craftMessage = function craftMessage() {
						var message = '';

						data.data.forEach(function(part) {
							message += '--' + boundary + '\r\n';

							for (var header in part.headers) {
								message += header + ': ' + part.headers[header] + '\r\n';
							}

							message += '\r\n' + part.body + '\r\n\r\n';
						});

						message += '--' + boundary + '--';

						return message;
					};

				settings.contentType += '; boundary=' + boundary;

				postData = craftMessage();
			}

			settings = $.extend(settings, {
				data: postData
			});
		}

		return $.ajax(settings);
	}
}(jQuery));
