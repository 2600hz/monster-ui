title: callApi()

# callApi()

## Syntax
```javascript
var self = this;

// ...

self.callApi(params: {
  resource[,
  apiRoot,
  authToken,
  bypassProgressIndicator,
  data: {
    accountId,
    data,
    filters,
    generateError,
    headers,
    ...
  },
  success,
  error,
  onChargesCancelled]
});
```

### Parameters
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`params` | A plain JavaScript object that wraps the arguments for the function. | `Object`([#params](#params)) | | `true`

### `params`
Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`resource` | Kazoo SDK method name. | `String` | | `true`
`apiRoot` | Custom API URL, to use instead of the configured globally. | `String` | | `false`
`authToken` | A Kazoo auth token. This will override any previously set auth token, for the current request only. | `String` | | `false`
`bypassProgressIndicator` | Flag to tell the core app that the progress indicator should not be displayed for the current API call. | `Boolean` | | `false`
`data` | A plain JavaScript object that contains the list of parameters to be sent on the request. | `Object`([#data](#data)) | | `true`
`success` | Function executed if the API responded successfully (i.e. Success HTTP code is received). | `Function` | | `false`
`error` | Function executed if the API request fails, or the API responds with a failure status. | `Function` | | `false`
`onChargesCancelled` | Function executed if the operation will apply charges, but they are declined by the user. | `Function` | | `false`

### `data`
Here is a list of some common data properties. However, this object may contain other properties besides the listed here, depending on the requested resource.

Key | Description | Type | Default | Required
:-: | --- | :-: | :-: | :-:
`accountId` | Kazoo account ID. | `String` | | `false`
`data` | Data payload to be sent in the request body. | `Object` | | `false`
`filters` | A map of filters to append to the API URL, where the key is the URL parameter name and the value is the parameter's value. | `Object` | | `false`
`generateError` | Flag that indicates if the method should display the default error alert, if the request fails. | `Boolean` | `true` | `false`
`headers` | An object of additional header key/value pairs to send along with the request (e.g. `{ 'Accept': 'application/octet-stream' }`).

## Description
Every Monster app has a helper function `callApi(_params_)` that can be used to call any API endpoint supported by the Kazoo SDK.

It is automatically configured with our [Kazoo SDK][kazoo_sdk] and takes the same parameter structure as the [`monster.request(_params_)`][monster_request] function, as well as some additional arguments, to easily interact with the Kazoo API within the application context. The main difference, however, is that the `resource` value must be a valid [Kazoo SDK's method name][kazoo_sdk_methods], which means that you don't have to declare any resource in the `requests` object, compared to the `monster.request(_params_)` function.

## Examples
### Request all the devices for the current account, without displaying Monster UI progress indicator
```javascript
var self = this;

// ...

self.callApi(params: {
  resource: 'device.list',
  data: {
    accountId: self.accountId
  },
  bypassProgressIndicator: true,
  success: function(data, status) {
    var devices = data.data;

    // Do something with the devices list
  },
  error: function(parsedError, error, globalHandler) {
    // Handle failure
  }
});
```

### Request the callflows that belong to the current user, and have not been last modified by Smart PBX nor Call Center apps
```javascript
var self = this;

// ...

self.callApi(params: {
  resource: 'callflow.list',
  data: {
    accountId: self.accountId,
    filters: {
      filter_owner_id: monster.apps.auth.currentUser.id,
      'filter_not_ui_metadata.origin': [
        'voip',
        'callqueues'
      ]
    }
  },
  success: function(data, status) {
    var callflows = data.data;

    // Do something with the callflow list
  }
});
```

### Request to create a voicemail box, but handle the charge declination case
```javascript
var self = this,
  newVMBox;

// ...

self.callApi(params: {
  resource: 'voicemail.create',
  data: {
    accountId: self.accountId,
    data: newVMBox
  },
  success: function(data) {
    var savedVMBox = data.data;

    // Do something with the newly created vmbox...
  },
  onChargesCancelled: function() {
    console.log('Charges not accepted by user!');
  }
});
```

### Request to create a user, but do not display the default error alert in case of HTTP 400 status code
```javascript
var self = this,
  newUser;

// ...

self.callApi(params: {
  resource: 'user.create',
  data: {
    accountId: self.accountId,
    data: newUser
  },
  success: function(data) {
    var savedUser = data.data;

    // Do something with the newly created user...
  },
  error: function(parsedError, error, globalHandler) {
    if (error.status === 400) { // You could check also: parsedError.error === '400'
      // Handle error due to invalid data...
    } else {
      // Display default alert
      globalHandler(parsedError, { generateError: true });
    }
  }
});
```

[kazoo_sdk]: ../kazooSdk.md
[kazoo_sdk_methods]: ../kazooSdk.md#list-of-methods
[monster_request]: ../monster/request().md
