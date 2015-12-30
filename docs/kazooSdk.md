#Kazoo SDK

The Kazoo javascript SDK is a jQuery plugin that allows you to easily call an extensive list of APIs from Kazoo.

### Requirements

This is a jQuery plugin, and therefore requires [jQuery](http://jquery.com/) to work.

This SDK only provides a set of functions to call the APIs, you need an API server running Kazoo.

### Usage

#### Initialization

You can access the kazooSdk object by calling the method `jQuery.getKazooSdk(settings)`. This object will contain all the API functions. It is strongly recommended to store this object in a variable and re-use it, instead of calling the _getKazooSdk_ method multiple times.

The _settings_ parameter can either be a simple string containing your API server URL, or an object containing some or all of the parameters below. Either way, the API server URL (_apiRoot_) is mandatory.

Available _settings_:
* `apiRoot`: A string containing the URL to your API server.
* `authToken`: A Kazoo auth token previously aquired through an authentication method. This is useful if you keep the user auth token in a cookie, for example. _Note:  This auth token will be stored withing this kazooSdk instance the same way as if you used an auth method, meaning that you won't need to provide it again for any API called from this instance._
* `onRequestStart(jqXHR, options)`: A function called right before executing the Ajax request. `jqXHR` is the [request object](http://api.jquery.com/Types/#jqXHR), and `options` is an object containing the set of parameters provided to the request function.
* `onRequestEnd(data, options)`: A function called as soon as a response is received from the server. `data` will be the response as a plain object in case of a success, or a jqXHR object in case of an error. `options` is an object containing the set of parameters provided to the request function.
* `onRequestSuccess(response, options)`: A function called on every successful API call. `response` is the response from the API as a plain object, and `options` is an object containing the set of parameters provided to the request function.
* `onRequestError(error, options)`: A function called on every unsuccessful API call. `error` is the response from the API as a jqXHR object, and `options` is an object containing the set of parameters provided to the request function.
* `uiMetadata`: A json object containing the UI Metadata (such as UI version and UI name) that will be inserted in every json payloads as "ui_metadata" for non-GET APIs.

Note: The `options` parameter in the _onRequestStart_, _onRequestEnd_, _onRequestSuccess_ and _onRequestError_ functions may be useful if you want to manually do an API call with the same parameters, using `kazooSdk.request(options)` (e.g. retry after a specific error). Beware however not to get caught in an infinite loop.

#### Calling an API

Once you've properly initialized and retrieved the SDK, you can make an API call by simply running its corresponding method. Each method takes a single Javascript object as parameter which must contain at least all the mandatory _settings_.
Note: although it is not defined as a mandatory setting, most APIs will need an auth token. If you provided it in the settings for the `getKazooSdk()` function or if you used an auth method from the SDK, the auth token will be automatically set for all your API calls.

##### General API settings

Note that each of these settings, if provided, will override the similar ones set with `getKazooSdk()`.

* `apiRoot`: A string containing the URL to your API server.
* `authToken`: A Kazoo auth token. This will override any previously set auth token for this method only.
* `uiMetadata`: A json object containing the UI Metadata that will be inserted in the payload as "ui_metadata".
* `acceptCharges`: A boolean that will be inserted in the payload as "accept_charges". This will authorize the payment on transaction APIs, it is usually set after receiving a 402 error.
* `success(responseData)`: A function called when the API call returns successfully, where `responseData` is the response payload from the API.
* `error(responseData, error)`: A function called when the API call returns an error, where `responseData` is the JSON-parsed response payload from the API and error is the response from the API as a jqXHR object.
* `onChargesCancelled()`: an optional function with no parameter that will be executed when a user refuses to confirm the charges related to an action.
* `filters`: A map of filters to append to the API URL where the key is the URL parameter and the value is the parameter's value. For instance, `{ "filter_type": "admin" }` will be translated into `<your_api_url>?filter_type=admin`. [See the wiki](https://2600hz.atlassian.net/wiki/display/APIs/Filtering+Data) for more info about filters.
* `headers`: An object of additional header key/value pairs to send along with request (e.g. `{ 'Accept': 'application/octet-stream' }`).
* `cache`: A boolean specifying whether to use the cache or not for GET & HEAD requests. False by default.


You can also include custom settings that you will then handle using the `options` parameter in the callbacks defined when initializing the SDK (`onRequestStart`, `onRequestEnd`, `onRequestSuccess`, `onRequestError`). You can see such a custom setting (`generateError`) in the example below.

##### Usage example
```
var kazooSdk = $.getKazooSdk({
	apiRoot: 'http://crossbarserver.yourdomain.com:8000/',
	uiMetadata: {
		ui: 'demo-ui',
		version: '1.0'
	},
	onRequestStart: function(request, requestOptions) {
		console.log('Request started', request);
	},
	onRequestEnd: function(request, requestOptions) {
		console.log('Request ended', request);
	},
	onRequestError: function(error, requestOptions) {
		if(requestOptions.generateError !== false) {
			var parsedError = $.parseJSON(error.responseText);
			alert('error', parsedError.message);
		}
	}
});

kazooSdk.auth.userAuth({
	data: {
		account_name: $('#account_name').val(),
		credentials: $.md5($('#login').val() + ':' + $('#password').val())
	},
	success: function(data, status) {
		kazooSdk.account.get({
			accountId: data.data.accountId,
			success: function(data, status) {
				console.log('Account data:', data.data);
			},
			error: function(data, status) {
				console.error('Could not get the account data:', data);
			},
			generateError: false
		});
	}
});
```

#### List of methods

##### Index
* [Account](#account)
* [Auth](#auth)
* [Balance](#balance)
* [Billing](#billing)
* [Callflow](#callflow)
* [Cdrs](#cdrs)
* [Channel](#channel)
* [Conference](#conference)
* [Connectivity](#connectivity)
* [Device](#device)
* [Directory](#directory)
* [Global Resources](#global-resources)
* [Group](#group)
* [Limits](#limits)
* [Local Resources](#local-resources)
* [Media](#media)
* [Menu](#menu)
* [Numbers](#numbers)
* [Port](#port)
* [Resource Templates](#resource-templates)
* [Service Plan](#service-plan)
* [Temporal Rule](#temporal-rule)
* [User](#user)
* [Voicemail](#voicemail)
* [Whitelabel](#whitelabel)

###### Account

|||
|---|---|
| Method: | __account.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __account.create(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __account.update(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __account.delete(__*settings*__)__ |
| Request Type: | DELETE |
| Request URL: | {apiRoot}/accounts/{accountId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __account.listDescendants(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/descendants |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __account.listChildren(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/children |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Auth

|||
|---|---|
| Method: | __auth.userAuth(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/user_auth |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __auth.sharedAuth(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/shared_auth |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __auth.pinAuth(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/pin_auth |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Balance

|||
|---|---|
| Method: | __balance.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/transactions/current_balance |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __balance.add(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId}/braintree/credits |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Billing

|||
|---|---|
| Method: | __billing.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/braintree/customer |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __billing.update(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/braintree/customer |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Callflow

|||
|---|---|
| Method: | __callflow.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/callflows/{callflowId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `callflowId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __callflow.create(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId}/callflows |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __callflow.update(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/callflows/{callflowId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `callflowId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __callflow.delete(__*settings*__)__ |
| Request Type: | DELETE |
| Request URL: | {apiRoot}/accounts/{accountId}/callflows/{callflowId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `callflowId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __callflow.list(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/callflows |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Cdrs

|||
|---|---|
| Method: | __cdrs.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/cdrs/{cdrId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `cdrId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __cdrs.list(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/cdrs |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Channel

|||
|---|---|
| Method: | __channel.list(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/channels |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Conference

|||
|---|---|
| Method: | __conference.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/conferences/{conferenceId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `conferenceId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.create(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId}/conferences |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.update(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/conferences/{conferenceId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `conferenceId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.delete(__*settings*__)__ |
| Request Type: | DELETE |
| Request URL: | {apiRoot}/accounts/{accountId}/conferences/{conferenceId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `conferenceId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.list(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/conferences |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.getPins(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/conferences/pins |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.view(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/conferences/{conferenceId}/status |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `conferenceId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.action(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/conferences/{conferenceId}/{action} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `conferenceId`, `action`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.getServer(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/conferences_servers/{serverId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `serverId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.createServer(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId}/conferences_servers |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.updateServer(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/conferences_servers/{serverId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `serverId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.deleteServer(__*settings*__)__ |
| Request Type: | DELETE |
| Request URL: | {apiRoot}/accounts/{accountId}/conferences_servers/{serverId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `serverId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.listServers(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/conferences_servers |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.addParticipant(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/conferences/{conferenceId}/add_participant |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `conferenceId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.muteParticipant(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/conferences/{conferenceId}/mute/{participantId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `conferenceId`, `participantId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.unmuteParticipant(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/conferences/{conferenceId}/unmute/{participantId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `conferenceId`, `participantId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.deafParticipant(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/conferences/{conferenceId}/deaf/{participantId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `conferenceId`, `participantId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.undeafParticipant(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/conferences/{conferenceId}/undeaf/{participantId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `conferenceId`, `participantId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.kickParticipant(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/conferences/{conferenceId}/kick/{participantId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `conferenceId`, `participantId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.createNotification(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId}/notify/conference_{notificationType} |
| Request Content Type: | text/html |
| Response Content Type: | text/html |
| Mandatory _settings_: | `accountId`, `notificationType`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.getNotification(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/notify/conference_{notificationType}/{contentType} |
| Request Content Type: | text/html |
| Response Content Type: | text/html |
| Mandatory _settings_: | `accountId`, `notificationType`, `contentType` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __conference.updateNotification(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/notify/conference_{notificationType} |
| Request Content Type: | text/html |
| Response Content Type: | text/html |
| Mandatory _settings_: | `accountId`, `notificationType`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Connectivity

|||
|---|---|
| Method: | __connectivity.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/connectivity/{connectivityId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `connectivityId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __connectivity.create(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId}/connectivity |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __connectivity.update(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/connectivity/{connectivityId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `connectivityId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __connectivity.list(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/connectivity |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Device

|||
|---|---|
| Method: | __device.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/devices/{deviceId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `deviceId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __device.create(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId}/devices |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __device.update(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/devices/{deviceId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `deviceId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __device.delete(__*settings*__)__ |
| Request Type: | DELETE |
| Request URL: | {apiRoot}/accounts/{accountId}/devices/{deviceId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `deviceId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __device.list(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/devices |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __device.getStatus(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/devices/status |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __device.quickcall(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/devices/{deviceId}/quickcall/{number} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `deviceId`, `number` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Directory

|||
|---|---|
| Method: | __directory.create(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId}/directories |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __directory.list(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/directories |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Global Resources

|||
|---|---|
| Method: | __globalResources.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/resources/{resourceId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `resourceId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __globalResources.create(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/resources |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __globalResources.update(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/resources/{resourceId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `resourceId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __globalResources.delete(__*settings*__)__ |
| Request Type: | DELETE |
| Request URL: | {apiRoot}/globalResources/{resourceId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `resourceId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __globalResources.list(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/resources |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __globalResources.updateCollection(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/resources/collection |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __globalResources.listJobs(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/resources/jobs |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __globalResources.getJob(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/resources/jobs/{jobId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `jobId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __globalResources.createJob(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/resources/jobs |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `jobId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Group

|||
|---|---|
| Method: | __group.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/groups/{groupId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `groupId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __group.create(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId}/groups |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __group.update(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/groups/{groupId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `groupId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __group.delete(__*settings*__)__ |
| Request Type: | DELETE |
| Request URL: | {apiRoot}/accounts/{accountId}/groups/{groupId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `groupId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __group.list(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/groups |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Limits

|||
|---|---|
| Method: | __limits.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/limits |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __limits.update(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/limits |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Local Resources

|||
|---|---|
| Method: | __localResources.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/resources/{resourceId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `resourceId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __localResources.create(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId}/resources |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __localResources.update(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/resources/{resourceId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `resourceId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __localResources.delete(__*settings*__)__ |
| Request Type: | DELETE |
| Request URL: | {apiRoot}/accounts/{accountId}/resources/{resourceId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `resourceId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __localResources.list(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/resources |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __localResources.updateCollection(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/resources/collection |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __localResources.listJobs(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/resources/jobs |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __localResources.getJob(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/resources/jobs/{jobId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `jobId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __localResources.createJob(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId}/resources/jobs |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `jobId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |


###### Media

|||
|---|---|
| Method: | __media.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/medias/{mediaId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `mediaId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __media.create(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId}/medias |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __media.update(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/medias/{mediaId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `mediaId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __media.delete(__*settings*__)__ |
| Request Type: | DELETE |
| Request URL: | {apiRoot}/accounts/{accountId}/medias/{mediaId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `mediaId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __media.list(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/medias |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __media.upload(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/media/{mediaId}/raw |
| Request Content Type: | application/x-base64 |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `mediaId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Menu

|||
|---|---|
| Method: | __menu.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/menus/{menuId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `menuId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __menu.create(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId}/menus |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __menu.update(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/menus/{menuId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `menuId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __menu.delete(__*settings*__)__ |
| Request Type: | DELETE |
| Request URL: | {apiRoot}/accounts/{accountId}/menus/{menuId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `menuId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __menu.list(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/menus |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Numbers

|||
|---|---|
| Method: | __numbers.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/phone_numbers/{phoneNumber} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `phoneNumber` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __numbers.activate(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId}/phone_numbers/collection/activate |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __numbers.update(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/phone_numbers/{phoneNumber} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `phoneNumber`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __numbers.delete(__*settings*__)__ |
| Request Type: | DELETE |
| Request URL: | {apiRoot}/accounts/{accountId}/phone_numbers/collection |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __numbers.identify(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/phone_numbers/{phoneNumber}/identify |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `phoneNumber` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __numbers.list(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/phone_numbers |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __numbers.listClassifiers(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/phone_numbers/classifiers |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __numbers.searchNumbers(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/phone_numbers?prefix={pattern}&quantity={limit}&offset={offset} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `pattern`, `limit`, `offset` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __numbers.searchBlocks(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/phone_numbers?prefix={pattern}&quantity={size}&offset={offset}&blocks={limit} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `pattern`, `size`, `offset`, `limit` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __numbers.searchCity(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/phone_numbers/prefix?city={city} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `city` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Port

|||
|---|---|
| Method: | __port.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/port_requests/{portRequestId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `portRequestId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __port.create(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId}/port_requests |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __port.update(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/port_requests/{portRequestId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `portRequestId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __port.delete(__*settings*__)__ |
| Request Type: | DELETE |
| Request URL: | {apiRoot}/accounts/{accountId}/port_requests/{portRequestId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `portRequestId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __port.list(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/port_requests |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __port.listDescendants(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/port_requests/descendants |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __port.listAttachments(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/port_requests/{portRequestId}/attachments |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `portRequestId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __port.getAttachment(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/port_requests/{portRequestId}/attachments/{documentName} |
| Request Content Type: | application/pdf |
| Response Content Type: | application/pdf |
| Mandatory _settings_: | `accountId`, `portRequestId`, `documentName` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __port.createAttachment(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId}/port_requests/{portRequestId}/attachments?filename={documentName} |
| Request Content Type: | application/pdf |
| Response Content Type: | application/pdf |
| Mandatory _settings_: | `accountId`, `portRequestId`, `documentName`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __port.updateAttachment(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/port_requests/{portRequestId}/attachments/{documentName} |
| Request Content Type: | application/pdf |
| Response Content Type: | application/pdf |
| Mandatory _settings_: | `accountId`, `portRequestId`, `documentName`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __port.deleteAttachment(__*settings*__)__ |
| Request Type: | DELETE |
| Request URL: | {apiRoot}/accounts/{accountId}/port_requests/{portRequestId}/attachments/{documentName} |
| Request Content Type: | application/pdf |
| Response Content Type: | application/pdf |
| Mandatory _settings_: | `accountId`, `portRequestId`, `documentName`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __port.changeState(__*settings*__)__ |
| Request Type: | PATCH |
| Request URL: | {apiRoot}/accounts/{accountId}/port_requests/{portRequestId}/{state} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `portRequestId`, `state` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |


###### Resource Templates

|||
|---|---|
| Method: | __resourceTemplates.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/resource_templates/{resourceId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `resourceId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __resourceTemplates.create(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId}/resource_templates |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __resourceTemplates.update(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/resource_templates/{resourceId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `resourceId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __resourceTemplates.delete(__*settings*__)__ |
| Request Type: | DELETE |
| Request URL: | {apiRoot}/accounts/{accountId}/resource_templates/{resourceId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `resourceId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __resourceTemplates.list(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/resource_templates |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Service Plan

|||
|---|---|
| Method: | __servicePlan.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/service_plans/{planId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `planId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __servicePlan.add(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/service_plans/{planId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `planId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __servicePlan.remove(__*settings*__)__ |
| Request Type: | DELETE |
| Request URL: | {apiRoot}/accounts/{accountId}/service_plans/{planId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `planId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __servicePlan.list(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/service_plans |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __servicePlan.listCurrent(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/service_plans/current |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __servicePlan.reconciliate(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/service_plans/reconciliation |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __servicePlan.synchronize(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/service_plans/synchronization |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Temporal Rule

|||
|---|---|
| Method: | __temporalRule.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/temporal_rules/{ruleId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `ruleId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __temporalRule.create(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId}/temporal_rules |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __temporalRule.update(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/temporal_rules/{ruleId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `ruleId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __temporalRule.delete(__*settings*__)__ |
| Request Type: | DELETE |
| Request URL: | {apiRoot}/accounts/{accountId}/temporal_rules/{ruleId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `ruleId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __temporalRule.list(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/temporal_rules |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### User

|||
|---|---|
| Method: | __user.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/users/{userId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `userId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __user.create(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId}/users |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __user.update(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/users/{userId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `userId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __user.delete(__*settings*__)__ |
| Request Type: | DELETE |
| Request URL: | {apiRoot}/accounts/{accountId}/users/{userId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `userId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __user.list(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/users |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __user.quickcall(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/users/{userId}/quickcall/{number} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `userId`, `number` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Voicemail

|||
|---|---|
| Method: | __voicemail.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/vmboxes/{voicemailId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `voicemailId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __voicemail.create(__*settings*__)__ |
| Request Type: | PUT |
| Request URL: | {apiRoot}/accounts/{accountId}/vmboxes |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __voicemail.update(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/accounts/{accountId}/vmboxes/{voicemailId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `voicemailId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __voicemail.delete(__*settings*__)__ |
| Request Type: | DELETE |
| Request URL: | {apiRoot}/accounts/{accountId}/vmboxes/{voicemailId} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `voicemailId`, `data` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __voicemail.list(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/accounts/{accountId}/vmboxes |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

###### Whitelabel

|||
|---|---|
| Method: | __whitelabel.get(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/whitelabel/{domain} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `domain` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __whitelabel.getLogo(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/whitelabel/{domain}/logo |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `domain` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __whitelabel.getDnsEntries(__*settings*__)__ |
| Request Type: | GET |
| Request URL: | {apiRoot}/whitelabel/domains |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |

|||
|---|---|
| Method: | __whitelabel.checkDnsEntries(__*settings*__)__ |
| Request Type: | POST |
| Request URL: | {apiRoot}/whitelabel/domains?domain={domain} |
| Request Content Type: | application/json |
| Response Content Type: | json |
| Mandatory _settings_: | `accountId`, `domain` |
| Optional _settings_: | See the list of [General API settings](#general-api-settings). |
