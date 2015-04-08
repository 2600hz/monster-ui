# How to use an API in Monster-UI
The Monster-UI framework allow developers to use the different Kazoo API very simply within their Monster-UI applications. If you would like more information on how to build an application, check [here][tutorial].

__Note: If the API you want to call is available in the Kazoo jQuery SDK, please prefer using [this method](#using-the-kazoo-jquery-sdk) over the regular API call method right below.__

### Listing the APIs you want to use
One of the main attribute of your application, is the "requests" attribute. The Monster-UI framework takes every request defined in this map and allow you to access them with your application. Here is an example of the requests attribute giving you access to all the API needed to create a CRUD for devices:

app.js

```js
/* inside the app code */
requests: {
	'demo.devices.list': {
		url: 'accounts/{accountId}/devices',
		verb: 'GET'
	},
	'demo.devices.create': {
		url: 'accounts/{accountId}/devices',
		verb: 'PUT'
	},
	'demo.devices.update': {
		url: 'accounts/{accountId}/devices/{deviceId}',
		verb: 'POST'
	},
	'demo.devices.delete': {
		url: 'accounts/{accountId}/devices/{deviceId}',
		verb: 'DELETE'
	},
	'demo.devices.get': {
		url: 'accounts/{accountId}/devices/{deviceId}',
		verb: 'GET'
	}
}
```

As you can see, it should be pretty self-explanatory. We created 5 resources named: 'demo.devices.list', 'demo.devices.create', 'demo.devices.update', 'demo.devices.delete', 'demo.devices.get'. We always prefix the resource name by the name of the app, and then we use a word describing which app we're using, and then finally the action. You can name them as you want but it's a good idea to follow this principle so that the request name makes sense when you use it later on in the code. The URL is always based of the default URL of your application (defined as the api_url in the app document in the database). If for some reason, you would like to use an API with a different api URL, you can add an apiRoot key in the resource definition as follow:

app.js

```js
requests: {
	'demo.devices.list': {
		apiRoot: 'http://yourApiURL/',
		url: 'accounts/{accountId}/devices',
		verb: 'GET'
	}
}
```

It will do the same request as the one above, except that it will request a different API URL, the one you defined in the apiRoot attribute. In order for this to work, the API at http://yourApiURL/ needs to have [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) configured properly.

### Calling an API
So now that you declared all those APIs, how do you actually request them and use them in your code? Nothing works better than an example:

app.js

```js
listDevices: function(callback) {
	var self = this;

	monster.request({
		resource: 'demo.devices.list',
		data: {
			accountId: self.accountId
		},
		success: function(response) {
			var devices = response.data;

			callback && callback(devices);
		},
		error: function(response) {
			monster.ui.alert('BOOM, it doesn't work. I bet it's a French guy who coded this API.');
		}
	});
}
```

As you can see, we have a monster.request helper, that allows you to request the APIs you defined earlier. It has 4 possible attributes:
* `resource`: it's the name you chose in the requests attribute
* `data`: it's the list of parameters for this request. For example, in the demo.devices.list request, the URL was 'accounts/{accountId}/devices', the {accountId} will be replace by the accountId from this data object!
* `success`: It's a function that's executed if the API responded successfully. This function has one parameter and its the result of this API.
* `error`: It's a function that's executed if the API fails. The reasons of the failure are usually defined in the response parameter.
* `onChargesCancelled`: an optional function with no parameter that will be executed when a user refuses to confirm the charges related to an action.

We usually create a function for each API call, in order to be able to call them simply inside our code. For example, if we wanted to display the list of devices, we would do this:

app.js

```js
// In this example, we assume the mainTemplate is given as a parameter, and contains a button
// with the ID refreshListDevices, and that a listDevices.html view exists in the /views folder
displayDevices: function(mainTemplate) {
	var self = this;

	mainTemplate.find('#refreshListDevices').on('click', function() {
		self.listDevices(function(devices) {
			var results = monster.template(self, 'listDevices', devices);

			mainTemplate
				.find('.list-devices')
				.empty()
				.append(results);
		});
	});
}
```

As always, please let us know if you have any recommandations on how we could make this documentation better!

### Using the Kazoo jQuery SDK

To simplify the API calling process, a Kazoo API SDK has been created as a jQuery plugin. We then created a monster helper to use it with a structure similar to what has been described above.

Every app now has a function `callApi(_params_)` that can be used to call any API supported by the Kazoo SDK. This function takes the same parameter structure as the `monster.request(_params_)` function, but the `resource` value should be the Kazoo SDK's method name. This means that you don't have to declare any resource in the `requests` object in your App to use the `callApi(_params_)` function.

You can also add extra parameters that you would usually have specified in the `requests` object of your app, such as `apiRoot`. For the full list of available parameters, please see the [Kazoo SDK documentation][kazoo_sdk_settings].

```js
listDevices: function(callback) {
	var self = this;

	self.callApi({
		resource: 'device.list',
		apiRoot: 'http://yourApiURL/',
		data: {
			accountId: self.accountId
		},
		success: function(response) {
			var devices = response.data;

			callback && callback(devices);
		},
		error: function(response) {
			monster.ui.alert('BOOM, it doesn't work. This wouldn't have happened if a French guy coded this API.');
		}
	});
}
```

[Here is a full list of supported APIs](https://github.com/2600hz/monster-ui/blob/master/docs/kazooSdk.md#list-of-methods).

[tutorial]: tutorial.md
[kazoo_sdk_settings]: kazooSdk.md#general-api-settings